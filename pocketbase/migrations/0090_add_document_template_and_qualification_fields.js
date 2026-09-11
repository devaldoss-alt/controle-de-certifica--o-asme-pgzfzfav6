migrate(
  (app) => {
    const documents = app.findCollectionByNameOrId('documents')

    // Aumenta o tamanho máximo de content e content_en para suportar procedimentos completos
    const contentField = documents.fields.getByName('content')
    if (contentField) {
      contentField.max = 500000
    }
    const contentEnField = documents.fields.getByName('content_en')
    if (contentEnField) {
      contentEnField.max = 500000
    }

    if (!documents.fields.getByName('template_family')) {
      documents.fields.add(
        new SelectField({
          name: 'template_family',
          values: ['SGQ — Português (PSGQ/FSGQ/ITSGQ)', 'Técnico/CQ — Bilíngue (CDE)'],
          maxSelect: 1,
        }),
      )
    }

    if (!documents.fields.getByName('inspector_qualification')) {
      documents.fields.add(
        new TextField({
          name: 'inspector_qualification',
        }),
      )
    }

    if (!documents.fields.getByName('prepared_by')) {
      documents.fields.add(
        new TextField({
          name: 'prepared_by',
        }),
      )
    }

    if (!documents.fields.getByName('approved_by')) {
      documents.fields.add(
        new TextField({
          name: 'approved_by',
        }),
      )
    }

    if (!documents.fields.getByName('verified_by')) {
      documents.fields.add(
        new TextField({
          name: 'verified_by',
        }),
      )
    }

    if (!documents.fields.getByName('revision_history')) {
      documents.fields.add(
        new JSONField({
          name: 'revision_history',
        }),
      )
    }

    app.save(documents)
  },
  (app) => {
    const documents = app.findCollectionByNameOrId('documents')
    const toRemove = [
      'template_family',
      'inspector_qualification',
      'prepared_by',
      'approved_by',
      'verified_by',
      'revision_history',
    ]
    for (const field of toRemove) {
      const f = documents.fields.getByName(field)
      if (f) documents.fields.removeByName(field)
    }
    app.save(documents)
  },
)
