migrate(
  (app) => {
    var asmeTutorials = {
      'ASME Sec I':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Verifique a categoria de construcao da caldeira conforme ASME Sec I.</p><p><strong>2.</strong> Confirme os materiais utilizados estao em conformidade com a especificacao ASME.</p><p><strong>3.</strong> Valide os procedimentos de soldagem (WPS) qualificados conforme ASME Sec IX.</p><p><strong>4.</strong> Registre os ensaios nao destrutivos (END) exigidos e mantenha os relatorios arquivados.</p><p><strong>Referencia: ASME Sec I - Requisitos de Construcao de Caldeiras de Energia</strong></p>',
      'ASME Sec VIII Div 1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Identifique a classe do vaso de pressao e a categoria de servico conforme ASME Sec VIII Div 1.</p><p><strong>2.</strong> Verifique os calculos de espessura e reforco de bocais.</p><p><strong>3.</strong> Confirme a qualificacao de soldadores e WPS conforme ASME Sec IX.</p><p><strong>4.</strong> Execute ensaios hidrostaticos ou pneumaticos conforme exigido.</p><p><strong>5.</strong> Documente o Certificado de Fabricacao ASME U-1 ou U-1A.</p><p><strong>Referencia: ASME Sec VIII Div 1 - Vasos de Pressao</strong></p>',
      'ASME Sec VIII Div 2':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Revise a analise de tensao detalhada (FEA) exigida para vasos Divisao 2.</p><p><strong>2.</strong> Verifique os criterios de falha por tensao adaptativa conforme ASME Sec VIII Div 2.</p><p><strong>3.</strong> Confirme os requisitos de ensaio nao destrutivo adicionais (UT, RT).</p><p><strong>4.</strong> Valide o programa de inspecao em servico conforme apendice 7.</p><p><strong>Referencia: ASME Sec VIII Div 2 - Vasos de Pressao por Analise</strong></p>',
      'ASME Sec IX':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Verifique os procedimentos de soldagem (WPS) estao qualificados conforme ASME Sec IX.</p><p><strong>2.</strong> Confirme os registros de qualificacao de soldadores (WPQ) estao atualizados.</p><p><strong>3.</strong> Valide as variaveis essenciais, nao essenciais e suplementares de cada WPS.</p><p><strong>4.</strong> Mantenha os registros de qualificacao de procedimento (PQR) arquivados.</p><p><strong>5.</strong> Verifique a validade das qualificacoes conforme normas aplicaveis.</p><p><strong>Referencia: ASME Sec IX - Qualificacao de Soldagem e Brasagem</strong></p>',
      'ASME B31.1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Verifique o projeto de tubulacao de potencia conforme ASME B31.1.</p><p><strong>2.</strong> Confirme os requisitos de inspecao e ensaio para juntas soldadas.</p><p><strong>3.</strong> Valide os procedimentos de soldagem e qualificacao de soldadores.</p><p><strong>4.</strong> Execute ensaios nao destrutivos conforme percentual exigido pela norma.</p><p><strong>5.</strong> Documente os relatorios de ensaio e mantenha registros de conformidade.</p><p><strong>Referencia: ASME B31.1 - Tubulacao de Potencia</strong></p>',
      'ASME B31.3':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Classifique o fluido e a categoria de servico conforme ASME B31.3.</p><p><strong>2.</strong> Verifique os criterios de projeto e espessura da tubulacao.</p><p><strong>3.</strong> Confirme os requisitos de examinacao radiografica e other END.</p><p><strong>4.</strong> Valide as qualificacoes de soldagem conforme ASME Sec IX.</p><p><strong>5.</strong> Execute teste de pressao conforme exigido pela categoria do fluido.</p><p><strong>Referencia: ASME B31.3 - Tubulacao de Processo</strong></p>',
      'NBIC Part 1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Realize a inspecao inicial do vaso de pressao conforme NBIC Part 1.</p><p><strong>2.</strong> Verifique a integridade estrutural, corrosao e deformacoes.</p><p><strong>3.</strong> Documente as condicoes encontradas com fotografias e relatorios.</p><p><strong>4.</strong> Classifique as nao conformidades conforme criterios NBIC.</p><p><strong>Referencia: NBIC Part 1 - Inspecao</strong></p>',
      'NBIC Part 2':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Avalie a necessidade de reparo ou alteracao conforme NBIC Part 2.</p><p><strong>2.</strong> Verifique os procedimentos de reparo estao qualificados.</p><p><strong>3.</strong> Confirme os requisitos de ensaio pos-reparo.</p><p><strong>4.</strong> Documente o R-1 Report (Relatorio de Reparo/Alteracao).</p><p><strong>5.</strong> Obtenha aprovacao do Inspecion Autorizado (AI) apos o reparo.</p><p><strong>Referencia: NBIC Part 2 - Reparo e Alteracao</strong></p>',
      'NBIC Part 3':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Verifique os requisitos de alteracao de vaso de pressao conforme NBIC Part 3.</p><p><strong>2.</strong> Confirme os calculos estruturais para a alteracao proposta.</p><p><strong>3.</strong> Valide os procedimentos de soldagem aplicaveis a alteracao.</p><p><strong>4.</strong> Execute ensaios pos-alteracao conforme exigido.</p><p><strong>5.</strong> Atualize o registro do vaso e o R-1 Report.</p><p><strong>Referencia: NBIC Part 3 - Alteracoes</strong></p>',
    }

    var checklists = app.findRecordsByFilter('checklists', "id != ''", 'created', 200, 0)
    for (var j = 0; j < checklists.length; j++) {
      var cl = checklists[j]
      var ref = cl.getString('mcq_ref')
      var title = cl.getString('title')
      var existingTutorial = cl.getString('tutorial')

      if (!existingTutorial) {
        if (ref && asmeTutorials[ref]) {
          cl.set('tutorial', asmeTutorials[ref])
          app.save(cl)
          continue
        }

        var lowerTitle = title.toLowerCase()
        if (lowerTitle.indexOf('asme') !== -1 || lowerTitle.indexOf('nbic') !== -1) {
          var defaultAsmeTutorial =
            '<h3>Como Realizar</h3><p><strong>1.</strong> Consulte a secao aplicavel do codigo ASME/NBIC para o item em questao.</p><p><strong>2.</strong> Verifique os requisitos de projeto, fabricacao e ensaio aplicaveis.</p><p><strong>3.</strong> Confirme as qualificacoes de soldagem e END conforme ASME Sec IX.</p><p><strong>4.</strong> Documente os resultados em relatorios formais e mantenha registros arquivados.</p><p><strong>5.</strong> Obtenha aprovacao do Inspetor Autorizado (AI) quando aplicavel.</p>'
          cl.set('tutorial', defaultAsmeTutorial)
          app.save(cl)
        }
      }
    }
  },
  (app) => {},
)
