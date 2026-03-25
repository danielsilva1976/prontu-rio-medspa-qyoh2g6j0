import { config } from '@/infra/config'
import { logger } from '@/infra/logger'

export const belleClient = async (
  endpoint: string,
  options: { method: string; queryParams?: Record<string, string>; body?: any },
) => {
  const { baseUrl, token } = config.belle

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

  logger.info(`Starting request to Belle: ${options.method} ${endpoint}`, {
    method: options.method,
    url: url.toString(),
    queryParams: options.queryParams,
    headers: { ...headers, Authorization: '***' },
    body: options.body,
  })

  try {
    const response = await fetch(url.toString(), {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    const status = response.status
    const text = await response.text()

    let responseBody
    try {
      responseBody = text ? JSON.parse(text) : {}
    } catch {
      responseBody = { message: text }
    }

    logger.info(`Received response from Belle: ${status}`, {
      status,
      body: responseBody,
    })

    if (status >= 400 || (responseBody && (responseBody.erro || responseBody.error))) {
      const errorMsg = responseBody?.mensagem || responseBody?.error || JSON.stringify(responseBody)
      if (status === 405) {
        throw new Error(
          `Contract Failure (HTTP 405): Method ${options.method} not allowed on ${endpoint}. Error: ${errorMsg}`,
        )
      } else if (status === 401 || status === 403) {
        throw new Error(`Authentication Failure (HTTP ${status}). Error: ${errorMsg}`)
      } else if (status === 400) {
        throw new Error(`Validation Failure (HTTP 400). Error: ${errorMsg}`)
      }
      throw new Error(`API Error (HTTP ${status}). Error: ${errorMsg}`)
    }

    return responseBody
  } catch (error: any) {
    logger.error(`Error requesting Belle API: ${error.message}`, {
      action: 'belleClient_error',
      message: error.message,
    })
    throw error
  }
}
