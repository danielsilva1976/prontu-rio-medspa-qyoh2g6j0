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
  UF?: string
  cidade?: string
  bairro?: string
  cep?: string
  endereco?: string
  numEndereco?: string
  historico_clinico?: string
  rg?: string
  estado_civil?: string
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
  url: string,
  token: string,
  estabelecimento: string = '1',
  queryParams: Record<string, any> = {},
  retries: number = 3,
): Promise<any> => {
  const cleanToken = token ? token.trim() : ''
  const cleanEstab = estabelecimento ? estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '') : '1'
  let finalUrl = url.trim()

  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Authorization: cleanToken,
    Accept: 'application/json, text/plain, */*',
  }

  const params = new URLSearchParams()
  if (cleanEstab) params.append('codEstab', cleanEstab)

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
  }

  const [baseUrl, existingQuery] = finalUrl.split('?')
  let queryStr = existingQuery || ''
  const newParamsStr = params.toString()
  if (newParamsStr) {
    queryStr = queryStr ? `${queryStr}&${newParamsStr}` : newParamsStr
  }
  finalUrl = queryStr ? `${baseUrl}?${queryStr}` : baseUrl

  const proxyPayload = {
    targetUrl: finalUrl,
    method: 'GET',
    headers,
    removeHeaders: ['Sec-Fetch-Site', 'Sec-Fetch-Mode', 'Sec-Fetch-Dest', 'Origin'],
    useResidentialProxy: true,
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
        const text = await response.text()
        throw new BelleApiError({
          error: `Erro HTTP ${response.status}`,
          details: text || 'Falha na comunicação com o servidor.',
          status: response.status,
          raw: { status: response.status, body: text },
        })
      }

      const text = await response.text()
      let result
      try {
        result = JSON.parse(text)
      } catch (e) {
        result = text
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
      if (
        attempt < retries &&
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

/**
 * Direct API Integration Handler with Diagnostic Logs
 */
export const testBelleApiConnectionWithRetry = async (
  url: string,
  token: string,
  estabelecimento: string,
  testData: any = {},
): Promise<{ success: boolean; status: number; data: any; diagnostics: DiagnosticLog[] }> => {
  const cleanToken = token ? token.trim() : ''
  const cleanEstab = estabelecimento ? estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '') : '1'

  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Authorization: cleanToken,
    Accept: 'application/json, text/plain, */*',
  }

  let finalUrl = url.trim()
  const params = new URLSearchParams()
  if (cleanEstab) params.append('codEstab', cleanEstab)

  Object.entries(testData).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.append(k, String(v))
    }
  })

  const [baseUrl, existingQuery] = finalUrl.split('?')
  let queryStr = existingQuery || ''
  const newParamsStr = params.toString()
  if (newParamsStr) {
    queryStr = queryStr ? `${queryStr}&${newParamsStr}` : newParamsStr
  }
  finalUrl = queryStr ? `${baseUrl}?${queryStr}` : baseUrl

  const proxyPayload = {
    targetUrl: finalUrl,
    method: 'GET',
    headers,
    removeHeaders: ['Sec-Fetch-Site', 'Sec-Fetch-Mode', 'Sec-Fetch-Dest', 'Origin'],
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

  try {
    let response: Response

    try {
      response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(proxyPayload),
      })
    } catch (networkErr: any) {
      throw new Error(`Proxy offline ou erro de rede: ${networkErr.message}`)
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

    if (!response.ok) {
      throw new BelleApiError({
        error: `Erro HTTP ${response.status}`,
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
  const result = await belleApiCall(url, token, estabelecimento, {})
  return { success: true, data: result }
}

export const fetchBelleClientes = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<BelleCliente[]> => {
  const data = await belleApiCall(url, token, estabelecimento, {})
  return Array.isArray(data) ? data : data?.pacientes || data?.clientes || data?.dados || []
}

export const fetchBelleAgendamentos = async (
  _url: string,
  _token: string,
  _cpf?: string,
  _estabelecimento: string = '1',
): Promise<BelleAgendamento[]> => {
  // Current REST v1.0 scope only covers clients listing/search. Return empty to prevent sync breaking.
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

    let formattedAddress = c.endereco || ''
    if (c.numEndereco) formattedAddress += `, ${c.numEndereco}`
    if (c.bairro) formattedAddress += ` - ${c.bairro}`
    if (c.cidade) formattedAddress += ` - ${c.cidade}`
    if (c.UF) formattedAddress += `/${c.UF}`

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
      history: c.historico_clinico || '',
      rg: c.rg || '',
      profissao: c.profissao || '',
      estado_civil: c.estado_civil || '',
      endereco: formattedAddress.trim(),
      status: nextAppointment ? 'scheduled' : 'active',
    }
  })
}

export const mapPatientToBellePayload = (patient: Partial<Patient>) => {
  return {
    acao: 'add_cliente',
    nome: patient.name || 'Sem Nome',
    email: patient.email || '',
    celular: patient.phone ? patient.phone.replace(/\D/g, '') : '',
    observacao: patient.history || 'Adicionado via Prontuário MEDSPA',
    origem: 'App',
  }
}
