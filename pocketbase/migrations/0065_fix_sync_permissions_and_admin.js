migrate(
  (app) => {
    // 1. Update sync_jobs API rules to allow authenticated users to create records
    const syncJobs = app.findCollectionByNameOrId('sync_jobs')
    syncJobs.createRule = "@request.auth.id != ''"
    app.save(syncJobs)

    // 2. Ensure daniel.nefro@gmail.com has the 'admin' role
    try {
      const user = app.findAuthRecordByEmail('users', 'daniel.nefro@gmail.com')
      user.set('role', 'admin')
      app.save(user)
    } catch (err) {
      // User might not exist in all environments, safely ignore
      console.log('User daniel.nefro@gmail.com not found, skipping role assignment.')
    }
  },
  (app) => {
    const syncJobs = app.findCollectionByNameOrId('sync_jobs')
    syncJobs.createRule = "@request.auth.role = 'admin'"
    app.save(syncJobs)
  },
)
