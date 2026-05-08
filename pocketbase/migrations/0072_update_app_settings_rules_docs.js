migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('app_settings')
    const rules = [
      "key = 'procedures'",
      "key = 'areas'",
      "key = 'technologies'",
      "key = 'products'",
      "key = 'brands'",
      "key = 'document_layout_config'",
    ]
    const ruleStr = `@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com' || (@request.auth.role = 'secretary' && (${rules.join(' || ')}))`
    col.listRule = ruleStr
    col.viewRule = ruleStr
    col.createRule = ruleStr
    col.updateRule = ruleStr
    col.deleteRule = ruleStr
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('app_settings')
    const rules = [
      "key = 'procedures'",
      "key = 'areas'",
      "key = 'technologies'",
      "key = 'products'",
      "key = 'brands'",
    ]
    const ruleStr = `@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com' || (@request.auth.role = 'secretary' && (${rules.join(' || ')}))`
    col.listRule = ruleStr
    col.viewRule = ruleStr
    col.createRule = ruleStr
    col.updateRule = ruleStr
    col.deleteRule = ruleStr
    app.save(col)
  },
)
