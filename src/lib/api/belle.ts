import { BelleCliente, BelleAgendamento, DiagnosticLog } from '@/integrations/belle/belleTypes'
import { mapBelleDataToPatients } from '@/integrations/belle/belleMapper'
import { logger } from '@/infra/logger'

export type { BelleCliente, BelleAgendamento, DiagnosticLog }
export { mapBelleDataToPatients }

const baseUrl = 'https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0'

const getAuthToken = (): string => {
  let token = ''

  // Validate environment variables - backend/SSR support first
  if (typeof process !== 'undefined' && process.env && process.env.BELLE_TOKEN) {
    token = process.env.BELLE_TOKEN
  } else if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Vite environment variable support
    token = (import.meta.env.VITE_BELLE_TOKEN || import.meta.env.BELLE_TOKEN || '') as string
  }

  // Strip potential quotes around the token
  return token.replace(/^["']|["']$/g, '').trim()
}

const doFetch = async (url: string, options: RequestInit, token: string) => {
  const headers = new Headers(options.headers || {})

  headers.set('Accept', 'application/json')
  if (options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }

  // Format Validation Support: Authentication Header securely parsed
  if (token) {
    const authValue = token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`
    headers.set('Authorization', authValue)
  }

  return fetch(url, { ...options, headers })
}

const fetchBelleApi = async (endpoint: string, options: RequestInit = {}) => {
  const isDirectUrl = endpoint.startsWith('http')
  const url = isDirectUrl ? endpoint : `${baseUrl}${endpoint}`

  const token = getAuthToken()

  if (!token) {
    logger.warn('Belle API Request: No auth token provided in environment variables', {
      url,
      action: 'Proceeding without token, expects 401/403 API response',
    })
  }

  let host = 'unknown'
  try {
    host = new URL(url).host
  } catch (e) {
    // ignore invalid URL host parsing
  }

  logger.info('Belle API Request Started', {
    url,
    host,
    method: options.method || 'GET',
    security: 'Direct External API Call',
    authConfigured: !!token,
  })

  let res: Response
  try {
    res = await doFetch(url, options, token)
  } catch (err: any) {
    logger.warn('Belle API fetch failed (Network/CORS)', { url, err: err.message })
    throw err
  }

  const contentType = res.headers.get('content-type') || ''

  logger.info('Belle API Request Completed', {
    url,
    host,
    method: options.method || 'GET',
    status: res.status,
    contentType,
  })

  const text = await res.text()
  const lowerText = text.trim().toLowerCase()

  if (
    contentType.includes('text/html') ||
    lowerText.startsWith('<!doctype html>') ||
    lowerText.startsWith('<html')
  ) {
    const error: any = new Error(
      'Routing/Intercept Error: Received HTML instead of JSON from Belle API. This indicates the request was intercepted or routed incorrectly.',
    )
    error.status = res.status
    error.url = url
    error.host = host
    error.method = options.method || 'GET'
    error.contentType = contentType
    error.rawBody = text.substring(0, 500)

    logger.error('Routing/Intercept Error', {
      url,
      host,
      method: error.method,
      status: res.status,
      contentType,
      bodyPreview: error.rawBody,
    })

    throw error
  }

  let data
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (e) {
      const error: any = new Error(
        `JSON Parse Error: Expected valid JSON object but failed to parse response.`,
      )
      error.status = res.status
      error.url = url
      error.host = host
      error.rawBody = text.substring(0, 200)
      throw error
    }
  }

  if (!res.ok || (data && (data.erro || data.error))) {
    const errorMsg =
      data?.mensagem || data?.error || JSON.stringify(data) || `HTTP error ${res.status}`
    const error: any = new Error(`API Error (HTTP ${res.status}). Error: ${errorMsg}`)
    error.status = res.status
    error.url = url
    error.host = host
    error.method = options.method || 'GET'
    error.rawBody = text
    throw error
  }

  return { data, status: res.status, url, method: options.method || 'GET', rawBody: text }
}

export const testarConexaoBelle = async (estabelecimento: string = '1') => {
  try {
    const response = await fetchBelleApi(`/clientes?codEstab=${estabelecimento}&pagina=0`, {
      method: 'GET',
    })

    return {
      success: true,
      data: response.data,
      debug: {
        url: response.url,
        method: response.method,
        status: response.status,
        codEstab: estabelecimento,
        rawBody: response.rawBody,
      },
    }
  } catch (error: any) {
    logger.error('Test Connection Error', { error: error.message, status: error.status })
    throw error
  }
}

export const testBelleConnection = testarConexaoBelle

export const listClientes = async (estabelecimento: string, pagina: number = 0) => {
  const response = await fetchBelleApi(`/clientes?codEstab=${estabelecimento}&pagina=${pagina}`, {
    method: 'GET',
  })
  return response.data
}

export const searchCliente = async (estabelecimento: string, filters: Record<string, string>) => {
  const params = new URLSearchParams()
  params.append('codEstab', estabelecimento)
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
  })

  const response = await fetchBelleApi(`/clientes?${params.toString()}`, {
    method: 'GET',
  })
  return response.data
}

export const updateCliente = async (codCliente: string | number, data: any) => {
  const response = await fetchBelleApi(`/clientes?codCliente=${codCliente}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return response.data
}

export const saveLead = async (data: any) => {
  const response = await fetchBelleApi(`/clientes/lead`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.data
}

export const fetchBelleClientes = async (
  estabelecimento: string = '1',
): Promise<BelleCliente[]> => {
  let allClientes: BelleCliente[] = []
  let pagina = 0
  let hasMore = true

  // Protect against infinite loops, allowing up to 100 pages of data (5000+ patients)
  while (hasMore && pagina < 100) {
    try {
      const data = await listClientes(estabelecimento, pagina)
      const clientes = Array.isArray(data)
        ? data
        : data?.pacientes || data?.clientes || data?.dados || []

      if (!clientes || clientes.length === 0) {
        hasMore = false
      } else {
        allClientes = [...allClientes, ...clientes]

        // If API returns fewer than 50 records, it's definitively the last page
        if (clientes.length < 50) {
          hasMore = false
        } else {
          pagina++
        }
      }
    } catch (e) {
      logger.error(`Error fetching clientes on page ${pagina}`, e)
      hasMore = false
    }
  }

  return allClientes
}

export const fetchBelleAgendamentos = async (
  estabelecimento: string = '1',
): Promise<BelleAgendamento[]> => {
  try {
    const response = await fetchBelleApi(`/agendamentos?codEstab=${estabelecimento}`, {
      method: 'GET',
    })
    const data = response.data

    return Array.isArray(data) ? data : data?.agendamentos || data?.dados || []
  } catch (e) {
    logger.error('Error fetching agendamentos network', e)
    return []
  }
}
