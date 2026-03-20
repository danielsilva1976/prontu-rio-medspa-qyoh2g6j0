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

/**
 * Normaliza a URL base para garantir que aponte para a API e não termine com barras
 * e força o uso de HTTPS para evitar bloqueios de conteúdo misto (Mixed Content)
 */
const getApiEndpoint = (url: string, path: string) => {
  let cleanUrl = url.trim().replace(/\/+$/, '')

  // Força HTTPS
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

/**
 * Função genérica para chamadas na API REST do Belle Software com Proxy CORS
 */
const belleApiCall = async (
  url: string,
  token: string,
  path: string,
  method: string = 'GET',
  payload: any = null,
) => {
  const baseEndpoint = getApiEndpoint(url, path)
  // Proxy CORS para prevenir erros browser-level "failed to fetch" e políticas de segurança
  const endpoint = `https://corsproxy.io/?${encodeURIComponent(baseEndpoint)}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Token: token, // Header exigido (case-sensitive) para autenticação
      },
      signal: controller.signal,
    }

    if (payload && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(payload)
    }

    const response = await fetch(endpoint, options)

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Token de Autenticação Inválido')
      }
      if (response.status === 404) {
        throw new Error('URL Base não encontrada. Verifique o endereço')
      }
      if (response.status >= 500) {
        throw new Error(
          'Erro de rede: Verifique sua conexão ou a disponibilidade do servidor Belle',
        )
      }
      throw new Error(`Erro de comunicação com Belle Software: ${response.status}`)
    }

    const text = await response.text()
    if (!text) return null

    const result = JSON.parse(text)

    // Tratamento de respostas de erro da API do Belle
    if (result.status === 'erro' || result.status === false || result.error) {
      const msg = result.mensagem || result.message || ''
      if (
        msg.toLowerCase().includes('token') ||
        msg.toLowerCase().includes('autentica') ||
        msg.toLowerCase().includes('auth')
      ) {
        throw new Error('Token de Autenticação Inválido')
      }
      throw new Error(msg || 'Erro desconhecido retornado pela API.')
    }

    return result.data || result.dados || result
  } catch (error: any) {
    clearTimeout(timeoutId)
    // Tratamento avançado e mapeamento de erros de rede/CORS
    if (
      error.name === 'AbortError' ||
      error.message === 'TIMEOUT_ERROR' ||
      (error.name === 'TypeError' && error.message === 'Failed to fetch') ||
      error.message.includes('Erro de rede') ||
      error.message.includes('CORS')
    ) {
      throw new Error('Erro de rede: Verifique sua conexão ou a disponibilidade do servidor Belle')
    }
    throw error
  }
}

/**
 * Valida a conexão com o Belle Software
 */
export const testBelleConnection = async (url: string, token: string): Promise<boolean> => {
  if (!url || url.includes('mock')) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    if (token === 'wrong' || token === 'invalido') {
      throw new Error('Token de Autenticação Inválido')
    }
    return true
  }

  await belleApiCall(url, token, '/api.php', 'POST', {})
  return true
}

/**
 * Busca os pacientes via Belle Software API REST
 */
export const fetchBelleClientes = async (url: string, token: string): Promise<BelleCliente[]> => {
  if (!url || !token || url.includes('mock')) {
    console.info('Usando mock de pacientes (integração não configurada ou em modo demo).')
    await new Promise((resolve) => setTimeout(resolve, 800))
    return mockClientes
  }

  const data = await belleApiCall(url, token, '/api/v1/pacientes', 'GET')
  return Array.isArray(data) ? data : data.pacientes || data.clientes || []
}

/**
 * Busca o histórico de agendamentos via Belle Software API REST
 */
export const fetchBelleAgendamentos = async (
  url: string,
  token: string,
  cpf?: string,
): Promise<BelleAgendamento[]> => {
  if (!url || !token || url.includes('mock')) {
    console.info('Usando mock de agendamentos (integração não configurada ou em modo demo).')
    return cpf ? mockAgendamentos.filter((a) => a.cpf_cliente === cpf) : mockAgendamentos
  }

  const path = cpf ? `/api/v1/agendamentos?cpf=${encodeURIComponent(cpf)}` : '/api/v1/agendamentos'
  const data = await belleApiCall(url, token, path, 'GET')
  return Array.isArray(data) ? data : data.agendamentos || []
}
