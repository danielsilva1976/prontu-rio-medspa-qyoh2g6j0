import { Patient } from '@/stores/usePatientStore'

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
  dtCadastro?: string
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
    headers: Record<string, string>
    body: any | 'vazio'
  }
  response: {
    status?: number
    body?: any
  } | null
  error?: string
  is405?: boolean
}

export class BelleApiError extends Error {
  public details: string
  public errorTitle: string
  public status?: number
  public raw?: any

  constructor(payload: any) {
    let message = 'Erro de API'
    let detailsStr = 'Falha na comunicação com o servidor.'
    let status = undefined
    let raw = undefined

    try {
      if (typeof payload === 'string') {
        message = payload
        detailsStr = payload
      } else if (payload && typeof payload === 'object') {
        message = String(payload.error || payload.message || message)
        status = payload.status
        raw = payload.raw || payload

        if (typeof payload.details === 'string') {
          detailsStr = payload.details
        } else if (payload.details && typeof payload.details === 'object') {
          detailsStr = JSON.stringify(payload.details)
        } else if (!payload.details && payload.error) {
          detailsStr =
            typeof payload.error === 'string' ? payload.error : JSON.stringify(payload.error)
        }
      }
    } catch (e) {
      detailsStr = 'Não foi possível extrair os detalhes do erro.'
    }

    super(message)
    this.name = 'BelleApiError'
    this.errorTitle = message
    this.details = String(detailsStr)
    this.status = status
    this.raw = raw
  }
}

const PROXY_ENDPOINT = import.meta.env.VITE_BELLE_PROXY_URL || '/api/proxy/belle'

const executeExplicitRequest = async (
  method: 'GET' | 'POST' | 'PUT',
  fullUrl: string,
  token: string,
  bodyData: any = null,
): Promise<{ status: number; body: any }> => {
  const cleanToken = token ? token.trim() : ''
  const headers = {
    Authorization: cleanToken,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const proxyPayload = {
    targetUrl: fullUrl,
    method,
    headers,
    body: method !== 'GET' ? bodyData : undefined,
    removeHeaders: [
      'Sec-Fetch-Site',
      'Sec-Fetch-Mode',
      'Sec-Fetch-Dest',
      'Origin',
      'Referer',
      'User-Agent',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
    ],
    useResidentialProxy: true,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(proxyPayload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const text = await response.text()
    let parsedBody = text
    try {
      parsedBody = JSON.parse(text)
    } catch (e) {
      // Keep plain text
    }

    return { status: response.status, body: parsedBody }
  } catch (err: any) {
    clearTimeout(timeoutId)
    throw err
  }
}

const validateResponse = (res: { status: number; body: any }) => {
  if (res.status >= 400 || (res.body && typeof res.body === 'object' && res.body.erro)) {
    throw new BelleApiError({
      error: `HTTP ${res.status}`,
      status: res.status,
      body: res.body,
      details: res.body?.mensagem || res.body?.error || JSON.stringify(res.body),
    })
  }
  return res.body.data || res.body.dados || res.body
}

export const listClientes = async (
  baseUrl: string,
  token: string,
  estabelecimento: string,
  pagina: number = 0,
) => {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '')
  const url = `${cleanBase}/clientes?pagina=${pagina}&codEstab=${estabelecimento}`
  const res = await executeExplicitRequest('GET', url, token)
  return validateResponse(res)
}

export const searchCliente = async (
  baseUrl: string,
  token: string,
  estabelecimento: string,
  filters: Record<string, string>,
) => {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '')
  const params = new URLSearchParams()
  params.append('codEstab', estabelecimento)
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, String(v))
  })
  const url = `${cleanBase}/cliente/buscar?${params.toString()}`
  const res = await executeExplicitRequest('GET', url, token)
  return validateResponse(res)
}

export const updateCliente = async (
  baseUrl: string,
  token: string,
  codCliente: string | number,
  data: any,
) => {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '')
  const url = `${cleanBase}/cliente?codCliente=${codCliente}`
  const res = await executeExplicitRequest('PUT', url, token, data)
  return validateResponse(res)
}

export const saveLead = async (baseUrl: string, token: string, data: any) => {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '')
  const url = `${cleanBase}/cliente/gravar-lead`
  const res = await executeExplicitRequest('POST', url, token, data)
  return validateResponse(res)
}

export const runIncrementalValidationFlow = async (
  baseUrl: string,
  token: string,
  estabelecimento: string = '1',
): Promise<{ success: boolean; diagnostics: DiagnosticLog[] }> => {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '')
  const cleanToken = token.trim()
  const cleanEstab = estabelecimento.trim()
  const diagnostics: DiagnosticLog[] = []

  const logStep = async (
    stepName: string,
    method: 'GET' | 'POST' | 'PUT',
    endpointPath: string,
    queryParams: Record<string, string>,
    body: any = null,
  ) => {
    const params = new URLSearchParams()
    Object.entries(queryParams).forEach(([k, v]) => params.append(k, v))
    const qStr = params.toString()
    const fullUrl = `${cleanBase}${endpointPath}${qStr ? `?${qStr}` : ''}`

    const logEntry: DiagnosticLog = {
      step: stepName,
      request: {
        method,
        url: fullUrl,
        queryParams,
        headers: {
          Authorization: '***',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: method === 'GET' ? 'vazio' : body,
      },
      response: null,
    }

    try {
      const res = await executeExplicitRequest(method, fullUrl, cleanToken, body)
      logEntry.response = { status: res.status, body: res.body }

      if (
        res.status >= 400 ||
        (res.body && typeof res.body === 'object' && (res.body.erro || res.body.error))
      ) {
        logEntry.error = res.body?.mensagem || res.body?.error || `HTTP ${res.status}`
        if (res.status === 405) logEntry.is405 = true
        diagnostics.push(logEntry)
        return false // Stop flow on first error
      }

      diagnostics.push(logEntry)
      return true
    } catch (err: any) {
      logEntry.error = err.message || 'Erro de rede ou timeout'
      diagnostics.push(logEntry)
      return false
    }
  }

  // Step 1: GET /clientes
  const step1 = await logStep('1. Listar Clientes (GET)', 'GET', '/clientes', {
    pagina: '0',
    codEstab: cleanEstab,
  })
  if (!step1) return { success: false, diagnostics }

  // Step 2: GET /cliente/buscar
  const step2 = await logStep('2. Buscar Cliente (GET)', 'GET', '/cliente/buscar', {
    cpf: '11122233344',
    codEstab: cleanEstab,
  })
  if (!step2) return { success: false, diagnostics }

  // Step 3: PUT /cliente (Sample Payload)
  const step3 = await logStep(
    '3. Atualizar Cliente (PUT)',
    'PUT',
    '/cliente',
    { codCliente: '4448985' },
    { nome: 'Teste Medspa', codEstab: cleanEstab },
  )
  if (!step3) return { success: false, diagnostics }

  // Step 4: POST /cliente/gravar-lead (Sample Payload)
  const step4 = await logStep(
    '4. Gravar Lead (POST)',
    'POST',
    '/cliente/gravar-lead',
    {},
    { nome: 'Lead Teste', codEstab: cleanEstab, celular: '11999999999' },
  )
  if (!step4) return { success: false, diagnostics }

  return { success: true, diagnostics }
}

export const testBelleConnection = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
) => {
  const result = await listClientes(url, token, estabelecimento, 0)
  return { success: true, data: result }
}

export const fetchBelleClientes = async (
  url: string,
  token: string,
  estabelecimento: string = '1',
): Promise<BelleCliente[]> => {
  let allClientes: BelleCliente[] = []
  let pagina = 0
  let hasMore = true

  while (hasMore) {
    const data = await listClientes(url, token, estabelecimento, pagina)
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
  _url: string,
  _token: string,
  _cpf?: string,
  _estabelecimento: string = '1',
): Promise<BelleAgendamento[]> => {
  return []
}

export const mapBelleDataToPatients = (rawClientes: any, rawAgendamentos: any) => {
  const now = new Date()
  const validClientes = Array.isArray(rawClientes) ? rawClientes : []
  const validAgendamentos = Array.isArray(rawAgendamentos) ? rawAgendamentos : []

  return validClientes.map((c) => {
    const belleIdStr = String(c.codigo || c.id || '')
    const clientAppts = validAgendamentos.filter(
      (a) =>
        (a.cpf_cliente && c.cpf && a.cpf_cliente === c.cpf) ||
        (a.cliente_id && String(a.cliente_id) === belleIdStr),
    )

    const rawDob = c.dtNascimento || c.data_nascimento
    let lastVisit = rawDob ? new Date(rawDob).toISOString().split('T')[0] : '2023-01-01'
    let nextAppointment: string | null = null
    const procedures = new Set<string>()

    clientAppts.forEach((a) => {
      if (a.servico) procedures.add(a.servico)
      if (a.data) {
        const apptDate = new Date(`${a.data}T${a.hora_inicio || '00:00'}:00`)
        if (!isNaN(apptDate.getTime())) {
          if (apptDate < now) {
            if (
              !lastVisit ||
              isNaN(new Date(lastVisit).getTime()) ||
              apptDate > new Date(lastVisit)
            )
              lastVisit = a.data
          } else {
            if (!nextAppointment || apptDate < new Date(nextAppointment))
              nextAppointment = `${a.data}T${a.hora_inicio || '00:00'}:00`
          }
        }
      }
    })

    let formattedAddress = c.rua || c.endereco || ''
    if (c.numeroRua || c.numEndereco) formattedAddress += `, ${c.numeroRua || c.numEndereco}`
    if (c.bairro) formattedAddress += ` - ${c.bairro}`
    if (c.cidade) formattedAddress += ` - ${c.cidade}`
    if (c.uf || c.UF) formattedAddress += `/${c.uf || c.UF}`

    return {
      belleId: belleIdStr,
      name: (c.nome || '').trim() || 'Paciente sem nome',
      cpf: (c.cpf || '').trim(),
      email: (c.email || '').trim(),
      phone: (c.celular || c.telefone || '').trim(),
      dob: rawDob,
      lastVisit,
      nextAppointment,
      procedures: Array.from(procedures),
      history: c.observacao || c.historico_clinico || '',
      rg: c.rg || '',
      profissao: c.profissao || '',
      estado_civil: c.estado_civil || '',
      endereco: formattedAddress.trim(),
      rua: c.rua || '',
      numeroRua: c.numeroRua || '',
      bairro: c.bairro || '',
      cidade: c.cidade || '',
      uf: c.uf || c.UF || '',
      cep: c.cep || '',
      temperatura: c.temperatura || '',
      classificacao: c.classificacao || '',
      status: nextAppointment ? 'scheduled' : 'active',
      sexo: c.sexo || '',
      rating: c.rating || '',
      tags: Array.isArray(c.tags)
        ? c.tags
        : typeof c.tags === 'string' && c.tags
          ? c.tags.split(',').map((t: string) => t.trim())
          : [],
    }
  })
}
