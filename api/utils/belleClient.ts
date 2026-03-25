export const belleClient = async (
  endpoint: string,
  options: { method: string; queryParams?: Record<string, string>; body?: any },
) => {
  const baseUrl = 'https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0'
  const token = process.env.BELLE_TOKEN || ''

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

  console.log(JSON.stringify({ step: 'Belle API Request Started', ...logContext }))

  let response: Response
  try {
    response = await fetch(url.toString(), {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch (error: any) {
    console.error(
      JSON.stringify({
        step: 'Belle API Request Failed (Network)',
        error: error.message,
        ...logContext,
      }),
    )
    throw new Error(`Network Error: ${error.message}`)
  }

  const status = response.status
  const rawBody = await response.text()

  console.log(
    JSON.stringify({
      step: 'Belle API Request Completed',
      httpStatusReturned: status,
      rawResponseBody: rawBody,
      ...logContext,
    }),
  )

  let responseBody
  try {
    responseBody = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    responseBody = { message: rawBody }
  }

  if (status >= 400 || (responseBody && (responseBody.erro || responseBody.error))) {
    const errorMsg = responseBody?.mensagem || responseBody?.error || JSON.stringify(responseBody)
    if (status === 405) {
      throw new Error(
        `Contract Failure (HTTP 405): Method ${options.method} not allowed. Error: ${errorMsg}`,
      )
    } else if (status === 401 || status === 403) {
      throw new Error(
        `Authentication Failure (HTTP ${status}): Credential issue. Error: ${errorMsg}`,
      )
    } else if (status === 400) {
      throw new Error(`Validation Failure (HTTP 400): Parameter issue. Error: ${errorMsg}`)
    }
    throw new Error(`API Error (HTTP ${status}). Error: ${errorMsg}`)
  }

  return responseBody
}
