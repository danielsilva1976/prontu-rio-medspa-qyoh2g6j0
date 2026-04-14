migrate((app) => {
  // Clear all medical records to start fresh
  app.db().newQuery('DELETE FROM medical_records').execute()

  // Clear clinical data from patients
  app
    .db()
    .newQuery(`
    UPDATE patients
    SET history = '',
        procedures = null,
        lastVisit = '',
        tags = '',
        rating = '',
        classificacao = '',
        temperatura = ''
  `)
    .execute()
})
