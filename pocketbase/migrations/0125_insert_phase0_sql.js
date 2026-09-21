migrate(
  (app) => {
    // Insert phase 0 items directly via raw SQL
    app
      .db()
      .newQuery(`
      INSERT INTO implementation_checklist (
        id, item_key, phase_id, phase_title, title, how_to, expected_result, attention_alert, is_highlight, order_index, done, done_by, notes, failure_registered, failure_description, created, updated
      ) VALUES
      (
        'p0item000000001', '0.1', 0, 'FASE 0 — Preparação (½ dia)', 'Acessos da equipe',
        'Cada membro da GQ faz login com o e-mail corporativo', 'Todos entram sem erro.',
        '', 0, 1, 0, '', '', 0, '', datetime('now'), datetime('now')
      ),
      (
        'p0item000000002', '0.2', 0, 'FASE 0 — Preparação (½ dia)', 'Verificar permissões',
        'Cada um abre todos os menus', 'Cada papel vê só o que deve (GQ vê tudo; operador vê o básico).',
        '', 0, 2, 0, '', '', 0, '', datetime('now'), datetime('now')
      ),
      (
        'p0item000000003', '0.3', 0, 'FASE 0 — Preparação (½ dia)', 'Cadastrar/validar empresas',
        'Conferir PSC, Koala System e GenTi', '3 empresas ativas.',
        '', 0, 3, 0, '', '', 0, '', datetime('now'), datetime('now')
      ),
      (
        'p0item000000004', '0.4', 0, 'FASE 0 — Preparação (½ dia)', 'Revisar cadastro de colaboradores',
        'Cargos, áreas e vínculos com usuários', 'Ninguém "órfão" (colaborador sem usuário).',
        '', 0, 4, 0, '', '', 0, '', datetime('now'), datetime('now')
      )
    `)
      .execute()
  },
  (app) => {
    app
      .db()
      .newQuery(
        "DELETE FROM implementation_checklist WHERE item_key IN ('0.1', '0.2', '0.3', '0.4')",
      )
      .execute()
  },
)
