// Migration 0076 — Seed mock checklists and notifications for customer demo.

migrate(
  (app) => {
    var checkCol = app.findCollectionByNameOrId('checklists')
    var apontadorRows = app.findRecordsByFilter('users', "email = 'apontador@psc.com'", 'created', 1, 0)
    var apontadorId = apontadorRows[0].id

    var recA = new Record(checkCol)
    recA.set('company_id', 'a631bv695rr4gef')
    recA.set('title', 'Teste Checklist A')
    recA.set('role_assigned', 'Welder')
    recA.set('category', 'Departmental')
    recA.set('status', 'completed')
    recA.set('approval_status', 'approved')
    recA.set('due_date', '2026-08-19 14:00:00.000Z')
    recA.set('apontador_id', apontadorId)
    app.save(recA)
    var idA = recA.id

    var notifCol = app.findCollectionByNameOrId('notifications')
    var notif = new Record(notifCol)
    notif.set('user_id', apontadorId)
    notif.set('checklist_id', idA)
    notif.set('message', 'Teste Checklist A notif')
    notif.set('type', 'approved')
    notif.set('read', false)
    notif.set('company_id', 'a631bv695rr4gef')
    app.save(notif)

    throw new Error('SUCCESS_AFTER_SAVE_NOTIF_' + notif.id)
  },
  (app) => {}
)
