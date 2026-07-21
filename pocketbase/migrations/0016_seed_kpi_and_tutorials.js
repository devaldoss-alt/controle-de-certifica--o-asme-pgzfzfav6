migrate(
  (app) => {
    var indCol = app.findCollectionByNameOrId('indicators')
    var companyId = ''
    try {
      companyId = app.findFirstRecordByData('companies', 'name', 'PSC Industria').id
    } catch (_) {}

    var managerId = ''
    try {
      managerId = app.findFirstRecordByData('users', 'role', 'Manager').id
    } catch (_) {}

    var indicators = [
      {
        title: 'ISC - Indice de Satisfacao do Cliente',
        formula: 'ISC = (Total de Pontos Obtidos / Total de Clientes Avaliados) x 100',
        target: 90,
        current: 85,
        unit: '%',
        period: 'Semestral',
      },
      {
        title: 'HHT - Horas Homem Trabalhadas',
        formula: 'HHT = Soma de horas trabalhadas por todos os colaboradores no periodo',
        target: 8000,
        current: 8200,
        unit: 'h',
        period: 'Monthly',
      },
      {
        title: 'ADC - Auditorias Concluidas no Prazo',
        formula: 'ADC = (Auditorias Concluidas no Prazo / Total de Auditorias Planejadas) x 100',
        target: 95,
        current: 92,
        unit: '%',
        period: 'Annual',
      },
      {
        title: 'IRPI - Indice de Rendimento da Producao Industrial',
        formula: 'IRPI = (Producao Realizada / Producao Planejada) x 100',
        target: 92,
        current: 94,
        unit: '%',
        period: 'Monthly',
      },
      {
        title: 'INCF - Indice de Nao Conformidades por Falha',
        formula: 'INCF = Total de Nao Conformidades Registradas no periodo (menor = melhor)',
        target: 3,
        current: 2,
        unit: 'pts',
        period: 'Monthly',
      },
      {
        title: 'RAE - Recuperacao e Aproveitamento de Equipamentos',
        formula: 'RAE = (Equipamentos Recuperados / Total de Equipamentos Avaliados) x 100',
        target: 80,
        current: 75,
        unit: '%',
        period: 'Annual',
      },
    ]

    for (var i = 0; i < indicators.length; i++) {
      var ind = indicators[i]
      try {
        app.findFirstRecordByData('indicators', 'title', ind.title)
      } catch (_) {
        var rec = new Record(indCol)
        rec.set('title', ind.title)
        rec.set('formula_description', ind.formula)
        rec.set('target_value', ind.target)
        rec.set('current_value', ind.current)
        rec.set('unit', ind.unit)
        rec.set('period', ind.period)
        if (managerId) rec.set('responsible', managerId)
        if (companyId) rec.set('company_id', companyId)
        app.save(rec)
      }
    }

    var tutorials = {
      'ISO 9001 Cl. 4.1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Realize uma analise SWOT identificando fatores internos (recursos, cultura, infraestrutura) e externos (mercado, regulamentacoes, concorrencia).</p><p><strong>2.</strong> Documente os resultados em ata de reuniao estrategica.</p><p><strong>3.</strong> Revise periodicamente (minimo semestral).</p><p><strong>Referencia: PSGQ 4.0 - Contexto da Organizacao</strong></p>',
      'ISO 9001 Cl. 4.3':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Defina os limites do SGQ com base nos produtos e servicos oferecidos.</p><p><strong>2.</strong> Considere plantas, unidades e processos incluidos.</p><p><strong>3.</strong> Documente o escopo no Manual da Qualidade (MN-AD-001).</p><p><strong>4.</strong> Obtenha aprovacao da Diretoria.</p><p><strong>Referencia: PSGQ 4.3 - Escopo do SGQ</strong></p>',
      'ISO 9001 Cl. 5.1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Participe das reunioes estrategicas de qualidade.</p><p><strong>2.</strong> Garanta que a politica da qualidade seja comunicada a toda a organizacao.</p><p><strong>3.</strong> Aloque recursos necessarios para o SGQ.</p><p><strong>4.</strong> Conduza analises criticas pela direcao (minimo anual).</p><p><strong>Referencia: PSGQ 5.0 / 5.1 - Lideranca e Comprometimento</strong></p>',
      'ISO 9001 Cl. 5.2':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Revise a Politica da Qualidade atual.</p><p><strong>2.</strong> Garanta que esteja alinhada com os objetivos estrategicos.</p><p><strong>3.</strong> Comunique a politica em murais, intranet e reunioes.</p><p><strong>4.</strong> Obtenha evidencias de comunicacao (atas, registros de treinamento).</p><p><strong>Referencia: PSGQ 5.2 - Politica da Qualidade</strong></p>',
      'ISO 9001 Cl. 6.1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Liste todos os processos do SGQ.</p><p><strong>2.</strong> Para cada processo, identifique riscos e oportunidades.</p><p><strong>3.</strong> Defina acoes para mitigar riscos e aproveitar oportunidades.</p><p><strong>4.</strong> Documente na Matriz de Riscos e Oportunidades.</p><p><strong>Referencia: PSGQ 6.0 / 6.1 - Planejamento</strong></p>',
      'ISO 9001 Cl. 6.2':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Estabeleca objetivos mensuraveis por departamento.</p><p><strong>2.</strong> Defina prazos, responsaveis e recursos necessarios.</p><p><strong>3.</strong> Documente no Plano de Objetivos da Qualidade.</p><p><strong>4.</strong> Monitore trimestralmente e ajuste conforme necessario.</p><p><strong>Referencia: PSGQ 6.2 - Objetivos da Qualidade</strong></p>',
      'ISO 9001 Cl. 7.1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Identifique as necessidades de recursos (humanos, infraestrutura, ambiente).</p><p><strong>2.</strong> Verifique disponibilidade orcamentaria.</p><p><strong>3.</strong> Solicite alocacao formal a Diretoria.</p><p><strong>4.</strong> Monitore a utilizacao dos recursos.</p><p><strong>Referencia: PSGQ 7.0 / 7.1 - Recursos</strong></p>',
      'ISO 9001 Cl. 7.2':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Levante as competencias necessarias por funcao.</p><p><strong>2.</strong> Compare com as competencias atuais da equipe.</p><p><strong>3.</strong> Elabore plano de treinamento para as lacunas identificadas.</p><p><strong>4.</strong> Avalie a eficacia dos treinamentos realizados.</p><p><strong>Referencia: PSGQ 7.2 - Competencia e Treinamento</strong></p>',
      'ISO 9001 Cl. 7.5':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Inventarie todos os documentos do SGQ.</p><p><strong>2.</strong> Verifique revisoes atualizadas e controle de obsoletos.</p><p><strong>3.</strong> Garanta acesso aos documentos pertinentes nos pontos de uso.</p><p><strong>4.</strong> Mantenha registros de distribuicao e atualizacao.</p><p><strong>Referencia: PSGQ 7.5 - Informacoes Documentadas</strong></p>',
      'ISO 9001 Cl. 8.1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Para cada Ordem de Servico, defina criterios de aceitacao.</p><p><strong>2.</strong> Elabore Plano de Inspecao e Teste (ITP).</p><p><strong>3.</strong> Controle os processos conforme WPS e procedimentos.</p><p><strong>4.</strong> Mantenha registros de conformidade em arquivo.</p><p><strong>Referencia: PSGQ 8.0 / 8.1 - Controle Operacional</strong></p>',
      'ISO 9001 Cl. 8.7':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Identifique a nao conformidade e isole o produto.</p><p><strong>2.</strong> Registre no Relatorio de Nao Conformidade (RNC).</p><p><strong>3.</strong> Defina disposicao (retrabalho, reparo, refugo, aceitacao sob concessao).</p><p><strong>4.</strong> Verifique a eficacia da acao corretiva.</p><p><strong>Referencia: PSGQ 8.7 - Controle de Saidas Nao Conformes</strong></p>',
      'ISO 9001 Cl. 9.1':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Defina os indicadores a serem monitorados (ISC, HHT, ADC, IRPI, INCF, RAE).</p><p><strong>2.</strong> Colete dados mensalmente das fontes pertinentes.</p><p><strong>3.</strong> Calcule os indicadores e compare com as metas.</p><p><strong>4.</strong> Apresente os resultados na Analise Critica pela Direcao.</p><p><strong>Referencia: PSGQ 9.0 / 9.1 - Monitoramento e Medicao</strong></p>',
      'ISO 9001 Cl. 9.2':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Elabore o Programa Anual de Auditorias Internas.</p><p><strong>2.</strong> Selecione auditores qualificados e independentes do processo.</p><p><strong>3.</strong> Execute a auditoria conforme check-list estabelecido.</p><p><strong>4.</strong> Elabore relatorio, identifique nao conformidades e acompanhe acoes corretivas.</p><p><strong>Referencia: PSGQ 9.2 - Auditorias Internas</strong></p>',
      'ISO 9001 Cl. 9.3':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Prepare pauta incluindo resultados de auditorias, indicadores e NCs.</p><p><strong>2.</strong> Conduza reuniao com Diretoria e liderancas.</p><p><strong>3.</strong> Registre decisoes e acoes em ata formal.</p><p><strong>4.</strong> Acompanhe a implementacao das acoes definidas.</p><p><strong>Referencia: PSGQ 9.3 - Analise Critica pela Direcao</strong></p>',
      'ISO 9001 Cl. 10.2':
        '<h3>Como Realizar</h3><p><strong>1.</strong> Registre a nao conformidade no RNC.</p><p><strong>2.</strong> Investigue a causa raiz (diagrama de Ishikawa, 5 Porques).</p><p><strong>3.</strong> Defina e implemente acao corretiva.</p><p><strong>4.</strong> Verifique a eficacia e atualize procedimentos se necessario.</p><p><strong>Referencia: PSGQ 10.0 / 10.2 - Nao Conformidades e Acoes Corretivas</strong></p>',
    }

    var checklists = app.findRecordsByFilter('checklists', "id != ''", 'created', 200, 0)
    for (var j = 0; j < checklists.length; j++) {
      var cl = checklists[j]
      var ref = cl.getString('mcq_ref')
      if (ref && tutorials[ref] && !cl.getString('tutorial')) {
        cl.set('tutorial', tutorials[ref])
        app.save(cl)
      }
    }
  },
  (app) => {
    try {
      app.truncateCollection(app.findCollectionByNameOrId('indicators'))
    } catch (_) {}
  },
)
