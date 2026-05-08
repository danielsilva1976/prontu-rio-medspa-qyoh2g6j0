migrate(
  (app) => {
    const collection = new Collection({
      name: 'doc_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin' || @request.auth.email = 'daniel.nefro@gmail.com'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'type', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('doc_templates')
    app.delete(collection)
  },
)
