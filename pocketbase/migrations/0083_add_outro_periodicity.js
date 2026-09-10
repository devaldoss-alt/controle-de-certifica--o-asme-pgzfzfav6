migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('training_plan_actions')
    const field = col.fields.getByName('periodicity')
    if (field) {
      // Keep existing select values and allow Outro
      const existing = field.values || []
      if (!existing.includes('Outro')) {
        field.values = [...existing, 'Outro']
        app.save(col)
      }
    }
  },
  (app) => {
    // Revert
    try {
      const col = app.findCollectionByNameOrId('training_plan_actions')
      const field = col.fields.getByName('periodicity')
      if (field) {
        field.values = (field.values || []).filter((v) => v !== 'Outro')
        app.save(col)
      }
    } catch (_) {}
  },
)
