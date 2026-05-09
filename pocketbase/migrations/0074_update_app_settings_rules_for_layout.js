migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')

    const rules =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com' || (@request.auth.role = 'secretary' && (key = 'procedures' || key = 'areas' || key = 'technologies' || key = 'products' || key = 'brands')) || (@request.auth.id != '' && key = 'document_layout_config')"

    collection.listRule = rules
    collection.viewRule = rules
    collection.createRule = rules
    collection.updateRule = rules
    collection.deleteRule = rules

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('app_settings')

    const rules =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com' || (@request.auth.role = 'secretary' && (key = 'procedures' || key = 'areas' || key = 'technologies' || key = 'products' || key = 'brands' || key = 'document_layout_config'))"

    collection.listRule = rules
    collection.viewRule = rules
    collection.createRule = rules
    collection.updateRule = rules
    collection.deleteRule = rules

    app.save(collection)
  },
)
