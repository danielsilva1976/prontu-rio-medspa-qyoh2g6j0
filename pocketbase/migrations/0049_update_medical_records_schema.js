migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('medical_records')

    const profNameField = collection.fields.getByName('professional_name')
    if (profNameField) {
      profNameField.required = false
    }

    const profRegField = collection.fields.getByName('professional_registration')
    if (profRegField) {
      profRegField.required = false
    }

    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('medical_records')

    const profNameField = collection.fields.getByName('professional_name')
    if (profNameField) {
      profNameField.required = true
    }

    const profRegField = collection.fields.getByName('professional_registration')
    if (profRegField) {
      profRegField.required = true
    }

    app.save(collection)
  },
)
