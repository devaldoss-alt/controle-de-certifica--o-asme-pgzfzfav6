migrate(
  (app) => {
    const suppliersCol = app.findCollectionByNameOrId('suppliers')
    const quotesCol = app.findCollectionByNameOrId('purchase_quotes')
    const ncCol = app.findCollectionByNameOrId('non_conformities')
    const indCol = app.findCollectionByNameOrId('indicators')

    const PSC_ID = 'a631bv695rr4gef'
    const KOALA_ID = 'i7kjauu378swxg6'
    const GENTI_ID = 'zt57khfow39nwa1'
    const compIds = [PSC_ID, KOALA_ID, GENTI_ID]

    let defaultUserId = 'uvq0hmn01q0faro'
    try {
      const u = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
      defaultUserId = u.id
    } catch (_) {}

    // 1. Seed Indicators for Onda E2 across PSC, KOALA, GENTI
    const suppliesIndicators = [
      {
        title: '% Fornecedores Críticos Qualificados',
        objective:
          'Assegurar que os insumos e serviços críticos venham de fornecedores qualificados',
        formula_description:
          '(Fornecedores críticos qualificados ÷ Total fornecedores críticos) × 100',
        target_value: 100,
        current_value: 75,
        unit: '%',
        period: 'Monthly',
        result_type: 'Percentual',
        verification_method: 'Lista de Fornecedores Qualificados (FSGQ 8.4-4)',
        target_operator: '≥',
      },
      {
        title: '% Cotações com Mínimo 3 Fornecedores',
        objective: 'Garantir competitividade e cumprimento do PSGQ 8.4 item 5.5',
        formula_description: '(Cotações com ≥ 3 fornecedores ÷ Total cotações finalizadas) × 100',
        target_value: 90,
        current_value: 100,
        unit: '%',
        period: 'Monthly',
        result_type: 'Percentual',
        verification_method: 'Resumos de Coleta de Preço (FSGQ 8.4-7)',
        target_operator: '≥',
      },
      {
        title: 'Índice de Atrasos na Entrega (Suprimentos)',
        objective: 'Monitorar a pontualidade na entrega de suprimentos e serviços',
        formula_description: '(Pedidos entregues com atraso ÷ Total de pedidos entregues) × 100',
        target_value: 10,
        current_value: 0,
        unit: '%',
        period: 'Monthly',
        result_type: 'Percentual',
        verification_method: 'Acompanhamento de Ordens de Compra (FSGQ 8.4-6)',
        target_operator: '<',
      },
    ]

    compIds.forEach((cId) => {
      suppliesIndicators.forEach((ind) => {
        let exists = false
        try {
          const found = app.findRecordsByFilter(
            'indicators',
            'company_id = {:companyId} && title = {:title}',
            'created',
            1,
            0,
            { companyId: cId, title: ind.title },
          )
          if (found && found.length > 0) exists = true
        } catch (_) {}

        if (!exists) {
          const rec = new Record(indCol)
          rec.set('title', ind.title)
          rec.set('objective', ind.objective)
          rec.set('formula_description', ind.formula_description)
          rec.set('target_value', ind.target_value)
          rec.set('current_value', ind.current_value)
          rec.set('unit', ind.unit)
          rec.set('period', ind.period)
          rec.set('result_type', ind.result_type)
          rec.set('verification_method', ind.verification_method)
          rec.set('target_operator', ind.target_operator)
          rec.set('responsible', defaultUserId)
          rec.set('company_id', cId)
          app.save(rec)
        }
      })
    })

    // 2. Realistic Suppliers for PSC (and copied/available for testing)
    // - Gerdau Aços Especiais: Crítico, Qualificado por ISO 9001 válida
    // - TermoVal Tratamentos Térmicos: Crítico, Qualificado por Certificados RBC/CQ
    // - CorrosãoZero Pinturas e Revestimentos: Crítico, Em avaliação (INCF estourado na RNC)
    // - FastLog Transportes Especiais: Não Crítico, Qualificado por Dispensa / Não Crítico
    // - SoldaTec Consumíveis e Serviços: Crítico, Em requalificação (vencendo reavaliação 2 anos)
    // - InspecLab Ensaios Não Destrutivos: Crítico, Qualificado por Questionário FSGQ 8.4-2 nota 8.5
    const sampleSuppliers = [
      {
        name: 'Gerdau Aços Longos S.A.',
        trade_name: 'Gerdau Aços Especiais',
        cnpj: '00.419.007/0001-30',
        contact_person: 'Marcos Vinicius',
        phone: '(11) 3094-6600',
        email: 'atendimento.acos@gerdau.com.br',
        address: 'Av. das Nações Unidas, 8501 - São Paulo/SP',
        classification: 'Crítico',
        critical_categories: ['Aços e materiais de aportar', 'Componentes críticos de engenharia'],
        materials_services_description:
          'Chapas SA-516 Gr 70, barras redondas, consumíveis de aportar.',
        qualification_status: 'Qualificado',
        qualification_criteria: ['ISO 9001 válida'],
        iso9001_certified: true,
        iso9001_cert_number: 'BR038921-2024',
        iso9001_valid_until: '2027-05-30 00:00:00.000Z',
        technical_certificates_info:
          'Certificado de Sistema de Gestão da Qualidade emitido por Bureau Veritas.',
        evaluation_score: 9.5,
        last_evaluation_date: '2025-05-10 00:00:00.000Z',
        next_reevaluation_date: '2027-05-10 00:00:00.000Z',
        reevaluation_exempt: true,
        reevaluation_exempt_reason: 'Dispensado — certificado ISO 9001 válido até 30/05/2027',
        qualification_notes:
          'Qualificação automática via ISO 9001 conforme item 5.3 a do PSGQ 8.4.',
      },
      {
        name: 'TermoVal Tratamentos Térmicos Industriais Ltda',
        trade_name: 'TermoVal Fornos',
        cnpj: '14.892.341/0001-88',
        contact_person: 'Engª Camila Prado',
        phone: '(19) 3455-8810',
        email: 'tecnico@termoval.com.br',
        address: 'Distrito Industrial II - Piracicaba/SP',
        classification: 'Crítico',
        critical_categories: ['Tratamentos térmicos'],
        materials_services_description:
          'Alívio de tensões térmicas pós-soldagem (PWHT), normalização e têmpera.',
        qualification_status: 'Qualificado',
        qualification_criteria: ['Certificados do serviço/material (RBC/ASME)'],
        iso9001_certified: false,
        technical_certificates_info:
          'Fornos calibrados RBC com gráfico termopar registrador e atendimento a ASME Sec VIII Div 1.',
        evaluation_score: 8.8,
        last_evaluation_date: '2025-02-15 00:00:00.000Z',
        next_reevaluation_date: '2027-02-15 00:00:00.000Z',
        reevaluation_exempt: false,
        qualification_notes:
          'Qualificado por comprovação de calibração rastreável RBC e qualificação de procedimento.',
      },
      {
        name: 'CorrosãoZero Revestimentos e Pintura Especial Ltda',
        trade_name: 'CorrosãoZero',
        cnpj: '28.301.992/0001-44',
        contact_person: 'Felipe Antunes',
        phone: '(12) 3941-2033',
        email: 'comercial@corrosaozero.com.br',
        address: 'Rodovia Presidente Dutra km 142 - SJC/SP',
        classification: 'Crítico',
        critical_categories: ['Tintas e revestimentos especiais', 'Revestimentos e banhos'],
        materials_services_description:
          'Aplicação de primer epóxi rico em zinco e acabamento poliuretano.',
        qualification_status: 'Em avaliação',
        qualification_criteria: ['Questionário FSGQ 8.4-2 (Nota ≥ 6,0)'],
        iso9001_certified: false,
        evaluation_score: 5.5,
        last_evaluation_date: '2026-01-20 00:00:00.000Z',
        next_reevaluation_date: '2026-07-20 00:00:00.000Z',
        reevaluation_exempt: false,
        disqualification_reason: '',
        qualification_notes:
          'Score inicial 5,5 (abaixo de 6,0) e índice INCF reincidente. Sob notificação formal.',
      },
      {
        name: 'FastLog Transportes Rodoviários Ltda',
        trade_name: 'FastLog Express',
        cnpj: '03.771.829/0001-02',
        contact_person: 'Renata Lins',
        phone: '(11) 4123-9000',
        email: 'operacoes@fastlog.com.br',
        address: 'Rua do Cargas, 450 - Guarulhos/SP',
        classification: 'Não Crítico',
        critical_categories: ['Outros materiais e serviços gerais'],
        materials_services_description: 'Frete e transporte de insumos gerais não acabados.',
        qualification_status: 'Qualificado',
        qualification_criteria: ['Dispensa / Não Crítico'],
        iso9001_certified: false,
        evaluation_score: 8.0,
        last_evaluation_date: '2025-08-01 00:00:00.000Z',
        next_reevaluation_date: '2027-08-01 00:00:00.000Z',
        reevaluation_exempt: false,
        qualification_notes:
          'Fornecedor não crítico conforme item 5.1 do PSGQ 8.4 (dispensa de avaliação profunda).',
      },
      {
        name: 'InspecLab Ensaios e Calibrações Ltda',
        trade_name: 'InspecLab Metrologia',
        cnpj: '19.448.112/0001-55',
        contact_person: 'Dr. Roberto Meireles',
        phone: '(11) 5080-2211',
        email: 'contato@inspeclab.com.br',
        address: 'Av. Paulista, 1000 - Bela Vista - SP',
        classification: 'Crítico',
        critical_categories: ['Ensaios Não Destrutivos (END)', 'Calibração de instrumentos'],
        materials_services_description:
          'Calibração de instrumentos dimensional/pressão e ensaios US, LP e PM.',
        qualification_status: 'Qualificado',
        qualification_criteria: [
          'Certificados do serviço/material (RBC/ASME)',
          'Questionário FSGQ 8.4-2 (Nota ≥ 6,0)',
        ],
        iso9001_certified: false,
        technical_certificates_info:
          'Acreditação Cgcre/Inmetro RBC nº CRL-0344 e inspetores qualificados SNQC/ABENDI.',
        evaluation_score: 9.0,
        last_evaluation_date: '2025-09-18 00:00:00.000Z',
        next_reevaluation_date: '2027-09-18 00:00:00.000Z',
        reevaluation_exempt: false,
        qualification_notes: 'Aprovado via questionário FSGQ 8.4-2 (9,0) + evidências RBC.',
      },
    ]

    const createdSupplierMap = {}

    sampleSuppliers.forEach((sup) => {
      let supId = ''
      try {
        const found = app.findRecordsByFilter(
          'suppliers',
          'company_id = {:companyId} && name = {:name}',
          'created',
          1,
          0,
          { companyId: PSC_ID, name: sup.name },
        )
        if (found && found.length > 0) {
          supId = found[0].id
        }
      } catch (_) {}

      if (!supId) {
        const rec = new Record(suppliersCol)
        Object.entries(sup).forEach(([k, v]) => rec.set(k, v))
        rec.set('company_id', PSC_ID)
        rec.set('qualified_by', defaultUserId)
        app.save(rec)
        supId = rec.id
      }
      createdSupplierMap[sup.name] = supId
    })

    // 3. Register realistic RNCs with origin='Fornecedor' for CorrosãoZero to demonstrate INCF > 30% alert!
    try {
      const ncExists = app.findRecordsByFilter(
        'non_conformities',
        'company_id = {:companyId} && supplier_name ~ {:supName}',
        'created',
        1,
        0,
        { companyId: PSC_ID, supName: 'CorrosãoZero' },
      )
      if (!ncExists || ncExists.length === 0) {
        const rnc1 = new Record(ncCol)
        rnc1.set('number', 'RNC-018/2026')
        rnc1.set('company_id', PSC_ID)
        rnc1.set('origin', 'Fornecedor')
        rnc1.set('supplier_name', 'CorrosãoZero Revestimentos e Pintura Especial Ltda')
        rnc1.set('severity', 'Grave')
        rnc1.set('status', 'Em Andamento')
        rnc1.set('process', 'Pintura')
        rnc1.set('action_type', 'Corretiva')
        rnc1.set(
          'description',
          'Espessura de camada seca abaixo do especificado na OS-2024-001 (revestimento epóxi reprovado no ensaio de aderência).',
        )
        rnc1.set('immediate_action', 'Segregar peças pintadas e reter lote.')
        rnc1.set('summary', 'Camada de tinta insuficiente fornecida pela terceirizada CorrosãoZero')
        rnc1.set('date', '2026-03-02 00:00:00.000Z')
        app.save(rnc1)

        const rnc2 = new Record(ncCol)
        rnc2.set('number', 'RNC-021/2026')
        rnc2.set('company_id', PSC_ID)
        rnc2.set('origin', 'Fornecedor')
        rnc2.set('supplier_name', 'CorrosãoZero Revestimentos e Pintura Especial Ltda')
        rnc2.set('severity', 'Médio')
        rnc2.set('status', 'Aberta')
        rnc2.set('process', 'Pintura')
        rnc2.set('action_type', 'Corretiva')
        rnc2.set(
          'description',
          'Escorridos e impregnação de poeira visíveis no acabamento poliuretano.',
        )
        rnc2.set('immediate_action', 'Solicitar retrabalho com custo por conta do fornecedor.')
        rnc2.set('summary', 'Acabamento visual defeituoso e não conformidade reincidente')
        rnc2.set('date', '2026-03-12 00:00:00.000Z')
        app.save(rnc2)
      }
    } catch (e) {
      console.log('Error creating sample supplier RNCs:', e)
    }

    // 4. Seed sample purchase quote (FSGQ 8.4-7 Resumo Coleta de Preço com 3 fornecedores)
    try {
      const gerdauId = createdSupplierMap['Gerdau Aços Longos S.A.']
      const quoteExists = app.findRecordsByFilter(
        'purchase_quotes',
        'company_id = {:companyId} && quote_number = {:num}',
        'created',
        1,
        0,
        { companyId: PSC_ID, num: 'RCP-2026/001' },
      )

      if (!quoteExists || quoteExists.length === 0) {
        const qRec = new Record(quotesCol)
        qRec.set('quote_number', 'RCP-2026/001')
        qRec.set('title', 'Aquisição de Chapas SA-516 Gr 70 para Tanque de Pressão')
        qRec.set('company_id', PSC_ID)
        qRec.set(
          'items_summary',
          '4 Chapas de Aço SA-516 Gr 70 espessura 1/2 pol (12,7mm) x 2400 x 6000 mm',
        )
        qRec.set('quote_count', 3)
        qRec.set('has_min_three_quotes', true)
        qRec.set(
          'proposals_json',
          JSON.stringify([
            {
              supplier: 'Gerdau Aços Longos S.A.',
              price: 14800,
              deadlineDays: 7,
              isSelected: true,
              isCritical: true,
              isQualified: true,
              conditions: 'FOB, 30 DDL, certificado incluso',
            },
            {
              supplier: 'Usiminas S/A',
              price: 15400,
              deadlineDays: 12,
              isSelected: false,
              isCritical: true,
              isQualified: true,
              conditions: 'CIF, 28 DDL',
            },
            {
              supplier: 'Distribuidora AçoSul Ltda',
              price: 16100,
              deadlineDays: 5,
              isSelected: false,
              isCritical: true,
              isQualified: false,
              conditions: 'FOB, à vista',
            },
          ]),
        )
        if (gerdauId) {
          qRec.set('selected_supplier_id', gerdauId)
        }
        qRec.set('selected_supplier_name', 'Gerdau Aços Longos S.A.')
        qRec.set('selected_supplier_is_critical', true)
        qRec.set('selected_supplier_is_qualified', true)
        qRec.set('total_amount', 14800)
        qRec.set('status', 'Pedido Emitido')
        qRec.set('delivery_status', 'No Prazo')
        qRec.set('delivery_expected_date', '2026-03-25 00:00:00.000Z')
        qRec.set(
          'notes',
          'Cotação realizada conforme PSGQ 8.4 item 5.5 com 3 fornecedores. Menor preço e fornecedor qualificado.',
        )
        app.save(qRec)
      }
    } catch (e) {
      console.log('Error creating sample quote:', e)
    }
  },
  (app) => {
    // down migration
  },
)
