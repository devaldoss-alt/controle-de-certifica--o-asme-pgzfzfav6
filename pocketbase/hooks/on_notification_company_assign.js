onRecordCreateRequest((e) => {
  var body = e.requestInfo().body || {}
  if (!body.company_id && e.auth && e.auth.getString) {
    var companyId = e.auth.getString('primary_company_id')
    if (companyId) {
      e.requestInfo().body.company_id = companyId
    }
  }
  e.next()
}, 'notifications')
