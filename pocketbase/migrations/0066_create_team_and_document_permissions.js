// Migration 0066 — new collections for the Team module and the per-person
// document access matrix used in /access-control (Documentos tab).
//
// `team`: directory of collaborators (no real people seeded by code).
// `document_permissions`: per-person access to a Lista Mestra sector,
//   columns Visualizar / Editar (used by the AccessControl "Documentos" tab).
migrate(
  (app) => {
    var companiesColId = app.findCollectionByNameOrId('companies').id

    // ---- team --------------------------------------------------------------
    if (!app.hasTable('team')) {
      var teamCol = new Collection({
        name: 'team',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule:
          "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'QCC' || @request.auth.role = 'Consultor')",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'QCC' || @request.auth.role = 'Consultor')",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'Manager'",
        fields: [
          { name: 'name', type: 'text', required: true },
          {
            name: 'company_id',
            type: 'relation',
            collectionId: companiesColId,
            maxSelect: 1,
          },
          { name: 'department', type: 'text' },
          { name: 'role', type: 'text' },
          { name: 'is_indicator', type: 'bool' },
          { name: 'linked_operators', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_team_company_id ON team (company_id)',
          'CREATE INDEX idx_team_department ON team (department)',
        ],
      })
      app.save(teamCol)
    }

    // ---- document_permissions ---------------------------------------------
    // Built only after `team` exists so the relation resolves.
    if (!app.hasTable('document_permissions')) {
      var teamColId = app.findCollectionByNameOrId('team').id
      var dpCol = new Collection({
        name: 'document_permissions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule:
          "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'QCC' || @request.auth.role = 'Consultor')",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'QCC' || @request.auth.role = 'Consultor')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'Manager' || @request.auth.role = 'QCC')",
        fields: [
          {
            name: 'team_id',
            type: 'relation',
            collectionId: teamColId,
            maxSelect: 1,
            required: true,
          },
          {
            name: 'company_id',
            type: 'relation',
            collectionId: companiesColId,
            maxSelect: 1,
          },
          { name: 'sector', type: 'text', required: true },
          { name: 'can_view', type: 'bool' },
          { name: 'can_edit', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_doc_perms_team ON document_permissions (team_id)',
          'CREATE INDEX idx_doc_perms_sector ON document_permissions (sector)',
        ],
      })
      app.save(dpCol)
    }
  },
  (app) => {
    if (app.hasTable('document_permissions')) {
      app.delete(app.findCollectionByNameOrId('document_permissions'))
    }
    if (app.hasTable('team')) {
      app.delete(app.findCollectionByNameOrId('team'))
    }
  },
)
