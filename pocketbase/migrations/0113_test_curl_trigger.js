migrate(
  (app) => {
    const doc = app.findFirstRecordByData('documents', 'prefix', 'FSGQ')
    const col = app.findCollectionByNameOrId('document_reading_sessions')
    const rec = new Record(col)
    rec.set('document_id', doc.id)
    rec.set('started_at', '2026-09-17 12:00:00.000Z')
    rec.set('reader_name', 'TEST_BB_TRIGGER')
    app.save(rec)
  },
  (app) => {},
)
