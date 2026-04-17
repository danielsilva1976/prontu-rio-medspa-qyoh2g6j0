migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    col.fields.add(
      new FileField({
        name: 'attachment',
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ['image/jpeg', 'application/pdf'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('medical_records')
    col.fields.add(
      new FileField({
        name: 'attachment',
        maxSelect: 1,
        maxSize: 0,
        mimeTypes: [],
      }),
    )
    app.save(col)
  },
)
