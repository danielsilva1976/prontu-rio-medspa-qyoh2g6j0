import { logger } from '../../infra/logger'

const baseUrl = 'https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0'

const fetchBelleApi = async (
  endpoint: string,
  options: RequestInit & { queryParams?: Record<string, string> },
) => {
  // Try to safely access process.env (since this runs in Cloudflare/Vercel/Node environment)
  let token = ''

  if (typeof process !== 'undefined' && process.env && process.env.BELLE_TOKEN) {
    token = process.env.BELLE_TOKEN
  } else if (
    typeof import.meta !== 'undefined' &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_BELLE_TOKEN
  ) {
    token = (import.meta as any).env.VITE_BELLE_TOKEN
  }

  const cleanToken = token.trim()

  if (!cleanToken) {
    throw new Error('Belle Token não configurado no backend (BELLE_TOKEN ausente).')
  }

  const url = new URL(`${baseUrl}${endpoint}`)
  if (options.queryParams) {
    Object.entries(options.queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.append(k, v)
      }
    })
  }

  const doRequest = async (authHeader: string) => {
    const headers = {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    const logContext = {
      method: options.method || 'GET',
      url: url.toString(),
      codEstab: options.queryParams?.codEstab,
    }

    logger.info('Backend Belle API Request Started', logContext)

    const fetchOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
    }
    if (options.body) {
      fetchOptions.body = options.body
    }

    const response = await fetch(url.toString(), fetchOptions)

    const status = response.status
    const rawBody = await response.text()

    let parsedBody
    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      parsedBody = { message: rawBody }
    }

    logger.info('Backend Belle API Request Completed', {
      method: options.method || 'GET',
      status,
      codEstab: options.queryParams?.codEstab,
    })

    return { status, rawBody, parsedBody, response }
  }

  // Format Verification: Try Bearer format first
  let res = await doRequest(`Bearer ${cleanToken}`)

  if (res.status === 401 || res.status === 403) {
    logger.info('Belle API 401/403 with Bearer token, trying raw format', {
      codEstab: options.queryParams?.codEstab,
    })
    res = await doRequest(cleanToken)
  }

  if (res.status >= 400 || (res.parsedBody && (res.parsedBody.erro || res.parsedBody.error))) {
    const errorMsg =
      res.parsedBody?.mensagem || res.parsedBody?.error || JSON.stringify(res.parsedBody)
    const err: any = new Error(`API Error (HTTP ${res.status}). Error: ${errorMsg}`)
    err.status = res.status
    err.rawBody = res.rawBody
    err.url = url.toString()
    err.method = options.method || 'GET'
    throw err
  }

  return res.parsedBody
}

export const belleService = {
  testarConexao: async (codEstab: string) => {
    return fetchBelleApi('/clientes', { method: 'GET', queryParams: { codEstab, pagina: '0' } })
  },
  listarClientes: async (codEstab: string, pagina: number) => {
    return fetchBelleApi('/clientes', {
      method: 'GET',
      queryParams: { codEstab, pagina: String(pagina) },
    })
  },
  buscarCliente: async (codEstab: string, filters: Record<string, string>) => {
    return fetchBelleApi('/clientes', { method: 'GET', queryParams: { codEstab, ...filters } })
  },
  atualizarCliente: async (codCliente: string, data: any) => {
    return fetchBelleApi(`/clientes?codCliente=${codCliente}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
  gravarLead: async (data: any) => {
    return fetchBelleApi('/clientes/lead', { method: 'POST', body: JSON.stringify(data) })
  },
  listarAgendamentos: async (codEstab: string) => {
    return fetchBelleApi('/agendamentos', { method: 'GET', queryParams: { codEstab } })
  },
}
