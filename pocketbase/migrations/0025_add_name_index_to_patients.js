migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    col.addIndex('idx_patients_name', false, 'name', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    col.removeIndex('idx_patients_name')
    app.save(col)
  },
)
