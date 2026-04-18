migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('medical_records')
    collection.fields.add(new TextField({ name: 'horario' }))
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('medical_records')
    collection.fields.removeByName('horario')
    app.save(collection)
  },
)
