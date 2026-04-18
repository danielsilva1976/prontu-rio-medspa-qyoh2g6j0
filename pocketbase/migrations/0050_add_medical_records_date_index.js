migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    col.addIndex('idx_medical_records_date_time', false, 'appointment_date, horario', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    col.removeIndex('idx_medical_records_date_time')
    app.save(col)
  },
)
