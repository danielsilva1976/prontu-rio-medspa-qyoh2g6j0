migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.manageRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.manageRule = null
    app.save(users)
  },
)
