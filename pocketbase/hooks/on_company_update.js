onRecordUpdateRequest(
  (e) => {
    try {
      var colName = e.record.collectionName
      var field = colName === 'service_orders' ? 'owner_company_id' : 'company_id'
      var originalVal = e.record.original().getString(field)
      e.record.set(field, originalVal)
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
