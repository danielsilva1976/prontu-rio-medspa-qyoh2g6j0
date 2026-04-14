migrate(
  (app) => {
    app.db().newQuery('DELETE FROM medical_records').execute()
  },
  (app) => {
    // down migration not possible for data deletion
  },
)
