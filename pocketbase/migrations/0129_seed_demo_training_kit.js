// Migration 0129 — Seed 4 training DEMO checklists for PSC company
//
// Checklists required:
// 1) "DEMO — Inspeção de Solda", status: "pending", approval_status: "pending", prazo: +30 dias, role_assigned: ["Welder"]
// 2) "DEMO — Ensaio Visual de Solda", status: "pending", approval_status: "pending", prazo: +30 dias, role_assigned: ["Welder"]
// 3) "DEMO — Checklist Crítico", is_critical: true, status: "pending", approval_status: "pending", prazo: +30 dias, role_assigned: ["Welder"]
// 4) "DEMO — Checklist Expirado", prazo: -15 dias, status: "pending", approval_status: "pending", role_assigned: ["Welder"]
//
// Target company: PSC (company_id: "a631bv695rr4gef")

migrate(
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'

    // Verify company exists
    try {
      app.findCollectionByNameOrId('companies')
      var pscRecord = app.findFirstRecordByData('companies', 'id', PSC_ID)
      if (!pscRecord) {
        console.log('[0129] PSC company record not found by id, aborting.')
        return
      }
    } catch (e) {
      console.log('[0129] Error checking company: ' + e)
      return
    }

    var checkCol = app.findCollectionByNameOrId('checklists')

    var now = new Date()
    var plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    var minus15 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()

    var demoChecklists = [
      {
        title: 'DEMO — Inspeção de Solda',
        title_en: 'DEMO — Welding Inspection',
        description: 'Demonstração de inspeção de preparação, junta e passe de raiz de soldagem.',
        description_en:
          'Demo checklist for welding joint preparation, fit-up and root pass inspection.',
        mcq_ref: 'ASME Sec. IX / FSGQ 8.5',
        status: 'pending',
        approval_status: 'pending',
        is_critical: false,
        due_date: plus30,
        tutorial:
          '<h3>Passo a Passo da Demonstração</h3><p>1. Verifique a identificação do soldador e a EPS aplicável.</p><p>2. Inspecione o bisel e limpeza das faces de fusão.</p><p>3. Anexe evidência fotográfica ou assinale a conclusão.</p>',
      },
      {
        title: 'DEMO — Ensaio Visual de Solda',
        title_en: 'DEMO — Visual Welding Examination',
        description:
          'Demonstração de ensaio visual dimensional e superficial de cordão de solda acabado.',
        description_en:
          'Demo checklist for dimensional and visual inspection of completed weld bead.',
        mcq_ref: 'ASME Sec. V Art. 9',
        status: 'pending',
        approval_status: 'pending',
        is_critical: false,
        due_date: plus30,
        tutorial:
          '<h3>Passo a Passo da Demonstração</h3><p>1. Avalie a uniformidade do cordão, reforço de solda e transição com o metal base.</p><p>2. Certifique-se da ausência de trincas, mordeduras excessivas e porosidades superficiais.</p><p>3. Registre as notas de inspeção.</p>',
      },
      {
        title: 'DEMO — Checklist Crítico',
        title_en: 'DEMO — Critical Checklist',
        description:
          'Demonstração de checklist com etapa de retenção crítica obrigatória e liberação pelo CQ/GQ.',
        description_en:
          'Demo checklist with mandatory critical hold point requiring QC/QA release.',
        mcq_ref: 'ASME Sec. VIII Div. 1 UW-48',
        status: 'pending',
        approval_status: 'pending',
        is_critical: true,
        due_date: plus30,
        tutorial:
          '<h3>Ponto de Retenção Crítico</h3><p>1. Por ser item crítico, o envio exige anexo de evidência fotográfica ou documento comprobatório.</p><p>2. Ao submeter, o status de aprovação vai para pendente aguardando validação do Gestor da Qualidade.</p>',
      },
      {
        title: 'DEMO — Checklist Expirado',
        title_en: 'DEMO — Expired Checklist',
        description:
          'Demonstração de checklist com prazo vencido para simulação de alertas e tratamento de atraso.',
        description_en:
          'Demo checklist with overdue deadline for training on deadline alerts and backlog management.',
        mcq_ref: 'SGQ Cl. 8.5.1',
        status: 'pending',
        approval_status: 'pending',
        is_critical: false,
        due_date: minus15,
        tutorial:
          '<h3>Treinamento de Prazos Expirados</h3><p>1. Este checklist simula um item atrasado (-15 dias).</p><p>2. Observe o badge vermelho de expirado e a ordenação prioritária na fila.</p>',
      },
    ]

    for (var i = 0; i < demoChecklists.length; i++) {
      var item = demoChecklists[i]

      // Check if already exists
      var existing = null
      try {
        var rows = app.findRecordsByFilter(
          'checklists',
          "company_id = '" + PSC_ID + "' && title = '" + item.title.replace(/'/g, "''") + "'",
          'created',
          1,
          0,
        )
        if (rows.length > 0) existing = rows[0]
      } catch (_) {}

      var rec = existing || new Record(checkCol)
      rec.set('title', item.title)
      rec.set('title_en', item.title_en)
      rec.set('description', item.description)
      rec.set('description_en', item.description_en)
      rec.set('mcq_ref', item.mcq_ref)
      rec.set('role_assigned', ['Welder'])
      rec.set('company_id', PSC_ID)
      rec.set('category', 'Departmental')
      rec.set('status', item.status)
      rec.set('approval_status', item.approval_status)
      rec.set('is_critical', !!item.is_critical)
      rec.set('due_date', item.due_date)
      rec.set('tutorial', item.tutorial)
      rec.set('locked', false)
      rec.set('evidence_file', [])
      rec.set('evidence_notes', '')
      rec.set('rejection_comment', '')
      rec.set('approval_comment', '')
      rec.set('approved_by', null)
      rec.set('approved_at', null)
      rec.set('last_action_by', null)

      app.save(rec)
    }
  },
  (app) => {
    var PSC_ID = 'a631bv695rr4gef'
    var demoTitles = [
      'DEMO — Inspeção de Solda',
      'DEMO — Ensaio Visual de Solda',
      'DEMO — Checklist Crítico',
      'DEMO — Checklist Expirado',
    ]

    for (var i = 0; i < demoTitles.length; i++) {
      try {
        var rows = app.findRecordsByFilter(
          'checklists',
          "company_id = '" + PSC_ID + "' && title = '" + demoTitles[i].replace(/'/g, "''") + "'",
          'created',
          10,
          0,
        )
        for (var j = 0; j < rows.length; j++) {
          try {
            app.delete(rows[j])
          } catch (_) {}
        }
      } catch (_) {}
    }
  },
)
