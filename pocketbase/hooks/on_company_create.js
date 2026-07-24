onRecordCreateRequest(
  (e) => {
    try {
      var authId = e.auth ? e.auth.id : ''
      if (!authId) {
        e.next()
        return
      }

      var user = $app.findRecordById('users', authId)
      var companyId = user.getString('primary_company_id')
      if (!companyId) {
        e.next()
        return
      }

      var colName = e.record.collectionName
      if (colName === 'service_orders') {
        e.record.set('owner_company_id', companyId)
      } else {
        e.record.set('company_id', companyId)
      }
    } catch (_) {}

    e.next()
  },
  'checklists',
  'documents',
  'service_orders',
  'indicators',
  'interactions',
  'indicator_history',
  'user_allocations',
  'notifications',
)
