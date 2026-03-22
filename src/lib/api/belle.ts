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

export interface DiagnosticLog {
  request: {
    url: string
    method: string
    headers: Record<string, string>
    body: string
  }
  response: {
    status?: number
    headers?: Record<string, string>
    body?: any
    error?: string
  } | null
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

  // Implementation of high-fidelity WAF bypass headers
  const proxyPayload = {
    targetUrl: targetEndpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
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

/**
 * Direct API Integration Handler with Auto-Retry and Full Diagnostics
 * Implements strict Postman documentation structure with WAF bypass
 */
export const testBelleApiConnectionWithRetry = async (
  url: string,
  token: string,
  estabelecimento: string,
  testData: any,
): Promise<{ success: boolean; status: number; data: any; diagnostics: DiagnosticLog[] }> => {
  const targetEndpoint = getApiEndpoint(url, '/api.php')
  const baseUrl = getApiEndpoint(url, '').replace(/\/api\.php$/, '')
  const cleanToken = token ? token.replace(/[\s\uFEFF\xA0]+/g, '') : ''
  const cleanEstab = estabelecimento ? estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '') : '1'

  const baseHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    Origin: baseUrl,
    Referer: `${baseUrl}/`,
  }

  const buildRequest = (contentType: string) => {
    let bodyData = ''
    const finalHeaders = { ...baseHeaders }

    const payload = {
      token: cleanToken,
      estabelecimento: cleanEstab,
      ...testData,
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams()
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
      })
      bodyData = params.toString()
      finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
    } else if (contentType === 'multipart/form-data') {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2, 15)
      let multipartBody = ''
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          multipartBody += `--${boundary}\r\n`
          multipartBody += `Content-Disposition: form-data; name="${k}"\r\n\r\n`
          multipartBody += `${v}\r\n`
        }
      })
      multipartBody += `--${boundary}--\r\n`
      bodyData = multipartBody
      finalHeaders['Content-Type'] = `multipart/form-data; boundary=${boundary}`
    } else if (contentType === 'application/json') {
      bodyData = JSON.stringify(payload)
      finalHeaders['Content-Type'] = 'application/json'
    }

    return { headers: finalHeaders, bodyData }
  }

  const contentTypesToTry = [
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'application/json',
  ]
  const diagnosticLog: DiagnosticLog[] = []

  for (const cType of contentTypesToTry) {
    const { headers, bodyData } = buildRequest(cType)

    const safeHeaders = { ...headers }
    if (safeHeaders['token']) safeHeaders['token'] = '***REDACTED***'

    const diagnosticEntry: DiagnosticLog = {
      request: {
        url: targetEndpoint,
        method: 'POST',
        headers: safeHeaders,
        body: bodyData,
      },
      response: null,
    }

    try {
      const proxyPayload = {
        targetUrl: targetEndpoint,
        method: 'POST',
        headers,
        data: bodyData,
      }

      const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(proxyPayload),
      })

      const text = await response.text()
      let parsedBody = text
      try {
        parsedBody = JSON.parse(text)
      } catch (e) {
        // Ignored as it might not be JSON
      }

      diagnosticEntry.response = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
      }

      diagnosticLog.push(diagnosticEntry)

      // Auto-retry on WAF blocks (usually 405, 403, or 406)
      if (response.status === 405 || response.status === 403 || response.status === 406) {
        continue
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return {
        success: true,
        status: response.status,
        data: parsedBody,
        diagnostics: diagnosticLog,
      }
    } catch (err: any) {
      if (!diagnosticEntry.response) {
        diagnosticEntry.response = { error: err.message }
      }
      if (!diagnosticLog.includes(diagnosticEntry)) diagnosticLog.push(diagnosticEntry)
      // On network errors, try the next format just in case it's a protocol issue
    }
  }

  throw new BelleApiError({
    error: 'Falha na Conexão após múltiplas tentativas (WAF Bloqueio).',
    details:
      'Tentamos vários formatos (URL Encoded, Multipart, JSON) mas o servidor web continuou bloqueando a requisição.',
    raw: { diagnostics: diagnosticLog },
  })
}

export const testBelleConnection = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<boolean> => {
  await fetchBelleClientes(url, token, estabelecimento)
  return true
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
