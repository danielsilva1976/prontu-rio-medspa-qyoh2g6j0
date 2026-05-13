migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    // Expand roles to include new clinical values and the frontend mapping
    const roleField = col.fields.getByName('role')
    if (roleField) {
      roleField.values = ['admin', 'secretary', 'aesthetic', 'médico', 'estético']
    }

    // Add the digital signature field
    if (!col.fields.getByName('signature')) {
      col.fields.add(
        new FileField({
          name: 'signature',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')

    col.fields.removeByName('signature')

    const roleField = col.fields.getByName('role')
    if (roleField) {
      roleField.values = ['admin', 'secretary']
    }

    app.save(col)
  },
)
