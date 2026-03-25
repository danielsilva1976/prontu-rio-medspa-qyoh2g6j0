import { belleClient } from './belleClient'

const unwrap = (res: any) => res?.data || res?.dados || res

export const belleService = {
  listarClientes: async (codEstab: string, pagina: number) => {
    const res = await belleClient('/clientes', {
      method: 'GET',
      queryParams: { codEstab, pagina: pagina.toString() },
    })
    return unwrap(res)
  },
  buscarCliente: async (codEstab: string, filters: Record<string, string>) => {
    const res = await belleClient('/cliente/buscar', {
      method: 'GET',
      queryParams: { codEstab, ...filters },
    })
    return unwrap(res)
  },
  atualizarCliente: async (codCliente: string, data: any) => {
    const res = await belleClient('/cliente', {
      method: 'PUT',
      queryParams: { codCliente },
      body: data,
    })
    return unwrap(res)
  },
  gravarLead: async (data: any) => {
    const res = await belleClient('/cliente/gravar-lead', {
      method: 'POST',
      body: data,
    })
    return unwrap(res)
  },
  runIncrementalValidationFlow: async (codEstab: string) => {
    const diagnostics: any[] = []

    const logStep = async (
      stepName: string,
      method: 'GET' | 'POST' | 'PUT',
      endpointPath: string,
      queryParams: Record<string, string>,
      body: any = null,
    ) => {
      const logEntry = {
        step: stepName,
        request: {
          method,
          url: endpointPath,
          queryParams,
          body: method === 'GET' ? 'vazio' : body,
        },
        response: null as any,
        error: undefined as any,
        is405: false,
      }
      try {
        const res = await belleClient(endpointPath, { method, queryParams, body })
        logEntry.response = { status: 200, body: res }
        diagnostics.push(logEntry)
        return true
      } catch (err: any) {
        logEntry.error = err.message
        if (err.message.includes('405')) logEntry.is405 = true
        logEntry.response = { status: err.message.match(/HTTP (\d+)/)?.[1] || 500 }
        diagnostics.push(logEntry)
        return false
      }
    }

    const step1 = await logStep('1. Listar Clientes (GET)', 'GET', '/clientes', {
      pagina: '0',
      codEstab,
    })
    if (!step1) return diagnostics

    const step2 = await logStep('2. Buscar Cliente (GET)', 'GET', '/cliente/buscar', {
      cpf: '11122233344',
      codEstab,
    })
    if (!step2) return diagnostics

    const step3 = await logStep(
      '3. Atualizar Cliente (PUT)',
      'PUT',
      '/cliente',
      { codCliente: '4448985' },
      { nome: 'Teste Medspa', codEstab },
    )
    if (!step3) return diagnostics

    const step4 = await logStep(
      '4. Gravar Lead (POST)',
      'POST',
      '/cliente/gravar-lead',
      {},
      { nome: 'Lead Teste', codEstab, celular: '11999999999' },
    )
    if (!step4) return diagnostics

    return diagnostics
  },
}
