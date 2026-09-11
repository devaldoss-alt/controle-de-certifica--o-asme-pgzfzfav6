migrate(
  (app) => {
    // 1. Atualiza PSGQ 7.2 (Família A SGQ em Português)
    const psgqHtmlContent = `
<h2>2. OBJETIVO</h2>
<p>Definir a competência e identificar requisitos de treinamento (ou outras ações) para alcançar a competência necessária do pessoal cujas responsabilidades se enquadram no escopo do Sistema de Gestão da Qualidade, bem como assegurar a gestão de recursos.</p>

<h2>3. REFERÊNCIA</h2>
<ul>
  <li>ABNT NBR ISO 9001</li>
  <li>FSGQ 5.0-8 Mapa de Processos</li>
  <li>FSGQ 5.0-10 Organograma</li>
  <li>ITSGQ 7.2-1 Capacitação Introdutória</li>
  <li>PSGQ 7.5 Informação Documentada</li>
</ul>

<h2>4. ABREVIATURAS / DEFINIÇÕES</h2>
<ul>
  <li><strong>SGQ</strong> - Sistema de Gestão da Qualidade</li>
  <li><strong>FSGQ</strong> - Formulários do SGQ</li>
  <li><strong>RH</strong> - Recursos Humanos</li>
  <li><strong>GQ</strong> - Gestor da Qualidade</li>
  <li><strong>PCMSO</strong> - Programa de Controle Médico de Saúde Ocupacional</li>
</ul>

<h2>5. PROCEDIMENTO</h2>

<h3>5.1 Provisão de Recursos</h3>
<p>O Gestor da Qualidade, em conjunto com a Direção, identifica e distribui os recursos necessários para o desenvolvimento, estabelecimento, implementação, manutenção e melhoria contínua da eficácia do SGQ e lista-os no FSGQ 5.0-4 Plano de Investimento. Esta avaliação leva em conta as capacidades e restrições de recursos internos existentes e o que precisa ser adquirido de provedores externos. O Diretor analisa criticamente e aprova este plano anual de investimento, podendo o mesmo, ser revisado conforme as necessidades e circunstâncias da Empresa.</p>

<h4>5.1.1 Pessoas</h4>
<p>Os formulários FSGQ 5.0-3 Descrição de cargos, FSGQ 5.0-10 Organograma e FSGQ 5.0-8 Mapa de Processos evidenciam e determinam a provisão de pessoas necessárias para a implementação eficaz do SGQ e para a operação e controle dos processos.</p>

<h3>5.2 Competência de Pessoal</h3>
<p>A Assistente de RH e/ou GQ identificam as competências necessárias aos cargos e funções com base na educação, treinamento, habilidades e experiência que estão determinadas no formulário FSGQ 5.0-3 Descrição de Cargos. Estas competências são relevantes para atender os requisitos dos produtos e dos clientes e para execução dos trabalhos que afetam a conformidade do produto, o desempenho e a eficácia do Sistema de Gestão da Qualidade.</p>
<p>A Assistente de RH e a Direção, em conjunto com o Gestor da Qualidade, estabelecem as responsabilidades e autoridades pertinentes ao cargo e que são comunicadas e entendidas por todos os funcionários da PSC.</p>

<h4>5.2.1 Capacitação e Qualificação Profissional</h4>
<p>Quando identificado a necessidade de contratação de pessoal, capacitação e qualificação profissional, a assistente de RH segue a ITSGQ 7.2-1 Capacitação Introdutória.</p>
<p>Quando se contrata um funcionário a assistente de RH preenche o formulário FSGQ 7.2-2 Ficha Cadastral do Funcionário avaliando e registrando o atendimento as competências necessárias para a função.</p>
<p><strong>Nota:</strong> Nos casos em que o candidato selecionado ou colaboradores já atuantes na PSC não atendam plenamente aos critérios estabelecidos na Descrição de Cargos, a Assistente de RH deverá justificar a contratação ou permanência no cargo. Para novos colaboradores, a justificativa deverá ser registrada no FSGQ 7.2-2 – Ficha Cadastral do Funcionário. Para colaboradores já em exercício de suas atividades, deverá ser realizado o registro da avaliação de qualificação no FSGQ 7.2-5 – Atestado de Qualificação do Colaborador, indicando se houve ou não êxito na qualificação. Nesses casos, deverão ser providenciados os treinamentos necessários para assegurar a adequada qualificação do colaborador.</p>

<h3>5.3 Treinamento e Conscientização</h3>
<p>O Gestor da Qualidade e/ou líder direto asseguram a conscientização dos funcionários através de treinamentos e outras ações, que promovem sua competência nas atividades do SGQ e em sua formação profissional, para garantir que seu pessoal esteja ciente da relevância e importância de suas atividades e de como elas contribuem para o alcance dos objetivos de qualidade.</p>
<p>A ITSGQ 7.2-2 Capacitação Introdutória descreve um conteúdo mínimo e essencial para a capacitação dos funcionários da PSC e de novos integrantes, visando alcançar a competência necessária do pessoal cujas responsabilidades se enquadram no escopo do Sistema de Gestão da Qualidade.</p>

<h4>5.3.1 Levantamento da Necessidade e Solicitação de Treinamento</h4>
<p>O GQ realiza o levantamento das necessidades e solicitações de treinamento através do FSGQ 7.2-4 Levantamento da Necessidade de Treinamento / Solicitação de Treinamento tendo como entradas para o levantamento:</p>
<ol>
  <li>Treinamento no Sistema de Gestão da Qualidade e Treinamento técnico</li>
  <li>Treinamento especificado pelo cliente e/ou fornecido pelo cliente, quando requerido em contrato</li>
  <li>Treinamento admissional</li>
  <li>Adequação a Descrição de Cargos</li>
  <li>Relatórios de Ação Preventiva e Corretiva</li>
  <li>Desempenho dos funcionários</li>
</ol>
<p>Este levantamento de treinamento serve de base para o Plano de Treinamento.</p>

<h4>5.3.2 Plano de Treinamento</h4>
<p>O GQ identifica anualmente os treinamentos, a frequência e o conteúdo dos treinamentos através do FSGQ 7.2-1 Plano de Treinamento.</p>
<p>A necessidade de treinamentos é definida conforme os seguintes critérios: estabelecidos no procedimento de Informação Documentada PSGQ 7.5; alterações em processos, técnicas ou equipamentos; admissão de colaboradores; ou necessidade de retreinamento. Eventualmente, podem ser estabelecidas periodicidades anuais ou semestrais para reciclagem de conhecimentos ou atendimento a requisitos normativos específicos.</p>
<p>A Diretoria avalia quais treinamentos devem ser aprovados, reprogramados ou cancelados.</p>
<p>O GQ prepara o Plano de Treinamento (FSGQ 7.2-1) com os treinamentos aprovados pela Direção.</p>
<p>As capacitações elaboradas fora do plano de treinamento são registradas em lista de presença e/ou certificado de órgão externo.</p>

<h4>5.3.3 Execução e Registro do Treinamento</h4>
<p>O GQ após execução do treinamento interno, registra o evento na Lista de Presença e Avaliação do Treinamento (FSGQ 7.2-3).</p>

<h4>5.3.4 Avaliação da eficácia dos treinamentos</h4>
<p>A avaliação da eficácia dos treinamentos é realizada, preferencialmente, 2 (dois) meses após a sua realização, ou em prazo definido internamente conforme a necessidade do processo, por meio do FSGQ 7.2-3 – Lista de Presença e Avaliação do Treinamento. Os líderes imediatos têm autoridade e responsabilidade por essa avaliação, podendo o Gestor da Qualidade também realizá-la quando necessário.</p>
<p>A eficácia poderá ser medida por meio do desempenho operacional com base no relatório de apontamento da produção.</p>
<p>Treinamentos avaliados como ineficazes podem ser repetidos ou tomadas outras ações a critério da Direção, a depender da sua criticidade.</p>

<h3>5.4 Infraestrutura e Ambiente de Trabalho</h3>
<p>A Direção determina, proporciona, gerencia e mantém uma infraestrutura propícia a operação de todos os seus processos, como suporte às atividades laborais para o alcance da conformidade dos produtos e serviços. Esta infraestrutura inclui:</p>
<ul>
  <li>Instalações e utilidades associadas;</li>
  <li>Equipamentos de processos e sua manutenção;</li>
  <li>Recursos para transporte, serviços de suporte (comunicação, sistemas de informação);</li>
  <li>Atendimento às exigências de cada função quanto aos requisitos legais, físicos e ambientais ou outros fatores.</li>
</ul>
<p>A Direção proporciona um ambiente de trabalho saudável, baseado no respeito ao bem-estar social, psicológico e físico de seus funcionários.</p>
<p>A Direção, ainda, avalia a necessidade de ajuste dos processos, novos equipamentos e alterações/revisões, juntamente com GQ e setores envolvidos, na reunião de Análise Crítica pela Direção ou quando julgar necessário.</p>
<p>O setor de Recursos Humanos disponibiliza caixa de sugestões para que os colaboradores possam registrar opiniões, sugestões e oportunidades de melhoria. As manifestações recebidas são consideradas pelo RH nos processos de acompanhamento e melhoria interna.</p>
<p>As ações disciplinares poderão ser aplicadas de forma gradual, conforme a natureza e a recorrência da ocorrência, podendo incluir:</p>
<ul>
  <li><strong>1ª ocorrência:</strong> advertência verbal;</li>
  <li><strong>2ª ocorrência:</strong> advertência por escrito;</li>
  <li><strong>3ª ocorrência:</strong> suspensão de 1 (um) dia;</li>
  <li><strong>4ª ocorrência:</strong> demissão por justa causa, conforme aplicabilidade e legislação vigente.</li>
</ul>
<p>A empresa reserva-se o direito de aplicar a medida disciplinar considerada adequada conforme a gravidade da ocorrência.</p>
<p>As ações disciplinares são controladas e registradas por meio do Formulário de Controle de Advertências FSGQ 7.2-9.</p>

<h2>6. AUTORIDADE E RESPONSABILIDADE</h2>
<ul>
  <li><strong>Diretoria:</strong> Aprovar o plano anual de investimento (FSGQ 5.0-4), avaliar e aprovar, reprogramar ou cancelar os treinamentos do Plano de Treinamento, decidir ações para treinamentos ineficazes, prover e manter a infraestrutura e o ambiente de trabalho, realizar a Análise Crítica pela Direção, assegurar a provisão de recursos necessários para o SGQ, promover a eficácia e a melhoria contínua do Sistema de Gestão da Qualidade e garantir o atendimento aos requisitos legais, regulamentares e dos clientes.</li>
  <li><strong>Gestor da Qualidade (GQ):</strong> Identificar necessidades de recursos junto com a Diretoria, realizar o levantamento das necessidades de treinamento (FSGQ 7.2-4), elaborar e gerenciar o Plano Anual de Treinamento (FSGQ 7.2-1), executar e registrar treinamentos internos, avaliar a eficácia dos treinamentos em conjunto com os líderes imediatos, assegurar a conscientização dos funcionários em relação ao SGQ, identificar competências necessárias para os cargos, monitorar a eficácia das ações de treinamento, manter registros de competência e treinamento e coordenar a implementação dos requisitos do SGQ relacionados à competência e treinamento.</li>
  <li><strong>Assistente de RH:</strong> Realizar o processo de recrutamento e seleção, preencher a Ficha Cadastral do Funcionário (FSGQ 7.2-2), avaliar competências de candidatos e funcionários, aplicar a Capacitação Introdutória (ITSGQ 7.2-1), justificar contratações ou permanências quando necessário, manter atualizadas as pastas funcionais com diplomas, certificados e registros profissionais, gerenciar a Caixa de Sugestões e ações disciplinares.</li>
  <li><strong>Líderes Imediatos:</strong> Avaliar a eficácia dos treinamentos de seus subordinados (FSGQ 7.2-3), identificar e ministrar necessidades específicas de treinamento de suas equipes, acompanhar a aplicação dos conhecimentos adquiridos no dia a dia e informar o desempenho dos funcionários relacionado à competência.</li>
  <li><strong>Colaboradores:</strong> Participar dos treinamentos obrigatórios, aplicar os conhecimentos adquiridos em suas atividades, contribuir para o alcance dos objetivos da qualidade, comunicar necessidades de treinamento ou melhoria e cumprir os procedimentos e instruções estabelecidos.</li>
</ul>

<h2>7. REGISTROS</h2>
<p>FSGQ 5.0-4 Plano de Investimento; FSGQ 5.0-3 Descrição de Cargos; FSGQ 7.2-1 Plano de Treinamento; FSGQ 7.2-2 Ficha Cadastral do Funcionário; FSGQ 7.2-3 Lista Presença e Avaliação do Treinamento; FSGQ 7.2-4 Levantamento da Necessidade de Treinamento/Solicitação de Treinamento; FSGQ 7.2-5 Atestado de Qualificação do Colaborador; FSGQ 7.2-7 Advertência Disciplinar; FSGQ 7.2-9 Controle de Advertências; FSGQ 7.2-10 Formulário da Caixa de Sugestões.</p>

<h2>8. ANEXOS</h2>
<p>Não se aplica.</p>
`

    const psgqRevs = JSON.stringify([
      {
        revision: '00',
        date: '05.06.2023',
        changes: 'Primeira emissão – conforme norma NBR ISO 9001:2015.',
        preparedBy: 'Devaldo Silva',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '01',
        date: '03.07.2025',
        changes: 'Revisão mudança da Logomarca da PSC.',
        preparedBy: 'Laira Menezes',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '02',
        date: '21.05.2025',
        changes:
          'Alteração da Gestora da Qualidade e item 3, 5.1, 5.2, 5.2.1, 5.3, 5.3.2, 5.3.4, 5.4, 6, 7 e 8, exclusão de texto no item 5.2 e 5.3.3.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
    ])

    // Aplica para registros com prefixo PSGQ e código 7.2
    const psgqRecords = app.findRecordsByFilter('documents', "prefix = 'PSGQ' && code = '7.2'")
    for (const doc of psgqRecords) {
      doc.set('content', psgqHtmlContent)
      doc.set('revision', '02')
      doc.set('template_family', 'SGQ — Português (PSGQ/FSGQ/ITSGQ)')
      doc.set('prepared_by', 'Roberta Junqueira /\nGestora da Qualidade')
      doc.set('approved_by', 'Marcos Maciel /\nDiretor')
      doc.set('revision_history', psgqRevs)
      app.save(doc)
    }

    // 2. Atualiza CDE-PSC-01 (Família B Técnico / CQ Bilíngue)
    const cdePtContent = `
<h2>1. OBJETIVO:</h2>
<p>Este procedimento visa estabelecer a sistemática para execução do controle dimensional durante as etapas de fabricação, montagem e inspeção de equipamentos industriais, assegurando que todas as dimensões, alinhamentos, níveis, tolerâncias geométricas e características construtivas estejam em conformidade com os desenhos aprovados, normas aplicáveis, especificações técnicas e requisitos do cliente.</p>

<h2>2. CAMPO DE APLICAÇÃO:</h2>
<p>A aplicação deste procedimento é restrita a fabricação/montagem e inspeção de equipamentos.</p>

<h2>3. RESPONSABILIDADES:</h2>
<p>A responsabilidade pela inspeção dimensional inicial, ou seja, antes da soldagem e dimensional final, após soldagem dos conjuntos fabricados e a análise dos resultados encontrados é de responsabilidade do inspetor.</p>

<h2>4. DOCUMENTOS DE REFERÊNCIA:</h2>
<ul>
  <li>ASME Seção VIII, Div. 1 e 2</li>
  <li>NBIC – Código Nacional de Inspeção do Conselho</li>
  <li>Normas Petrobras N-115, N-268, N-269, N-381, N-1710, N-1852 e N-2511;</li>
  <li>Normas API 620 e 650 / AWS D1.1; DIN Standards 13920, 2768-1, 2768-2 and 10029</li>
  <li>Norma Tema 10 Edição.</li>
</ul>

<h2>5. RESPONSABILIDADES:</h2>
<h3>5.1 SUPERVISOR:</h3>
<p>Garantir disponibilidade de recursos para a fabricação/montagem dos equipamentos, materiais, equipamentos e recursos humanos, Orientar o encarregado;</p>

<h3>5.2 ENCARREGADO:</h3>
<p>Atentar para que todas as etapas descritas nesse procedimento sejam cumpridas.</p>

<h3>5.3 INSPETOR:</h3>
<p>Aferir com a inspeção dimensional os componentes fabricados conforme projeto, normas e critérios de aceitação; acompanhar e verificar a calibração dos instrumentos de testes e medições; verificar as condições dos instrumentos; verificar estocagem e armazenamento das chapas, perfis, tubos, flanges, válvulas e conexões.</p>

<h2>6. DESENVOLVIMENTO:</h2>
<h3>6.1 CONSIDERAÇÕES GERAIS:</h3>
<p>Todas as partes dos equipamentos devem ser montados de acordo com a orientação estabelecida no projeto.</p>
<p>Devem ser utilizados pontos de solda com as seguintes características no ajuste e montagem das chapas:</p>
<ul>
  <li>Comprimento dos pontos – mínimo 20 mm.</li>
  <li>A distância entre os pontos deve ser de no máximo 400 mm.</li>
</ul>
<p><em>Nota: Os pontos de solda devem ser removidos na operação de goivagem. Se os mesmos forem incorporados à solda final devem ser feitos ensaios visuais e de líquido penetrante. Não é permitida a remoção dos acessórios por meio de impacto. A solda deverá ser removida por corte com grafite e esmerilhamento para evitar arrancamento do metal de base.</em></p>

<h2>7. CONDIÇÕES EXIGÍVEIS PARA A FABRICAÇÃO DE VASOS / FEIXE TUBULAR:</h2>
<p>Após a fabricação, deve ser realizada inspeção dimensional completa com emissão de relatório específico contemplando todas as dimensões aplicáveis ao equipamento, referenciadas no Anexo A, Figura A.1, N-268 em sua última revisão, incluindo as dimensões requeridas, os valores encontrados e suas respectivas tolerâncias permitidas pela Figura A.1.</p>
`

    const cdeEnContent = `
<h2>1. OBJECTIVE:</h2>
<p>This procedure aims to establish a systematic approach for performing dimensional control during the manufacturing, assembly, and inspection stages of industrial equipment, ensuring that all dimensions, alignments, levels, geometric tolerances, and construction characteristics conform to approved drawings, applicable standards, technical specifications, and customer requirements.</p>

<h2>2. FIELD OF APPLICATION:</h2>
<p>The application of this procedure is restricted to the manufacturing/assembly and inspection of equipment.</p>

<h2>3. RESPONSIBILITIES:</h2>
<p>The responsibility for the initial dimensional inspection, that is, before welding and final dimensional inspection after welding of the manufactured assemblies and the analysis of the results found is the responsibility of the inspector.</p>

<h2>4. REFERENCE DOCUMENTS:</h2>
<ul>
  <li>ASME Section VIII, Div. 1 and 2</li>
  <li>NBIC - National Board Inspection Code</li>
  <li>Petrobras Standards N-115, N-268, N-269, N-381, N-1710, N-1852 and N-2511;</li>
  <li>API Standards 620 and 650 / AWS D1.1; DIN Standards 13920, 2768-1, 2768-2 and 10029</li>
  <li>TEMA Standards 10th Edition.</li>
</ul>

<h2>5. RESPONSIBILITIES:</h2>
<h3>5.1 SUPERVISOR:</h3>
<p>Ensure availability of resources for the manufacture/assembly of equipment, materials, equipment, and human resources. Provide guidance to the supervisor;</p>

<h3>5.2 SUPERVISOR / FOREMAN:</h3>
<p>Ensure that all steps described in this procedure are followed.</p>

<h3>5.3 INSPECTOR:</h3>
<p>Perform dimensional inspection on manufactured components according to the design, standards, and acceptance criteria; Monitor and verify the calibration of test and measurement instruments; Check the condition of the instruments; Check the storage and storage of plates, profiles, pipes, flanges, valves, and fittings.</p>

<h2>6. DEVELOPMENT:</h2>
<h3>6.1 GENERAL CONSIDERATIONS:</h3>
<p>All equipment parts must be assembled according to the guidelines established in the design.</p>
<p>Weld points with the following characteristics must be used when adjusting and assembling the plates:</p>
<ul>
  <li>Length of points – minimum 20 mm.</li>
  <li>The distance between points must be a maximum of 400 mm. Minimum.</li>
</ul>
<p><em>Note: The weld points must be removed in the gouging operation. If they are incorporated into the final weld, visual and liquid penetrant tests must be performed. Removal of accessories by impact is not permitted.</em></p>

<h2>7. REQUIRED CONDITIONS FOR VESSEL / TUBE BUNDLE MANUFACTURING:</h2>
<p>After manufacturing, a complete dimensional inspection must be performed with issuance of a specific report covering all dimensions applicable to the equipment, referenced in Annex A, Figure A.1, N-268 in its latest revision, including the required dimensions, found values and their respective tolerances permitted by Figure A.1.</p>
`

    const cdeRevs = JSON.stringify([
      {
        revision: '0',
        date: '10/06/2022',
        changes: 'ORIGINAL ISSUE / EMISSÃO ORIGINAL',
        preparedBy: 'RÔMULO DO NASCIMENTO',
        verifiedBy: 'GERALDO TIMÓTEO',
        approvedBy: 'RÔMULO DO NASCIMENTO',
      },
      {
        revision: '1',
        date: '21/02/2025',
        changes: 'REGULATORY REVIEW / REVISÃO NORMATIVA',
        preparedBy: 'RÔMULO DO NASCIMENTO',
        verifiedBy: 'GERALDO TIMÓTEO',
        approvedBy: 'RÔMULO DO NASCIMENTO',
      },
      {
        revision: '2',
        date: '08/12/2025',
        changes:
          'GENERAL REVIEW TO COMPLY WITH ASME STANDARDS / REVISÃO GERAL PARA ATENDIMENTO À NORMA ASME',
        preparedBy: 'RÔMULO DO NASCIMENTO',
        verifiedBy: 'GERALDO TIMÓTEO',
        approvedBy: 'RÔMULO DO NASCIMENTO',
      },
      {
        revision: '3',
        date: '20/05/2026',
        changes:
          'UPDATED IN ACCORDANCE WITH REVISED STANDARDS. ATUALIZAÇÃO CONFORME REVISÃO NORMAS.',
        preparedBy: 'RÔMULO DO NASCIMENTO',
        verifiedBy: 'GERALDO TIMÓTEO',
        approvedBy: 'RÔMULO DO NASCIMENTO',
      },
    ])

    const cdeRecords = app.findRecordsByFilter(
      'documents',
      "prefix = 'CDE' && (code = '1' || code = 'PSC-01')",
    )
    for (const doc of cdeRecords) {
      doc.set('title', 'Procedimento de Controle Dimensional')
      doc.set('title_en', 'Dimensional Control Procedure')
      doc.set('content', cdePtContent)
      doc.set('content_en', cdeEnContent)
      doc.set('code', 'PSC-01')
      doc.set('revision', '03')
      doc.set('template_family', 'Técnico/CQ — Bilíngue (CDE)')
      doc.set(
        'inspector_qualification',
        'PROCEDIMENTO QUALIFICADO E DE ACORDO COM AS REGRAS DAS NORMAS ASME VIII; TEMA E N268.\nRÔMULO DO NASCIMENTO SNQC/END\nNÍVEL 2 Nº 16482 (CD-CL)',
      )
      doc.set('prepared_by', 'RÔMULO DO NASCIMENTO')
      doc.set('verified_by', 'GERALDO TIMÓTEO')
      doc.set('approved_by', 'RÔMULO DO NASCIMENTO')
      doc.set('revision_history', cdeRevs)
      app.save(doc)
    }
  },
  (app) => {},
)
