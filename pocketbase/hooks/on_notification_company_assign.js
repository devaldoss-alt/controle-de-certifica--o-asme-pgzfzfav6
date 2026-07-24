onRecordCreate((e) => {
  var checklistId = e.record.getString('checklist_id')
  if (!checklistId) {
    e.next()
    return
  }

  try {
    var checklist = $app.findRecordById('checklists', checklistId)
    var companyId = checklist.getString('company_id')
    if (companyId) {
      e.record.set('company_id', companyId)
    }
  } catch (_) {}

  e.next()
}, 'notifications')
