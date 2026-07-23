onRecordAfterUpdateSuccess((e) => {
  const record = e.record

  const oldStatus = record.original().getString('approval_status')
  const newStatus = record.getString('approval_status')

  if (newStatus !== 'approved' && newStatus !== 'rejected') return e.next()
  if (oldStatus === newStatus) return e.next()

  const targetUserId = record.getString('last_action_by')
  if (!targetUserId) return e.next()

  const title = record.getString('title')
  var message = ''
  if (newStatus === 'approved') {
    message = "Checklist '" + title + "' has been approved"
  } else {
    var comment = record.getString('rejection_comment')
    message = "Checklist '" + title + "' has been rejected"
    if (comment) message = message + ': ' + comment
  }

  try {
    const notifCol = $app.findCollectionByNameOrId('notifications')
    var notif = new Record(notifCol)
    notif.set('user_id', targetUserId)
    notif.set('type', newStatus)
    notif.set('checklist_id', record.id)
    notif.set('message', message)
    notif.set('read', false)
    $app.save(notif)
  } catch (err) {
    console.log('Failed to create approval notification', err.message)
  }

  return e.next()
}, 'checklists')
