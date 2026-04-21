migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      const record = app.findAuthRecordByEmail('users', 'daniel.nefro@gmail.com')
      record.setPassword('Sucesso2026!')
      record.set('role', 'admin')
      record.set('name', 'Daniel Silva')
      record.setVerified(true)
      app.save(record)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('daniel.nefro@gmail.com')
      record.setPassword('Sucesso2026!')
      record.set('role', 'admin')
      record.set('name', 'Daniel Silva')
      record.setVerified(true)
      app.save(record)
    }
  },
  (app) => {
    // Down migration is intentionally empty for safety to preserve the admin user
  },
)
