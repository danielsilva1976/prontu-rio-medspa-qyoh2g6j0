export const config = {
  belle: {
    baseUrl: 'https://app.bellesoftware.com.br/api/release/controller/IntegracaoExterna/v1.0',
    token:
      (typeof process !== 'undefined' ? process.env.BELLE_TOKEN : undefined) ||
      (typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env.VITE_BELLE_TOKEN
        : '') ||
      '',
    estabelecimentoPadrao: '1',
  },
}
