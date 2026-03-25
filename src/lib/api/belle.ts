import { BelleCliente, BelleAgendamento, DiagnosticLog } from '@/integrations/belle/belleTypes'
import { mapBelleDataToPatients } from '@/integrations/belle/belleMapper'
import { logger } from '@/infra/logger'

export type { BelleCliente, BelleAgendamento, DiagnosticLog }
export { mapBelleDataToPatients }

const handleResponse = async (res: Response) => {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`)
  }
  return data
}

// Consolidating belleClient and belleService into a direct API caller for the frontend
const belleDirectClient = async (
  endpoint: string,
  options: { method: string; queryParams?: Record<string, string>; body?: any },
) => {
  const baseUrl = 'https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0'
  const token = import.meta.env.VITE_BELLE_TOKEN || 'your_backend_token_here'

  const url = new URL(`${baseUrl}${endpoint}`)
  if (options.queryParams) {
    Object.entries(options.queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.append(k, v)
      }
    })
  }

  const cleanToken = token ? token.trim() : ''
  const headers = {
    Authorization: cleanToken,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const codEstab = options.queryParams?.codEstab || 'unknown'

  const logContext = {
    codEstab,
    method: options.method,
    targetUrl: url.toString(),
    queryParams: options.queryParams,
    headersSent: { ...headers, Authorization: '***' },
  }

  logger.info('Belle API Request Started', logContext)

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch (error: any) {
    logger.error('Belle API Request Failed (Network)', {
      error: error.message,
      ...logContext,
    })
    const err: any = new Error(`Network Error: ${error.message}`)
    err.status = 'Network'
    err.url = url.toString()
    err.method = options.method
    throw err
  }

  const status = response.status
  const rawBody = await response.text()

  logger.info('Belle API Request Completed', {
    httpStatusReturned: status,
    rawResponseBody: rawBody,
    ...logContext,
  })

  let responseBody
  try {
    responseBody = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    responseBody = { message: rawBody }
  }

  if (status >= 400 || (responseBody && (responseBody.erro || responseBody.error))) {
    const errorMsg = responseBody?.mensagem || responseBody?.error || JSON.stringify(responseBody)
    const error: any = new Error(`API Error (HTTP ${status}). Error: ${errorMsg}`)
    error.status = status
    error.url = url.toString()
    error.method = options.method
    error.rawBody = rawBody

    if (status === 405) {
      error.message = `Contract Failure (HTTP 405): Method ${options.method} not allowed. Error: ${errorMsg}`
    } else if (status === 401 || status === 403) {
      error.message = `Authentication Failure (HTTP ${status}): Credential issue. Error: ${errorMsg}`
    } else if (status === 400) {
      error.message = `Validation Failure (HTTP 400): Parameter issue. Error: ${errorMsg}`
    }
    throw error
  }

  return {
    responseBody,
    debug: { url: url.toString(), method: options.method, status, rawBody, codEstab },
  }
}

export const testarConexaoBelle = async (estabelecimento: string = '1') => {
  try {
    const { responseBody, debug } = await belleDirectClient('/clientes', {
      method: 'GET',
      queryParams: { codEstab: estabelecimento, pagina: '0' },
    })
    return { success: true, data: responseBody, debug }
  } catch (error: any) {
    throw error
  }
}

export const testBelleConnection = testarConexaoBelle

export const listClientes = async (estabelecimento: string, pagina: number = 0) => {
  const res = await fetch(`/api/belle/clientes/listar?codEstab=${estabelecimento}&pagina=${pagina}`)
  return handleResponse(res)
}

export const searchCliente = async (estabelecimento: string, filters: Record<string, string>) => {
  const params = new URLSearchParams()
  params.append('codEstab', estabelecimento)
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
  })
  const res = await fetch(`/api/belle/clientes/buscar?${params.toString()}`)
  return handleResponse(res)
}

export const updateCliente = async (codCliente: string | number, data: any) => {
  const res = await fetch(`/api/belle/clientes/atualizar?codCliente=${codCliente}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export const saveLead = async (data: any) => {
  const res = await fetch(`/api/belle/clientes/gravar-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export const fetchBelleClientes = async (
  estabelecimento: string = '1',
): Promise<BelleCliente[]> => {
  let allClientes: BelleCliente[] = []
  let pagina = 0
  let hasMore = true

  while (hasMore) {
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
  }

  return allClientes
}

export const fetchBelleAgendamentos = async (
  _estabelecimento: string = '1',
): Promise<BelleAgendamento[]> => {
  return []
}
