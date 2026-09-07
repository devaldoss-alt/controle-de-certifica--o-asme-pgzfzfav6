migrate(
  (app) => {
    const companiesCol = app.findCollectionByNameOrId('companies')

    // 1. Create training_plan_actions collection
    if (!app.hasTable('training_plan_actions')) {
      const actionsCollection = new Collection({
        name: 'training_plan_actions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'company_id',
            type: 'relation',
            required: true,
            collectionId: companiesCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'year', type: 'number', required: true, onlyInt: true },
          { name: 'action', type: 'text', required: true },
          {
            name: 'periodicity',
            type: 'select',
            required: true,
            values: ['Diária/DSS', 'Semanal', 'Mensal', 'Anual', 'Pontual'],
            maxSelect: 1,
          },
          { name: 'responsible', type: 'text', required: true },
          { name: 'target_audience', type: 'text', required: true },
          {
            name: 'origin',
            type: 'select',
            required: true,
            values: ['Interno', 'Externo'],
            maxSelect: 1,
          },
          {
            name: 'type',
            type: 'select',
            required: true,
            values: [
              'SMS',
              'Qualificação Pessoal-Sensibilização',
              'Procedimentos-Instruções-Formulários',
              'Outros',
            ],
            maxSelect: 1,
          },
          {
            name: 'competence_form',
            type: 'select',
            required: true,
            values: ['Treinamento', 'Educação', 'Experiência', 'Empresa Parceira'],
            maxSelect: 1,
          },
          { name: 'planned_date', type: 'date', required: true },
          { name: 'realized_date', type: 'date', required: false },
          { name: 'requires_effectiveness_eval', type: 'bool' },
          { name: 'ch_hours', type: 'number', required: false, min: 0 },
          { name: 'participants_count', type: 'number', required: false, min: 0, onlyInt: true },
          { name: 'ch_total', type: 'number', required: false, min: 0 },
          { name: 'effectiveness_due_date', type: 'date', required: false },
          {
            name: 'effectiveness_status',
            type: 'select',
            required: false,
            values: ['Não aplicável', 'Pendente', 'OK', 'Atrasado'],
            maxSelect: 1,
          },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_tpa_company ON training_plan_actions (company_id)',
          'CREATE INDEX idx_tpa_year ON training_plan_actions (year)',
          'CREATE INDEX idx_tpa_type ON training_plan_actions (type)',
          'CREATE INDEX idx_tpa_planned_date ON training_plan_actions (planned_date)',
        ],
      })
      app.save(actionsCollection)
    }

    // 2. Update module_permissions select field to include 'Treinamentos'
    try {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const modField = mpCol.fields.getByName('module')
      if (modField) {
        const cur = modField.values || []
        if (cur.indexOf('Treinamentos') < 0) {
          cur.push('Treinamentos')
          modField.values = cur
          modField.maxSelect = cur.length
          app.save(mpCol)
        }
      }
    } catch (e) {
      console.log('Error updating module_permissions field for Treinamentos:', e)
    }

    // 3. Seed default module_permissions for Treinamentos (Manager, QCC, Consultor, Supervisor, Apontador)
    try {
      const mpCol = app.findCollectionByNameOrId('module_permissions')
      const pscId = 'a631bv695rr4gef'
      const koalaId = 'i7kjauu378swxg6'
      const gentiId = 'zt57khfow39nwa1'
      const companiesList = [pscId, koalaId, gentiId]

      const rolesConfigs = [
        { role: 'Manager', can_view: true, can_create: true, can_edit: true, can_delete: true },
        { role: 'QCC', can_view: true, can_create: true, can_edit: true, can_delete: false },
        {
          role: 'Consultor',
          can_view: true,
          can_create: false,
          can_edit: false,
          can_delete: false,
        },
        { role: 'Apontador', can_view: true, can_create: true, can_edit: true, can_delete: false },
        { role: 'Supervisor', can_view: true, can_create: true, can_edit: true, can_delete: false },
      ]

      for (let c = 0; c < companiesList.length; c++) {
        const cId = companiesList[c]
        for (let r = 0; r < rolesConfigs.length; r++) {
          const cfg = rolesConfigs[r]
          let exists = false
          try {
            const found = app.findRecordsByFilter(
              'module_permissions',
              "role = '" + cfg.role + "' && module = 'Treinamentos' && company_id = '" + cId + "'",
              '',
              1,
              0,
            )
            if (found && found.length > 0) exists = true
          } catch (_) {}

          if (!exists) {
            const rec = new Record(mpCol)
            rec.set('role', cfg.role)
            rec.set('module', 'Treinamentos')
            rec.set('can_view', cfg.can_view)
            rec.set('can_create', cfg.can_create)
            rec.set('can_edit', cfg.can_edit)
            rec.set('can_delete', cfg.can_delete)
            rec.set('company_id', cId)
            app.save(rec)
          }
        }
      }
    } catch (e) {
      console.log('Error seeding Treinamentos module_permissions:', e)
    }

    // 4. Seed demo realistic actions for 2026 (PSC, KS, GENTI)
    try {
      const actionsCol = app.findCollectionByNameOrId('training_plan_actions')
      const count = app.countRecords('training_plan_actions')

      if (count === 0) {
        const pscId = 'a631bv695rr4gef'
        const koalaId = 'i7kjauu378swxg6'
        const gentiId = 'zt57khfow39nwa1'

        const samples = [
          // 1. PSC - Realizado no prazo (OK)
          {
            company_id: pscId,
            year: 2026,
            action: 'INTEGRAÇÃO DE SMS PARA NOVOS COLABORADORES E CONTRATADOS',
            periodicity: 'Mensal',
            responsible: 'Fabiana',
            target_audience: 'Novos Colaboradores',
            origin: 'Interno',
            type: 'SMS',
            competence_form: 'Treinamento',
            planned_date: '2026-01-15 00:00:00.000Z',
            realized_date: '2026-01-14 00:00:00.000Z',
            requires_effectiveness_eval: true,
            ch_hours: 4,
            participants_count: 8,
            ch_total: 32,
            effectiveness_due_date: '2026-03-15 00:00:00.000Z',
            effectiveness_status: 'OK',
            notes: 'Integração admissional obrigatória conforme NR-01.',
          },
          // 2. PSC - Realizado no prazo (OK) com avaliação pendente
          {
            company_id: pscId,
            year: 2026,
            action: 'QUALIFICAÇÃO EM PROCEDIMENTO DE SOLDAGEM ASME IX (EPS / RQPS)',
            periodicity: 'Pontual',
            responsible: 'Devaldo',
            target_audience: 'Soldadores e Operadores de Soldagem',
            origin: 'Interno',
            type: 'Qualificação Pessoal-Sensibilização',
            competence_form: 'Treinamento',
            planned_date: '2026-02-10 00:00:00.000Z',
            realized_date: '2026-02-08 00:00:00.000Z',
            requires_effectiveness_eval: true,
            ch_hours: 8,
            participants_count: 5,
            ch_total: 40,
            effectiveness_due_date: '2026-04-09 00:00:00.000Z',
            effectiveness_status: 'Pendente',
            notes: 'Avaliação de eficácia será feita via ensaio radiográfico dos cupons.',
          },
          // 3. PSC - Realizado atrasado (Atrasado)
          {
            company_id: pscId,
            year: 2026,
            action: 'TRATATIVA DA RNC 015-26 - CALIBRAÇÃO DE INSTRUMENTOS',
            periodicity: 'Pontual',
            responsible: 'Roberta',
            target_audience: 'CQ e Inspetores',
            origin: 'Interno',
            type: 'Procedimentos-Instruções-Formulários',
            competence_form: 'Treinamento',
            planned_date: '2026-01-20 00:00:00.000Z',
            realized_date: '2026-01-28 00:00:00.000Z',
            requires_effectiveness_eval: true,
            ch_hours: 2,
            participants_count: 4,
            ch_total: 8,
            effectiveness_due_date: '2026-03-29 00:00:00.000Z',
            effectiveness_status: 'Pendente',
            notes: 'Ação corretiva decorrente da RNC interna de calibração.',
          },
          // 4. PSC - Não realizado e prazo vencido (Atrasado)
          {
            company_id: pscId,
            year: 2026,
            action: 'NR-35 TRABALHO EM ALTURA - RECICLAGEM BIENAL',
            periodicity: 'Anual',
            responsible: 'SENAC',
            target_audience: 'Produção e Manutenção',
            origin: 'Externo',
            type: 'SMS',
            competence_form: 'Empresa Parceira',
            planned_date: '2026-02-01 00:00:00.000Z',
            realized_date: null,
            requires_effectiveness_eval: true,
            ch_hours: 8,
            participants_count: 12,
            ch_total: 96,
            effectiveness_due_date: null,
            effectiveness_status: 'Pendente',
            notes: 'Aguardando reagendamento da turma pelo fornecedor externo.',
          },
          // 5. PSC - Pendente futuro (Em aberto)
          {
            company_id: pscId,
            year: 2026,
            action: 'INSPEÇÃO VISUAL E DIMENSIONAL DE SOLDA SEGUNDO ASME VIII DIV.1',
            periodicity: 'Pontual',
            responsible: 'Geraldo',
            target_audience: 'CQ',
            origin: 'Interno',
            type: 'Procedimentos-Instruções-Formulários',
            competence_form: 'Treinamento',
            planned_date: '2026-04-15 00:00:00.000Z',
            realized_date: null,
            requires_effectiveness_eval: true,
            ch_hours: 6,
            participants_count: 3,
            ch_total: 18,
            effectiveness_due_date: null,
            effectiveness_status: 'Pendente',
            notes: 'Treinamento prático de amostragem na fabricação de vasos de pressão.',
          },
          // 6. PSC - Pendente futuro sem necessidade de avaliação de eficácia
          {
            company_id: pscId,
            year: 2026,
            action: 'DIÁLOGO DIÁRIO DE SEGURANÇA (DSS) - CAMPANHA DE PREVENÇÃO DE QUEDAS',
            periodicity: 'Diária/DSS',
            responsible: 'Fabiana',
            target_audience: 'TODOS',
            origin: 'Interno',
            type: 'SMS',
            competence_form: 'Educação',
            planned_date: '2026-05-02 00:00:00.000Z',
            realized_date: null,
            requires_effectiveness_eval: false,
            ch_hours: 0.5,
            participants_count: 25,
            ch_total: 12.5,
            effectiveness_due_date: null,
            effectiveness_status: 'Não aplicável',
            notes: 'Sensibilização geral de segurança operacional.',
          },
          // 7. PSC - Procedimento Operacional
          {
            company_id: pscId,
            year: 2026,
            action: 'CONTROLE DE DOCUMENTOS E REGISTROS DA QUALIDADE ISO 9001 (LISTA MESTRA)',
            periodicity: 'Anual',
            responsible: 'Danilo Ext.',
            target_audience: 'Liderança',
            origin: 'Externo',
            type: 'Procedimentos-Instruções-Formulários',
            competence_form: 'Treinamento',
            planned_date: '2026-06-10 00:00:00.000Z',
            realized_date: null,
            requires_effectiveness_eval: true,
            ch_hours: 4,
            participants_count: 6,
            ch_total: 24,
            effectiveness_due_date: null,
            effectiveness_status: 'Pendente',
            notes: 'Revisão das sistemáticas de aprovação e obsolescência de documentos.',
          },
          // 8. PSC - Sensibilização e Cultura
          {
            company_id: pscId,
            year: 2026,
            action: 'SENSIBILIZAÇÃO PARA AUDITORIA ASME E ESTAMPA U',
            periodicity: 'Pontual',
            responsible: 'Devaldo',
            target_audience: 'TODOS',
            origin: 'Interno',
            type: 'Qualificação Pessoal-Sensibilização',
            competence_form: 'Educação',
            planned_date: '2026-07-05 00:00:00.000Z',
            realized_date: null,
            requires_effectiveness_eval: false,
            ch_hours: 2,
            participants_count: 30,
            ch_total: 60,
            effectiveness_due_date: null,
            effectiveness_status: 'Não aplicável',
            notes: 'Preparação do time para a renovação da certificação ASME.',
          },
          // 9. PSC - Outros / Almoxarifado
          {
            company_id: pscId,
            year: 2026,
            action: 'BOAS PRÁTICAS DE RECEBIMENTO, ARMAZENAMENTO E RASTREABILIDADE DE MATERIAIS',
            periodicity: 'Semanal',
            responsible: 'Roberta',
            target_audience: 'Almoxarifado',
            origin: 'Interno',
            type: 'Outros',
            competence_form: 'Experiência',
            planned_date: '2026-03-20 00:00:00.000Z',
            realized_date: null,
            requires_effectiveness_eval: true,
            ch_hours: 3,
            participants_count: 4,
            ch_total: 12,
            effectiveness_due_date: null,
            effectiveness_status: 'Pendente',
            notes: 'Treinamento focado no novo módulo de Almoxarifado e CQ de entrada.',
          },
          // 10. PSC - NR-10 Segurança em Instalações e Serviços em Eletricidade
          {
            company_id: pscId,
            year: 2026,
            action: 'NR-10 SEGURANÇA EM INSTALAÇÕES E SERVIÇOS EM ELETRICIDADE',
            periodicity: 'Anual',
            responsible: 'SENAC',
            target_audience: 'Manutenção',
            origin: 'Externo',
            type: 'SMS',
            competence_form: 'Empresa Parceira',
            planned_date: '2026-08-18 00:00:00.000Z',
            realized_date: null,
            requires_effectiveness_eval: true,
            ch_hours: 40,
            participants_count: 2,
            ch_total: 80,
            effectiveness_due_date: null,
            effectiveness_status: 'Pendente',
            notes: 'Curso obrigatório presencial de 40 horas.',
          },
          // 11. KOALA SYSTEM (KS) - Específico
          {
            company_id: koalaId,
            year: 2026,
            action: 'OPERAÇÃO SEGURA E MANUTENÇÃO PREVENTIVA DE PONTES ROLANTES',
            periodicity: 'Anual',
            responsible: 'Danilo Ext.',
            target_audience: 'Operadores de Ponte e PCP',
            origin: 'Externo',
            type: 'SMS',
            competence_form: 'Treinamento',
            planned_date: '2026-03-12 00:00:00.000Z',
            realized_date: '2026-03-10 00:00:00.000Z',
            requires_effectiveness_eval: true,
            ch_hours: 16,
            participants_count: 6,
            ch_total: 96,
            effectiveness_due_date: '2026-05-09 00:00:00.000Z',
            effectiveness_status: 'OK',
            notes: 'Específico das instalações operacionais da Koala System.',
          },
          // 12. GENTI - Específico
          {
            company_id: gentiId,
            year: 2026,
            action: 'LGPD E GOVERNANÇA DE DADOS EM SERVIÇOS EMPRESARIAIS',
            periodicity: 'Anual',
            responsible: 'Geraldo',
            target_audience: 'Administrativo e RH',
            origin: 'Interno',
            type: 'Qualificação Pessoal-Sensibilização',
            competence_form: 'Treinamento',
            planned_date: '2026-04-10 00:00:00.000Z',
            realized_date: null,
            requires_effectiveness_eval: true,
            ch_hours: 4,
            participants_count: 5,
            ch_total: 20,
            effectiveness_due_date: null,
            effectiveness_status: 'Pendente',
            notes: 'Treinamento de conformidade LGPD para os serviços da Genti.',
          },
        ]

        for (let s = 0; s < samples.length; s++) {
          const sample = samples[s]
          const rec = new Record(actionsCol)
          Object.keys(sample).forEach((k) => {
            if (sample[k] !== undefined && sample[k] !== null) {
              rec.set(k, sample[k])
            }
          })
          app.save(rec)
        }
      }
    } catch (e) {
      console.log('Error seeding sample training actions:', e)
    }
  },
  (app) => {
    if (app.hasTable('training_plan_actions')) {
      app.delete(app.findCollectionByNameOrId('training_plan_actions'))
    }
  },
)
