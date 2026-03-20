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
 * Normaliza a URL base para garantir que aponte para o endpoint api.php correto
 * e força o uso de HTTPS para evitar bloqueios de conteúdo misto (Mixed Content)
 */
const getApiEndpoint = (url: string) => {
  let cleanUrl = url.trim().replace(/\/$/, '')

  // Força HTTPS
  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace('http://', 'https://')
  } else if (!cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`
  }

  return cleanUrl.endsWith('api.php') ? cleanUrl : `${cleanUrl}/api.php`
}

/**
 * Função genérica para chamadas na api.php do Belle Software
 */
const belleApiCall = async (url: string, token: string, action: string, payload: any = {}) => {
  const endpoint = getApiEndpoint(url)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Auth-Token': token, // Suporte a variações de headers
      },
      body: JSON.stringify({
        token: token, // Suporte a token no body (comum em versões legadas api.php)
        acao: action,
        ...payload,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro de comunicação com Belle Software: ${response.status}`)
    }

    const result = await response.json()

    // Tratamento de respostas de erro da API do Belle
    if (result.status === 'erro' || result.status === false || result.error) {
      throw new Error(result.mensagem || result.message || 'Erro desconhecido retornado pela API.')
    }

    return result.data || result.dados || result
  } catch (error: any) {
    // Tratamento específico para erros de rede/CORS
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error(
        'Falha de rede (Failed to fetch). O servidor pode estar inacessível ou bloqueando a requisição por CORS.',
      )
    }
    throw error
  }
}

/**
 * Fetch patients from Belle Software API via api.php
 */
export const fetchBelleClientes = async (url: string, token: string): Promise<BelleCliente[]> => {
  if (!url || !token || url.includes('mock')) {
    console.info('Usando mock de clientes (integração não configurada ou em modo demo).')
    // Simula tempo de rede
    await new Promise((resolve) => setTimeout(resolve, 800))
    return mockClientes
  }

  try {
    const data = await belleApiCall(url, token, 'listar_clientes')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Falha na integração de clientes Belle Software:', error)
    throw error
  }
}

/**
 * Fetch appointment history from Belle Software API via api.php
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

  try {
    const payload = cpf ? { cpf } : { periodo: 'recentes' }
    const data = await belleApiCall(url, token, 'listar_agendamentos', payload)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Falha na integração de agendamentos Belle Software:', error)
    throw error
  }
}
