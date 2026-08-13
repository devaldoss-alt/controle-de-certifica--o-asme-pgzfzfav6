// Migration 0065 — multipurpose data fixup (no new collections):
//   1. Extend module_permissions.module select values to include all modules
//      the app exposes (Documentos, Checklists, Indicadores, Romaneios,
//      Ordens de Serviço, Agenda) — already-present values are preserved.
//   2. Seed module_permissions for Manager + QCC roles, for PSC and Koala,
//      covering the modules required by the app so the Koala company
//      (and PSC) actually see their modules.
//   3. Remove ASME/Departmental checklists linked to GENTI (GENTI has no
//      ASME certification) — they were mis-seeded. ~14 records.
//   4. Create IET + Lead Time indicators for the Koala company, mirroring
//      the PSC structure (migration 0063 only inserted them for PSC).
//   5. Backfill documents.next_review_date = effective_date + 2 years for
//      any Internal (Lista Mestra) document whose next_review_date is null
//      and that has an effective_date.
//   6. Re-apply the checklists RLS fix (already done in 0064) so the
//      company selector works. Kept here defensively.
migrate(
  (app) => {
    // ---- IDs ---------------------------------------------------------------
    var PSC_ID = ''
    var KOALA_ID = ''
    var GENTI_ID = ''
    try {
      var comps = app.findRecordsByFilter('companies', '1=1', 'name', 500, 0)
      for (var i = 0; i < comps.length; i++) {
        var n = (comps[i].getString('name') || '').toLowerCase()
        var ne = (comps[i].getString('name_en') || '').toLowerCase()
        if (n.indexOf('psc') >= 0 || ne.indexOf('psc') >= 0) PSC_ID = comps[i].id
        else if (n.indexOf('koala') >= 0 || ne.indexOf('koala') >= 0) KOALA_ID = comps[i].id
        else if (n.indexOf('genti') >= 0 || ne.indexOf('genti') >= 0) GENTI_ID = comps[i].id
      }
    } catch (e) {
      // fall back to known ids
    }
    if (!PSC_ID) PSC_ID = 'a631bv695rr4gef'
    if (!KOALA_ID) KOALA_ID = 'i7kjauu378swxg6'
    if (!GENTI_ID) GENTI_ID = 'zt57khfow39nwa1'

    // ---- 1. Extend module select values ------------------------------------
    try {
      var mpCol = app.findCollectionByNameOrId('module_permissions')
      var modField = mpCol.fields.getByName('module')
      if (modField) {
        var cur = modField.values || []
        var desired = [
          'Documentos',
          'Checklists',
          'Indicadores',
          'Romaneios',
          'Ordens de Serviço',
          'Agenda',
        ]
        var changed = false
        for (var k = 0; k < desired.length; k++) {
          if (cur.indexOf(desired[k]) < 0) {
            cur.push(desired[k])
            changed = true
          }
        }
        if (changed) {
          modField.values = cur
          modField.maxSelect = cur.length
          app.save(mpCol)
        }
      }
    } catch (e) {}

    // ---- 2. Seed module_permissions (Manager + QCC, PSC + Koala) -----------
    try {
      var mpCol2 = app.findCollectionByNameOrId('module_permissions')
      var modules = [
        'Documentos',
        'Checklists',
        'Indicadores',
        'Romaneios',
        'Ordens de Serviço',
        'Agenda',
      ]
      var roles = ['Manager', 'QCC']
      var companyIds = [PSC_ID, KOALA_ID]

      for (var ci = 0; ci < companyIds.length; ci++) {
        for (var ri = 0; ri < roles.length; ri++) {
          for (var mi = 0; mi < modules.length; mi++) {
            var role = roles[ri]
            var module = modules[mi]
            var compId = companyIds[ci]
            var exists = false
            try {
              var found = app.findRecordsByFilter(
                'module_permissions',
                "role = '" +
                  role +
                  "' && module = '" +
                  module +
                  "' && company_id = '" +
                  compId +
                  "'",
                '',
                1,
                0,
              )
              if (found && found.length > 0) exists = true
            } catch (e) {}
            if (exists) continue
            var rec = new Record(mpCol2)
            rec.set('role', role)
            rec.set('module', module)
            rec.set('can_view', true)
            rec.set('can_create', true)
            rec.set('can_edit', true)
            rec.set('can_delete', role === 'Manager')
            rec.set('company_id', compId)
            app.save(rec)
          }
        }
      }
    } catch (e) {}

    // ---- 3. Remove ASME/Departmental checklists from GENTI -----------------
    try {
      var gentiChks = app.findRecordsByFilter(
        'checklists',
        "company_id = '" + GENTI_ID + "' && category = 'Departmental'",
        '',
        500,
        0,
      )
      for (var g = 0; g < gentiChks.length; g++) {
        // Only delete the ASME Sec. VIII ones (title starts with "ASME").
        var title = gentiChks[g].getString('title') || ''
        if (title.indexOf('ASME') === 0) {
          app.delete(gentiChks[g])
        }
      }
    } catch (e) {}

    // ---- 4. Create Koala IET + Lead Time indicators ------------------------
    try {
      var indCol = app.findCollectionByNameOrId('indicators')
      var defUserId = 'uvq0hmn01q0faro'
      try {
        var au = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
        if (au) defUserId = au.id
      } catch (e) {}

      var koalaIndicators = [
        {
          title: 'IET - Eficiência no Cumprimento de Tarefas',
          objective:
            'Medir a porcentagem de tarefas e checklists concluídos rigorosamente dentro do prazo',
          formula_description: '(Tarefas Concluídas no Prazo ÷ Total de Tarefas Concluídas) × 100',
          target_value: 90,
          current_value: 94.2,
          unit: '%',
          period: 'Monthly',
          result_type: 'Percentual',
          verification_method: 'Cálculo dinâmico de checklists e O.S. finalizados sem atraso',
          target_operator: '≥',
        },
        {
          title: 'Lead Time - Tempo Médio de Conclusão',
          objective:
            'Acompanhar o tempo de ciclo médio desde a criação até a homologação da tarefa',
          formula_description: 'Soma de (Data de Conclusão - Data de Emissão) ÷ Total de Tarefas',
          target_value: 3,
          current_value: 2.1,
          unit: 'dias',
          period: 'Monthly',
          result_type: 'Numérico',
          verification_method: 'Medição de tempo do ciclo operacional de qualidade',
          target_operator: '≤',
        },
      ]

      for (var ii = 0; ii < koalaIndicators.length; ii++) {
        var item = koalaIndicators[ii]
        var already = false
        try {
          var koalaFound = app.findRecordsByFilter(
            'indicators',
            "title = '" + item.title + "' && company_id = '" + KOALA_ID + "'",
            '',
            1,
            0,
          )
          if (koalaFound && koalaFound.length > 0) already = true
        } catch (e) {}
        if (already) continue
        var irec = new Record(indCol)
        irec.set('title', item.title)
        irec.set('objective', item.objective)
        irec.set('formula_description', item.formula_description)
        irec.set('target_value', item.target_value)
        irec.set('current_value', item.current_value)
        irec.set('unit', item.unit)
        irec.set('period', item.period)
        irec.set('result_type', item.result_type)
        irec.set('verification_method', item.verification_method)
        irec.set('target_operator', item.target_operator)
        irec.set('responsible', defUserId)
        irec.set('company_id', KOALA_ID)
        app.save(irec)
      }
    } catch (e) {}

    // ---- 5. Backfill next_review_date for Internal documents ---------------
    // effective_date + 2 years, SQLite date arithmetic.
    try {
      app
        .db()
        .newQuery(
          "UPDATE documents SET next_review_date = date(effective_date, '+2 years') " +
            "WHERE category = 'Internal' AND next_review_date IS NULL " +
            "AND effective_date IS NOT NULL AND effective_date != ''",
        )
        .execute()
    } catch (e) {}

    // ---- 6. Re-apply checklists RLS fix (defensive, mirrors 0064) ----------
    try {
      var chkCol = app.findCollectionByNameOrId('checklists')
      var auth = "@request.auth.id != ''"
      var authWrite =
        "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"
      chkCol.listRule = auth
      chkCol.viewRule = auth
      chkCol.createRule = auth
      chkCol.updateRule = authWrite
      chkCol.deleteRule = authWrite
      app.save(chkCol)
    } catch (e) {}
  },
  (app) => {
    // Best-effort revert (not strictly required).
  },
)
