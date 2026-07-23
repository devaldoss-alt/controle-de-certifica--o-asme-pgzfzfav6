onRecordAfterUpdateSuccess((e) => {
  const record = e.record

  if (!record.getBool('is_critical')) return e.next()

  const oldEvidence = record.original().getString('evidence_file')
  const newEvidence = record.getString('evidence_file')

  if (!newEvidence || newEvidence === '') return e.next()
  if (oldEvidence && oldEvidence !== '') return e.next()

  const title = record.getString('title')
  const actorId = record.getString('last_action_by')

  var users = []
  try {
    users = $app.findRecordsByFilter('users', "role = 'Manager' || role = 'QCC'", 'name', 500, 0)
  } catch (_) {
    return e.next()
  }

  const notifCol = $app.findCollectionByNameOrId('notifications')

  for (var i = 0; i < users.length; i++) {
    if (users[i].id === actorId) continue
    try {
      var notif = new Record(notifCol)
      notif.set('user_id', users[i].id)
      notif.set('type', 'submission')
      notif.set('checklist_id', record.id)
      notif.set('message', "Critical checklist '" + title + "' submitted for approval")
      notif.set('read', false)
      $app.save(notif)
    } catch (err) {
      console.log('Failed to create notification for user ' + users[i].id, err.message)
    }
  }

  return e.next()
}, 'checklists')
