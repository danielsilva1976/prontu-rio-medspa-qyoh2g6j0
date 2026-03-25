import { BelleCliente, BelleAgendamento, DiagnosticLog } from '@/integrations/belle/belleTypes'
import { mapBelleDataToPatients } from '@/integrations/belle/belleMapper'
import { logger } from '@/infra/logger'

export type { BelleCliente, BelleAgendamento, DiagnosticLog }
export { mapBelleDataToPatients }

const baseUrl = 'https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0'

const doFetch = async (url: string, options: RequestInit, authHeader: string) => {
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', authHeader)
  headers.set('Accept', 'application/json')

  if (options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, { ...options, headers })
}

const fetchBelleApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${baseUrl}${endpoint}`
  const token = (import.meta as any).env.VITE_BELLE_TOKEN || ''
  const cleanToken = token.trim()

  if (!cleanToken) {
    throw new Error('Belle Token não configurado (VITE_BELLE_TOKEN ausente).')
  }

  const host = new URL(url).host

  logger.info('Belle API Request Started', {
    host,
    url,
    method: options.method || 'GET',
  })

  let res = await doFetch(url, options, `Bearer ${cleanToken}`)

  if (res.status === 401 || res.status === 403) {
    logger.info('Belle API 401/403 with Bearer token, trying raw format', { url })
    res = await doFetch(url, options, cleanToken)
  }

  const contentType = res.headers.get('content-type') || ''

  logger.info('Belle API Request Completed', {
    url,
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
    error.method = options.method || 'GET'
    error.contentType = contentType
    error.rawBody = text.substring(0, 500)

    logger.error('Routing/Intercept Error', {
      url,
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
    error.method = options.method || 'GET'
    error.rawBody = text
    throw error
  }

  return data
}

export const testarConexaoBelle = async (estabelecimento: string = '1') => {
  try {
    const data = await fetchBelleApi(`/clientes?codEstab=${estabelecimento}&pagina=0`, {
      method: 'GET',
    })

    return {
      success: true,
      data: data,
      debug: {
        url: `${baseUrl}/clientes?codEstab=${estabelecimento}&pagina=0`,
        method: 'GET',
        codEstab: estabelecimento,
      },
    }
  } catch (error: any) {
    logger.error('Test Connection Error', { error: error.message, status: error.status })
    throw error
  }
}

export const testBelleConnection = testarConexaoBelle

export const listClientes = async (estabelecimento: string, pagina: number = 0) => {
  return fetchBelleApi(`/clientes?codEstab=${estabelecimento}&pagina=${pagina}`, {
    method: 'GET',
  })
}

export const searchCliente = async (estabelecimento: string, filters: Record<string, string>) => {
  const params = new URLSearchParams()
  params.append('codEstab', estabelecimento)
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
  })

  return fetchBelleApi(`/clientes?${params.toString()}`, {
    method: 'GET',
  })
}

export const updateCliente = async (codCliente: string | number, data: any) => {
  return fetchBelleApi(`/clientes?codCliente=${codCliente}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const saveLead = async (data: any) => {
  return fetchBelleApi(`/clientes/lead`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const fetchBelleClientes = async (
  estabelecimento: string = '1',
): Promise<BelleCliente[]> => {
  let allClientes: BelleCliente[] = []
  let pagina = 0
  let hasMore = true

  while (hasMore) {
    try {
      const data = await listClientes(estabelecimento, pagina)
      const clientes = Array.isArray(data)
        ? data
        : data?.pacientes || data?.clientes || data?.dados || []

      if (!clientes || clientes.length === 0) {
        hasMore = false
      } else {
        allClientes = [...allClientes, ...clientes]
        if (clientes.length < 100) {
          hasMore = false
        } else {
          pagina++
        }
      }
    } catch (e) {
      logger.error('Error fetching clientes', e)
      hasMore = false
    }
  }

  return allClientes
}

export const fetchBelleAgendamentos = async (
  estabelecimento: string = '1',
): Promise<BelleAgendamento[]> => {
  try {
    const data = await fetchBelleApi(`/agendamentos?codEstab=${estabelecimento}`, {
      method: 'GET',
    })

    return Array.isArray(data) ? data : data?.agendamentos || data?.dados || []
  } catch (e) {
    logger.error('Error fetching agendamentos network', e)
    return []
  }
}
