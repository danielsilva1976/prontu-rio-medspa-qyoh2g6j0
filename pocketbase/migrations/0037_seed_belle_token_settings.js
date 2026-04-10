migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('app_settings')
    let record
    try {
      record = app.findFirstRecordByData('app_settings', 'key', 'BELLE_TOKEN')
    } catch (_) {
      record = new Record(col)
      record.set('key', 'BELLE_TOKEN')
    }

    const envToken =
      $os.getenv('BELLE_TOKEN') ||
      $os.getenv('VITE_BELLE_TOKEN') ||
      '1787cad7ac7dd71ac2fbbdaf823928fd'
    record.set('value', envToken)
    record.set('description', 'Token de integração com a API Belle Software')

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('app_settings', 'key', 'BELLE_TOKEN')
      app.delete(record)
    } catch (_) {}
  },
)
