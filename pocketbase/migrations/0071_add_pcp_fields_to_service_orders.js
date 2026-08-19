migrate(
  (app) => {
    const soCol = app.findCollectionByNameOrId('service_orders')

    if (!soCol.fields.getByName('estimated_hours')) {
      soCol.fields.add(new NumberField({ name: 'estimated_hours', min: 0 }))
    }
    if (!soCol.fields.getByName('sector')) {
      soCol.fields.add(new TextField({ name: 'sector' }))
    }
    if (!soCol.fields.getByName('start_date')) {
      soCol.fields.add(new DateField({ name: 'start_date' }))
    }
    if (!soCol.fields.getByName('completed_date')) {
      soCol.fields.add(new DateField({ name: 'completed_date' }))
    }

    app.save(soCol)

    // Backfill sectors and estimated hours on existing service orders for realistic capacity planning
    const orders = app.findRecordsByFilter('service_orders', "id != ''", 'created', 500, 0)
    const sectors = ['Solda', 'Usinagem', 'Caldeiraria', 'CQ', 'Montagem', 'Pintura']
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i]
      if (!o.getString('sector')) {
        o.set('sector', sectors[i % sectors.length])
      }
      if (o.getInt('estimated_hours') <= 0) {
        o.set('estimated_hours', (i + 1) * 80 + 40)
      }
      app.save(o)
    }
  },
  (app) => {
    const soCol = app.findCollectionByNameOrId('service_orders')
    if (soCol.fields.getByName('estimated_hours')) soCol.fields.removeByName('estimated_hours')
    if (soCol.fields.getByName('sector')) soCol.fields.removeByName('sector')
    if (soCol.fields.getByName('start_date')) soCol.fields.removeByName('start_date')
    if (soCol.fields.getByName('completed_date')) soCol.fields.removeByName('completed_date')
    app.save(soCol)
  },
)
