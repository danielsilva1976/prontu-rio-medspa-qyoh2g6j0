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

  constructor(payload: any) {
    let message = 'Erro de API'
    let detailsStr = 'Falha na comunicação com o servidor.'

    try {
      if (typeof payload === 'string') {
        message = payload
        detailsStr = payload
      } else if (payload && typeof payload === 'object') {
        message = String(payload.error || payload.message || message)

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
    this.details = String(detailsStr)
  }
}

const ERROR_USER_FRIENDLY =
  'Falha na comunicação. Verifique suas credenciais de acesso ao Belle Software.'

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
  return `${cleanUrl}${cleanPath}`
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

  let attempt = 0
  while (attempt < retries) {
    attempt++
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      let response: Response | undefined
      let usedFallback = false

      // Primary attempt: Internal proxy (bypassing CORS safely)
      try {
        const proxyParams = new URLSearchParams(params.toString())
        proxyParams.append('target_url', targetEndpoint)

        response = await fetch('/api/internal/belle-bridge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: proxyParams.toString(),
          signal: controller.signal,
        })

        // If internal bridge throws HTTP 405 (Nginx block), 404, or 502, we seamlessly failover
        if (!response.ok && [404, 405, 502, 500].includes(response.status)) {
          usedFallback = true
        }
      } catch (err) {
        usedFallback = true
      }

      // Fallback Strategy: Resilient External Proxy -> Direct Connection
      if (usedFallback) {
        console.warn('Internal bridge unavailable. Initiating proxy failover mechanism...')
        try {
          response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetEndpoint)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json, text/plain, */*',
            },
            body: params.toString(),
            signal: controller.signal,
          })
        } catch (fallbackErr) {
          response = await fetch(targetEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json, text/plain, */*',
            },
            body: params.toString(),
            signal: controller.signal,
          })
        }
      }

      clearTimeout(timeoutId)

      if (!response) {
        throw new Error('Falha de rede')
      }

      if (!response.ok) {
        if (response.status >= 500 && attempt < retries) {
          await sleep(1000 * attempt)
          continue
        }

        let errPayload: any = {
          error: `Erro HTTP ${response.status}`,
          details: 'Falha na comunicação com a API.',
        }

        try {
          const text = await response.text()
          if (text) {
            errPayload.details = text
            if (text.trim().startsWith('{')) {
              const parsed = JSON.parse(text)
              errPayload = { ...errPayload, ...parsed }
            }
          }
        } catch (e) {
          // Ignore JSON parse errors on failure
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
          error: 'Resposta Inesperada (HTML)',
          details:
            'A API retornou uma página HTML em vez de JSON. Verifique a URL base configurada.',
        })
      }

      let result
      try {
        result = JSON.parse(text)
      } catch (e) {
        throw new BelleApiError({
          error: 'Resposta Inválida',
          details: 'A API não retornou um JSON válido.',
        })
      }

      if (result.status === 'erro' || result.status === false || result.error) {
        throw new BelleApiError({
          error: result.error || result.mensagem || 'Falha na Autenticação',
          details: result.details || result.mensagem || ERROR_USER_FRIENDLY,
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
          error: 'Falha de Conexão',
          details:
            'Não foi possível conectar à API. Verifique sua conexão com a internet, proxy de rede ou se o servidor do Belle Software está disponível.',
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
    }
  })
}
