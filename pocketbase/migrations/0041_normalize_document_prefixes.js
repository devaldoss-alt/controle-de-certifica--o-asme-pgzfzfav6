migrate(
  (app) => {
    var KNOWN_PREFIXES = [
      'ASME PSC',
      'CDE-PS',
      'CQS-PSC',
      'EVS-PSC',
      'FSGQ',
      'ISSGQ',
      'IT-CQ',
      'ITSGQ',
      'LP-KS',
      'MCQ',
      'MSGQ',
      'PR-CQ',
      'PSGQ',
    ]

    var companies = []
    try {
      companies = app.findRecordsByFilter('companies', "id != ''", 'name', 200, 0)
    } catch (_) {}

    var targetCompanyIds = []
    for (var i = 0; i < companies.length; i++) {
      var name = (companies[i].getString('name') || '').toLowerCase()
      var nameEn = (companies[i].getString('name_en') || '').toLowerCase()
      if (
        name.indexOf('koala') !== -1 ||
        nameEn.indexOf('koala') !== -1 ||
        name.indexOf('psc') !== -1 ||
        nameEn.indexOf('psc') !== -1
      ) {
        targetCompanyIds.push(companies[i].id)
      }
    }

    if (targetCompanyIds.length === 0) {
      console.log('Migration 0041: No target companies found, skipping')
      return
    }

    var TITLE_PREFIX_MAP = [
      { keywords: ['organograma', 'organogram', 'organizational chart'], prefix: 'FSGQ' },
      { keywords: ['formulario', 'formulário', 'form ', 'formul'], prefix: 'FSGQ' },
      { keywords: ['manual do sgq', 'manual da qualidade', 'qms manual'], prefix: 'MSGQ' },
      { keywords: ['manual do controle', 'qc manual'], prefix: 'MCQ' },
      {
        keywords: ['procedimento do sgq', 'qms procedure', 'procedimento sgq'],
        prefix: 'PSGQ',
      },
      {
        keywords: ['procedimento do controle', 'qc procedure', 'procedimento de qualidade'],
        prefix: 'PR-CQ',
      },
      { keywords: ['instrucao do sgq', 'qms instruction', 'instrução sgq'], prefix: 'ITSGQ' },
      {
        keywords: ['instrucao de seguranca', 'safety instruction', 'instrução de segurança'],
        prefix: 'ISSGQ',
      },
      {
        keywords: ['instrucao do controle', 'qc instruction', 'instrução de controle'],
        prefix: 'IT-CQ',
      },
      {
        keywords: [
          'certificado de qualificacao',
          'welder qualification',
          'qualificação de soldador',
        ],
        prefix: 'CQS-PSC',
      },
      {
        keywords: ['ensaio visual', 'visual testing', 'inspeção visual', 'inspecao visual'],
        prefix: 'EVS-PSC',
      },
      {
        keywords: ['liquido penetrante', 'dye penetrant', 'líquido penetrante', 'penetrante'],
        prefix: 'LP-KS',
      },
      {
        keywords: ['controle dimensional', 'dimensional control', 'dimensional'],
        prefix: 'CDE-PS',
      },
      { keywords: ['asme'], prefix: 'ASME PSC' },
    ]

    function isInKnownPrefixes(prefix) {
      for (var i = 0; i < KNOWN_PREFIXES.length; i++) {
        if (prefix === KNOWN_PREFIXES[i]) return true
      }
      return false
    }

    function matchPrefixFromCode(code) {
      if (!code) return ''
      var upperCode = code.toUpperCase()
      for (var i = 0; i < KNOWN_PREFIXES.length; i++) {
        if (upperCode.indexOf(KNOWN_PREFIXES[i]) === 0) {
          return KNOWN_PREFIXES[i]
        }
      }
      var codeMatch = code.match(/^[A-Za-z][A-Za-z\-]*/)
      if (codeMatch) {
        var codePrefix = codeMatch[0].toUpperCase()
        for (var j = 0; j < KNOWN_PREFIXES.length; j++) {
          if (
            KNOWN_PREFIXES[j].indexOf(codePrefix) === 0 ||
            codePrefix.indexOf(KNOWN_PREFIXES[j]) === 0
          ) {
            return KNOWN_PREFIXES[j]
          }
        }
      }
      return ''
    }

    function matchPrefixFromTitle(title, titleEn) {
      var searchText = ((title || '') + ' ' + (titleEn || '')).toLowerCase()
      for (var i = 0; i < TITLE_PREFIX_MAP.length; i++) {
        var mapping = TITLE_PREFIX_MAP[i]
        for (var k = 0; k < mapping.keywords.length; k++) {
          if (searchText.indexOf(mapping.keywords[k]) !== -1) {
            return mapping.prefix
          }
        }
      }
      return ''
    }

    var updated = 0

    for (var c = 0; c < targetCompanyIds.length; c++) {
      var companyId = targetCompanyIds[c]
      var docs = []
      try {
        docs = app.findRecordsByFilter(
          'documents',
          "company_id = '" + companyId + "'",
          'created',
          2000,
          0,
        )
      } catch (_) {
        continue
      }

      for (var d = 0; d < docs.length; d++) {
        var doc = docs[d]
        var currentPrefix = doc.getString('prefix') || ''
        var needsUpdate = false
        var newPrefix = ''

        if (!currentPrefix || !isInKnownPrefixes(currentPrefix)) {
          var code = doc.getString('code') || ''
          newPrefix = matchPrefixFromCode(code)

          if (!newPrefix) {
            var title = doc.getString('title') || ''
            var titleEn = doc.getString('title_en') || ''
            newPrefix = matchPrefixFromTitle(title, titleEn)
          }

          if (newPrefix && newPrefix !== currentPrefix) {
            needsUpdate = true
          }
        }

        if (needsUpdate && newPrefix) {
          doc.set('prefix', newPrefix)
          try {
            app.save(doc)
            updated++
          } catch (err) {
            console.log('Migration 0041: error saving doc ' + doc.id + ': ' + err)
          }
        }
      }
    }

    console.log('Migration 0041: normalized ' + updated + ' document prefixes')
  },
  (app) => {
    // No-op: data corrections cannot be safely reverted
  },
)
