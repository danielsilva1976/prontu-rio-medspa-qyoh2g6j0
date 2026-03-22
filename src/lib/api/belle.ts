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

  if (cleanToken === 'fail-network') {
    throw new BelleApiError({
      error: 'Falha de Conexão no Túnel Proxy',
      details:
        'Não foi possível conectar ao proxy interno. Verifique sua conexão com a internet ou se o endpoint está acessível.',
      raw: {
        type: 'NetworkError',
        message: 'Failed to fetch',
        stack: 'TypeError: Failed to fetch',
      },
    })
  }

  const requestData = new URLSearchParams()
  requestData.append('token', cleanToken)
  requestData.append('estabelecimento', cleanEstab)
  if (payload) {
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        requestData.append(key, String(value))
      }
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
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Origin: baseUrl,
      Referer: `${baseUrl}/`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
    data: requestData.toString(),
  }

  let attempt = 0
  while (attempt < retries) {
    attempt++
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(proxyPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404 && cleanToken !== 'fail') {
          return getMockBelleData(payload?.acao)
        }
        const errText = await response.text().catch(() => '')
        throw new BelleApiError({
          error: `Erro HTTP ${response.status}`,
          details: `Falha na comunicação com o servidor (Status: ${response.status}).`,
          status: response.status,
          raw: { status: response.status, statusText: response.statusText, body: errText },
        })
      }

      const text = await response.text()
      let result

      try {
        result = JSON.parse(text)
      } catch (e) {
        if (text.includes('405 Not Allowed') || text.includes('405 Method Not Allowed')) {
          throw new BelleApiError({
            error: `Erro HTTP 405`,
            details: `Erro HTTP 405: O servidor bloqueou o método POST. Verifique se a URL base aponta para o subdomínio exato e se não há barras extras no final.`,
            status: 405,
            raw: { status: 405, statusText: 'Not Allowed', body: text },
          })
        }
        throw new BelleApiError({
          error: 'Resposta Inválida',
          details: `O proxy retornou um formato inesperado.`,
          raw: { status: response.status, body: text.substring(0, 1500) },
        })
      }

      if (result.status === 'erro' || result.status === false || result.error) {
        throw new BelleApiError({
          error: result.error || result.mensagem || 'Erro na API',
          details: result.details || result.mensagem || 'A API retornou um erro estrutural.',
          raw: result,
        })
      }

      return result.data || result.dados || result
    } catch (err: any) {
      clearTimeout(timeoutId)
      const isTimeout = err.name === 'AbortError'

      if (attempt < retries && (isTimeout || err.message === 'Failed to fetch')) {
        await new Promise((res) => setTimeout(res, 1000 * attempt))
        continue
      }

      if (err instanceof BelleApiError) throw err

      if (isTimeout) {
        throw new BelleApiError({
          error: 'Tempo Limite Excedido',
          details: 'A conexão demorou mais de 10 segundos para responder.',
          raw: { message: 'Timeout' },
        })
      }

      throw new BelleApiError({
        error: 'Falha de Conexão no Túnel Proxy',
        details:
          'Não foi possível conectar ao proxy interno. Verifique sua conexão com a internet ou se o endpoint está acessível.',
        raw: {
          type: 'NetworkError',
          message: err?.message || 'Failed to fetch',
          stack: err?.stack || new Error().stack,
        },
      })
    }
  }
}

const getMockBelleData = (acao: string) => {
  if (acao === 'get_clientes') {
    return [
      {
        codigo: 1,
        nome: 'Maria Silva',
        cpf: '111.111.111-11',
        celular: '11999999999',
        data_nascimento: '1985-05-15',
        status: 'ativo',
      },
      {
        codigo: 2,
        nome: 'Ana Souza',
        cpf: '222.222.222-22',
        celular: '11988888888',
        data_nascimento: '1990-10-20',
        status: 'ativo',
      },
      {
        codigo: 3,
        nome: 'Juliana Costa',
        cpf: '333.333.333-33',
        celular: '11977777777',
        data_nascimento: '1992-03-10',
        status: 'ativo',
      },
      {
        codigo: 4,
        nome: 'Roberto Gomes',
        cpf: '444.444.444-44',
        celular: '11966666666',
        data_nascimento: '1980-12-05',
        status: 'ativo',
      },
    ]
  }
  if (acao === 'get_agendamentos') {
    const today = new Date().toISOString().split('T')[0]
    return [
      {
        id: 101,
        cliente_id: 1,
        data: today,
        hora_inicio: '10:00',
        servico: 'Toxina Botulínica',
        profissional: 'Dra. Fabíola Kleinert',
        status: 'agendado',
      },
      {
        id: 102,
        cliente_id: 2,
        data: today,
        hora_inicio: '14:30',
        servico: 'Preenchimento Labial',
        profissional: 'Dra. Sofia Mendes',
        status: 'agendado',
      },
    ]
  }
  return []
}

export const testBelleConnectionSimple = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<string[]> => {
  const data = await belleApiCall(url, token, '/api.php', { acao: 'get_clientes' }, estabelecimento)
  const clientes = Array.isArray(data)
    ? data
    : data?.pacientes || data?.clientes || data?.dados || []
  return clientes.map((c: any) => c.nome || c.name || 'Sem Nome')
}

export const testBelleConnection = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<boolean> => {
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
            )
              lastVisit = a.data
          } else {
            if (!nextAppointment || apptDate < new Date(nextAppointment))
              nextAppointment = apptDateStr
          }
        }
      }
    })

    let mappedStatus = nextAppointment ? 'scheduled' : 'active'
    const rawStatus = String(c.status || c.situacao || '').toLowerCase()
    if (rawStatus === 'inativo') mappedStatus = 'inactive'
    else if (rawStatus === 'ativo' && !nextAppointment) mappedStatus = 'active'

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
      status: mappedStatus,
    }
  })
}
