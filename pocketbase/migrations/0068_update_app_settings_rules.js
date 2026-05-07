migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('app_settings')
    const adminRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    const secRule =
      "@request.auth.role = 'secretary' && (key = 'procedures' || key = 'areas' || key = 'technologies' || key = 'products' || key = 'brands')"
    const rule = `${adminRule} || (${secRule})`

    col.listRule = rule
    col.viewRule = rule
    col.createRule = rule
    col.updateRule = rule
    col.deleteRule = rule
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('app_settings')
    const rule = "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    col.listRule = rule
    col.viewRule = rule
    col.createRule = rule
    col.updateRule = rule
    col.deleteRule = rule
    app.save(col)
  },
)
