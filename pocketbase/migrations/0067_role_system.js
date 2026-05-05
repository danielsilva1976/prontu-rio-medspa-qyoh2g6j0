migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Add avatar field if not exists
    if (!users.fields.getByName('avatar')) {
      users.fields.add(
        new FileField({
          name: 'avatar',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }

    // Update role field to include 'aesthetic'
    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.selectValues = ['admin', 'secretary', 'aesthetic']
    }

    // Update API rules for `users`
    users.listRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    users.viewRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    users.createRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    users.updateRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    users.deleteRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    app.save(users)

    // Update API rules for `app_settings`
    const appSettings = app.findCollectionByNameOrId('app_settings')
    appSettings.listRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    appSettings.viewRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    appSettings.createRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    appSettings.updateRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    appSettings.deleteRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    app.save(appSettings)

    // Update API rules for `medical_records`
    const medicalRecords = app.findCollectionByNameOrId('medical_records')
    medicalRecords.createRule = "@request.auth.id != ''"
    medicalRecords.updateRule = "@request.auth.id != ''"
    medicalRecords.deleteRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    app.save(medicalRecords)

    // Ensure super-admin account has admin role
    try {
      const daniel = app.findAuthRecordByEmail('users', 'daniel.nefro@gmail.com')
      daniel.set('role', 'admin')
      app.save(daniel)
    } catch (_) {
      // If not found, ignore
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.selectValues = ['admin', 'secretary']
    }

    users.listRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    users.viewRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    users.createRule = ''
    users.updateRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)

    const appSettings = app.findCollectionByNameOrId('app_settings')
    appSettings.listRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    appSettings.viewRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    appSettings.createRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    appSettings.updateRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    appSettings.deleteRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    app.save(appSettings)

    const medicalRecords = app.findCollectionByNameOrId('medical_records')
    medicalRecords.createRule = "@request.auth.id != ''"
    medicalRecords.updateRule = "@request.auth.id != ''"
    medicalRecords.deleteRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    app.save(medicalRecords)
  },
)
