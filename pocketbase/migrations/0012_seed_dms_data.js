migrate(
  (app) => {
    var allPfx = ['PSGQ', 'MN-AD', 'PR-CQ', 'PR-EN', 'IT-CQ', 'IT-EN', 'RG-CQ', 'RG-EN']
    var matrix = {
      Manager: { v: allPfx, e: allPfx },
      Director: { v: allPfx, e: allPfx },
      QCC: { v: allPfx, e: ['PSGQ', 'PR-CQ', 'IT-CQ', 'RG-CQ'] },
      Inspector: { v: ['PSGQ', 'PR-CQ', 'IT-CQ', 'RG-CQ'], e: ['IT-CQ', 'RG-CQ'] },
      AI: { v: ['PSGQ', 'PR-CQ', 'IT-CQ', 'RG-CQ'], e: [] },
      Engineer: { v: ['PSGQ', 'PR-EN', 'IT-EN', 'RG-EN'], e: ['PR-EN', 'IT-EN', 'RG-EN'] },
      CertifyingEngineer: { v: ['PSGQ', 'PR-EN', 'IT-EN', 'RG-EN', 'PR-CQ'], e: [] },
      Designer: { v: ['PSGQ', 'PR-EN', 'IT-EN', 'RG-EN'], e: ['PR-EN', 'IT-EN', 'RG-EN'] },
      Welder: { v: ['IT-CQ', 'RG-CQ'], e: [] },
      NDE: { v: ['IT-CQ', 'PR-CQ', 'RG-CQ'], e: ['RG-CQ'] },
    }

    var daCol = app.findCollectionByNameOrId('document_access')
    for (var role in matrix) {
      for (var i = 0; i < allPfx.length; i++) {
        var pfx = allPfx[i]
        var existing = []
        try {
          existing = app.findRecordsByFilter(
            'document_access',
            'role = "' + role + '" && document_prefix = "' + pfx + '"',
            '',
            1,
            0,
          )
        } catch (_) {}
        if (existing.length === 0) {
          var rec = new Record(daCol)
          rec.set('role', role)
          rec.set('document_prefix', pfx)
          rec.set('can_view', matrix[role].v.indexOf(pfx) >= 0)
          rec.set('can_edit', matrix[role].e.indexOf(pfx) >= 0)
          app.save(rec)
        }
      }
    }

    var companyId = ''
    try {
      companyId = app.findFirstRecordByData('companies', 'name', 'PSC Industria').id
    } catch (_) {}

    var docUpdates = {
      'Procedimento de Soldagem ASME Section IX': {
        prefix: 'PR-CQ',
        prefix_en: 'Quality Procedures',
        code: 'PR-CQ-001',
        revision: '03',
      },
      'Manual da Qualidade ISO 9001:2015': {
        prefix: 'MN-AD',
        prefix_en: 'Manuals',
        code: 'MN-AD-001',
        revision: '05',
      },
    }
    var docs = app.findRecordsByFilter('documents', "id != ''", 'created', 200, 0)
    for (var j = 0; j < docs.length; j++) {
      var d = docs[j]
      var u = docUpdates[d.getString('title')]
      if (u && !d.getString('code')) {
        d.set('prefix', u.prefix)
        d.set('prefix_en', u.prefix_en)
        d.set('code', u.code)
        d.set('revision', u.revision)
        app.save(d)
      }
    }

    var docCol = app.findCollectionByNameOrId('documents')
    var newDocs = [
      {
        t: 'Procedimento do Sistema de Gestao da Qualidade',
        te: 'Quality Management System Procedure',
        p: 'PSGQ',
        pe: 'QMS Procedures',
        c: 'PSGQ-001',
        r: '04',
        cat: 'ISO',
        ct: '<h1>PSGQ-001</h1><p>Procedimento geral do SGQ conforme ISO 9001:2015.</p>',
      },
      {
        t: 'Instrucao de Trabalho - Inspecao de Soldagem',
        te: 'Work Instruction - Welding Inspection',
        p: 'IT-CQ',
        pe: 'Work Instructions - QC',
        c: 'IT-CQ-001',
        r: '02',
        cat: 'ASME',
        ct: '<h1>IT-CQ-001</h1><p>Instrucao para inspecao de soldagem conforme WPS.</p>',
      },
      {
        t: 'Instrucao de Trabalho - Controle de Documentos',
        te: 'Work Instruction - Document Control',
        p: 'IT-CQ',
        pe: 'Work Instructions - QC',
        c: 'IT-CQ-002',
        r: '01',
        cat: 'ISO',
        ct: '<h1>IT-CQ-002</h1><p>Controle de documentos do SGQ.</p>',
      },
      {
        t: 'Registro de Inspecao de Material',
        te: 'Material Inspection Record',
        p: 'RG-CQ',
        pe: 'Quality Records',
        c: 'RG-CQ-001',
        r: '01',
        cat: 'ASME',
        ct: '<h1>RG-CQ-001</h1><p>Formulario de registro de inspecao de material.</p>',
      },
      {
        t: 'Procedimento de Calculo de Vasos de Pressao',
        te: 'Pressure Vessel Calculation Procedure',
        p: 'PR-EN',
        pe: 'Engineering Procedures',
        c: 'PR-EN-001',
        r: '03',
        cat: 'ASME',
        ct: '<h1>PR-EN-001</h1><p>Calculo de vasos conforme ASME VIII.</p>',
      },
      {
        t: 'Instrucao de Trabalho - Elaboracao de Desenhos',
        te: 'Work Instruction - Drawing Preparation',
        p: 'IT-EN',
        pe: 'Work Instructions - ENG',
        c: 'IT-EN-001',
        r: '01',
        cat: 'ASME',
        ct: '<h1>IT-EN-001</h1><p>Elaboracao de desenhos de fabricacao.</p>',
      },
    ]
    for (var k = 0; k < newDocs.length; k++) {
      var nd = newDocs[k]
      try {
        app.findFirstRecordByData('documents', 'code', nd.c)
      } catch (_) {
        var dr = new Record(docCol)
        dr.set('title', nd.t)
        dr.set('title_en', nd.te)
        dr.set('content', nd.ct)
        dr.set('category', nd.cat)
        dr.set('prefix', nd.p)
        dr.set('prefix_en', nd.pe)
        dr.set('code', nd.c)
        dr.set('revision', nd.r)
        if (companyId) dr.set('company_id', companyId)
        app.save(dr)
      }
    }
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('document_access'))
    } catch (_) {}
  },
)
