// Migration 0068 — Seed TEST calendar events for PSC and Koala
// Creates checklists (due_date = today/tomorrow) and service orders (deadline = today/tomorrow)
// so the /calendar page shows events immediately. This is TEST data only.
//
// PSC company_id  = a631bv695rr4gef
// Koala company_id = i7kjauu378swxg6

migrate(
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'
    var KOALA_ID = 'i7kjauu378swxg6'

    // Resolve company ids defensively (in case ids differ in some env)
    try {
      var pscRec = app.findFirstRecordByData(
        'companies',
        'name',
        'PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA',
      )
      PSC_ID = pscRec.id
    } catch (_) {}
    try {
      var koalaRec = app.findFirstRecordByData(
        'companies',
        'name',
        'KOALA SYSTEM INDUSTRIA E COMERCIO LTDA',
      )
      KOALA_ID = koalaRec.id
    } catch (_) {}

    if (!PSC_ID || !KOALA_ID) {
      try {
        var companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
        for (var i = 0; i < companies.length; i++) {
          var cname = (companies[i].getString('name') || '').toLowerCase()
          var cnameEn = (companies[i].getString('name_en') || '').toLowerCase()
          if (!PSC_ID && (cname.indexOf('psc') !== -1 || cnameEn.indexOf('psc') !== -1)) {
            PSC_ID = companies[i].id
          }
          if (!KOALA_ID && (cname.indexOf('koala') !== -1 || cnameEn.indexOf('koala') !== -1)) {
            KOALA_ID = companies[i].id
          }
        }
      } catch (_) {}
    }

    // Compute today and tomorrow dates (YYYY-MM-DD)
    var now = new Date()
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0)
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    var todayStr = today.toISOString().split('T')[0]
    var tomorrowStr = tomorrow.toISOString().split('T')[0]

    var checkCol = app.findCollectionByNameOrId('checklists')
    var soCol = app.findCollectionByNameOrId('service_orders')

    // Helper: idempotent by a stable title/number
    function existsChecklist(companyId, title) {
      try {
        var found = app.findRecordsByFilter(
          'checklists',
          'company_id = "' + companyId + '" && title = {:title}',
          'created',
          1,
          0,
          { title: title },
        )
        return found.length > 0
      } catch (_) {
        return false
      }
    }

    function existsSO(number) {
      try {
        app.findFirstRecordByData('service_orders', 'number', number)
        return true
      } catch (_) {
        return false
      }
    }

    function makeChecklist(
      companyId,
      title,
      titleEn,
      role,
      mcqRef,
      dueDateStr,
      critical,
      category,
    ) {
      if (existsChecklist(companyId, title)) return false
      try {
        var rec = new Record(checkCol)
        rec.set('title', title)
        rec.set('title_en', titleEn || '')
        rec.set('description', 'Tarefa de TESTE para visualizacao no calendario')
        rec.set('description_en', 'TEST task for calendar preview')
        rec.set('role_assigned', role)
        rec.set('mcq_ref', mcqRef || '')
        rec.set('status', 'pending')
        rec.set('due_date', dueDateStr)
        rec.set('is_critical', !!critical)
        rec.set('category', category || 'Departmental')
        rec.set('approval_status', 'pending')
        rec.set('locked', false)
        rec.set('company_id', companyId)
        app.save(rec)
        return true
      } catch (e) {
        console.log('Migration 0068: error saving checklist "' + title + '": ' + e)
        return false
      }
    }

    function makeSO(companyId, number, client, equipment, standard, deadlineStr, status) {
      if (existsSO(number)) return false
      try {
        var rec = new Record(soCol)
        rec.set('number', number)
        rec.set('client', client)
        rec.set('equipment', equipment)
        rec.set('standard', standard)
        rec.set('deadline', deadlineStr)
        rec.set('status', status || 'Active')
        rec.set('owner_company_id', companyId)
        app.save(rec)
        return true
      } catch (e) {
        console.log('Migration 0068: error saving service order "' + number + '": ' + e)
        return false
      }
    }

    var seeded = 0

    // ===== PSC test data =====
    // Checklists (due today + tomorrow)
    if (PSC_ID) {
      if (
        makeChecklist(
          PSC_ID,
          '[TESTE] Inspecao de soldagem VP-001',
          '[TEST] Welding inspection VP-001',
          'Inspector',
          'ASME IX / Seção 6.2',
          todayStr,
          true,
          'OS',
        )
      )
        seeded++
      if (
        makeChecklist(
          PSC_ID,
          '[TESTE] Relatorio de END - Caldeira de Recuperacao',
          '[TEST] NDE report - Recovery Boiler',
          'NDE',
          'NBIC / Seção 9.4',
          tomorrowStr,
          false,
          'OS',
        )
      )
        seeded++
      if (
        makeChecklist(
          PSC_ID,
          '[TESTE] Auditoria interna ISO 9001 - Documentos',
          '[TEST] ISO 9001 internal audit - Documents',
          'QCC',
          'ISO 9001 Cl. 7.5',
          todayStr,
          true,
          'ISO 9001',
        )
      )
        seeded++

      // Service Orders (deadline today + tomorrow)
      if (
        makeSO(
          PSC_ID,
          'OS-TEST-001',
          'Petrobras S.A.',
          'Vaso de Pressao VP-001',
          'ASME Section VIII',
          todayStr,
          'Active',
        )
      )
        seeded++
      if (
        makeSO(
          PSC_ID,
          'OS-TEST-002',
          'Vale S.A.',
          'Caldeira de Recuperacao',
          'NBIC',
          tomorrowStr,
          'Active',
        )
      )
        seeded++
    }

    // ===== Koala test data =====
    if (KOALA_ID) {
      if (
        makeChecklist(
          KOALA_ID,
          '[TESTE] Inspecao de soldagem - Koala',
          '[TEST] Welding inspection - Koala',
          'Inspector',
          'ASME IX / Seção 6.2',
          todayStr,
          true,
          'OS',
        )
      )
        seeded++
      if (
        makeChecklist(
          KOALA_ID,
          '[TESTE] Relatorio de END - Koala',
          '[TEST] NDE report - Koala',
          'NDE',
          'NBIC / Seção 9.4',
          tomorrowStr,
          false,
          'OS',
        )
      )
        seeded++
      if (
        makeChecklist(
          KOALA_ID,
          '[TESTE] Auditoria interna ISO 9001 - Koala',
          '[TEST] ISO 9001 internal audit - Koala',
          'QCC',
          'ISO 9001 Cl. 7.5',
          todayStr,
          true,
          'ISO 9001',
        )
      )
        seeded++

      // Service Orders (deadline today + tomorrow)
      if (
        makeSO(
          KOALA_ID,
          'OS-TEST-101',
          'Braskem',
          'Torre de Destilacao',
          'ASME Section VIII',
          todayStr,
          'Active',
        )
      )
        seeded++
      if (
        makeSO(
          KOALA_ID,
          'OS-TEST-102',
          'Ultrapar',
          'Permutador de Calor',
          'NBIC',
          tomorrowStr,
          'Active',
        )
      )
        seeded++
    }

    console.log('Migration 0068: seeded ' + seeded + ' TEST calendar events (checklists + OS)')
  },
  (app) => {
    // No-op: test seed data, no safe revert
  },
)
