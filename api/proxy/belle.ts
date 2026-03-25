export default async function handler(request: Request) {
  // CORS configuration to allow frontend to access proxy
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  }

  // Immediately respond to preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // Ensure only POST requests are allowed through the proxy to eliminate 405 errors on internal router
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Proxy explicitly requires POST method',
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    let payload
    try {
      // Correctly parse the JSON payload using request.json()
      payload = await request.json()
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON payload provided to proxy.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { targetUrl, method, headers, removeHeaders, useResidentialProxy, body } = payload || {}

    // Strict validation for required routing parameters
    if (!targetUrl || !method) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Missing targetUrl or method in proxy payload.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Advanced request logging (Initiation)
    console.log(`[PROXY LOG] Internal Route Method: ${request.method}`)
    console.log(`[PROXY LOG] Internal URL: ${request.url || '/api/proxy/belle'}`)
    console.log(`[PROXY LOG] Received Body:`, JSON.stringify(payload))

    // Prepare request execution to external API
    const targetMethod = String(method).toUpperCase()
    const fetchOptions: RequestInit = {
      method: targetMethod,
      headers: {
        ...headers, // Passes Authorization, Content-Type, Accept directly
      },
    }

    // Prevent body attachment on GET/HEAD to avoid external API protocol errors
    if (targetMethod !== 'GET' && targetMethod !== 'HEAD' && body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    // Execute the server-side fetch to the target external URL
    const externalResponse = await fetch(targetUrl, fetchOptions)
    const status = externalResponse.status

    const text = await externalResponse.text()
    let responseData

    try {
      responseData = text ? JSON.parse(text) : {}
    } catch {
      responseData = { message: text || 'No content returned from external API' }
    }

    // Advanced request logging (Completion)
    console.log(`[PROXY LOG] HTTP Status Returned: ${status}`)
    console.log(`[PROXY LOG] Raw Response:`, responseData)

    if (status === 405) {
      console.error(
        `[PROXY ERROR] Contract/Proxy Error: 405 Method Not Allowed returned by external API (${targetMethod} ${targetUrl}). This is a contract failure, not an authentication issue.`,
      )
    }

    return new Response(JSON.stringify(responseData), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error(`[PROXY ERROR] Execution failed:`, error.message)
    return new Response(
      JSON.stringify({
        error: 'Internal Proxy Error',
        message: 'Failed to forward request to external API.',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}
