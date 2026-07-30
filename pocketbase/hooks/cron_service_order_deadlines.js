cronAdd('service_order_deadline_check', '0 8 * * *', () => {
  var now = new Date()
  var sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  var serviceOrders = []
  try {
    serviceOrders = $app.findRecordsByFilter(
      'service_orders',
      'status = "Active" && deadline != ""',
      'deadline',
      500,
      0,
    )
  } catch (_) {
    return
  }

  var notifCol = $app.findCollectionByNameOrId('notifications')

  for (var i = 0; i < serviceOrders.length; i++) {
    var so = serviceOrders[i]
    var deadlineStr = so.getString('deadline')
    if (!deadlineStr) continue

    var deadlineDate = new Date(deadlineStr)
    if (isNaN(deadlineDate.getTime())) continue
    if (deadlineDate < now || deadlineDate > sevenDaysLater) continue

    var responsibleUserId = ''

    var lastChecklists = []
    try {
      lastChecklists = $app.findRecordsByFilter(
        'checklists',
        'os_id = "' + so.id + '" && last_action_by != ""',
        '-updated',
        1,
        0,
      )
    } catch (_) {}

    if (lastChecklists.length > 0) {
      responsibleUserId = lastChecklists[0].getString('last_action_by')
    }

    if (!responsibleUserId) {
      var companyId = so.getString('owner_company_id')
      if (companyId) {
        var managers = []
        try {
          managers = $app.findRecordsByFilter(
            'users',
            'role = "Manager" && primary_company_id = "' + companyId + '"',
            'created',
            1,
            0,
          )
        } catch (_) {}
        if (managers.length > 0) {
          responsibleUserId = managers[0].id
        }
      }
    }

    if (!responsibleUserId) continue

    var osNumber = so.getString('number')
    var existingNotifs = []
    try {
      existingNotifs = $app.findRecordsByFilter(
        'notifications',
        'user_id = "' +
          responsibleUserId +
          '" && type = "deadline_alert" && message ~ "' +
          osNumber +
          '"',
        '-created',
        1,
        0,
      )
    } catch (_) {}

    if (existingNotifs.length > 0) continue

    var dateStr = deadlineStr.split(' ')[0].split('T')[0]
    var message = 'Prazo da OS ' + osNumber + ' se aproxima: ' + dateStr

    try {
      var notif = new Record(notifCol)
      notif.set('user_id', responsibleUserId)
      notif.set('type', 'deadline_alert')
      notif.set('message', message)
      notif.set('read', false)
      notif.set('company_id', so.getString('owner_company_id'))
      $app.save(notif)
    } catch (err) {
      $app.logger().error('Failed to create deadline alert', 'error', String(err))
    }
  }
})
