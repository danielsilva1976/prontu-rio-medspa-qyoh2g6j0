migrate(
  (app) => {
    const collection = new Collection({
      name: 'medical_records',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('patients').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'content', type: 'json' },
        { name: 'professional_name', type: 'text', required: true },
        { name: 'professional_registration', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_medical_records_patient ON medical_records (patient)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('medical_records')
    app.delete(collection)
  },
)
