migrate(
  (app) => {
    const slipsCol = app.findCollectionByNameOrId('packing_slips')

    // 1. Add new fields to packing_slips
    // - issue_time: text (hora automática de emissão, ex: 14:35)
    // - movement_reason: text (Serviço Especial, Uso interno/produção, Devolução ao estoque, Garantia, Outro)
    // - movement_reason_other: text (especificação livre)
    // - special_service_type: text (Pintura, Galvanização, Tratamento Térmico, Outro)
    // - special_service_status: text (Aguardando retorno, Retornado, N/A)
    // - return_date: date (data que retornou)
    // - returned_slip_id: relation to packing_slips (romaneio de entrada vinculado)
    // - parent_slip_id: relation to packing_slips (romaneio de saída de origem)
    // - days_out: number (dias corridos fora)

    if (!slipsCol.fields.getByName('issue_time')) {
      slipsCol.fields.add(new TextField({ name: 'issue_time', required: false }))
    }
    if (!slipsCol.fields.getByName('movement_reason')) {
      slipsCol.fields.add(new TextField({ name: 'movement_reason', required: false }))
    }
    if (!slipsCol.fields.getByName('movement_reason_other')) {
      slipsCol.fields.add(new TextField({ name: 'movement_reason_other', required: false }))
    }
    if (!slipsCol.fields.getByName('special_service_type')) {
      slipsCol.fields.add(new TextField({ name: 'special_service_type', required: false }))
    }
    if (!slipsCol.fields.getByName('special_service_status')) {
      slipsCol.fields.add(new TextField({ name: 'special_service_status', required: false }))
    }
    if (!slipsCol.fields.getByName('return_date')) {
      slipsCol.fields.add(new DateField({ name: 'return_date', required: false }))
    }
    if (!slipsCol.fields.getByName('returned_slip_id')) {
      slipsCol.fields.add(
        new RelationField({
          name: 'returned_slip_id',
          required: false,
          collectionId: slipsCol.id,
          maxSelect: 1,
        }),
      )
    }
    if (!slipsCol.fields.getByName('parent_slip_id')) {
      slipsCol.fields.add(
        new RelationField({
          name: 'parent_slip_id',
          required: false,
          collectionId: slipsCol.id,
          maxSelect: 1,
        }),
      )
    }
    if (!slipsCol.fields.getByName('days_out')) {
      slipsCol.fields.add(new NumberField({ name: 'days_out', required: false }))
    }

    app.save(slipsCol)

    // 2. Seed example packing slips with special services in open status
    // Example: Outbound for galvanization 5 days ago (in open status / aguardando retorno)
    // and another returned one to show calculation.
    const PSC_ID = 'a631bv695rr4gef'
    let defaultUserId = ''
    try {
      const u = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
      defaultUserId = u.id
    } catch (_) {}

    let osId = ''
    try {
      const soList = app.findRecordsByFilter(
        'service_orders',
        'owner_company_id = {:c}',
        'created',
        1,
        0,
        { c: PSC_ID },
      )
      if (soList && soList.length > 0) {
        osId = soList[0].id
      }
    } catch (_) {}

    // Date 5 days ago
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    const fiveDaysAgoIso = fiveDaysAgo.toISOString().split('T')[0] + ' 09:30:00.000Z'

    // Date 10 days ago (returned after 3 days)
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const tenDaysAgoIso = tenDaysAgo.toISOString().split('T')[0] + ' 10:00:00.000Z'
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const sevenDaysAgoIso = sevenDaysAgo.toISOString().split('T')[0] + ' 15:45:00.000Z'

    // Check if demo slip already exists
    let existingDemo = false
    try {
      const found = app.findRecordsByFilter(
        'packing_slips',
        'company_id = {:c} && number = {:n}',
        'created',
        1,
        0,
        { c: PSC_ID, n: 1003 },
      )
      if (found && found.length > 0) existingDemo = true
    } catch (_) {}

    if (!existingDemo) {
      // Slip 1003: Saída para Galvanização a Fogo (há 5 dias, em aberto / aguardando retorno)
      const slip1003 = new Record(slipsCol)
      slip1003.set('number', 1003)
      slip1003.set('issue_date', fiveDaysAgoIso)
      slip1003.set('issue_time', '09:30')
      slip1003.set('type', 'Saída')
      slip1003.set('company_id', PSC_ID)
      slip1003.set('recipient_origin', 'GalvanoBahia Tratamentos Especiais Ltda')
      slip1003.set('origin_location', 'Fábrica PSC - Galpão 02')
      slip1003.set('destination_location', 'Unidade Galvanização Camaçari')
      slip1003.set('delivery_responsible', 'Carlos Transportador')
      slip1003.set('warehouse_responsible', 'Almoxarife Teste')
      slip1003.set('cq_pcp_responsible', 'Inspetor CQ PSC')
      slip1003.set('sector', 'Produção')
      slip1003.set('requester', 'Engenharia de Fabricação')
      slip1003.set('in_charge', 'Encarregado de Galvanização / GalvanoBahia')
      slip1003.set('movement_reason', 'Serviço Especial')
      slip1003.set('special_service_type', 'Galvanização')
      slip1003.set('special_service_status', 'Aguardando retorno')
      slip1003.set('status', 'Finalized')
      slip1003.set('nfe_number', 'NF-54890')
      slip1003.set('oc_number', 'OC-2026-088')
      if (defaultUserId) slip1003.set('responsible_id', defaultUserId)
      if (osId) slip1003.set('os_id', osId)
      slip1003.set(
        'items',
        JSON.stringify([
          {
            item: 1,
            quantity: 12,
            unit: 'PC',
            description: 'Flanges de Aço Carbono ANSI 150# Ø 8 polegadas',
            observation: 'Enviar com jateamento prévio Sa 2.5',
            is_raw_material: true,
            raw_material_evidence: 'Chapas certificadas rastreadas pelo CQ',
            has_certificate: true,
            certificate_evidence: 'Certificado de Matéria-Prima Gerdau Nº 8841-B',
            has_invoice: false,
            invoice_evidence: '',
            photos: ['https://img.usecurling.com/p/400/300?q=steel+flange+industrial'],
          },
          {
            item: 2,
            quantity: 4,
            unit: 'PC',
            description: 'Tubo Curvado Schedule 40 - Raio Longo',
            observation: 'Galvanização a fogo com camada mínima de 80 mícrons',
            is_raw_material: true,
            raw_material_evidence: 'Tubos certificados Tubosul',
            has_certificate: true,
            certificate_evidence: 'Certificado 9920/2026',
            has_invoice: false,
            invoice_evidence: '',
            photos: ['https://img.usecurling.com/p/400/300?q=steel+pipes+industrial'],
          },
        ]),
      )
      app.save(slip1003)

      // Slip 1004: Saída para Pintura Especial (há 10 dias, retornou há 7 dias = 3 dias fora)
      const slip1004 = new Record(slipsCol)
      slip1004.set('number', 1004)
      slip1004.set('issue_date', tenDaysAgoIso)
      slip1004.set('issue_time', '10:00')
      slip1004.set('type', 'Saída')
      slip1004.set('company_id', PSC_ID)
      slip1004.set('recipient_origin', 'Pintura Industrial CorrosãoZero Ltda')
      slip1004.set('origin_location', 'Almoxarifado Central PSC')
      slip1004.set('destination_location', 'Cabine de Pintura Especial Simões Filho')
      slip1004.set('delivery_responsible', 'Logística Express')
      slip1004.set('warehouse_responsible', 'Almoxarife Teste')
      slip1004.set('cq_pcp_responsible', 'Inspetor de Pintura N1')
      slip1004.set('sector', 'Qualidade')
      slip1004.set('requester', 'PCP')
      slip1004.set('in_charge', 'Encarregado pelo recebimento / CorrosãoZero')
      slip1004.set('movement_reason', 'Serviço Especial')
      slip1004.set('special_service_type', 'Pintura')
      slip1004.set('special_service_status', 'Retornado')
      slip1004.set('return_date', sevenDaysAgoIso)
      slip1004.set('days_out', 3)
      slip1004.set('status', 'Finalized')
      slip1004.set('nfe_number', 'NF-54812')
      if (defaultUserId) slip1004.set('responsible_id', defaultUserId)
      if (osId) slip1004.set('os_id', osId)
      slip1004.set(
        'items',
        JSON.stringify([
          {
            item: 1,
            quantity: 2,
            unit: 'PC',
            description: 'Berço Metálico Estrutural do Vaso VP-001',
            observation: 'Pintura primer epóxi 150 mícrons + acabamento PU',
            is_raw_material: false,
            raw_material_evidence: '',
            has_certificate: true,
            certificate_evidence: 'Relatório de inspeção dimensional aprovado',
            has_invoice: false,
            invoice_evidence: '',
            photos: ['https://img.usecurling.com/p/400/300?q=metal+structure+welding'],
          },
        ]),
      )
      app.save(slip1004)

      // Slip 1005: Entrada vinculada de retorno do 1004
      const slip1005 = new Record(slipsCol)
      slip1005.set('number', 1005)
      slip1005.set('issue_date', sevenDaysAgoIso)
      slip1005.set('issue_time', '15:45')
      slip1005.set('type', 'Entrada')
      slip1005.set('company_id', PSC_ID)
      slip1005.set('recipient_origin', 'PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA')
      slip1005.set('origin_location', 'Pintura Industrial CorrosãoZero Ltda')
      slip1005.set('destination_location', 'Fábrica PSC - Expedição')
      slip1005.set('delivery_responsible', 'Logística Express')
      slip1005.set('warehouse_responsible', 'Almoxarife Teste')
      slip1005.set('cq_pcp_responsible', 'Inspetor CQ PSC')
      slip1005.set('sector', 'Almoxarifado')
      slip1005.set('requester', 'PCP')
      slip1005.set('in_charge', 'Encarregado do Almoxarifado')
      slip1005.set('movement_reason', 'Serviço Especial')
      slip1005.set('special_service_type', 'Pintura')
      slip1005.set('special_service_status', 'Retornado')
      slip1005.set('parent_slip_id', slip1004.id)
      slip1005.set('status', 'Finalized')
      slip1005.set('nfe_number', 'NF-77301')
      slip1005.set('days_out', 3)
      if (defaultUserId) slip1005.set('responsible_id', defaultUserId)
      if (osId) slip1005.set('os_id', osId)
      slip1005.set(
        'items',
        JSON.stringify([
          {
            item: 1,
            quantity: 2,
            unit: 'PC',
            description: 'Berço Metálico Estrutural do Vaso VP-001 (Pintado)',
            observation: 'Retorno de pintura. Aprovado CQ espessura 165 mícrons.',
            is_raw_material: false,
            raw_material_evidence: '',
            has_certificate: true,
            certificate_evidence: 'Laudo de Aderência e Espessura Tintas PU Nº 104',
            has_invoice: true,
            invoice_evidence: 'NF-e 77301 CorrosãoZero',
            photos: ['https://img.usecurling.com/p/400/300?q=painted+steel+inspection'],
          },
        ]),
      )
      app.save(slip1005)

      // Link 1004 to 1005 as returned
      slip1004.set('returned_slip_id', slip1005.id)
      app.save(slip1004)
    }
  },
  (app) => {
    // down migration
  },
)
