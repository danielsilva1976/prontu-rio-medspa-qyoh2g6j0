import { belleClient } from './belleClient'

export const belleService = {
  testarConexaoBelle: async (codEstab: string) => {
    const data = await belleClient('/clientes', {
      method: 'GET',
      queryParams: { codEstab, pagina: '0' },
    })
    return { success: true, data }
  },
}
