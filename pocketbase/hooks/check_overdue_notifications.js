var $app = $app || app

onRecordCreate((e) => {
  var rec = e.record
  var status = rec.getString('status')
  var due = rec.getString('due_date')
  if (due && status === 'pending') {
    var today = new Date().toISOString().split('T')[0]
    if (due < today) {
      // Find quality manager and consultant users
      var users = $app.findRecordsByFilter(
        'users',
        "role ~ 'Manager' || role ~ 'Consultor' || email = 'devaldoss@gmail.com' || email = 'consultor.teste@qualihub.com'",
        'name',
        100,
        0,
      )
      var notifCol = $app.findCollectionByNameOrId('notifications')
      for (var i = 0; i < users.length; i++) {
        var u = users[i]
        var notif = new Record(notifCol)
        notif.set('user_id', u.id)
        notif.set('checklist_id', rec.id)
        notif.set(
          'message',
          'ALERT: Tarefa/Checklist atrasado - Procrastinação detectada: ' + rec.getString('title'),
        )
        notif.set('read', false)
        notif.set('type', 'deadline_alert')
        notif.set('company_id', rec.getString('company_id'))
        $app.save(notif)
      }
    }
  }
}, 'checklists')
