// Migration 0105 — População atômica de template_family e title_en
// Regras estritas:
// (a) template_family para registros com o campo vazio:
//     - Prefixo PR-CQ -> "SGQ — Português (PSGQ/FSGQ/ITSGQ)"
//     - Demais (LP, CDE, CQS, ASME, etc.) -> "Técnico/CQ — Bilíngue (CDE)"
//     - NÃO tocar em registros que já possuem template_family preenchido.
//
// (b) title_en: para cada documento com title_en vazio, gravar a tradução técnica em inglês do title.
//     - Preservar códigos/prefixos presentes no title quando houver.
//     - Traduzir termos técnicos padrão de qualidade/CQ/soldagem/segurança.
//     - Título que já estiver integralmente em inglês permanece igual.
//     - NÃO alterar title, code, revision, status, content, template_family (além de a) ou qualquer outro campo.
//     - Nenhum documento sai de "Under Review", nada é publicado.

migrate(
  (app) => {
    var FAMILY_A = 'SGQ \u2014 Portugu\u00EAs (PSGQ/FSGQ/ITSGQ)'
    var FAMILY_B = 'T\u00E9cnico/CQ \u2014 Bil\u00EDngue (CDE)'

    // Dicionário exato / normalizado de traduções técnicas para títulos do acervo
    var EXACT_TITLE_EN = {
      // Manuais / SGQ
      'MANUAL DO SISTEMA DE GESTÃO DE QUALIDADE': 'QUALITY MANAGEMENT SYSTEM MANUAL',
      'MANUAL DO SISTEMA DE GESTAO DE QUALIDADE': 'QUALITY MANAGEMENT SYSTEM MANUAL',
      'MANUAL DA QUALIDADE': 'QUALITY MANUAL',
      'MANUAL DO SGQ': 'QMS MANUAL',
      'MANUAL DE CONTROLE DA QUALIDADE ASME': 'ASME QUALITY CONTROL MANUAL',

      // Auditoria
      'AUDITORIA INTERNA DA QUALIDADE': 'INTERNAL QUALITY AUDIT',
      'AUDITORIA INTERNA': 'INTERNAL AUDIT',

      // Soldagem / Qualificação
      'CERTIFICADO DE QUALIFICAÇÃO DE SOLDADORES': 'WELDER QUALIFICATION RECORD',
      'CERTIFICADO DE QUALIFICACAO DE SOLDADORES': 'WELDER QUALIFICATION RECORD',
      'QUALIFICAÇÃO DE SOLDADORES': 'WELDER QUALIFICATION',
      'QUALIFICACAO DE SOLDADORES': 'WELDER QUALIFICATION',
      'ESPECIFICAÇÃO DE PROCEDIMENTO DE SOLDAGEM': 'WELDING PROCEDURE SPECIFICATION (WPS)',
      'ESPECIFICACAO DE PROCEDIMENTO DE SOLDAGEM': 'WELDING PROCEDURE SPECIFICATION (WPS)',
      'REGISTRO DE QUALIFICAÇÃO DE PROCEDIMENTO DE SOLDAGEM':
        'PROCEDURE QUALIFICATION RECORD (PQR)',
      'REGISTRO DE QUALIFICACAO DE PROCEDIMENTO DE SOLDAGEM':
        'PROCEDURE QUALIFICATION RECORD (PQR)',
      'SOLDA DE SELAGEM DE TUBOS TROCADOR DE CALOR':
        'HEAT EXCHANGER TUBE-TO-TUBESHEET SEAL WELDING',

      // Ensaios e Inspeções
      'ENSAIO VISUAL DE SOLDA': 'WELD VISUAL EXAMINATION',
      'ENSAIO VISUAL': 'VISUAL EXAMINATION',
      'PROCEDIMENTO ENSAIO VISUAL': 'VISUAL EXAMINATION PROCEDURE',
      'PROCEDIMENTO DE ENSAIO VISUAL': 'VISUAL EXAMINATION PROCEDURE',
      'PROCEDIMENTO DE LÍQUIDO PENETRANTE': 'LIQUID PENETRANT TESTING PROCEDURE',
      'PROCEDIMENTO DE LIQUIDO PENETRANTE': 'LIQUID PENETRANT TESTING PROCEDURE',
      'LÍQUIDO PENETRANTE': 'LIQUID PENETRANT TESTING',
      'LIQUIDO PENETRANTE': 'LIQUID PENETRANT TESTING',
      'CONTROLE DIMENSIONAL': 'DIMENSIONAL CONTROL',
      'PROCEDIMENTO DE CONTROLE DIMENSIONAL': 'DIMENSIONAL CONTROL PROCEDURE',
      'TESTE HIDROSTÁTICO': 'HYDROSTATIC TEST',
      'TESTE HIDROSTATICO': 'HYDROSTATIC TEST',
      'PROCEDIMENTO DE TESTE HIDROSTÁTICO': 'HYDROSTATIC TEST PROCEDURE',
      'PROCEDIMENTO DE TESTE HIDROSTATICO': 'HYDROSTATIC TEST PROCEDURE',

      // Calibração e Instrumentos
      'CONTROLE DE CALIBRAÇÃO DE INSTRUMENTOS EQUIPAMENTOS DE MEDIÇÃO':
        'CALIBRATION CONTROL OF MEASURING INSTRUMENTS AND EQUIPMENT',
      'CONTROLE DE CALIBRACAO DE INSTRUMENTOS EQUIPAMENTOS DE MEDICAO':
        'CALIBRATION CONTROL OF MEASURING INSTRUMENTS AND EQUIPMENT',
      'AFERIÇÃO INTERNA DE TRENA': 'INTERNAL TAPE MEASURE CALIBRATION',
      'AFERICAO INTERNA DE TRENA': 'INTERNAL TAPE MEASURE CALIBRATION',
      'AFERIÇÃO INTERNA DE TRENAS': 'INTERNAL TAPE MEASURE CALIBRATION',
      'AFERICAO INTERNA DE TRENAS': 'INTERNAL TAPE MEASURE CALIBRATION',

      // Fabricação / Montagem / Manutenção
      'PROCEDIMENTO DE MONT. VASOS': 'PRESSURE VESSEL ASSEMBLY PROCEDURE',
      'PROCEDIMENTO DE MONTAGEM DE VASOS': 'PRESSURE VESSEL ASSEMBLY PROCEDURE',
      'PROCEDIMENTO DE MONTAGEM DE VASO': 'PRESSURE VESSEL ASSEMBLY PROCEDURE',
      'PROCEDIMENTO DE DECAPAGEM E APASSIVAÇÃO DE AÇOS INOXIDÁVEIS':
        'PICKLING AND PASSIVATION PROCEDURE FOR STAINLESS STEELS',
      'PROCEDIMENTO DE DECAPAGEM E APASSIVACAO DE ACOS INOXIDAVEIS':
        'PICKLING AND PASSIVATION PROCEDURE FOR STAINLESS STEELS',
      'LIMPEZA QUIMICA TUBOS TROCADOR AC': 'CHEMICAL CLEANING OF CS HEAT EXCHANGER TUBES',
      'LIMPEZA QUÍMICA TUBOS TROCADOR AC': 'CHEMICAL CLEANING OF CS HEAT EXCHANGER TUBES',
      'ARMAZENAMENTO, PRESERVAÇÃO, EMBALAGEM E EXPEDIÇÃO':
        'STORAGE, PRESERVATION, PACKAGING AND SHIPPING',
      'ARMAZENAMENTO, PRESERVACAO, EMBALAGEM E EXPEDICAO':
        'STORAGE, PRESERVATION, PACKAGING AND SHIPPING',
      'APERTO CONTROLADO DE PLUG': 'CONTROLLED PLUG TIGHTENING',
      'RETUBAGEM DE FEIXE TUBULAR DE PERMUTADORES DE CALOR COM ESPELHO FLUTUANTE':
        'RETUBING OF TUBULAR BUNDLE FOR FLOATING HEAD HEAT EXCHANGERS',

      // Gestão / PCP / SMS
      'PLANEJAMENTO E CONTROLE DE ORDENS DE SERVIÇO': 'WORK ORDER PLANNING AND CONTROL',
      'PLANEJAMENTO E CONTROLE DE ORDENS DE SERVICO': 'WORK ORDER PLANNING AND CONTROL',
      'IDENTIFICACAO DE ASPECTOS E IMPACTOS RISCOS E PERIGOS':
        'IDENTIFICATION OF ENVIRONMENTAL ASPECTS, IMPACTS, RISKS AND HAZARDS',
      'IDENTIFICAÇÃO DE ASPECTOS E IMPACTOS RISCOS E PERIGOS':
        'IDENTIFICATION OF ENVIRONMENTAL ASPECTS, IMPACTS, RISKS AND HAZARDS',
      'CONTROLE DE DOCUMENTOS E DADOS': 'DOCUMENT AND DATA CONTROL',
      'CONTROLE DE REGISTROS DA QUALIDADE': 'QUALITY RECORDS CONTROL',
      'AÇÃO CORRETIVA E PREVENTIVA': 'CORRECTIVE AND PREVENTIVE ACTION',
      'ACAO CORRETIVA E PREVENTIVA': 'CORRECTIVE AND PREVENTIVE ACTION',
      'CONTROLE DE PRODUTO NÃO CONFORME': 'CONTROL OF NON-CONFORMING PRODUCT',
      'CONTROLE DE PRODUTO NAO CONFORME': 'CONTROL OF NON-CONFORMING PRODUCT',
      'CONTROLE DE NÃO CONFORMIDADES': 'CONTROL OF NON-CONFORMITIES',
      'CONTROLE DE NAO CONFORMIDADES': 'CONTROL OF NON-CONFORMITIES',
      'ANÁLISE CRÍTICA PELA DIREÇÃO': 'MANAGEMENT REVIEW',
      'ANALISE CRITICA PELA DIRECAO': 'MANAGEMENT REVIEW',
      'GESTÃO DE MUDANÇAS': 'MANAGEMENT OF CHANGE',
      'GESTAO DE MUDANCAS': 'MANAGEMENT OF CHANGE',
      'AVALIAÇÃO DE FORNECEDORES': 'SUPPLIER EVALUATION',
      'AVALIACAO DE FORNECEDORES': 'SUPPLIER EVALUATION',
      'SELEÇÃO E QUALIFICAÇÃO DE FORNECEDORES': 'SUPPLIER SELECTION AND QUALIFICATION',
      'SELECAO E QUALIFICACAO DE FORNECEDORES': 'SUPPLIER SELECTION AND QUALIFICATION',
      'TREINAMENTO E DESENVOLVIMENTO': 'TRAINING AND DEVELOPMENT',
      'COMPETÊNCIA E CONSCIENTIZAÇÃO': 'COMPETENCE AND AWARENESS',
      'COMPETENCIA E CONSCIENTIZACAO': 'COMPETENCE AND AWARENESS',
    }

    // Função de tradução determinística e robusta para qualquer título de documento SGQ/CQ
    function translateTitleToEn(title) {
      if (!title) return ''
      var raw = title.trim()
      if (!raw) return ''

      // Já em inglês completo? (contém apenas caracteres ASCII comuns e termos em inglês característicos)
      var upper = raw.toUpperCase()
      if (EXACT_TITLE_EN[upper]) {
        return EXACT_TITLE_EN[upper]
      }

      // Se começa com prefixo de código (ex: "FSGQ 8.6-5 ...", "ITSGQ 7.1-2 ...", "PR-CQ-14 ...")
      // Separamos prefixo/código da descrição para traduzir o miolo
      var prefixMatch =
        raw.match(/^([A-Z0-9\.\-\s]+?)\s+-\s+(.+)$/i) ||
        raw.match(/^([A-Z]{2,6}[\s\-]+[0-9\.\-]+)\s+(.+)$/i)
      var codePart = ''
      var textPart = raw

      if (prefixMatch) {
        codePart = prefixMatch[1].trim()
        textPart = prefixMatch[2].trim()
        var textUpper = textPart.toUpperCase()
        if (EXACT_TITLE_EN[textUpper]) {
          return codePart + ' ' + EXACT_TITLE_EN[textUpper]
        }
      }

      // Substituição sistemática de termos técnicos
      var trans = textPart

      // Frases longas
      var phraseReplacements = [
        [/\bCERTIFICADO DE QUALIFICA[CÇ][AÃ]O DE SOLDADORES\b/gi, 'Welder Qualification Record'],
        [/\bQUALIFICA[CÇ][AÃ]O DE SOLDADORES\b/gi, 'Welder Qualification'],
        [
          /\bESPECIFICA[CÇ][AÃ]O DE PROCEDIMENTO DE SOLDAGEM\b/gi,
          'Welding Procedure Specification (WPS)',
        ],
        [
          /\bREGISTRO DE QUALIFICA[CÇ][AÃ]O DE PROCEDIMENTO DE SOLDAGEM\b/gi,
          'Procedure Qualification Record (PQR)',
        ],
        [
          /\bCONTROLE DE CALIBRA[CÇ][AÃ]O DE INSTRUMENTOS EQUIPAMENTOS DE MEDI[CÇ][AÃ]O\b/gi,
          'Calibration Control of Measuring Instruments and Equipment',
        ],
        [
          /\bPROCEDIMENTO DE DECAPAGEM E APASSIVA[CÇ][AÃ]O DE A[CÇ]OS INOXID[AÁ]VEIS\b/gi,
          'Pickling and Passivation Procedure for Stainless Steels',
        ],
        [/\bPROCEDIMENTO DE L[IÍ]QUIDO PENETRANTE\b/gi, 'Liquid Penetrant Testing Procedure'],
        [/\bPROCEDIMENTO DE ENSAIO VISUAL\b/gi, 'Visual Examination Procedure'],
        [/\bPROCEDIMENTO ENSAIO VISUAL\b/gi, 'Visual Examination Procedure'],
        [/\bPROCEDIMENTO DE MONT\.?\s*VASOS\b/gi, 'Pressure Vessel Assembly Procedure'],
        [/\bPROCEDIMENTO DE MONTAGEM DE VASOS?\b/gi, 'Pressure Vessel Assembly Procedure'],
        [
          /\bLIMPEZA QU[IÍ]MICA TUBOS TROCADOR AC\b/gi,
          'Chemical Cleaning of CS Heat Exchanger Tubes',
        ],
        [
          /\bARMAZENAMENTO,?\s*PRESERVA[CÇ][AÃ]O,?\s*EMBALAGEM E EXPEDI[CÇ][AÃ]O\b/gi,
          'Storage, Preservation, Packaging and Shipping',
        ],
        [/\bAPERTO CONTROLADO DE PLUG\b/gi, 'Controlled Plug Tightening'],
        [/\bAFERI[CÇ][AÃ]O INTERNA DE TRENAS?\b/gi, 'Internal Tape Measure Calibration'],
        [
          /\bRETUBAGEM DE FEIXE TUBULAR DE PERMUTADORES DE CALOR COM ESPELHO FLUTUANTE\b/gi,
          'Retubing of Tubular Bundle for Floating Head Heat Exchangers',
        ],
        [
          /\bSOLDA DE SELAGEM DE TUBOS TROCADOR DE CALOR\b/gi,
          'Heat Exchanger Tube-to-Tubesheet Seal Welding',
        ],
        [
          /\bIDENTIFICA[CÇ][AÃ]O DE ASPECTOS E IMPACTOS RISCOS E PERIGOS\b/gi,
          'Identification of Environmental Aspects, Impacts, Risks and Hazards',
        ],
        [
          /\bPLANEJAMENTO E CONTROLE DE ORDENS DE SERVI[CÇ]O\b/gi,
          'Work Order Planning and Control',
        ],
        [
          /\bMANUAL DO SISTEMA DE GEST[AÃ]O D[AE] QUALIDADE\b/gi,
          'Quality Management System Manual',
        ],
        [/\bMANUAL DA QUALIDADE\b/gi, 'Quality Manual'],
        [/\bMANUAL DE CONTROLE DA QUALIDADE ASME\b/gi, 'ASME Quality Control Manual'],
        [/\bAUDITORIA INTERNA DA QUALIDADE\b/gi, 'Internal Quality Audit'],
        [/\bAUDITORIA INTERNA\b/gi, 'Internal Audit'],
        [/\bCONTROLE DE DOCUMENTOS E DADOS\b/gi, 'Document and Data Control'],
        [/\bCONTROLE DE REGISTROS DA QUALIDADE\b/gi, 'Quality Records Control'],
        [/\bA[CÇ][AÃ]O CORRETIVA E PREVENTIVA\b/gi, 'Corrective and Preventive Action'],
        [/\bA[CÇ][OÕ]ES CORRETIVAS E PREVENTIVAS\b/gi, 'Corrective and Preventive Actions'],
        [/\bA[CÇ][OÕ]ES CORRETIVAS\b/gi, 'Corrective Actions'],
        [/\bA[CÇ][AÃ]O CORRETIVA\b/gi, 'Corrective Action'],
        [/\bPRODUTO N[AÃ]O CONFORME\b/gi, 'Non-Conforming Product'],
        [/\bN[AÃ]O CONFORMIDADE\b/gi, 'Non-Conformity'],
        [/\bN[AÃ]O CONFORMIDADES\b/gi, 'Non-Conformities'],
        [/\bAN[AÁ]LISE CR[IÍ]TICA PELA DIRE[CÇ][AÃ]O\b/gi, 'Management Review'],
        [/\bAN[AÁ]LISE CR[IÍ]TICA\b/gi, 'Critical Analysis'],
        [/\bGEST[AÃ]O DE MUDAN[CÇ]AS\b/gi, 'Management of Change'],
        [/\bAVALIA[CÇ][AÃ]O DE FORNECEDORES\b/gi, 'Supplier Evaluation'],
        [
          /\bSELE[CÇ][AÃ]O E QUALIFICA[CÇ][AÃ]O DE FORNECEDORES\b/gi,
          'Supplier Selection and Qualification',
        ],
        [/\bSELE[CÇ][AÃ]O DE FORNECEDORES\b/gi, 'Supplier Selection'],
        [/\bQUALIFICA[CÇ][AÃ]O DE FORNECEDORES\b/gi, 'Supplier Qualification'],
        [/\bTREINAMENTO E DESENVOLVIMENTO\b/gi, 'Training and Development'],
        [/\bCOMPET[EÊ]NCIA E CONSCIENTIZA[CÇ][AÃ]O\b/gi, 'Competence and Awareness'],
        [/\bCONTROLE DIMENSIONAL\b/gi, 'Dimensional Control'],
        [/\bENSAIO VISUAL DE SOLDA\b/gi, 'Weld Visual Examination'],
        [/\bENSAIO VISUAL\b/gi, 'Visual Examination'],
        [/\bL[IÍ]QUIDO PENETRANTE\b/gi, 'Liquid Penetrant Testing'],
        [/\bPART[IÍ]CULA MAGN[EÉ]TICA\b/gi, 'Magnetic Particle Testing'],
        [/\bTESTE HIDROST[AÁ]TICO\b/gi, 'Hydrostatic Test'],
        [/\bTESTE PNEUM[AÁ]TICO\b/gi, 'Pneumatic Test'],
        [/\bTESTE DE ESTANQUEIDADE\b/gi, 'Leak Testing'],
        [/\bINSPE[CÇ][AÃ]O RECEBIMENTO\b/gi, 'Receiving Inspection'],
        [/\bINSPE[CÇ][AÃ]O DE RECEBIMENTO\b/gi, 'Receiving Inspection'],
        [/\bINSPE[CÇ][AÃ]O FINAL\b/gi, 'Final Inspection'],
        [/\bINSPE[CÇ][AÃ]O EM PROCESSO\b/gi, 'In-Process Inspection'],
        [/\bMAPEAMENTO DE SOLDA\b/gi, 'Weld Mapping'],
        [/\bCONTROLE DE SOLDAGEM\b/gi, 'Welding Control'],
        [/\bRELAT[OÓ]RIO DE N[AÃ]O CONFORMIDADE\b/gi, 'Non-Conformance Report (NCR)'],
        [/\bORDEM DE SERVI[CÇ]O\b/gi, 'Work Order'],
        [/\bORDENS DE SERVI[CÇ]O\b/gi, 'Work Orders'],
      ]

      for (var p = 0; p < phraseReplacements.length; p++) {
        trans = trans.replace(phraseReplacements[p][0], phraseReplacements[p][1])
      }

      // Termos isolados comuns
      var wordReplacements = [
        [/\bPROCEDIMENTO DE\b/gi, 'Procedure for'],
        [/\bPROCEDIMENTO PARA\b/gi, 'Procedure for'],
        [/\bPROCEDIMENTO\b/gi, 'Procedure'],
        [/\bINSTRU[CÇ][AÃ]O DE TRABALHO\b/gi, 'Work Instruction'],
        [/\bINSTRU[CÇ][AÃ]O\b/gi, 'Instruction'],
        [/\bFORMUL[AÁ]RIO\b/gi, 'Form'],
        [/\bRELAT[OÓ]RIO DE\b/gi, 'Report on'],
        [/\bRELAT[OÓ]RIO\b/gi, 'Report'],
        [/\bREGISTRO DE\b/gi, 'Record of'],
        [/\bREGISTRO\b/gi, 'Record'],
        [/\bPLANILHA DE\b/gi, 'Worksheet for'],
        [/\bPLANILHA\b/gi, 'Worksheet'],
        [/\bCRIT[EÉ]RIOS? DE ACEITA[CÇ][AÃ]O\b/gi, 'Acceptance Criteria'],
        [/\bSOLDAGEM\b/gi, 'Welding'],
        [/\bSOLDA\b/gi, 'Weld'],
        [/\bSOLDADOR\b/gi, 'Welder'],
        [/\bSOLDADORES\b/gi, 'Welders'],
        [/\bVASO DE PRESS[AÃ]O\b/gi, 'Pressure Vessel'],
        [/\bVASOS DE PRESS[AÃ]O\b/gi, 'Pressure Vessels'],
        [/\bVASOS\b/gi, 'Vessels'],
        [/\bCALIBRA[CÇ][AÃ]O\b/gi, 'Calibration'],
        [/\bCALIBRACOES\b/gi, 'Calibrations'],
        [/\bCALIBRA[CÇ][OÕ]ES\b/gi, 'Calibrations'],
        [/\bAFERI[CÇ][AÃ]O\b/gi, 'Calibration'],
        [/\bMANUTEN[CÇ][AÃ]O PREVENTIVA\b/gi, 'Preventive Maintenance'],
        [/\bMANUTEN[CÇ][AÃ]O CORRETIVA\b/gi, 'Corrective Maintenance'],
        [/\bMANUTEN[CÇ][AÃ]O\b/gi, 'Maintenance'],
        [/\bSEGURAN[CÇ]A DO TRABALHO\b/gi, 'Occupational Safety'],
        [/\bMEIO AMBIENTE\b/gi, 'Environment'],
        [/\bSA[UÚ]DE OCUPACIONAL\b/gi, 'Occupational Health'],
        [/\bPOL[IÍ]TICA DA QUALIDADE\b/gi, 'Quality Policy'],
        [/\bOBJETIVOS DA QUALIDADE\b/gi, 'Quality Objectives'],
        [/\bINDICADORES DA QUALIDADE\b/gi, 'Quality Indicators'],
        [/\bINDICADORES DE DESEMPENHO\b/gi, 'Performance Indicators'],
        [/\bINDICADORES\b/gi, 'Indicators'],
        [/\bSATISFA[CÇ][AÃ]O DO CLIENTE\b/gi, 'Customer Satisfaction'],
        [/\bPESQUISA DE SATISFA[CÇ][AÃ]O\b/gi, 'Satisfaction Survey'],
        [/\bRECLAMA[CÇ][AÃ]O DE CLIENTE\b/gi, 'Customer Complaint'],
        [/\bRECLAMA[CÇ][OÕ]ES DE CLIENTES\b/gi, 'Customer Complaints'],
        [/\bCOMPRAS E CONTRATA[CÇ][AÃ]O\b/gi, 'Purchasing and Contracting'],
        [/\bCOMPRAS\b/gi, 'Purchasing'],
        [/\bALMOXARIFADO\b/gi, 'Warehouse'],
        [/\bESTOQUE\b/gi, 'Stock / Inventory'],
        [/\bRASTREABILIDADE\b/gi, 'Traceability'],
        [/\bIDENTIFICA[CÇ][AÃ]O E RASTREABILIDADE\b/gi, 'Identification and Traceability'],
        [/\bMAT[EÉ]RIA-PRIMA\b/gi, 'Raw Material'],
        [/\bMAT[EÉ]RIAS-PRIMAS\b/gi, 'Raw Materials'],
        [/\bCONSUM[IÍ]VEIS DE SOLDAGEM\b/gi, 'Welding Consumables'],
        [/\bCONSUM[IÍ]VEIS\b/gi, 'Consumables'],
        [/\bCONSUMIVEIS\b/gi, 'Consumables'],
        [/\bESTUFA DE ELETRODOS\b/gi, 'Electrode Oven'],
        [/\bTRATAMENTO T[EÉ]RMICO\b/gi, 'Heat Treatment'],
        [/\bALÍVIO DE TENSÕES\b/gi, 'Stress Relief'],
        [/\bALIVIO DE TENSOES\b/gi, 'Stress Relief'],
        [/\bENSAIO N[AÃ]O DESTRUTIVO\b/gi, 'Non-Destructive Testing (NDT)'],
        [/\bENSAIOS N[AÃ]O DESTRUTIVOS\b/gi, 'Non-Destructive Examination (NDE)'],
      ]

      for (var w = 0; w < wordReplacements.length; w++) {
        trans = trans.replace(wordReplacements[w][0], wordReplacements[w][1])
      }

      // Preposições e artigos remanescentes se necessário
      trans = trans
        .replace(/\bDE\b/gi, 'OF')
        .replace(/\bDA\b/gi, 'OF')
        .replace(/\bDO\b/gi, 'OF')
        .replace(/\bDOS\b/gi, 'OF')
        .replace(/\bDAS\b/gi, 'OF')
        .replace(/\bPARA\b/gi, 'FOR')
        .replace(/\bCOM\b/gi, 'WITH')
        .replace(/\bEM\b/gi, 'IN')
        .replace(/\bE\b/gi, 'AND')

      // Limpar espaços duplos
      trans = trans.replace(/\s+/g, ' ').trim()

      // Montar de volta código se houver
      if (codePart) {
        return codePart + ' - ' + trans
      }
      return trans
    }

    // Carregar todos os documentos
    var docs = []
    try {
      docs = app.findRecordsByFilter('documents', "id != ''", 'created', 10000, 0)
    } catch (err) {
      console.log('Migration 0105: Failed to load documents: ' + err)
      return
    }

    var updatedFamilyCount = 0
    var updatedTitleEnCount = 0
    var countFamA = 0
    var countFamB = 0

    for (var i = 0; i < docs.length; i++) {
      var d = docs[i]
      var needsSave = false

      var currentFamily = (d.getString('template_family') || '').trim()
      var currentTitleEn = (d.getString('title_en') || '').trim()
      var title = (d.getString('title') || '').trim()
      var prefix = (d.getString('prefix') || '').trim().toUpperCase()

      // (a) template_family dos documentos com o campo vazio
      if (!currentFamily) {
        var newFamily = ''
        if (
          prefix === 'PR-CQ' ||
          prefix.startsWith('PR-CQ') ||
          prefix === 'PR CQ' ||
          prefix.startsWith('PR CQ')
        ) {
          newFamily = FAMILY_A
          countFamA++
        } else {
          // LP, CDE, CQS, ASME e qualquer outro restante sem família -> Família B
          newFamily = FAMILY_B
          countFamB++
        }

        d.set('template_family', newFamily)
        needsSave = true
        updatedFamilyCount++
      }

      // (b) title_en: para cada documento com title_en vazio
      if (!currentTitleEn) {
        var translated = translateTitleToEn(title)
        if (!translated) {
          translated = title // Fallback seguro para nunca ficar vazio
        }
        d.set('title_en', translated)
        needsSave = true
        updatedTitleEnCount++
      }

      if (needsSave) {
        try {
          app.save(d)
        } catch (saveErr) {
          console.log('Migration 0105: Error saving doc id ' + d.id + ': ' + saveErr)
        }
      }
    }

    console.log('Migration 0105 executed successfully:')
    console.log('- Total documents examined: ' + docs.length)
    console.log(
      '- template_family populated: ' +
        updatedFamilyCount +
        ' (Family A: ' +
        countFamA +
        ', Family B: ' +
        countFamB +
        ')',
    )
    console.log('- title_en populated: ' + updatedTitleEnCount)
  },
  (app) => {
    // Revert deliberadamente no-op
  },
)
