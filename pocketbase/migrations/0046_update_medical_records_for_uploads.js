migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    col.fields.add(new DateField({ name: 'appointment_date', required: false }))
    col.fields.add(
      new FileField({
        name: 'attachment',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['application/pdf'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    col.fields.removeByName('appointment_date')
    col.fields.removeByName('attachment')
    app.save(col)
  },
)
