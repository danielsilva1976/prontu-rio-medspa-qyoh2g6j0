migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('patients')

    if (!col.fields.getByName('lastVisit')) {
      col.fields.add(new TextField({ name: 'lastVisit' }))
    }
    if (!col.fields.getByName('nextAppointment')) {
      col.fields.add(new TextField({ name: 'nextAppointment' }))
    }
    if (!col.fields.getByName('avatar')) {
      col.fields.add(new TextField({ name: 'avatar' }))
    }
    if (!col.fields.getByName('procedures')) {
      col.fields.add(new JSONField({ name: 'procedures' }))
    }
    if (!col.fields.getByName('professional')) {
      col.fields.add(new TextField({ name: 'professional' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('patients')

    const fields = ['lastVisit', 'nextAppointment', 'avatar', 'procedures', 'professional']
    for (const name of fields) {
      const f = col.fields.getByName(name)
      if (f) col.fields.removeById(f.id)
    }

    app.save(col)
  },
)
