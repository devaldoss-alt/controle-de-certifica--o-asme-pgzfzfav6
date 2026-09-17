migrate(
  (app) => {
    if (app.hasTable('non_conformities')) {
      const col = app.findCollectionByNameOrId('non_conformities')

      // Helper to safely add fields if they don't exist
      const addFieldIfNotExists = (field) => {
        if (!col.fields.getByName(field.name)) {
          col.fields.add(field)
        }
      }

      // 1. Update 'severity' select field to official values: Leve | Médio | Grave | Gravíssimo
      // Normalizing any existing 'Crítico' to 'Gravíssimo' first via raw SQL
      try {
        app
          .db()
          .newQuery(
            "UPDATE non_conformities SET severity = 'Gravíssimo' WHERE severity = 'Crítico'",
          )
          .execute()
      } catch (_) {}

      const sevField = col.fields.getByName('severity')
      if (sevField) {
        sevField.values = ['Leve', 'Médio', 'Grave', 'Gravíssimo']
        sevField.maxSelect = 1
      }

      // 2. Update 'origin' select field if present, aligning with official FSGQ list:
      // R.O., R.C., Auditorias, Fornecedor, SMS, Análise Crítica
      const originField = col.fields.getByName('origin')
      if (originField) {
        originField.values = ['R.O.', 'R.C.', 'Auditorias', 'Fornecedor', 'SMS', 'Análise Crítica']
        originField.maxSelect = 1
      }

      // 3. Update 'action_type' select values: Ação Corretiva | Ação Preventiva | N/A
      const actionTypeField = col.fields.getByName('action_type')
      if (actionTypeField) {
        actionTypeField.values = ['Ação Corretiva', 'Ação Preventiva', 'N/A']
        actionTypeField.maxSelect = 1
      }

      // 4. Add the 3 official header Yes/No flags from FSGQ 8.7-2 (Rev.04)
      // "interfere no processo subsequente", "interfere no prazo de entrega", "solicitado pelo cliente"
      // Note: Never mark BoolField as required in PocketBase
      addFieldIfNotExists(new BoolField({ name: 'interferes_subsequent_process', required: false }))
      addFieldIfNotExists(new BoolField({ name: 'interferes_delivery_deadline', required: false }))
      addFieldIfNotExists(new BoolField({ name: 'requested_by_client', required: false }))

      // 5. Add reinspected bool flag for list/control ("Reinspecionado")
      addFieldIfNotExists(new BoolField({ name: 'is_reinspected', required: false }))

      // 6. Add actual completion date field if missing
      addFieldIfNotExists(new DateField({ name: 'completion_actual_date', required: false }))

      // 7. Save collection changes
      app.save(col)
    }
  },
  (app) => {
    // Revert logic
  },
)
