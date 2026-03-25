export interface BelleCliente {
  codigo?: number | string
  id?: number | string
  nome?: string
  cpf?: string
  dtNascimento?: string
  data_nascimento?: string
  celular?: string
  telefone?: string
  email?: string
  sexo?: string
  profissao?: string
  uf?: string
  UF?: string
  cidade?: string
  bairro?: string
  cep?: string
  rua?: string
  numeroRua?: string
  endereco?: string
  numEndereco?: string
  historico_clinico?: string
  observacao?: string
  rg?: string
  estado_civil?: string
  status?: string
  situacao?: string
  temperatura?: string
  classificacao?: string
  rating?: string
  tags?: string[] | string
}

export interface BelleAgendamento {
  id: number
  cliente_id?: number | string
  cpf_cliente?: string
  data: string
  hora_inicio: string
  servico: string
  profissional: string
  status: string
  observacoes?: string
}

export interface DiagnosticLog {
  step: string
  request: {
    method: string
    url: string
    queryParams: Record<string, string>
    headers?: Record<string, string>
    body: any | 'vazio'
  }
  response: {
    status?: number
    body?: any
  } | null
  error?: string
  is405?: boolean
}
