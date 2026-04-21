migrate(
  (app) => {
    const adminRule =
      "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"
    const userRule =
      "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'"

    // 1. Patients
    const patients = app.findCollectionByNameOrId('patients')
    patients.deleteRule = adminRule
    app.save(patients)

    // 2. Sync Jobs
    const syncJobs = app.findCollectionByNameOrId('sync_jobs')
    syncJobs.listRule = adminRule
    syncJobs.viewRule = adminRule
    syncJobs.updateRule = adminRule
    syncJobs.deleteRule = adminRule
    syncJobs.createRule = "@request.auth.id != ''"
    app.save(syncJobs)

    // 3. Users
    const users = app.findCollectionByNameOrId('users')
    users.listRule = userRule
    users.viewRule = userRule
    users.updateRule = userRule
    app.save(users)

    // 4. App Settings
    const appSettings = app.findCollectionByNameOrId('app_settings')
    appSettings.listRule = adminRule
    appSettings.viewRule = adminRule
    appSettings.createRule = adminRule
    appSettings.updateRule = adminRule
    appSettings.deleteRule = adminRule
    app.save(appSettings)

    // 5. Medical Records
    const medicalRecords = app.findCollectionByNameOrId('medical_records')
    medicalRecords.deleteRule = adminRule
    app.save(medicalRecords)

    // 6. Ensure admin role for specific user
    try {
      const adminUser = app.findAuthRecordByEmail('users', 'daniel.nefro@gmail.com')
      adminUser.set('role', 'admin')
      app.save(adminUser)
    } catch (e) {
      // Skip if user does not exist yet
    }
  },
  (app) => {
    // 1. Patients
    const patients = app.findCollectionByNameOrId('patients')
    patients.deleteRule = "@request.auth.role = 'admin'"
    app.save(patients)

    // 2. Sync Jobs
    const syncJobs = app.findCollectionByNameOrId('sync_jobs')
    syncJobs.listRule = "@request.auth.role = 'admin'"
    syncJobs.viewRule = "@request.auth.role = 'admin'"
    syncJobs.updateRule = "@request.auth.role = 'admin'"
    syncJobs.deleteRule = "@request.auth.role = 'admin'"
    syncJobs.createRule = "@request.auth.id != ''"
    app.save(syncJobs)

    // 3. Users
    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    app.save(users)

    // 4. App Settings
    const appSettings = app.findCollectionByNameOrId('app_settings')
    appSettings.listRule = "@request.auth.role = 'admin'"
    appSettings.viewRule = "@request.auth.role = 'admin'"
    appSettings.createRule = "@request.auth.role = 'admin'"
    appSettings.updateRule = "@request.auth.role = 'admin'"
    appSettings.deleteRule = "@request.auth.role = 'admin'"
    app.save(appSettings)

    // 5. Medical Records
    const medicalRecords = app.findCollectionByNameOrId('medical_records')
    medicalRecords.deleteRule = "@request.auth.role = 'admin'"
    app.save(medicalRecords)
  },
)
