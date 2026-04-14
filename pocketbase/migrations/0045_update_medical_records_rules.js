migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    col.updateRule = null
    col.deleteRule = null
    app.save(col)
  },
)
