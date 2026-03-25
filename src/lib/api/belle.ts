import { BelleCliente, BelleAgendamento, DiagnosticLog } from '@/integrations/belle/belleTypes'
import { mapBelleDataToPatients } from '@/integrations/belle/belleMapper'
import { logger } from '@/infra/logger'

export type { BelleCliente, BelleAgendamento, DiagnosticLog }
export { mapBelleDataToPatients }

const handleResponse = async (res: Response, url?: string, method = 'GET') => {
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const data = await res.json()
    if (!res.ok) {
      const error: any = new Error(data.error || data.mensagem || `HTTP error ${res.status}`)
      error.status = res.status
      error.url = url || res.url
      error.method = method
      error.rawBody = JSON.stringify(data)
      throw error
    }
    return data
  } else {
    const text = await res.text()

    const headersRecord: Record<string, string> = {}
    res.headers.forEach((val, key) => {
      headersRecord[key] = val
    })

    logger.error('Non-JSON response received', {
      status: res.status,
      headers: headersRecord,
      bodyPreview: text.substring(0, 500),
    })

    if (!res.ok) {
      const error: any = new Error(`HTTP error ${res.status} - Non-JSON response`)
      error.status = res.status
      error.url = url || res.url
      error.method = method
      error.rawBody = text.substring(0, 500)
      throw error
    }

    return text
  }
}

export const testarConexaoBelle = async (estabelecimento: string = '1') => {
  const url = `/api/belle/testar-conexao?codEstab=${estabelecimento}`
  logger.info('Testing Belle API connection via backend', { url })
  const res = await fetch(url)

  const contentType = res.headers.get('content-type') || ''
  let data: any = null
  let text = ''

  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    text = await res.text()
    const headersRecord: Record<string, string> = {}
    res.headers.forEach((val, key) => {
      headersRecord[key] = val
    })
    logger.warn('Non-JSON response received', {
      status: res.status,
      headers: headersRecord,
      bodyPreview: text.substring(0, 500),
    })
  }

  if (!res.ok) {
    const errorBody = data ? JSON.stringify(data) : text.substring(0, 500)
    const error: any = new Error(data?.error || data?.mensagem || `HTTP error ${res.status}`)
    error.status = res.status
    error.url = url
    error.method = 'GET'
    error.rawBody = errorBody
    throw error
  }

  return {
    success: true,
    data: data?.data || data || text,
    debug: {
      url,
      method: 'GET',
      status: res.status,
      codEstab: estabelecimento,
      rawBody: data ? JSON.stringify(data).substring(0, 200) : text.substring(0, 200),
    },
  }
}

export const testBelleConnection = testarConexaoBelle

export const listClientes = async (estabelecimento: string, pagina: number = 0) => {
  const url = `/api/belle/clientes/listar?codEstab=${estabelecimento}&pagina=${pagina}`
  const res = await fetch(url)
  return handleResponse(res, url)
}

export const searchCliente = async (estabelecimento: string, filters: Record<string, string>) => {
  const params = new URLSearchParams()
  params.append('codEstab', estabelecimento)
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
  })
  const url = `/api/belle/clientes/buscar?${params.toString()}`
  const res = await fetch(url)
  return handleResponse(res, url)
}

export const updateCliente = async (codCliente: string | number, data: any) => {
  const url = `/api/belle/clientes/atualizar?codCliente=${codCliente}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res, url, 'PUT')
}

export const saveLead = async (data: any) => {
  const url = `/api/belle/clientes/gravar-lead`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res, url, 'POST')
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
    const url = `/api/belle/agendamentos/listar?codEstab=${estabelecimento}`
    const res = await fetch(url)

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await res.text()
      const headersRecord: Record<string, string> = {}
      res.headers.forEach((val, key) => {
        headersRecord[key] = val
      })

      logger.error('Error fetching agendamentos API - Non-JSON response', {
        status: res.status,
        headers: headersRecord,
        bodyPreview: text.substring(0, 500),
      })
      return []
    }

    const data = await res.json()
    if (!res.ok) {
      logger.error('Error fetching agendamentos API', data)
      return []
    }
    return Array.isArray(data) ? data : data?.agendamentos || data?.dados || []
  } catch (e) {
    logger.error('Error fetching agendamentos network', e)
    return []
  }
}
