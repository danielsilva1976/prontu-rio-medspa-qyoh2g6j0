import { Patient } from '@/stores/usePatientStore'

export interface BelleCliente {
  codigo?: number | string
  id?: number | string
  nome?: string
  cpf?: string
  dtNascimento?: string
  data_nascimento?: string
  celular?: string
  telefone?: string
  email?: string
  dtCadastro?: string
  sexo?: string
  profissao?: string
  uf?: string
  UF?: string
  cidade?: string
  bairro?: string
  cep?: string
  rua?: string
  numeroRua?: string
  endereco?: string
  numEndereco?: string
  historico_clinico?: string
  observacao?: string
  rg?: string
  estado_civil?: string
  status?: string
  situacao?: string
  temperatura?: string
  classificacao?: string
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
    removeHeaders?: string[]
    useResidentialProxy?: boolean
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

export const belleApiCall = async (
  method: 'GET' | 'POST' | 'PUT',
  baseUrl: string,
  endpoint: string,
  token: string,
  queryParams: Record<string, any> = {},
  bodyData: any = null,
  retries: number = 0,
): Promise<any> => {
  const cleanToken = token ? token.trim() : ''
  let finalUrl = `${baseUrl.trim().replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers: Record<string, string> = {
    Authorization: cleanToken,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const params = new URLSearchParams()
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
  }

  const newParamsStr = params.toString()
  if (newParamsStr) {
    finalUrl = finalUrl.includes('?')
      ? `${finalUrl}&${newParamsStr}`
      : `${finalUrl}?${newParamsStr}`
  }

  const proxyPayload = {
    targetUrl: finalUrl,
    method,
    headers,
    body: method !== 'GET' ? bodyData : undefined,
    removeHeaders: [
      'Sec-Fetch-Site',
      'Sec-Fetch-Mode',
      'Sec-Fetch-Dest',
      'Origin',
      'Referer',
      'User-Agent',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
    ],
    useResidentialProxy: true,
  }

  let attempt = 0
  while (attempt <= retries) {
    attempt++
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(proxyPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const text = await response.text()
      let result
      try {
        result = JSON.parse(text)
      } catch (e) {
        result = text
      }

      if (!response.ok || [400, 401, 404, 500].includes(response.status)) {
        let errorMsg = `Erro HTTP ${response.status}`
        if (response.status === 400) errorMsg = '400 Bad Request'
        if (response.status === 401) errorMsg = '401 Unauthorized'
        if (response.status === 404) errorMsg = '404 Not Found'
        if (response.status === 500) errorMsg = '500 Server Error'

        throw new BelleApiError({
          error: errorMsg,
          details: typeof result === 'string' ? result : JSON.stringify(result),
          status: response.status,
          raw: { status: response.status, body: result },
        })
      }

      if (
        typeof result === 'object' &&
        result !== null &&
        (result.status === 'erro' || result.status === false || result.error)
      ) {
        throw new BelleApiError({
          error: result.error || result.mensagem || 'Erro na API',
          details: result.details || result.mensagem || text,
          raw: result,
        })
      }

      return result.data || result.dados || result
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') {
        throw new BelleApiError({
          error: 'Timeout',
          details: 'A requisição demorou mais de 30 segundos para responder.',
        })
      }
      if (
        attempt <= retries &&
        (err.message === 'Failed to fetch' || err.message.includes('Network'))
      ) {
        await new Promise((res) => setTimeout(res, 1000 * attempt))
        continue
      }
      if (err instanceof BelleApiError) throw err
      throw new BelleApiError({ error: 'Erro de Rede', details: err?.message, raw: err })
    }
  }
}

export const listClientes = async (
  baseUrl: string,
  token: string,
  estabelecimento: string,
  pagina: number = 0,
) => {
  return belleApiCall('GET', baseUrl, '/clientes', token, { codEstab: estabelecimento, pagina })
}

export const searchCliente = async (
  baseUrl: string,
  token: string,
  estabelecimento: string,
  filters: { cpf?: string; id?: string; email?: string; celular?: string },
) => {
  return belleApiCall('GET', baseUrl, '/cliente/buscar', token, {
    codEstab: estabelecimento,
    ...filters,
  })
}

export const updateCliente = async (
  baseUrl: string,
  token: string,
  codCliente: string | number,
  data: any,
) => {
  return belleApiCall('PUT', baseUrl, '/cliente', token, { codCliente }, data)
}

export const saveLead = async (
  baseUrl: string,
  token: string,
  estabelecimento: string,
  data: {
    nome: string
    celular?: string
    email?: string
    cpf?: string
    observacao?: string
    tpOrigem?: string
    codOrigem?: string
  },
) => {
  return belleApiCall(
    'POST',
    baseUrl,
    '/cliente/gravar-lead',
    token,
    {},
    { codEstab: estabelecimento, ...data },
  )
}

export const testBelleApiConnectionWithRetry = async (
  baseUrl: string,
  token: string,
  estabelecimento: string,
  testData: any = {},
): Promise<{ success: boolean; status: number; data: any; diagnostics: DiagnosticLog[] }> => {
  const cleanToken = token ? token.trim() : ''
  const cleanEstab = estabelecimento ? estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '') : '1'

  let endpoint = '/clientes'
  let queryParams: Record<string, any> = { codEstab: cleanEstab }

  const hasFilters = Object.values(testData).some((v) => v !== undefined && v !== null && v !== '')
  if (hasFilters) {
    endpoint = '/cliente/buscar'
    queryParams = { ...queryParams, ...testData }
  } else {
    queryParams.pagina = 0
  }

  let finalUrl = `${baseUrl.trim().replace(/\/$/, '')}${endpoint}`
  const params = new URLSearchParams()
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })

  const newParamsStr = params.toString()
  if (newParamsStr) {
    finalUrl = finalUrl.includes('?')
      ? `${finalUrl}&${newParamsStr}`
      : `${finalUrl}?${newParamsStr}`
  }

  const headers: Record<string, string> = {
    Authorization: cleanToken,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const proxyPayload = {
    targetUrl: finalUrl,
    method: 'GET',
    headers,
    removeHeaders: [
      'Sec-Fetch-Site',
      'Sec-Fetch-Mode',
      'Sec-Fetch-Dest',
      'Origin',
      'Referer',
      'User-Agent',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
    ],
    useResidentialProxy: true,
  }

  const diagnosticEntry: DiagnosticLog = {
    request: {
      url: finalUrl,
      method: proxyPayload.method,
      headers,
      removeHeaders: proxyPayload.removeHeaders,
      useResidentialProxy: proxyPayload.useResidentialProxy,
    },
    response: null,
  }

  const diagnosticLog: DiagnosticLog[] = []
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    let response: Response

    try {
      response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(proxyPayload),
        signal: controller.signal,
      })
    } catch (networkErr: any) {
      if (networkErr.name === 'AbortError') {
        throw new Error('Timeout de 30 segundos excedido ao contactar o servidor.')
      }
      throw new Error(`Proxy offline ou erro de rede: ${networkErr.message}`)
    } finally {
      clearTimeout(timeoutId)
    }

    const text = await response.text()
    let parsedBody = text
    try {
      parsedBody = JSON.parse(text)
    } catch (e) {
      // Keep as plain text if not JSON
    }

    diagnosticEntry.response = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedBody,
    }

    diagnosticLog.push(diagnosticEntry)

    if (!response.ok || [400, 401, 404, 500].includes(response.status)) {
      let errorMsg = `Erro HTTP ${response.status}`
      if (response.status === 400) errorMsg = '400 Bad Request'
      if (response.status === 401) errorMsg = '401 Unauthorized'
      if (response.status === 404) errorMsg = '404 Not Found'
      if (response.status === 500) errorMsg = '500 Server Error'

      throw new BelleApiError({
        error: errorMsg,
        details: typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody),
        status: response.status,
        raw: { diagnostics: diagnosticLog, status: response.status, body: parsedBody },
      })
    }

    if (
      typeof parsedBody === 'object' &&
      parsedBody !== null &&
      ('erro' in parsedBody || parsedBody.status === false || parsedBody.error)
    ) {
      throw new BelleApiError({
        error: parsedBody.error || parsedBody.mensagem || 'Erro na API',
        details: parsedBody.details || parsedBody.mensagem || JSON.stringify(parsedBody),
        status: 200,
        raw: { diagnostics: diagnosticLog, status: 200, body: parsedBody },
      })
    }

    return {
      success: true,
      status: response.status,
      data: parsedBody,
      diagnostics: diagnosticLog,
    }
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (!diagnosticEntry.response) {
      diagnosticEntry.response = { error: err.message }
      if (!diagnosticLog.includes(diagnosticEntry)) diagnosticLog.push(diagnosticEntry)
    }
    if (err instanceof BelleApiError) throw err
    throw new BelleApiError({
      error: 'Falha na Conexão',
      details: err.message,
      raw: { diagnostics: diagnosticLog },
    })
  }
}

export const testBelleConnection = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
) => {
  const result = await listClientes(url, token, estabelecimento, 0)
  return { success: true, data: result }
}

export const fetchBelleClientes = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<BelleCliente[]> => {
  const data = await listClientes(url, token, estabelecimento, 0)
  return Array.isArray(data) ? data : data?.pacientes || data?.clientes || data?.dados || []
}

export const fetchBelleAgendamentos = async (
  _url: string,
  _token: string,
  _cpf?: string,
  _estabelecimento: string = '1',
): Promise<BelleAgendamento[]> => {
  return []
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

    const rawDob = c.dtNascimento || c.data_nascimento
    let lastVisit = rawDob ? new Date(rawDob).toISOString().split('T')[0] : '2023-01-01'
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

    let formattedAddress = c.rua || c.endereco || ''
    if (c.numeroRua || c.numEndereco) formattedAddress += `, ${c.numeroRua || c.numEndereco}`
    if (c.bairro) formattedAddress += ` - ${c.bairro}`
    if (c.cidade) formattedAddress += ` - ${c.cidade}`
    if (c.uf || c.UF) formattedAddress += `/${c.uf || c.UF}`

    return {
      belleId: belleIdStr,
      name: (c.nome || '').trim() || 'Paciente sem nome',
      cpf: (c.cpf || '').trim(),
      email: (c.email || '').trim(),
      phone: (c.celular || c.telefone || '').trim(),
      dob: rawDob,
      lastVisit,
      nextAppointment,
      procedures: Array.from(procedures),
      history: c.observacao || c.historico_clinico || '',
      rg: c.rg || '',
      profissao: c.profissao || '',
      estado_civil: c.estado_civil || '',
      endereco: formattedAddress.trim(),
      rua: c.rua || '',
      numeroRua: c.numeroRua || '',
      bairro: c.bairro || '',
      cidade: c.cidade || '',
      uf: c.uf || c.UF || '',
      cep: c.cep || '',
      temperatura: c.temperatura || '',
      classificacao: c.classificacao || '',
      status: nextAppointment ? 'scheduled' : 'active',
    }
  })
}
