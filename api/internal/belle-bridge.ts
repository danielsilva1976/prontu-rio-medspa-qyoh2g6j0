export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      },
    })
  }

  // The integration bridge must strictly enforce POST method for data retrieval
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method Not Allowed',
        details: `O endpoint aceita apenas requisições POST. Recebido: ${req.method}`,
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }

  try {
    const bodyText = await req.text()
    const params = new URLSearchParams(bodyText)
    const targetUrl = params.get('target_url')

    if (!targetUrl) {
      return new Response(
        JSON.stringify({
          error: 'Parâmetro ausente',
          details: 'O parâmetro target_url é obrigatório para o redirecionamento.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        },
      )
    }

    params.delete('target_url')

    // Request options ensuring Content-Type and Accept headers
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'BelleIntegrationProxy/1.0',
      },
      body: params.toString(),
      // Prevent automatic redirect following to avoid automatic HTTP POST to GET downgrades
      redirect: 'manual',
    }

    let externalResponse = await fetch(targetUrl, requestOptions)

    // Handle potential redirects manually to enforce POST method across them
    let maxRedirects = 3
    let currentUrl = targetUrl

    while (externalResponse.status >= 300 && externalResponse.status < 400 && maxRedirects > 0) {
      const redirectUrl = externalResponse.headers.get('location')
      if (!redirectUrl) break

      currentUrl = new URL(redirectUrl, currentUrl).toString()
      externalResponse = await fetch(currentUrl, requestOptions)
      maxRedirects--
    }

    const text = await externalResponse.text()

    return new Response(text, {
      status: externalResponse.status,
      headers: {
        'Content-Type': externalResponse.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Ponte de Integração Indisponível',
        details: `Ponte de Integração Indisponível - Erro de proxy: ${error.message}`,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    )
  }
}

export const POST = handler
export const OPTIONS = handler
export const GET = handler
