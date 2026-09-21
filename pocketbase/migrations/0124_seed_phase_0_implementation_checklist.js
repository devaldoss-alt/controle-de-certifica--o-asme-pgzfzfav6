migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('implementation_checklist')
    const phase0Items = [
      {
        item_key: '0.1',
        phase_id: 0,
        phase_title: 'FASE 0 — Preparação (½ dia)',
        title: 'Acessos da equipe',
        how_to: 'Cada membro da GQ faz login com o e-mail corporativo',
        expected_result: 'Todos entram sem erro.',
        attention_alert: '',
        is_highlight: false,
        order_index: 1,
      },
      {
        item_key: '0.2',
        phase_id: 0,
        phase_title: 'FASE 0 — Preparação (½ dia)',
        title: 'Verificar permissões',
        how_to: 'Cada um abre todos os menus',
        expected_result: 'Cada papel vê só o que deve (GQ vê tudo; operador vê o básico).',
        attention_alert: '',
        is_highlight: false,
        order_index: 2,
      },
      {
        item_key: '0.3',
        phase_id: 0,
        phase_title: 'FASE 0 — Preparação (½ dia)',
        title: 'Cadastrar/validar empresas',
        how_to: 'Conferir PSC, Koala System e GenTi',
        expected_result: '3 empresas ativas.',
        attention_alert: '',
        is_highlight: false,
        order_index: 3,
      },
      {
        item_key: '0.4',
        phase_id: 0,
        phase_title: 'FASE 0 — Preparação (½ dia)',
        title: 'Revisar cadastro de colaboradores',
        how_to: 'Cargos, áreas e vínculos com usuários',
        expected_result: 'Ninguém "órfão" (colaborador sem usuário).',
        attention_alert: '',
        is_highlight: false,
        order_index: 4,
      },
    ]

    for (let i = 0; i < phase0Items.length; i++) {
      const item = phase0Items[i]
      try {
        const existing = app.findRecordsByFilter(
          'implementation_checklist',
          `item_key = '${item.item_key}'`,
          '',
          1,
          0,
        )
        if (existing.length === 0) {
          const record = new Record(col)
          record.set('item_key', item.item_key)
          record.set('phase_id', item.phase_id)
          record.set('phase_title', item.phase_title)
          record.set('title', item.title)
          record.set('how_to', item.how_to)
          record.set('expected_result', item.expected_result)
          record.set('attention_alert', item.attention_alert)
          record.set('is_highlight', item.is_highlight)
          record.set('order_index', item.order_index)
          record.set('done', false)
          record.set('done_by', '')
          record.set('notes', '')
          record.set('failure_registered', false)
          record.set('failure_description', '')
          app.save(record)
        }
      } catch (err) {
        console.log('Error seeding phase 0 item: ' + err)
      }
    }
  },
  (app) => {
    // down
    const items = ['0.1', '0.2', '0.3', '0.4']
    for (let i = 0; i < items.length; i++) {
      try {
        const records = app.findRecordsByFilter(
          'implementation_checklist',
          `item_key = '${items[i]}'`,
          '',
          1,
          0,
        )
        if (records.length > 0) {
          app.delete(records[0])
        }
      } catch (_) {}
    }
  },
)
