migrate(
  (app) => {
    function normalizeDocPrefix(prefix) {
      var upper = (prefix || '').trim().toUpperCase()
      if (!upper) return ''
      var normalized = upper.replace(/[\s_]+/g, '-')
      if (normalized === 'ASME-PSC') return 'ASME PSC'
      var fixes = {
        'CDE-PS': 'CDE',
        CDEPS: 'CDE',
        'CDE-PSC': 'CDE',
        'CQS-PS': 'CQS',
        CQSPS: 'CQS',
        'CQS-PSC': 'CQS',
        'EVS-PS': 'EVS',
        EVSPS: 'EVS',
        'EVS-PSC': 'EVS',
        'LP-KS': 'LP',
        LPKS: 'LP',
        'LP-KS ': 'LP',
      }
      if (fixes[normalized]) return fixes[normalized]
      if (normalized.endsWith('-PSC')) return normalized.slice(0, -4)
      if (normalized.endsWith('-KS')) return normalized.slice(0, -3)
      return upper
    }

    function extractCodeFromTitle(title) {
      if (!title) return ''
      var trimmed = title.trim()
      var match = trimmed.match(/^[^\d]+?\s+(\d+(?:\.\d+)*)/)
      if (match) return match[1]
      match = trimmed.match(/^(\d+(?:\.\d+)*)/)
      if (match) return match[1]
      match = trimmed.match(/\b(\d+\.\d+(?:\.\d+)*)\b/)
      if (match) return match[1]
      return ''
    }

    var docs = []
    try {
      docs = app.findRecordsByFilter('documents', "id != ''", 'created', 5000, 0)
    } catch (_) {
      console.log('Migration 0045: no documents found')
      return
    }

    var codeBackfilled = 0
    var prefixNormalized = 0

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]
      var needsUpdate = false

      var currentPrefix = doc.getString('prefix') || ''
      var newPrefix = normalizeDocPrefix(currentPrefix)
      if (newPrefix && newPrefix !== currentPrefix) {
        doc.set('prefix', newPrefix)
        needsUpdate = true
        prefixNormalized++
      }

      var currentCode = doc.getString('code') || ''
      if (!currentCode) {
        var title = doc.getString('title') || ''
        var titleEn = doc.getString('title_en') || ''
        var extractedCode = extractCodeFromTitle(title)
        if (!extractedCode && titleEn) {
          extractedCode = extractCodeFromTitle(titleEn)
        }
        if (extractedCode) {
          doc.set('code', extractedCode)
          needsUpdate = true
          codeBackfilled++
        }
      }

      if (needsUpdate) {
        try {
          app.save(doc)
        } catch (err) {
          console.log('Migration 0045: error saving doc ' + doc.id + ': ' + err)
        }
      }
    }

    console.log(
      'Migration 0045: backfilled ' +
        codeBackfilled +
        ' codes, normalized ' +
        prefixNormalized +
        ' prefixes',
    )

    var PREFIXES = ['CDE', 'EVS', 'CQS', 'MCQ', 'LP']
    var ROLES = [
      'Director',
      'QCC',
      'Inspector',
      'AI',
      'Designer',
      'Engineer',
      'CertifyingEngineer',
      'Welder',
      'NDE',
      'Apontador',
      'Manager',
    ]

    var accessCol = app.findCollectionByNameOrId('document_access')

    var existingAccess = []
    try {
      existingAccess = app.findRecordsByFilter('document_access', "id != ''", 'role', 1000, 0)
    } catch (_) {}

    var existingSet = {}
    for (var e = 0; e < existingAccess.length; e++) {
      var acc = existingAccess[e]
      var accPrefix = normalizeDocPrefix(acc.getString('document_prefix') || '')
      var accRole = acc.getString('role') || ''
      existingSet[accPrefix + '|' + accRole] = true
    }

    var accessAdded = 0
    for (var p = 0; p < PREFIXES.length; p++) {
      var prefix = PREFIXES[p]
      for (var r = 0; r < ROLES.length; r++) {
        var role = ROLES[r]
        if (existingSet[prefix + '|' + role]) continue

        var record = new Record(accessCol)
        record.set('document_prefix', prefix)
        record.set('role', role)
        record.set('can_view', true)
        record.set('can_edit', role === 'QCC' || role === 'Manager' || role === 'Director')
        try {
          app.save(record)
          accessAdded++
        } catch (err) {
          console.log('Migration 0045: error saving access for ' + prefix + '/' + role + ': ' + err)
        }
      }
    }

    console.log('Migration 0045: added ' + accessAdded + ' document_access records')
  },
  (app) => {
    // No-op: data corrections cannot be safely reverted
  },
)
