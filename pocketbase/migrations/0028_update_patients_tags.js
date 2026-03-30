migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    const tagsField = col.fields.getByName('tags')

    if (tagsField && tagsField.type === 'text') {
      col.fields.removeByName('tags')
      col.fields.add(new JSONField({ name: 'tags', required: false }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('patients')
    const tagsField = col.fields.getByName('tags')

    if (tagsField && tagsField.type === 'json') {
      col.fields.removeByName('tags')
      col.fields.add(new TextField({ name: 'tags', required: false }))
      app.save(col)
    }
  },
)
