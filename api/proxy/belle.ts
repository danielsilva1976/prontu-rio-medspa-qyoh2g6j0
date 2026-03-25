export default async function handler(req: any, res: any) {
  // Configuração de CORS para permitir que o frontend acesse o proxy local/remotamente
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')

  // Responde imediatamente a requisições de preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Determina o payload dependendo do método da requisição e de como os dados foram enviados
    let payload = req.body

    // Tenta fazer o parse caso o body venha como string
    if (typeof payload === 'string' && payload.trim() !== '') {
      try {
        payload = JSON.parse(payload)
      } catch (e) {
        // Ignora erro de parse e mantém a string original, pois pode ser intencional
      }
    }

    // Fallback: se for um GET ou requisição sem body, tenta buscar o payload na query string
    const requestMethod = req.method ? req.method.toUpperCase() : 'GET'
    if (requestMethod === 'GET' && (!payload || Object.keys(payload).length === 0)) {
      if (req.query?.payload) {
        try {
          payload = JSON.parse(req.query.payload as string)
        } catch (e) {}
      } else {
        payload = req.query
      }
    }

    // Desestrutura o payload de instruções
    const { targetUrl, method, headers, body } = payload || {}

    if (!targetUrl || !method) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing targetUrl or method in proxy payload.',
      })
    }

    // Logs de execução exigidos (Início da transação)
    console.log(`[PROXY LOG] Internal Route Method: ${requestMethod}`)
    console.log(`[PROXY LOG] Internal URL: ${req.url || '/api/proxy/belle'}`)
    console.log(`[PROXY LOG] Received Body:`, JSON.stringify(payload))

    // Prepara a chamada para a API externa (Belle Software) utilizando a URL e método literais fornecidos
    const targetMethod = String(method).toUpperCase()
    const fetchOptions: RequestInit = {
      method: targetMethod,
      headers: {
        ...headers, // Repassa os cabeçalhos literais (Authorization unadulterated, Content-Type, Accept)
      },
    }

    // Garante que não enviamos "body" em métodos GET ou HEAD, evitando erros de protocolo na API alvo
    if (targetMethod !== 'GET' && targetMethod !== 'HEAD' && body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    // Executa o forwarding da requisição transparente
    const externalResponse = await fetch(targetUrl, fetchOptions)
    const status = externalResponse.status

    // Processa a resposta bruta da API externa
    const text = await externalResponse.text()
    let responseData

    try {
      responseData = text ? JSON.parse(text) : {}
    } catch {
      // Se a resposta não for JSON (como páginas de erro de proxy do servidor externo), encapsula em um objeto JSON
      responseData = { message: text || 'No content returned from external API' }
    }

    // Logs de execução exigidos (Conclusão da transação)
    console.log(`[PROXY LOG] HTTP Status Returned: ${status}`)
    console.log(`[PROXY LOG] Raw Response:`, responseData)

    // Tratamento e log específico exigido para erros 405 de contrato
    if (status === 405) {
      console.error(
        `[PROXY ERROR] Contract/Proxy Error: 405 Method Not Allowed returned by external API (${targetMethod} ${targetUrl}). This is a contract failure, not an authentication issue.`,
      )
    }

    // Repassa exatamente o HTTP Status e o payload para a UI
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
