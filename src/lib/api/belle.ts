export interface BelleCliente {
  id: number
  nome: string
  cpf: string
  email: string
  celular: string
  data_nascimento: string
  historico_clinico?: string
}

export interface BelleAgendamento {
  id: number
  cliente_id?: number
  cpf_cliente?: string
  data: string
  hora_inicio: string
  servico: string
  profissional: string
  status: string
  observacoes?: string
}

const mockClientes: BelleCliente[] = [
  {
    id: 101,
    nome: 'Ana Souza (Belle)',
    cpf: '333.444.555-66',
    email: 'ana@bellesoftware.com',
    celular: '(11) 98888-7777',
    data_nascimento: '1990-05-20',
    historico_clinico: 'Paciente com histórico de melasma.',
  },
  {
    id: 102,
    nome: 'Isabella Rodrigues (Atualizada)',
    cpf: '123.456.789-00',
    email: 'isa@email.com',
    celular: '(11) 98765-4321',
    data_nascimento: '1989-05-12',
    historico_clinico: 'Alergia a dipirona relatada na última consulta.',
  },
  {
    id: 103,
    nome: 'Carlos Silva (Belle)',
    cpf: '111.222.333-44',
    email: 'carlos@bellesoftware.com',
    celular: '(11) 97777-6666',
    data_nascimento: '1985-08-15',
  },
]

const mockAgendamentos: BelleAgendamento[] = [
  {
    id: 1001,
    cliente_id: 101,
    cpf_cliente: '333.444.555-66',
    data: new Date().toISOString().split('T')[0],
    hora_inicio: '14:00',
    servico: 'Toxina Botulínica - Terço Superior',
    profissional: 'Dra. Fabíola Kleinert',
    status: 'Atendido',
  },
  {
    id: 1002,
    cliente_id: 101,
    cpf_cliente: '333.444.555-66',
    data: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hora_inicio: '10:00',
    servico: 'Avaliação Facial',
    profissional: 'Dra. Fabíola Kleinert',
    status: 'Atendido',
  },
  {
    id: 1003,
    cliente_id: 103,
    cpf_cliente: '111.222.333-44',
    data: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hora_inicio: '16:30',
    servico: 'Retorno Pós-Procedimento',
    profissional: 'Dra. Sofia Mendes',
    status: 'Agendado',
  },
  {
    id: 1004,
    cliente_id: 102,
    cpf_cliente: '123.456.789-00',
    data: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hora_inicio: '09:00',
    servico: 'Bioestimulador de Colágeno',
    profissional: 'Dra. Fabíola Kleinert',
    status: 'Agendado',
  },
]

const ERROR_INVALID_TOKEN =
  'falha na conexão: token de autenticação invalido. Verifique dados no Belle software'

const getApiEndpoint = (url: string, path: string) => {
  let cleanUrl = url.trim().replace(/\/+$/, '')

  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace('http://', 'https://')
  } else if (!cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`
  }

  if (cleanUrl.endsWith('/api.php')) {
    cleanUrl = cleanUrl.slice(0, -8)
  } else if (cleanUrl.endsWith('api.php')) {
    cleanUrl = cleanUrl.slice(0, -7)
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${cleanUrl}${cleanPath}`
}

const logToBugScanner = (context: string, details: any) => {
  // Simulates integration with internal monitoring system (Bug Scanner)
  console.error(`[Bug Scanner] ${context}:`, JSON.stringify(details, null, 2))
}

/**
 * Função genérica para chamadas na API REST do Belle Software
 */
const belleApiCall = async (
  url: string,
  token: string,
  path: string,
  payload: any = null,
  estabelecimento: string = '',
) => {
  const endpoint = getApiEndpoint(url, path)

  // CORS Bypass Strategy: Proxies the request to avoid browser block
  const proxiedEndpoint = `https://corsproxy.io/?url=${encodeURIComponent(endpoint)}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    // Strict Payload Normalization
    const cleanToken = token ? token.replace(/[\s\uFEFF\xA0]+/g, '') : ''
    const cleanEstab = estabelecimento ? estabelecimento.replace(/[\s\uFEFF\xA0]+/g, '') : ''

    const params = new URLSearchParams()
    if (cleanToken) params.append('token', cleanToken)
    if (cleanEstab) params.append('estabelecimento', cleanEstab)

    if (payload && typeof payload === 'object') {
      for (const [key, value] of Object.entries(payload)) {
        params.append(
          key,
          typeof value === 'object' ? JSON.stringify(value).trim() : String(value).trim(),
        )
      }
    }

    const requestBody = params.toString()

    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: requestBody,
      signal: controller.signal,
    }

    const response = await fetch(proxiedEndpoint, options)

    clearTimeout(timeoutId)

    let text = ''
    try {
      text = await response.text()
    } catch (e) {
      console.error('Failed to read response text', e)
    }

    if (!response.ok) {
      let details = text ? text.substring(0, 250) : 'Sem detalhes adicionais'
      try {
        if (text) {
          const jsonText = JSON.parse(text)
          details = jsonText.mensagem || jsonText.message || jsonText.error || details
        }
      } catch (e) {
        // Mantém a string bruta
      }

      logToBugScanner('Failed Belle API Connection', {
        endpoint,
        proxiedEndpoint,
        status: response.status,
        requestBody,
        responseBody: text,
      })

      if (response.status === 403) {
        throw new Error(`Erro 403 Forbidden. Acesso negado. Detalhes do Belle Software: ${details}`)
      }
      if (response.status === 401) {
        throw new Error(ERROR_INVALID_TOKEN)
      }
      if (response.status === 404) {
        throw new Error('URL Base não encontrada. Verifique o endereço')
      }
      if (response.status >= 500) {
        throw new Error(
          'Erro de rede: O servidor Belle Software está indisponível ou ocorreu um erro interno.',
        )
      }
      throw new Error(
        `Erro de comunicação com Belle Software: Status ${response.status} - ${details}`,
      )
    }

    if (!text) return null

    const lowerText = text.toLowerCase()
    if (
      lowerText.trim().startsWith('<!doctype html>') ||
      lowerText.trim().startsWith('<html') ||
      lowerText.includes('<title>login') ||
      lowerText.includes('user/login')
    ) {
      throw new Error(ERROR_INVALID_TOKEN)
    }

    const result = JSON.parse(text)

    if (result.status === 'erro' || result.status === false || result.error) {
      const msg = result.mensagem || result.message || result.error || ''
      if (
        msg.toLowerCase().includes('token') ||
        msg.toLowerCase().includes('autentica') ||
        msg.toLowerCase().includes('auth') ||
        msg.toLowerCase().includes('login') ||
        msg.toLowerCase().includes('invali') ||
        msg.toLowerCase().includes('senha')
      ) {
        throw new Error(ERROR_INVALID_TOKEN)
      }

      logToBugScanner('Belle API Business Error', {
        endpoint,
        requestBody,
        response: result,
      })

      throw new Error(msg || 'Erro desconhecido retornado pela API.')
    }

    return result.data || result.dados || result
  } catch (error: any) {
    clearTimeout(timeoutId)

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      logToBugScanner('Network/CORS Error', { error: error.message, endpoint })
      throw new Error(
        'TypeError: Failed to fetch - A conexão foi bloqueada por CORS ou problema de rede. Por favor, tente novamente.',
      )
    }

    if (
      error.message === 'URL Base or Credentials Incorrect' ||
      error.message === 'URL Base ou Credenciais Incorretas'
    ) {
      throw new Error(ERROR_INVALID_TOKEN)
    }

    if (
      error.name === 'AbortError' ||
      error.message === 'TIMEOUT_ERROR' ||
      error.message.includes('Erro de rede')
    ) {
      throw new Error('Erro de rede: Verifique sua conexão ou a disponibilidade do servidor Belle')
    }
    throw error
  }
}

/**
 * Valida a conexão com o Belle Software
 */
export const testBelleConnection = async (
  url: string,
  token: string,
  estabelecimento: string = '',
): Promise<boolean> => {
  if (!url || url.includes('mock')) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    if (token === 'wrong' || token === 'invalido') {
      throw new Error(ERROR_INVALID_TOKEN)
    }
    if (token === '403') {
      throw new Error(
        'Falha na conexão. erro 403. Acesso negado. O servidor reconheceu a requisição, mas recusou a autorização. Detalhes: Permissões insuficientes para este token',
      )
    }
    return true
  }

  await belleApiCall(url, token, '/api.php', null, estabelecimento)
  return true
}

/**
 * Busca os pacientes via Belle Software API REST
 */
export const fetchBelleClientes = async (
  url: string,
  token: string,
  estabelecimento: string = '',
): Promise<BelleCliente[]> => {
  if (!url || !token || url.includes('mock')) {
    console.info('Usando mock de pacientes (integração não configurada ou em modo demo).')
    await new Promise((resolve) => setTimeout(resolve, 800))
    return mockClientes
  }

  const data = await belleApiCall(url, token, '/api/v1/pacientes', null, estabelecimento)
  return Array.isArray(data) ? data : data.pacientes || data.clientes || []
}

/**
 * Busca o histórico de agendamentos via Belle Software API REST
 */
export const fetchBelleAgendamentos = async (
  url: string,
  token: string,
  cpf?: string,
  estabelecimento: string = '',
): Promise<BelleAgendamento[]> => {
  if (!url || !token || url.includes('mock')) {
    console.info('Usando mock de agendamentos (integração não configurada ou em modo demo).')
    return cpf ? mockAgendamentos.filter((a) => a.cpf_cliente === cpf) : mockAgendamentos
  }

  const path = cpf ? `/api/v1/agendamentos?cpf=${encodeURIComponent(cpf)}` : '/api/v1/agendamentos'
  const data = await belleApiCall(url, token, path, null, estabelecimento)
  return Array.isArray(data) ? data : data.agendamentos || []
}
