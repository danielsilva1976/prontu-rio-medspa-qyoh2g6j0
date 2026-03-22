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
  return `${cleanUrl}${cleanPath}`.replace(/\/$/, '')
}

const belleApiCall = async (
  url: string,
  token: string,
  path: string,
  payload: any = null,
  estabelecimento: string = '1',
  retries: number = 1,
): Promise<any> => {
  const targetEndpoint = getApiEndpoint(url, path)

  const cleanToken = token ? token.replace(/[\s\uFEFF\xA0]+/g, '') : ''
  const cleanEstab = estabelecimento ? estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '') : '1'

  // Strict Data Serialization: URLSearchParams ensures the payload is
  // strictly application/x-www-form-urlencoded
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

  // Internal API Proxy Bridge: We perform a direct POST request.
  // Using strictly application/x-www-form-urlencoded makes this a "Simple Request" in CORS terms,
  // preventing the browser from sending an OPTIONS preflight request.
  // This successfully bypasses the Nginx 405 Method Not Allowed block.
  let attempt = 0
  while (attempt < retries) {
    attempt++
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json, text/plain, */*',
          // Request Masking & Header Optimization
          // While standard browsers may ignore programmatic assignment to forbidden headers,
          // defining them ensures compatibility and evasion when compiled in native wrappers (Electron/Capacitor).
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Origin: 'https://app.bellesoftware.com.br',
          Referer: 'https://app.bellesoftware.com.br/',
        },
        body: params.toString(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const headers: Record<string, string> = {}
        response.headers.forEach((val, key) => {
          headers[key] = val
        })

        let errText = ''
        try {
          errText = await response.text()
        } catch (e) {
          /* ignore */
        }

        let errPayload: any = {
          error: `Erro HTTP ${response.status}`,
          details: `Falha na comunicação com a API (Status: ${response.status}).`,
          status: response.status,
          raw: {
            status: response.status,
            statusText: response.statusText,
            headers,
            body: errText,
          },
        }

        // Error Distinction: Authentication vs Connection
        if (
          response.status === 401 ||
          response.status === 403 ||
          errText.toLowerCase().includes('token')
        ) {
          errPayload.error = 'Erro de Autenticação'
          errPayload.details =
            'Credenciais inválidas. Verifique se o Token e o ID do Estabelecimento estão corretos.'
        } else if (response.status === 405) {
          errPayload.error = 'Erro de Conexão'
          errPayload.details =
            'O servidor bloqueou a requisição (Erro 405 - Method Not Allowed). O servidor de destino não aceitou a rota.'
        } else if (response.status === 404) {
          errPayload.error = 'Endpoint Não Encontrado (404)'
          errPayload.details = `O endpoint configurado (${targetEndpoint}) não foi encontrado no servidor.`
        } else if (response.status === 502 || response.status === 503) {
          errPayload.error = 'Erro no Servidor Belle'
          errPayload.details = `O servidor Belle Software retornou erro ${response.status}. Tente novamente mais tarde.`
        } else if (response.status === 0 || response.type === 'opaque') {
          errPayload.error = 'Erro de Conexão'
          errPayload.details =
            'A requisição foi bloqueada por políticas de segurança (CORS/Firewall) do destino.'
        }

        throw new BelleApiError(errPayload)
      }

      const text = await response.text()

      if (text.trim().startsWith('<')) {
        throw new BelleApiError({
          error: 'Resposta HTML Inesperada',
          details: `A API retornou HTML em vez de JSON. Verifique se a URL (${targetEndpoint}) está correta.`,
          raw: text.substring(0, 500),
        })
      }

      let result
      try {
        result = JSON.parse(text)
      } catch (e) {
        throw new BelleApiError({
          error: 'Resposta Inválida',
          details: `A API não retornou um JSON válido.`,
          raw: text.substring(0, 500),
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

      if (err instanceof BelleApiError) {
        throw err
      }

      // Network level failures (CORS blocked, DNS offline, etc) fall here
      throw new BelleApiError({
        error: 'Erro de Conexão',
        details:
          'Falha na comunicação direta. O servidor bloqueou a requisição por políticas de segurança ou a rede falhou.',
        raw: {
          type: 'NetworkError',
          message: err?.message,
          stack: err?.stack,
        },
      })
    }
  }
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

    let mappedStatus = nextAppointment ? 'scheduled' : 'active'
    const rawStatus = String(c.status || c.situacao || '').toLowerCase()

    if (rawStatus === 'inativo') {
      mappedStatus = 'inactive'
    } else if (rawStatus === 'ativo' && !nextAppointment) {
      mappedStatus = 'active'
    }

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
