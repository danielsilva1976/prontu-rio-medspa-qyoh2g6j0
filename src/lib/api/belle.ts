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

export class BelleApiError extends Error {
  public details: any

  constructor(details: any) {
    super(details.details || details.error || 'API Error')
    this.name = 'BelleApiError'
    this.details = details
  }
}

const ERROR_USER_FRIENDLY = 'Erro ao conectar com o Belle Software. Verifique suas credenciais.'

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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: requestBody,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const text = await response.text()

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${text.substring(0, 100)}`)
    }

    const lowerText = text.toLowerCase()
    if (
      lowerText.trim().startsWith('<!doctype html>') ||
      lowerText.trim().startsWith('<html') ||
      lowerText.includes('<title>login') ||
      lowerText.includes('user/login')
    ) {
      throw new Error('Invalid Response Format (HTML expected JSON)')
    }

    const result = JSON.parse(text)

    if (result.status === 'erro' || result.status === false || result.error) {
      throw new BelleApiError({
        url: endpoint,
        method: 'POST',
        error: result.error || result.mensagem || 'Belle API Error',
        details: ERROR_USER_FRIENDLY,
      })
    }

    return result.data || result.dados || result
  } catch (err: any) {
    clearTimeout(timeoutId)

    if (err instanceof BelleApiError) {
      throw err
    }

    logToBugScanner('Failed Belle API Connection', {
      endpoint,
      requestBody,
      error: err.message,
    })

    throw new BelleApiError({
      url: endpoint,
      method: 'POST',
      error: err?.message || 'Connection Failed',
      details: ERROR_USER_FRIENDLY,
    })
  }
}

export const testBelleConnection = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<boolean> => {
  // Use a low-impact read action to validate credentials reliably
  await belleApiCall(url, token, '/api.php', { acao: 'get_clientes' }, estabelecimento)
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
  // Align strictly with api.php and POST action payload according to AC
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
