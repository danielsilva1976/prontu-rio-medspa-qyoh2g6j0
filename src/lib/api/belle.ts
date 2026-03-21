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

export class BelleProxyError extends Error {
  public details: any

  constructor(details: any) {
    super(details.details || details.error || 'Proxy Error')
    this.name = 'BelleProxyError'
    this.details = details
  }
}

const ERROR_INVALID_TOKEN =
  'Falha na conexão: token de autenticação invalido. Verifique dados no Belle software'

const getApiEndpoint = (url: string, path: string) => {
  let cleanUrl = url.trim().replace(/\/+$/, '')

  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace('http://', 'https://')
  } else if (!cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`
  }

  if (cleanUrl.endsWith('/api.php')) {
    cleanUrl = cleanUrl.slice(0, -8)
  } else if (cleanUrl.endsWith('api.php')) {
    cleanUrl = cleanUrl.slice(0, -7)
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${cleanUrl}${cleanPath}`
}

const logToBugScanner = (context: string, details: any) => {
  console.error(`[Bug Scanner] ${context}:`, JSON.stringify(details, null, 2))
}

const belleApiCall = async (
  url: string,
  token: string,
  path: string,
  payload: any = null,
  estabelecimento: string = '1',
) => {
  const endpoint = getApiEndpoint(url, path)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const cleanToken = token ? token.replace(/[\s\uFEFF\xA0]+/g, '') : ''
    const cleanEstab = estabelecimento ? estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '') : '1'

    const params = new URLSearchParams()
    if (cleanToken) params.append('token', cleanToken)
    if (cleanEstab) params.append('estabelecimento', cleanEstab)

    if (payload && typeof payload === 'object') {
      for (const [key, value] of Object.entries(payload)) {
        params.append(
          key,
          typeof value === 'object' ? JSON.stringify(value).trim() : String(value).trim(),
        )
      }
    }

    const requestBody = params.toString()

    // Utilize CORS Proxy to bypass browser restrictions for the Belle API
    const proxyBaseUrl = import.meta.env.VITE_CORS_PROXY_URL || 'https://corsproxy.io/?'
    const fetchUrl = `${proxyBaseUrl}${encodeURIComponent(endpoint)}`

    let response: Response

    try {
      response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: requestBody,
        signal: controller.signal,
      })
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new BelleProxyError({
          url: endpoint,
          method: 'POST',
          error: 'Proxy Connection Failed',
          details:
            'Erro ao conectar via CORS Proxy. O serviço de proxy pode estar indisponível no momento.',
        })
      }
      throw err
    }

    clearTimeout(timeoutId)

    let text = ''
    try {
      text = await response.text()
    } catch (e) {
      console.error('Failed to read response text', e)
    }

    if (!response.ok) {
      let detailsMsg = text ? text.substring(0, 250) : 'Sem detalhes adicionais'
      let parsedBody: any = null
      try {
        if (text) {
          parsedBody = JSON.parse(text)
          detailsMsg = parsedBody.mensagem || parsedBody.message || parsedBody.error || detailsMsg
        }
      } catch (e) {
        // Keep raw text
      }

      logToBugScanner('Failed Belle API Connection', {
        endpoint,
        status: response.status,
        requestBody,
        responseBody: text,
      })

      if (response.status === 403) {
        throw new BelleProxyError({
          url: endpoint,
          method: 'POST',
          error: '403 Forbidden',
          details: `Acesso negado. Detalhes do Belle Software: ${detailsMsg}`,
        })
      }

      if (response.status === 401) {
        throw new BelleProxyError({
          url: endpoint,
          method: 'POST',
          error: '401 Unauthorized',
          details: `${ERROR_INVALID_TOKEN}. Detalhes: ${detailsMsg}`,
        })
      }

      throw new BelleProxyError({
        url: endpoint,
        method: 'POST',
        error: `Status ${response.status}`,
        details: `Erro de comunicação com Belle Software: ${detailsMsg}`,
      })
    }

    if (!text) return null

    const lowerText = text.toLowerCase()
    if (
      lowerText.trim().startsWith('<!doctype html>') ||
      lowerText.trim().startsWith('<html') ||
      lowerText.includes('<title>login') ||
      lowerText.includes('user/login')
    ) {
      throw new BelleProxyError({
        url: endpoint,
        method: 'POST',
        error: 'Invalid Response Format',
        details: ERROR_INVALID_TOKEN,
      })
    }

    const result = JSON.parse(text)

    if (result.status === 'erro' || result.status === false || result.error) {
      const msg = result.mensagem || result.message || result.error || ''
      if (
        msg.toLowerCase().includes('token') ||
        msg.toLowerCase().includes('autentica') ||
        msg.toLowerCase().includes('auth') ||
        msg.toLowerCase().includes('login') ||
        msg.toLowerCase().includes('invali') ||
        msg.toLowerCase().includes('senha')
      ) {
        throw new BelleProxyError({
          url: endpoint,
          method: 'POST',
          error: 'Authentication Error',
          details: `${ERROR_INVALID_TOKEN}. Detalhes: ${msg}`,
        })
      }

      throw new BelleProxyError({
        url: endpoint,
        method: 'POST',
        error: 'Belle API Error',
        details: msg || 'Erro desconhecido retornado pela API.',
      })
    }

    return result.data || result.dados || result
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'BelleProxyError') {
      throw error
    }

    if (
      error.name === 'AbortError' ||
      error.message === 'TIMEOUT_ERROR' ||
      error.message.includes('Erro de rede')
    ) {
      throw new BelleProxyError({
        url: endpoint,
        method: 'POST',
        error: 'Network Timeout',
        details: 'Erro de rede: Verifique sua conexão ou a disponibilidade do servidor proxy.',
      })
    }
    throw error
  }
}

export const testBelleConnection = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<boolean> => {
  await belleApiCall(url, token, '/api.php', null, estabelecimento)
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
  const path = cpf ? `/api/v1/agendamentos?cpf=${encodeURIComponent(cpf)}` : '/api/v1/agendamentos'
  const data = await belleApiCall(url, token, path, null, estabelecimento)
  return Array.isArray(data) ? data : data?.agendamentos || []
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
        const hora = a.hora_inicio || '00:00'
        const apptDateStr = `${a.data}T${hora}:00`
        const apptDate = new Date(apptDateStr)

        if (!isNaN(apptDate.getTime())) {
          if (apptDate < now) {
            if (
              !lastVisit ||
              isNaN(new Date(lastVisit).getTime()) ||
              apptDate > new Date(lastVisit)
            ) {
              lastVisit = a.data
            }
          } else {
            if (!nextAppointment || apptDate < new Date(nextAppointment)) {
              nextAppointment = apptDateStr
            }
          }
        }
      }
    })

    return {
      belleId: belleIdStr,
      name: c.nome || 'Paciente sem nome',
      cpf: c.cpf || '',
      email: c.email || '',
      phone: c.celular || c.telefone || '',
      dob: c.data_nascimento,
      lastVisit,
      nextAppointment,
      procedures: Array.from(procedures),
      history: c.historico_clinico || '',
    }
  })
}
