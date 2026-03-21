// Backend proxy route for Belle Software API integration
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')

  const method = (req.method || '').toUpperCase()

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Method Compatibility - Resolve 405 error by checking uppercase method
  if (method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      details: `O endpoint /api/internal/belle-bridge aceita apenas requisições POST. Recebido: ${method}`,
    })
  }

  try {
    let bodyStr = ''

    // Robust parsing to handle different body formats depending on the serverless runtime
    if (typeof req.body === 'string') {
      bodyStr = req.body
    } else if (Buffer.isBuffer(req.body)) {
      bodyStr = req.body.toString('utf-8')
    } else if (typeof req.body === 'object' && req.body !== null) {
      const p = new URLSearchParams()
      for (const [k, v] of Object.entries(req.body)) {
        p.append(k, String(v))
      }
      bodyStr = p.toString()
    } else {
      return res.status(400).json({
        error: 'Formato inválido',
        details: 'O corpo da requisição não pôde ser processado.',
      })
    }

    const params = new URLSearchParams(bodyStr)
    const targetUrl = params.get('target_url')

    if (!targetUrl) {
      return res.status(400).json({
        error: 'Parâmetro ausente',
        details: 'O parâmetro target_url é obrigatório para o redirecionamento.',
      })
    }

    // Remove internal routing param before forwarding
    params.delete('target_url')

    // Secure Data Relay - Forward properly encoded URL parameters
    const externalResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/plain, */*',
      },
      body: params.toString(),
    })

    const text = await externalResponse.text()

    // Forward the exact status and content from Belle Software
    res.status(externalResponse.status)
    res.setHeader(
      'Content-Type',
      externalResponse.headers.get('Content-Type') || 'application/json',
    )
    return res.send(text)
  } catch (error: any) {
    return res.status(500).json({
      error: 'Falha no Bridge Interno',
      details: error.message || 'Erro inesperado ao conectar com a API externa.',
    })
  }
}
