migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('sync_jobs')
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('sync_jobs')
    col.listRule = "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    col.viewRule = "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    app.save(col)
  },
)
