export default async function handler(req: any, res: any) {
  // Configuração de CORS para permitir que o frontend acesse o proxy local/remotamente
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')

  // Responde imediatamente a requisições de preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // O proxy em si aceita exclusivamente requisições POST para receber o payload de intruções
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'The internal proxy only accepts POST requests.',
    })
  }

  try {
    // Desestrutura o payload enviado pelo frontend
    const { targetUrl, method, headers, body } = req.body || {}

    if (!targetUrl || !method) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing targetUrl or method in proxy payload.',
      })
    }

    // Logs de execução exigidos (Início da transação)
    console.log(`[PROXY LOG] Internal Route Method: ${req.method}`)
    console.log(`[PROXY LOG] Internal URL: /api/proxy/belle`)
    console.log(`[PROXY LOG] Received Body:`, JSON.stringify(req.body))

    // Prepara a chamada para a API externa (Belle Software)
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        ...headers,
      },
    }

    // Garante que não enviamos "body" em métodos GET ou HEAD, evitando erros de protocolo
    if (fetchOptions.method !== 'GET' && fetchOptions.method !== 'HEAD' && body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    // Executa o forwarding da requisição
    const externalResponse = await fetch(targetUrl, fetchOptions)
    const status = externalResponse.status

    // Processa a resposta bruta da API externa
    const text = await externalResponse.text()
    let responseData

    try {
      responseData = text ? JSON.parse(text) : {}
    } catch {
      // Se a resposta não for JSON (como algumas páginas de erro de proxy), encapsula em um objeto JSON
      responseData = { message: text || 'No content returned from external API' }
    }

    // Logs de execução exigidos (Conclusão da transação)
    console.log(`[PROXY LOG] HTTP Status Returned: ${status}`)
    console.log(`[PROXY LOG] Raw Response:`, responseData)

    // Repassa exatamente o HTTP Status e o payload para a UI, permitindo o correto tratamento e log do frontend (ex: Erros 405)
    return res.status(status).json(responseData)
  } catch (error: any) {
    console.error(`[PROXY ERROR] Execution failed:`, error.message)
    return res.status(500).json({
      error: 'Internal Proxy Error',
      message: 'Failed to forward request to external API.',
      details: error.message,
    })
  }
}
