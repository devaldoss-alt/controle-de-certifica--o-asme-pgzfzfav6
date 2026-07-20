migrate(
  (app) => {
    var checklistTranslations = {
      'Assinei a Declaração de Política e Autoridade do MCQ?':
        'Did I sign the Quality Policy and Authority Statement of the QCM?',
      'O SCQ está implementado e mantido ativamente?':
        'Is the QMS implemented and actively maintained?',
      'Recursos suficientes foram alocados para manutenção da certificação ASME/NBIC?':
        'Were sufficient resources allocated for ASME/NBIC certification maintenance?',
      'Revisões gerenciais do sistema de qualidade são conduzidas periodicamente?':
        'Are management reviews of the quality system conducted periodically?',
      'A autoridade para interromper trabalhos não conformes foi claramente delegada?':
        'Was the authority to stop non-conforming work clearly delegated?',
      'As responsabilidades de cada função estão documentadas e comunicadas?':
        'Are responsibilities for each role documented and communicated?',
      'O Manual de Controle de Qualidade está atualizado e aprovado?':
        'Is the Quality Control Manual updated and approved?',
      'Revisões obsoletas do MCQ foram retiradas de circulação?':
        'Were obsolete QCM revisions removed from circulation?',
      'Cálculos de projeto foram revisados e aprovados?':
        'Were design calculations reviewed and approved?',
      'Auditorias internas são conduzidas conforme calendário estabelecido?':
        'Are internal audits conducted according to the established schedule?',
      'Registros de qualidade estão organizados e acessíveis?':
        'Are quality records organized and accessible?',
      'ITPs foram distribuídos aos responsáveis?':
        'Have ITPs been distributed to those responsible?',
      'Pontos de espera (Hold Points) estão coordenados com o AI?':
        'Are Hold Points coordinated with the AI?',
      'Não-conformidades identificadas foram registradas e tratadas?':
        'Were identified non-conformities recorded and addressed?',
      'O Plano de Inspeção e Teste (ITP) foi preparado?':
        'Was the Inspection and Test Plan (ITP) prepared?',
      'Inspeções realizadas estão documentadas?': 'Are completed inspections documented?',
      'Conformidade com WPS foi verificada durante a inspeção?':
        'Was WPS compliance verified during inspection?',
      'Materiais recebidos foram inspecionados e aceitos/rejeitados?':
        'Were received materials inspected and accepted/rejected?',
      'Testes foram presenciados e documentados?': 'Were tests witnessed and documented?',
      'Hold Points foram solicitados ao AI com antecedência?':
        'Were Hold Points requested from the AI in advance?',
      'Registros de inspeção estão completos e assinados?':
        'Are inspection records complete and signed?',
      'Verificação independente de conformidade foi executada?':
        'Was independent compliance verification performed?',
      'Hold Points foram testemunhados e documentados no ITP?':
        'Were Hold Points witnessed and documented in the ITP?',
      'MDeR foi revisado para certificação?': 'Was MDeR reviewed for certification?',
      'Qualificações de soldadores foram verificadas?': 'Were welder qualifications verified?',
      'Não-conformidades identificadas foram reportadas ao QCC?':
        'Were identified non-conformities reported to QCC?',
      'Conformidade com código ASME foi confirmada?': 'Was ASME code compliance confirmed?',
      'Cálculos de projeto (Div 1) foram preparados?': 'Were design calculations (Div 1) prepared?',
      'Materiais foram selecionados conforme ASME Section II?':
        'Were materials selected per ASME Section II?',
      'Registros de projeto estão mantidos e atualizados?':
        'Are design records maintained and updated?',
      'Aprovação de projeto dentro do escopo foi obtida?': 'Was in-scope design approval obtained?',
      'Desenhos de fabricação estão disponíveis e aprovados?':
        'Are fabrication drawings available and approved?',
      'Especificações de soldagem foram preparadas?': 'Were welding specifications prepared?',
      'Cálculos de engenharia (Div 2) foram preparados?':
        'Were engineering calculations (Div 2) prepared?',
      'MDeR (Manufacturer Design Report) foi preparado?':
        'Was MDeR (Manufacturer Design Report) prepared?',
      'Conformidade de projeto foi verificada?': 'Was design compliance verified?',
      'Análise de tensões foi documentada?': 'Was stress analysis documented?',
      'Revisão de engenharia foi concluída e aprovada?':
        'Was engineering review completed and approved?',
      'MDeR foi submetido ao Engenheiro Certificador?':
        'Was MDeR submitted to the Certifying Engineer?',
      'MDeR foi revisado e certificado?': 'Was MDeR reviewed and certified?',
      'Toda documentação de projeto foi revisada?': 'Was all design documentation reviewed?',
      'Certificação final de conformidade foi emitida?':
        'Was final certification of compliance issued?',
      'Interpretação de código ASME foi aplicada corretamente?':
        'Was ASME code interpretation applied correctly?',
      'MDeR foi assinado e arquivado?': 'Was MDeR signed and archived?',
      'A WPS aplicável está disponível e foi lida antes de soldar?':
        'Is the applicable WPS available and read before welding?',
      'Execução de soldagem está conforme WPS aprovado?': 'Is welding execution per approved WPS?',
      'Registro de continuidade de qualificação está atualizado?':
        'Is qualification continuity record updated?',
      'Soldas executadas foram documentadas?': 'Were executed welds documented?',
      'Trabalho não conforme foi rejeitado e reportado?':
        'Was non-conforming work rejected and reported?',
      'Equipamentos de soldagem estão calibrados?': 'Are welding equipment calibrated?',
      'Preparação de juntas está conforme procedimento?': 'Is joint preparation per procedure?',
      'Relatórios de END foram emitidos e documentados?': 'Were NDE reports issued and documented?',
      'Equipamentos de END estão calibrados?': 'Are NDE equipment calibrated?',
      'Procedimentos de END estão aprovados e disponíveis?':
        'Are NDE procedures approved and available?',
      'Pessoal de END está qualificado conforme ASNT?': 'Is NDE personnel qualified per ASNT?',
      'Resultados de END foram avaliados (aceitar/rejeitar)?':
        'Were NDE results evaluated (accept/reject)?',
      'Relatórios de END foram entregues ao Inspetor?':
        'Were NDE reports delivered to the Inspector?',
      'Inspecao de soldagem VP-001 conforme WPS': 'Welding inspection VP-001 per WPS',
      'Relatorio de END - Caldeira de Recuperacao': 'NDE Report - Recovery Boiler',
      'Auditoria interna ISO 9001 - Controle de documentos':
        'Internal audit ISO 9001 - Document control',
      'Revisao do Sistema de Gestao da Qualidade': 'Quality Management System Review',
      'Controle de registros da qualidade ISO 9001': 'ISO 9001 Quality records control',
    }

    var checklists = app.findRecordsByFilter('checklists', "id != ''", 'created', 500, 0)
    for (var i = 0; i < checklists.length; i++) {
      var cl = checklists[i]
      var ptTitle = cl.getString('title')
      var enTitle = checklistTranslations[ptTitle]
      if (enTitle && !cl.getString('title_en')) {
        cl.set('title_en', enTitle)
        app.save(cl)
      }
    }

    var documentTranslations = {
      'Procedimento de Soldagem ASME Section IX': {
        title: 'ASME Section IX Welding Procedure',
        content:
          '<h1>Welding Procedure</h1><p>This document describes welding procedures per ASME Section IX.</p><h2>Scope</h2><p>Applicable to all welding performed on pressure vessels.</p>',
      },
      'Manual da Qualidade ISO 9001:2015': {
        title: 'ISO 9001:2015 Quality Manual',
        content:
          '<h1>Quality Manual</h1><p>Quality Management System per ABNT NBR ISO 9001:2015.</p><h2>Scope</h2><p>This manual describes the QMS of PSC Industry.</p>',
      },
    }

    var docs = app.findRecordsByFilter('documents', "id != ''", 'created', 500, 0)
    for (var j = 0; j < docs.length; j++) {
      var d = docs[j]
      var ptDocTitle = d.getString('title')
      var enDoc = documentTranslations[ptDocTitle]
      if (enDoc) {
        var changed = false
        if (!d.getString('title_en')) {
          d.set('title_en', enDoc.title)
          changed = true
        }
        if (!d.getString('content_en')) {
          d.set('content_en', enDoc.content)
          changed = true
        }
        if (changed) app.save(d)
      }
    }

    var companyTranslations = {
      'PSC Industria': 'PSC Industry',
      'KOALA Engenharia': 'KOALA Engineering',
      'GENTI Servicos': 'GENTI Services',
    }

    var companies = app.findRecordsByFilter('companies', "id != ''", 'created', 500, 0)
    for (var k = 0; k < companies.length; k++) {
      var c = companies[k]
      var ptCompName = c.getString('name')
      var enCompName = companyTranslations[ptCompName]
      if (enCompName && !c.getString('name_en')) {
        c.set('name_en', enCompName)
        app.save(c)
      }
    }

    var equipmentTranslations = {
      'Vaso de Pressao VP-001': 'Pressure Vessel VP-001',
      'Caldeira de Recuperacao': 'Recovery Boiler',
      'Torre de Destilacao': 'Distillation Tower',
    }

    var orders = app.findRecordsByFilter('service_orders', "id != ''", 'created', 500, 0)
    for (var m = 0; m < orders.length; m++) {
      var so = orders[m]
      var ptEquip = so.getString('equipment')
      var enEquip = equipmentTranslations[ptEquip]
      if (enEquip && !so.getString('equipment_en')) {
        so.set('equipment_en', enEquip)
        app.save(so)
      }
    }
  },
  (app) => {
    var checklists = app.findRecordsByFilter('checklists', "id != ''", 'created', 500, 0)
    for (var i = 0; i < checklists.length; i++) {
      checklists[i].set('title_en', '')
      checklists[i].set('description_en', '')
      app.save(checklists[i])
    }
    var docs = app.findRecordsByFilter('documents', "id != ''", 'created', 500, 0)
    for (var j = 0; j < docs.length; j++) {
      docs[j].set('title_en', '')
      docs[j].set('content_en', '')
      app.save(docs[j])
    }
    var companies = app.findRecordsByFilter('companies', "id != ''", 'created', 500, 0)
    for (var k = 0; k < companies.length; k++) {
      companies[k].set('name_en', '')
      app.save(companies[k])
    }
    var orders = app.findRecordsByFilter('service_orders', "id != ''", 'created', 500, 0)
    for (var m = 0; m < orders.length; m++) {
      orders[m].set('equipment_en', '')
      app.save(orders[m])
    }
  },
)
