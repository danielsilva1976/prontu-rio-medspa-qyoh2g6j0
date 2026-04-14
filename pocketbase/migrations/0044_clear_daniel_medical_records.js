migrate(
  (app) => {
    try {
      // Find the specific patient by name
      const patient = app.findFirstRecordByData('patients', 'name', 'Daniel Melchiades da Silva')

      // Delete all medical records associated with this patient's ID
      app
        .db()
        .newQuery('DELETE FROM medical_records WHERE patient = {:patientId}')
        .bind({ patientId: patient.id })
        .execute()

      console.log(`Successfully cleared test medical records for patient: ${patient.get('name')}`)
    } catch (_) {
      // Gracefully handle the case where the patient doesn't exist
      console.log(
        "Patient 'Daniel Melchiades da Silva' not found, skipping medical records cleanup.",
      )
    }
  },
  (app) => {
    // Reverting this data deletion is not possible since the data is removed
  },
)
