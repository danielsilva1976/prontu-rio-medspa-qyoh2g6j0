migrate((app) => {
  // Clear all medical records to start fresh for production use
  app.db().newQuery('DELETE FROM medical_records').execute()
})
