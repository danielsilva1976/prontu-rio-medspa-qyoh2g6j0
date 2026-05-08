migrate(
  (app) => {
    try {
      app.findFirstRecordByData('app_settings', 'key', 'document_layout_config')
    } catch (_) {
      const col = app.findCollectionByNameOrId('app_settings')
      const record = new Record(col)
      record.set('key', 'document_layout_config')
      record.set(
        'value',
        JSON.stringify({
          clinicName: 'Clínica MEDSPA',
          proName: 'Dra. Fabíola Kleinert',
          proSpecialty: 'Médica Dermatologista',
          proRegistry: 'CRM-SP 123456',
          addressLine1: 'Av. Paulista, 1000 - Conjunto 101 - Bela Vista',
          addressLine2: 'São Paulo, SP - 01310-100',
          contact: '(11) 99999-9999 • contato@medspa.com.br',
          disclaimer:
            'Documento assinado digitalmente conforme MP nº 2.200-2/2001, que institui a Infraestrutura de Chaves Públicas Brasileira - ICP-Brasil.',
        }),
      )
      app.save(record)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('app_settings', 'key', 'document_layout_config')
      app.delete(record)
    } catch (_) {}
  },
)
