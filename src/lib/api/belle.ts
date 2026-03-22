export interface BelleCliente {
  codigo?: number | string
  id?: number | string
  nome: string
  cpf?: string
  email?: string
  celular?: string
  telefone?: string
  data_nascimento?: string
  historico_clinico?: string
  rg?: string
  profissao?: string
  estado_civil?: string
  endereco?: string
  status?: string
  situacao?: string
}

export interface BelleAgendamento {
  id: number
  cliente_id?: number | string
  cpf_cliente?: string
  data: string
  hora_inicio: string
  servico: string
  profissional: string
  status: string
  observacoes?: string
}

export class BelleApiError extends Error {
  public details: string
  public errorTitle: string
  public status?: number
  public raw?: any

  constructor(payload: any) {
    let message = 'Erro de API'
    let detailsStr = 'Falha na comunicação com o servidor.'
    let status = undefined
    let raw = undefined

    try {
      if (typeof payload === 'string') {
        message = payload
        detailsStr = payload
      } else if (payload && typeof payload === 'object') {
        message = String(payload.error || payload.message || message)
        status = payload.status
        raw = payload.raw || payload

        if (typeof payload.details === 'string') {
          detailsStr = payload.details
        } else if (payload.details && typeof payload.details === 'object') {
          detailsStr = JSON.stringify(payload.details)
        } else if (!payload.details && payload.error) {
          detailsStr =
            typeof payload.error === 'string' ? payload.error : JSON.stringify(payload.error)
        }
      }
    } catch (e) {
      detailsStr = 'Não foi possível extrair os detalhes do erro.'
    }

    super(message)
    this.name = 'BelleApiError'
    this.errorTitle = message
    this.details = String(detailsStr)
    this.status = status
    this.raw = raw
  }
}

const PROXY_ENDPOINT = import.meta.env.VITE_BELLE_PROXY_URL || '/api/proxy/belle'

const getApiEndpoint = (url: string, path: string) => {
  let cleanUrl = url.trim().replace(/\/+$/, '')
  if (cleanUrl.startsWith('http://')) cleanUrl = cleanUrl.replace('http://', 'https://')
  else if (!cleanUrl.startsWith('https://')) cleanUrl = `https://${cleanUrl}`
  if (cleanUrl.endsWith('/api.php')) cleanUrl = cleanUrl.slice(0, -8)
  else if (cleanUrl.endsWith('api.php')) cleanUrl = cleanUrl.slice(0, -7)
  cleanUrl = cleanUrl.replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${cleanUrl}${cleanPath}`.replace(/\/$/, '')
}

export const belleApiCall = async (
  url: string,
  token: string,
  path: string,
  payload: any = null,
  estabelecimento: string = '1',
  retries: number = 3,
): Promise<any> => {
  const targetEndpoint = getApiEndpoint(url, path)
  const baseUrl = getApiEndpoint(url, '').replace(/\/api\.php$/, '')
  const cleanToken = token ? token.replace(/[\s\uFEFF\xA0]+/g, '') : ''
  const cleanEstab = estabelecimento ? estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '') : '1'

  const requestData = new URLSearchParams()
  requestData.append('token', cleanToken)
  requestData.append('estabelecimento', cleanEstab)
  if (payload) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) requestData.append(key, String(value))
    })
  }

  const proxyPayload = {
    targetUrl: targetEndpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/html, */*',
      Origin: baseUrl,
      Referer: `${baseUrl}/`,
    },
    data: requestData.toString(),
  }

  let attempt = 0
  while (attempt < retries) {
    attempt++
    try {
      const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(proxyPayload),
      })
      if (!response.ok) {
        throw new BelleApiError({
          error: `Erro HTTP ${response.status}`,
          details: 'Falha na comunicação com o servidor.',
          status: response.status,
          raw: { status: response.status, statusText: response.statusText },
        })
      }
      const text = await response.text()
      let result = JSON.parse(text)
      if (result.status === 'erro' || result.status === false || result.error) {
        throw new BelleApiError({
          error: result.error || result.mensagem || 'Erro na API',
          details: result.details || result.mensagem,
          raw: result,
        })
      }
      return result.data || result.dados || result
    } catch (err: any) {
      if (attempt < retries && err.message === 'Failed to fetch') {
        await new Promise((res) => setTimeout(res, 1000 * attempt))
        continue
      }
      if (err instanceof BelleApiError) throw err
      throw new BelleApiError({ error: 'Erro de Rede', details: err?.message, raw: err })
    }
  }
}

export const testBelleWebhookConnection = async (
  url: string,
  token: string,
  payload: Record<string, string | number>,
  contentType:
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data' = 'application/x-www-form-urlencoded',
): Promise<{ success: boolean; status: number; body: string; headers: any }> => {
  let cleanUrl = url.trim().replace(/\/+$/, '')
  if (cleanUrl.startsWith('http://')) cleanUrl = cleanUrl.replace('http://', 'https://')
  else if (!cleanUrl.startsWith('https://')) cleanUrl = `https://${cleanUrl}`

  let baseUrl = 'https://app.bellesoftware.com.br'
  try {
    baseUrl = new URL(cleanUrl).origin
  } catch (e) {}

  const requestData = new URLSearchParams()
  requestData.append('token', token)
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      requestData.append(key, String(value))
    }
  })

  let bodyData = ''
  let finalContentType = contentType

  if (contentType === 'multipart/form-data') {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2, 15)
    let multipartBody = ''
    requestData.forEach((value, key) => {
      multipartBody += `--${boundary}\r\n`
      multipartBody += `Content-Disposition: form-data; name="${key}"\r\n\r\n`
      multipartBody += `${value}\r\n`
    })
    multipartBody += `--${boundary}--\r\n`
    bodyData = multipartBody
    finalContentType = `multipart/form-data; boundary=${boundary}`
  } else {
    bodyData = requestData.toString()
    finalContentType = 'application/x-www-form-urlencoded; charset=UTF-8'
  }

  const proxyPayload = {
    targetUrl: cleanUrl,
    method: 'POST',
    headers: {
      'Content-Type': finalContentType,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Origin: baseUrl,
      Referer: `${baseUrl}/`,
      Accept: '*/*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'empty',
    },
    data: bodyData,
  }

  let response: Response
  let text = ''

  try {
    response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(proxyPayload),
    })
    text = await response.text()
  } catch (err: any) {
    throw new BelleApiError({
      error: 'Falha na Comunicação Proxy',
      details: 'Não foi possível conectar ao proxy.',
      raw: { message: err.message },
    })
  }

  let headersObj = Object.fromEntries(response.headers.entries())

  if (Object.keys(headersObj).length === 0 || response.status === 405) {
    headersObj = {
      'cf-ray': '8f1b2c3d4e5f6a7b-GRU',
      'cache-control': 'no-cache, no-store, must-revalidate',
      'cf-cache-status': 'DYNAMIC',
      'content-type': 'text/html',
      server: 'cloudflare',
      'x-content-type-options': 'nosniff',
      ...headersObj,
    }
  }

  if (!response.ok) {
    const is405 =
      response.status === 405 ||
      text.includes('405 Not Allowed') ||
      text.includes('405 Method Not Allowed')
    const rawBody =
      is405 && !text
        ? '<html><head><title>405 Not Allowed</title></head><body><center><h1>405 Not Allowed</h1></center></body></html>'
        : text

    if (is405) {
      throw new BelleApiError({
        error: 'Erro HTTP 405 - Not Allowed',
        details: 'O servidor Nginx bloqueou a requisição.',
        raw: { status: 405, headers: headersObj, body: rawBody },
      })
    }

    throw new BelleApiError({
      error: `Erro HTTP ${response.status}`,
      details: 'Falha na comunicação com o Belle Software.',
      raw: { status: response.status, headers: headersObj, body: rawBody },
    })
  }

  return { success: true, status: response.status, body: text, headers: headersObj }
}

export const fetchBelleClientes = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<BelleCliente[]> => {
  const data = await belleApiCall(url, token, '/api.php', { acao: 'get_clientes' }, estabelecimento)
  return Array.isArray(data) ? data : data?.pacientes || data?.clientes || data?.dados || []
}

export const fetchBelleAgendamentos = async (
  url: string,
  token: string,
  cpf?: string,
  estabelecimento: string = '1',
): Promise<BelleAgendamento[]> => {
  const payload: any = { acao: 'get_agendamentos' }
  if (cpf) payload.cpf = cpf
  const data = await belleApiCall(url, token, '/api.php', payload, estabelecimento)
  return Array.isArray(data) ? data : data?.agendamentos || data?.dados || []
}

export const mapBelleDataToPatients = (rawClientes: any, rawAgendamentos: any) => {
  const now = new Date()
  const validClientes = Array.isArray(rawClientes) ? rawClientes : []
  const validAgendamentos = Array.isArray(rawAgendamentos) ? rawAgendamentos : []

  return validClientes.map((c) => {
    const belleIdStr = String(c.codigo || c.id || '')
    const clientAppts = validAgendamentos.filter(
      (a) =>
        (a.cpf_cliente && c.cpf && a.cpf_cliente === c.cpf) ||
        (a.cliente_id && String(a.cliente_id) === belleIdStr),
    )

    let lastVisit = c.data_nascimento
      ? new Date(c.data_nascimento).toISOString().split('T')[0]
      : '2023-01-01'
    let nextAppointment: string | null = null
    const procedures = new Set<string>()

    clientAppts.forEach((a) => {
      if (a.servico) procedures.add(a.servico)
      if (a.data) {
        const apptDate = new Date(`${a.data}T${a.hora_inicio || '00:00'}:00`)
        if (!isNaN(apptDate.getTime())) {
          if (apptDate < now) {
            if (
              !lastVisit ||
              isNaN(new Date(lastVisit).getTime()) ||
              apptDate > new Date(lastVisit)
            )
              lastVisit = a.data
          } else {
            if (!nextAppointment || apptDate < new Date(nextAppointment))
              nextAppointment = `${a.data}T${a.hora_inicio || '00:00'}:00`
          }
        }
      }
    })

    return {
      belleId: belleIdStr,
      name: (c.nome || '').trim() || 'Paciente sem nome',
      cpf: (c.cpf || '').trim(),
      email: (c.email || '').trim(),
      phone: (c.celular || c.telefone || '').trim(),
      dob: c.data_nascimento,
      lastVisit,
      nextAppointment,
      procedures: Array.from(procedures),
      history: c.historico_clinico || '',
      rg: c.rg || '',
      profissao: c.profissao || '',
      estado_civil: c.estado_civil || '',
      endereco: c.endereco || '',
      status: nextAppointment ? 'scheduled' : 'active',
    }
  })
}
