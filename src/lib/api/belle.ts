export interface BelleCliente {
  id: number
  nome: string
  cpf: string
  email: string
  celular: string
  data_nascimento: string
}

export interface BelleAgendamento {
  id: number
  data: string
  hora_inicio: string
  servico: string
  profissional: string
  status: string
}

const mockClientes: BelleCliente[] = [
  {
    id: 101,
    nome: 'Ana Souza (Belle)',
    cpf: '333.444.555-66',
    email: 'ana@bellesoftware.com',
    celular: '(11) 98888-7777',
    data_nascimento: '1990-05-20',
  },
  {
    id: 102,
    nome: 'Isabella Rodrigues',
    cpf: '123.456.789-00',
    email: 'isa@email.com',
    celular: '(11) 98765-4321',
    data_nascimento: '1989-05-12',
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
    data: new Date().toISOString().split('T')[0],
    hora_inicio: '14:00',
    servico: 'Toxina Botulínica - Terço Superior',
    profissional: 'Dra. Fabíola Kleinert',
    status: 'Atendido',
  },
  {
    id: 1002,
    data: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hora_inicio: '10:00',
    servico: 'Avaliação Facial',
    profissional: 'Dra. Fabíola Kleinert',
    status: 'Atendido',
  },
  {
    id: 1003,
    data: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hora_inicio: '16:30',
    servico: 'Retorno Pós-Procedimento',
    profissional: 'Dra. Sofia Mendes',
    status: 'Agendado',
  },
]

/**
 * Fetch patients from Belle Software API
 * Throws an error if configured with real credentials to ensure UI handles it gracefully.
 */
export const fetchBelleClientes = async (url: string, token: string): Promise<BelleCliente[]> => {
  if (!url || !token || url.includes('mock')) {
    console.info('Usando mock de clientes (integração não configurada).')
    return mockClientes
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/api/v1/clientes`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error('Falha na integração Belle Software:', error)
    throw error // Re-throw to be caught by the UI
  }
}

/**
 * Fetch appointment history from Belle Software API for a specific CPF
 * Throws an error if configured with real credentials to ensure UI handles it gracefully.
 */
export const fetchBelleAgendamentos = async (
  url: string,
  token: string,
  cpf: string,
): Promise<BelleAgendamento[]> => {
  if (!url || !token || url.includes('mock')) {
    console.info('Usando mock de agendamentos (integração não configurada).')
    return mockAgendamentos
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/api/v1/agendamentos?cpf=${cpf}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error('Falha na integração Belle Software:', error)
    throw error // Re-throw to be caught by the UI
  }
}
