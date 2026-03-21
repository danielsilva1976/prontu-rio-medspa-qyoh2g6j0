export const OPTIONS = async (req: Request) => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  })
}

export const POST = async (req: Request) => {
  try {
    let bodyText = await req.text().catch(() => '')

    if (!bodyText && req.url && req.url.includes('?')) {
      bodyText = req.url.split('?')[1]
    }

    const params = new URLSearchParams(bodyText)
    const targetUrl = params.get('target_url')

    if (!targetUrl) {
      return new Response(
        JSON.stringify({
          error: 'Parâmetro ausente',
          details: 'O parâmetro target_url é obrigatório.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        },
      )
    }

    params.delete('target_url')

    const externalResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/plain, */*',
      },
      body: params.toString(), // Strictly form-encoded proxy forwarding
    })

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
        error: 'Falha no Bridge Interno',
        details: error.message || 'Erro inesperado',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      },
    )
  }
}

export default async function handler(req: any, res: any) {
  if (req instanceof Request || (req.headers && typeof req.headers.get === 'function')) {
    if (req.method === 'OPTIONS') return OPTIONS(req as Request)
    if (req.method === 'POST') return POST(req as Request)
    return new Response('Method Not Allowed', { status: 405 })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')

  const method = (req.method || '').toUpperCase()

  if (method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      details: `O endpoint aceita apenas requisições POST. Recebido: ${method}`,
    })
  }

  try {
    let bodyStr = ''

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
    } else if (req.on) {
      bodyStr = await new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk: any) => (data += chunk))
        req.on('end', () => resolve(data))
        req.on('error', reject)
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

    params.delete('target_url')

    const externalResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json, text/plain, */*',
      },
      body: params.toString(), // Strictly form-encoded proxy forwarding
    })

    const text = await externalResponse.text()

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
