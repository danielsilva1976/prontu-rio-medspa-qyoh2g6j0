migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('sync_jobs')
    col.createRule = "@request.auth.id != ''"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('sync_jobs')
    col.createRule = ''
    app.save(col)
  },
)
