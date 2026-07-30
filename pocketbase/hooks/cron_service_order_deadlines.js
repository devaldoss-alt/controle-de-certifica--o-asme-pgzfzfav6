cronAdd('service_order_deadlines', '0 7 * * *', () => {
  var orders = []
  try {
    orders = $app.findRecordsByFilter(
      'service_orders',
      "status = 'Active' && deadline != ''",
      'created',
      500,
      0,
    )
  } catch (e) {
    $app.logger().error('cron_service_order_deadlines: failed to fetch orders', 'error', String(e))
    return
  }

  var now = new Date()
  var nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  var targetOffsets = [21, 14, 7]

  for (var i = 0; i < orders.length; i++) {
    var order = orders[i]
    var deadlineStr = order.getString('deadline')
    if (!deadlineStr) continue

    var deadlineParts = deadlineStr.split('-')
    if (deadlineParts.length < 3) continue
    var deadlineUtc = Date.UTC(
      parseInt(deadlineParts[0], 10),
      parseInt(deadlineParts[1], 10) - 1,
      parseInt(deadlineParts[2], 10),
    )
    var diffDays = Math.round((deadlineUtc - nowUtc) / (1000 * 60 * 60 * 24))

    var targetOffset = 0
    for (var d = 0; d < targetOffsets.length; d++) {
      if (diffDays === targetOffsets[d]) {
        targetOffset = targetOffsets[d]
        break
      }
    }
    if (targetOffset === 0) continue

    var soId = order.id
    var companyId = order.getString('owner_company_id')
    var soNumber = order.getString('number')

    var managers = []
    try {
      managers = $app.findRecordsByFilter(
        'users',
        "primary_company_id = '" + companyId + "' && role = 'Manager'",
        'created',
        50,
        0,
      )
    } catch (e) {
      $app.logger().error('cron: failed to find managers', 'soId', soId, 'error', String(e))
      continue
    }

    if (managers.length === 0) continue

    var notifCol = $app.findCollectionByNameOrId('notifications')

    for (var j = 0; j < managers.length; j++) {
      var manager = managers[j]

      try {
        $app.findFirstRecordByFilter(
          'notifications',
          "service_order_id = '" +
            soId +
            "' && day_offset = " +
            targetOffset +
            " && user_id = '" +
            manager.id +
            "'",
        )
        continue
      } catch (_) {}

      try {
        var notif = new Record(notifCol)
        notif.set('user_id', manager.id)
        notif.set('type', 'deadline_alert')
        notif.set(
          'message',
          'Prazo se aproximando: OS ' + soNumber + ' vence em ' + targetOffset + ' dias',
        )
        notif.set('read', false)
        notif.set('company_id', companyId)
        notif.set('service_order_id', soId)
        notif.set('day_offset', targetOffset)
        $app.save(notif)
      } catch (e) {
        $app.logger().error('cron: failed to create notification', 'soId', soId, 'error', String(e))
      }
    }
  }
})
