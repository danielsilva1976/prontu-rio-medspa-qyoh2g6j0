migrate(
  (app) => {
    let usersCol
    try {
      usersCol = app.findCollectionByNameOrId('users')
    } catch (err) {
      usersCol = new Collection({
        name: 'users',
        type: 'auth',
        listRule: 'id = @request.auth.id',
        viewRule: 'id = @request.auth.id',
        createRule: '',
        updateRule: 'id = @request.auth.id',
        deleteRule: 'id = @request.auth.id',
        fields: [new TextField({ name: 'name', required: false })],
      })
      app.save(usersCol)
    }

    // Ensure rules are exactly as requested
    usersCol.listRule = 'id = @request.auth.id'
    usersCol.viewRule = 'id = @request.auth.id'
    usersCol.updateRule = 'id = @request.auth.id'
    usersCol.deleteRule = 'id = @request.auth.id'
    app.save(usersCol)

    // Seed initial user
    try {
      app.findAuthRecordByEmail('users', 'daniel.nefro@gmail.com')
    } catch (e) {
      const record = new Record(usersCol)
      record.setEmail('daniel.nefro@gmail.com')
      record.setPassword('securepassword123')
      record.setVerified(true)
      app.save(record)
    }
  },
  (app) => {
    // Safe down migration: we just remove the seeded user and revert rules if needed,
    // but it's safer to just remove the user.
    try {
      const record = app.findAuthRecordByEmail('users', 'daniel.nefro@gmail.com')
      app.delete(record)
    } catch (e) {}
  },
)
