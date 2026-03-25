import { BelleCliente, BelleAgendamento, DiagnosticLog } from '@/integrations/belle/belleTypes'
import { mapBelleDataToPatients } from '@/integrations/belle/belleMapper'

export type { BelleCliente, BelleAgendamento, DiagnosticLog }
export { mapBelleDataToPatients }

const handleResponse = async (res: Response) => {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`)
  }
  return data
}

export const listClientes = async (estabelecimento: string, pagina: number = 0) => {
  const res = await fetch(`/api/belle/clientes/listar?codEstab=${estabelecimento}&pagina=${pagina}`)
  return handleResponse(res)
}

export const searchCliente = async (estabelecimento: string, filters: Record<string, string>) => {
  const params = new URLSearchParams()
  params.append('codEstab', estabelecimento)
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
  })
  const res = await fetch(`/api/belle/clientes/buscar?${params.toString()}`)
  return handleResponse(res)
}

export const updateCliente = async (codCliente: string | number, data: any) => {
  const res = await fetch(`/api/belle/clientes/atualizar?codCliente=${codCliente}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export const saveLead = async (data: any) => {
  const res = await fetch(`/api/belle/clientes/gravar-lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse(res)
}

export const testarConexaoBelle = async (estabelecimento: string = '1') => {
  const res = await fetch(`/api/belle/testar-conexao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codEstab: estabelecimento }),
  })
  return handleResponse(res)
}

export const testBelleConnection = testarConexaoBelle

export const fetchBelleClientes = async (
  estabelecimento: string = '1',
): Promise<BelleCliente[]> => {
  let allClientes: BelleCliente[] = []
  let pagina = 0
  let hasMore = true

  while (hasMore) {
    const data = await listClientes(estabelecimento, pagina)
    const clientes = Array.isArray(data)
      ? data
      : data?.pacientes || data?.clientes || data?.dados || []

    if (!clientes || clientes.length === 0) {
      hasMore = false
    } else {
      allClientes = [...allClientes, ...clientes]
      if (clientes.length < 100) {
        hasMore = false
      } else {
        pagina++
      }
    }
  }

  return allClientes
}

export const fetchBelleAgendamentos = async (
  _estabelecimento: string = '1',
): Promise<BelleAgendamento[]> => {
  return []
}
