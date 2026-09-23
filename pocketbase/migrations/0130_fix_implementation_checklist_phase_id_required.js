migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('implementation_checklist')
    // Relax required constraint on fields that can have value 0 or empty in updates
    const phaseField = col.fields.getByName('phase_id')
    if (phaseField) {
      phaseField.required = false
    }
    const itemKeyField = col.fields.getByName('item_key')
    if (itemKeyField) {
      itemKeyField.required = false
    }
    const phaseTitleField = col.fields.getByName('phase_title')
    if (phaseTitleField) {
      phaseTitleField.required = false
    }
    const titleField = col.fields.getByName('title')
    if (titleField) {
      titleField.required = false
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('implementation_checklist')
    const phaseField = col.fields.getByName('phase_id')
    if (phaseField) {
      phaseField.required = true
    }
    app.save(col)
  },
)
