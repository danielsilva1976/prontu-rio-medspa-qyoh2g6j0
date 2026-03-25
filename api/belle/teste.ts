const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

async function testarConexaoBelle(codEstab: string, requestBody: any, internalMethod: string) {
  const baseUrl = 'https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0'
  const token = process.env.BELLE_TOKEN || ''

  const url = `${baseUrl}/clientes?codEstab=${codEstab}&pagina=0`

  const headersToSend = {
    Authorization: token,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const safeHeaders = { ...headersToSend, Authorization: '***' }

  const logContext = {
    internalMethod,
    targetUrl: url,
    headersSent: safeHeaders,
    requestBodyReceived: requestBody,
  }

  console.log(JSON.stringify({ step: 'Integration Test Started', ...logContext }))

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: headersToSend,
    })
  } catch (error: any) {
    console.error(
      JSON.stringify({
        step: 'Integration Test Failed (Network)',
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
      step: 'Integration Test Completed',
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
      throw new Error(`Contract Failure (HTTP 405): Method GET not allowed. Error: ${errorMsg}`)
    } else if (status === 401 || status === 403) {
      throw new Error(
        `Authentication Failure (HTTP ${status}): Credential issue. Error: ${errorMsg}`,
      )
    } else if (status === 400) {
      throw new Error(`Validation Failure (HTTP 400): Parameter issue. Error: ${errorMsg}`)
    }
    throw new Error(`API Error (HTTP ${status}). Error: ${errorMsg}`)
  }

  return { success: true, data: responseBody }
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const textBody = await request.text()
    let body: any = {}

    if (textBody) {
      try {
        body = JSON.parse(textBody)
      } catch (e) {
        // Fallback for empty or invalid JSON payload
      }
    }

    const codEstab = body.codEstab || '1'

    const result = await testarConexaoBelle(codEstab, body, request.method)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
