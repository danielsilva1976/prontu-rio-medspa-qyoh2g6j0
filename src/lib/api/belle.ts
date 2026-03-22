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

  constructor(payload: any) {
    let message = 'Erro de API'
    let detailsStr = 'Falha na comunicação com o servidor.'
    let status = undefined

    try {
      if (typeof payload === 'string') {
        message = payload
        detailsStr = payload
      } else if (payload && typeof payload === 'object') {
        message = String(payload.error || payload.message || message)
        status = payload.status

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
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
  retries: number = 3,
): Promise<any> => {
  const targetEndpoint = getApiEndpoint(url, path)
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

  // Enforce correct required structure
  params.append('target_url', targetEndpoint)

  let attempt = 0
  while (attempt < retries) {
    attempt++
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch('/api/internal/belle-bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json, text/plain, */*',
        },
        body: params.toString(),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status >= 500 && response.status !== 502 && attempt < retries) {
          await sleep(1000 * attempt)
          continue
        }

        let errPayload: any = {
          error: `Erro HTTP ${response.status}`,
          details: `Falha na comunicação com a API (Status: ${response.status}).`,
          status: response.status,
        }

        if (response.status === 405) {
          errPayload.error = 'Method Not Allowed (405)'
          errPayload.details = `A requisição POST foi recusada pela URL de destino (${targetEndpoint}). Verifique se a URL base está correta e se o servidor aceita POST. Um redirecionamento forçado no servidor pode estar bloqueando a conexão.`
        } else if (response.status === 404) {
          errPayload.error = 'Endpoint Não Encontrado (404)'
          errPayload.details = `O endpoint configurado (${targetEndpoint}) não foi encontrado. Verifique a configuração da URL.`
        } else if (response.status === 502) {
          errPayload.error = 'Bad Gateway (502)'
          errPayload.details = `A ponte de integração não obteve resposta válida do servidor Belle Software (${targetEndpoint}). O servidor pode estar indisponível.`
        } else {
          try {
            const text = await response.text()
            if (text && text.trim().startsWith('{')) {
              const parsed = JSON.parse(text)
              errPayload = { ...errPayload, ...parsed }
            } else if (text) {
              errPayload.details = `Status ${response.status}: ${text}`
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        throw new BelleApiError(errPayload)
      }

      const text = await response.text()

      if (text.trim().startsWith('<')) {
        if (attempt < retries) {
          await sleep(1000 * attempt)
          continue
        }
        throw new BelleApiError({
          error: 'Resposta HTML Inesperada',
          details: `A API retornou HTML em vez de JSON. Resposta parcial: ${text.substring(0, 100)}... Verifique se a URL (${targetEndpoint}) está correta.`,
        })
      }

      let result
      try {
        result = JSON.parse(text)
      } catch (e) {
        throw new BelleApiError({
          error: 'Resposta Inválida',
          details: `A API não retornou um JSON válido. Resposta: ${text.substring(0, 100)}...`,
        })
      }

      if (result.status === 'erro' || result.status === false || result.error) {
        const errMsg = String(result.error || result.mensagem || '').toLowerCase()
        const isAuth =
          errMsg.includes('token') ||
          errMsg.includes('autentica') ||
          errMsg.includes('estabelecimento') ||
          errMsg.includes('não autorizado')

        if (isAuth) {
          throw new BelleApiError({
            error: 'Erro de Autenticação',
            details: 'Falha na Autenticação - Verifique seu Token e ID do Estabelecimento.',
          })
        }

        throw new BelleApiError({
          error: result.error || result.mensagem || 'Erro na API',
          details: result.details || result.mensagem || 'A API retornou um erro estrutural.',
        })
      }

      return result.data || result.dados || result
    } catch (err: any) {
      clearTimeout(timeoutId)

      const isNetworkError =
        err.message?.includes('Failed to fetch') ||
        err.name === 'AbortError' ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Falha de rede')

      if (isNetworkError) {
        if (attempt < retries) {
          await sleep(1000 * attempt)
          continue
        }

        throw new BelleApiError({
          error: 'Erro de Conexão',
          details: 'Não foi possível conectar à ponte de integração. Verifique sua rede.',
        })
      }

      if (err instanceof BelleApiError) {
        throw err
      }

      if (attempt < retries) {
        await sleep(1000 * attempt)
        continue
      }

      throw new BelleApiError({
        error: 'Erro Inesperado',
        details: err?.message || 'Falha na execução da requisição.',
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
