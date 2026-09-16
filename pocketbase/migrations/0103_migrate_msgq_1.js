migrate(
  (app) => {
    // -------------------------------------------------------------
    // Migration 0103: Migração do MSGQ-1 (PSC)
    // MANUAL DO SISTEMA DE GESTÃO DA QUALIDADE REV. 07
    // Registro Alvo: y71katw65s3atps (PSC INDÚSTRIA COMÉRCIO E SERVIÇOS LTDA)
    // Registro uvtgldppxm8xljf (Koala) NUNCA é modificado
    // -------------------------------------------------------------

    var TARGET_DOC_ID = 'y71katw65s3atps'
    var TEMPLATE_FAMILY = 'SGQ — Português (PSGQ/FSGQ/ITSGQ)'

    var revisionHistory = JSON.stringify([
      {
        revision: '00',
        date: '10.03.2018',
        changes: 'Emissão inicial do Manual da Qualidade.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '01',
        date: '15.08.2019',
        changes: 'Adequação aos requisitos normativos e revisão de processos.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '02',
        date: '20.02.2020',
        changes: 'Inclusão da política de qualidade e objetivos estratégicos.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '03',
        date: '12.04.2021',
        changes: 'Revisão do organograma e responsabilidades da liderança.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '04',
        date: '11.08.2021',
        changes: 'Adequação aos procedimentos operacionais e gestão de riscos.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '05',
        date: '18.01.2022',
        changes: 'Atualização do mapeamento de processos e cadeia de valor.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '06',
        date: '05.06.2023',
        changes: 'Alinhamento geral conforme norma ABNT NBR ISO 9001:2015.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
      {
        revision: '07',
        date: '10.09.2023',
        changes:
          'Revisão geral do Manual do SGQ, atualização da política da qualidade, integração dos fluxos de fabricação, controle dimensional e critérios de aprovação.',
        preparedBy: 'Roberta Junqueira',
        approvedBy: 'Marcos Maciel',
      },
    ])

    var MSGQ_1_CONTENT = `# MANUAL DO SISTEMA DE GESTÃO DA QUALIDADE: MSGQ-1
## MANUAL DO SGQ

**Sistema de Gestão da Qualidade**  
**Código:** MSGQ-1  
**Revisão:** 07  
**Data de Vigência:** 10/09/2023  
**Empresa:** PSC INDÚSTRIA COMÉRCIO E SERVIÇOS LTDA  
**Classificação:** Interno  

---

### Controle de Aprovação

| Elaboração / Revisão | Data | Aprovação | Data |
| :--- | :---: | :--- | :---: |
| **Roberta Junqueira**<br>Gestora da Qualidade | 10.09.2023 | **Marcos Maciel**<br>Diretor | 10.09.2023 |

---

## 1. HISTÓRICO DE REVISÕES

| REVISÃO | DATA | DESCRIÇÃO DA ALTERAÇÃO | ELABORADO | APROVADO |
| :---: | :---: | :--- | :--- | :--- |
| **00** | 10.03.2018 | Emissão inicial do Manual da Qualidade. | Roberta Junqueira | Marcos Maciel |
| **01** | 15.08.2019 | Adequação aos requisitos normativos e revisão de processos. | Roberta Junqueira | Marcos Maciel |
| **02** | 20.02.2020 | Inclusão da política de qualidade e objetivos estratégicos. | Roberta Junqueira | Marcos Maciel |
| **03** | 12.04.2021 | Revisão do organograma e responsabilidades da liderança. | Roberta Junqueira | Marcos Maciel |
| **04** | 11.08.2021 | Adequação aos procedimentos operacionais e gestão de riscos. | Roberta Junqueira | Marcos Maciel |
| **05** | 18.01.2022 | Atualização do mapeamento de processos e cadeia de valor. | Roberta Junqueira | Marcos Maciel |
| **06** | 05.06.2023 | Alinhamento geral conforme norma ABNT NBR ISO 9001:2015. | Roberta Junqueira | Marcos Maciel |
| **07** | 10.09.2023 | Revisão geral do Manual do SGQ, atualização da política da qualidade, integração dos fluxos de fabricação, controle dimensional e critérios de aprovação. | Roberta Junqueira | Marcos Maciel |

---

## 2. APRESENTAÇÃO DA EMPRESA

A **PSC INDÚSTRIA COMÉRCIO E SERVIÇOS LTDA**, fundada com o objetivo de oferecer soluções completas em caldeiraria pesada, usinagem, soldagem e manutenção de equipamentos industriais, atua com destaque no fornecimento de permutadores de calor, vasos de pressão, feixes tubulares, tanques de armazenamento e estruturas metálicas de alta complexidade.

Localizada estrategicamente com parque fabril equipado para conformação, corte, usinagem de precisão, caldeiraria e montagem, a PSC conta com equipe técnica multidisciplinar qualificada conforme normas nacionais e internacionais aplicáveis aos setores químico, petroquímico, siderúrgico, papel e celulose, geração de energia e sucroalcooleiro.

---

## 3. ESCOPO DO SISTEMA DE GESTÃO DA QUALIDADE

O Sistema de Gestão da Qualidade da PSC abrange:

> **"Projeto, fabricação, montagem, manutenção, reforma e retubagem de equipamentos industriais, caldeiraria pesada, feixes tubulares, permutadores de calor, vasos de pressão, tanques e estruturas correlatas, incluindo serviços de usinagem, soldagem especializada e ensaios não destrutivos."**

### 3.1 Não Aplicabilidades Justificadas
- **Requisito 8.5.1 alínea (f):** Quando a validação e revalidação periódica da capacidade de alcançar resultados planejados não puder ser plenamente verificada por medição ou monitoramento subsequente, a organização qualifica procedimentos específicos (EPS, RQPS) e operadores/soldadores conforme normas ASME Seção IX e AWS.
- **Requisito 8.5.5:** As atividades pós-entrega aplicam-se exclusivamente quando especificadas contratualmente em termos de garantia técnica e assistência técnica operacional.

---

## 4. CONTEXTO DA ORGANIZAÇÃO

### 4.1 Entendimento da Organização e de seu Contexto
A PSC determina fatores internos e externos que afetam sua capacidade de alcançar os resultados pretendidos pelo SGQ através da matriz SWOT (Forças, Oportunidades, Fraquezas e Ameaças) e do procedimento **PSGQ 5.1 (Gerenciamento de Riscos e Contingências)**.

### 4.2 Necessidades e Expectativas das Partes Interessadas
A organização identifica, monitora e analisa criticamente as informações sobre partes interessadas relevantes para o negócio: clientes, colaboradores, acionistas/diretoria, fornecedores, órgãos reguladores (ANP, ASME, ABNT, Ministério do Trabalho) e comunidade local.

### 4.3 Mapeamento de Processos do SGQ
Os processos da PSC são estruturados na seguinte macroarquitetura:
1. **Processos de Direção / Estratégicos:** Liderança, Planejamento Estratégico, Gestão de Riscos e Análise Crítica pela Direção (**PSGQ 5.0, PSGQ 5.1, PSGQ 9.3**).
2. **Processos Principais / Operacionais:** Comercial e Contratos (**PSGQ 8.2**), Engenharia e Projeto (**PSGQ 8.3**), Suprimentos e Qualificação de Fornecedores (**PSGQ 8.4**), PCP e Fabricação (**PSGQ 8.5, ITSGQ 8.5-7**), Inspeção e Ensaios da Qualidade (**PSGQ 8.6, PR-CQ-14, EVS-PSC-01, IT-CQ-08**) e Expedição (**FSGQ 8.6-11**).
3. **Processos de Apoio / Suporte:** Recursos Humanos, Treinamento e Competência (**PSGQ 7.2, FSGQ 7.2-1**), Manutenção e Infraestrutura (**PSGQ 7.1**), Calibração de Instrumentos (**PSGQ 7.1.5**) e Informação Documentada (**PSGQ 7.5**).

---

## 5. LIDERANÇA E COMPROMISSO

### 5.1 Comprometimento da Alta Direção
A Alta Direção da PSC demonstra liderança e compromisso em relação ao SGQ:
- Assumindo a responsabilidade pela eficácia do Sistema de Gestão da Qualidade;
- Assegurando que a Política da Qualidade e os Objetivos da Qualidade sejam estabelecidos e compatíveis com o direcionamento estratégico e o contexto da organização;
- Promovendo o uso da abordagem por processos e da mentalidade de risco;
- Garantindo a disponibilidade dos recursos necessários para a implementação, manutenção e melhoria contínua do SGQ;
- Comunicando a importância de uma gestão da qualidade eficaz e do cumprimento dos requisitos do SGQ, do cliente e regulamentares;
- Conduzindo reuniões semestrais de Análise Crítica pela Direção.

### 5.2 Política da Qualidade
A PSC Indústria Comércio e Serviços Ltda. tem como compromisso fundamental:

> *"Atender com excelência e confiabilidade as demandas do mercado industrial de caldeiraria, usinagem, fabricação e manutenção de equipamentos, através de processos seguros, conformidade estrita com normas técnicas e contratuais vigentes, qualificação permanente dos colaboradores e busca incessante pela melhoria contínua do Sistema de Gestão da Qualidade."*

### 5.3 Papéis, Responsabilidades e Autoridades Organizacionais
- **Diretoria:** Define diretrizes estratégicas, aprova a política da qualidade, aloca investimentos fabris e preside a análise crítica do SGQ.
- **Gestão da Qualidade (GQ):** Assegura que o SGQ esteja conforme a ABNT NBR ISO 9001:2015, relata o desempenho e as necessidades de melhoria à Diretoria, coordena auditorias internas e auditorias de certificação.
- **Controle da Qualidade (CQ):** Executa inspeções de recebimento, processo e finais, ensaios não destrutivos, emite relatórios dimensionais e laudos técnicos, supervisiona a compilação do Data-Book.
- **Planejamento e Controle da Produção (PCP):** Elabora programações de fabricação, emite e acompanha Ordens de Serviço (**ITSGQ 8.5-7**), balanceia capacidade produtiva e prazos contratuais.
- **Supervisão de Produção / Encarregados:** Asseguram que os colaboradores executem as operações fabris conforme procedimentos aprovados e registrem os apontamentos diários de produção (**FSGQ 8.5-6**).

---

## 6. PLANEJAMENTO DO SGQ

### 6.1 Ações para Abordar Riscos e Oportunidades
Em atendimento ao procedimento **PSGQ 5.1**, a organização mapeia semestralmente os riscos operacionais, financeiros, de segurança e de qualidade em cada setor, definindo ações de mitigação, contingência, responsáveis e prazos de acompanhamento.

### 6.2 Objetivos da Qualidade e Planejamento para Alcançá-los
Os objetivos são mensuráveis, coerentes com a Política da Qualidade e desdobrados em indicadores monitorados mensalmente:
- Índice de Satisfação do Cliente (≥ 85%);
- Índice de Atendimento aos Prazos de Entrega / Lead Time (≥ 90%);
- Taxa de Não Conformidade Fabril / Retrabalho (≤ 2,0%);
- Índice de Eficácia dos Treinamentos Realizados (≥ 80%);
- Índice de Calibração de Instrumentos e Equipamentos Críticos (100% no prazo).

### 6.3 Planejamento de Mudanças
Quando a organização determina a necessidade de alterações no SGQ, estas são realizadas de maneira planejada e sistemática conforme o procedimento **PSGQ 8.5.2 (Gestão de Mudança)**.

---

## 7. APOIO E RECURSOS

### 7.1 Recursos
- **Infraestrutura:** Instalações fabris, pontes rolantes, calandras, guilhotinas, dobradeiras, tornos horizontais e verticais, mandrilhadoras, máquinas de solda multiprocesso (TIG, MIG/MAG, Arco Submerso, Eletrodo Revestido), fornos de tratamento térmico e cabine de jateamento e pintura.
- **Ambiente de Trabalho:** Condições ergonômicas, ventilação adequada, proteção coletiva e individual de acordo com as NRs 06, 09, 12, 13 e 18.
- **Recursos de Monitoramento e Medição:** Instrumentos de medição (paquímetros, micrômetros, trenas, súbitas, manômetros, termômetros, medidores de espessura por ultrassom) são periodicamente calibrados por laboratórios da RBC conforme **PSGQ 7.1.5**.

### 7.2 Competência e Treinamento
Conforme **PSGQ 7.2**:
- Os colaboradores possuem competência comprovada através de escolaridade, treinamento técnico ou experiência demonstrada.
- Soldadores e operadores de soldagem são qualificados conforme normas ASME IX / AWS D1.1 com Registros de Qualificação de Soldador (RQS/WPQR).
- Inspetores de END são certificados pelo SNQC/ABENDI nas técnicas de EV, LP, PM, US e ER.
- Levantamentos anuais de necessidades de treinamento são consolidados no Plano Anual de Treinamento (**FSGQ 7.2-1**).

### 7.3 Conscientização e Comunicação
A organização garante que todos os colaboradores estejam conscientes da Política da Qualidade, dos seus objetivos individuais e de sua contribuição para a eficácia do SGQ, através de diálogos diários de segurança e qualidade (DSS/DSQ), murais informativos e treinamentos introdutórios (**ITSGQ 7.2.1**).

### 7.4 Informação Documentada
Conforme procedimento **PSGQ 7.5**, a organização mantém controle rigoroso sobre a criação, revisão, aprovação, codificação, distribuição, retenção e descarte de documentos internos e externos. Cópias obsoletas são prontamente recolhidas e descartadas, mantendo-se apenas uma cópia mestre identificada como "OBSOLETO" para fins históricos.

---

## 8. OPERAÇÃO E PRODUÇÃO

### 8.1 Planejamento e Controle Operacionais
O planejamento da produção é coordenado pelo PCP através da emissão de Ordens de Serviço formais (**FSGQ 8.2-7**), detalhamento das etapas fabris e alocação de postos de trabalho conforme a Instrução de Trabalho **ITSGQ 8.5-7**.

### 8.2 Requisitos para Produtos e Serviços
- **Análise Crítica de Pedidos e Contratos:** O departamento Comercial e a Engenharia avaliam todas as especificações técnicas de cliente, normas mandatórias e prazos antes da confirmação do pedido (**PSGQ 8.2**).
- Quaisquer divergências técnicas são esclarecidas formalmente com o cliente antes do início da fabricação.

### 8.3 Projeto e Desenvolvimento
A Engenharia desenvolve detalhamentos de fabricação, cálculos mecânicos de vasos de pressão e trocadores de calor conforme normas aplicáveis (ASME Seção VIII Div. 1, TEMA, NR-13), submetendo os desenhos à aprovação prévia do cliente conforme **PSGQ 8.3** e **ITSGQ 8.3-1**.

### 8.4 Controle de Processos, Produtos e Serviços Providos Externamente
- Fornecedores de insumos críticos (chapas, tubos, conexões, flanges, consumíveis de solda e serviços externos de tratamento térmico/ensaios) são qualificados pelo procedimento **PSGQ 8.4**.
- Todo material recebido passa por Inspeção de Recebimento com verificação de certificado de usina e conferência dimensional antes de ser disponibilizado ao almoxarifado (**FSGQ 8.6-8**).

### 8.5 Produção e Fornecimento de Serviço
1. **Controle da Produção:** A fabricação segue rigorosamente as Ordens de Serviço, Instruções de Trabalho aplicáveis e desenhos aprovados.
2. **Identificação e Rastreabilidade:** Todas as peças, componentes e matérias-primas são identificadas com número de corrida, certificado de material e número da OS, assegurando total rastreabilidade do produto até a montagem final.
3. **Propriedade Pertencente a Clientes ou Provedores Externos:** Equipamentos enviados por clientes para reforma ou retubagem são identificados, protegidos e inspecionados no recebimento.
4. **Preservação:** Os materiais e equipamentos em processo são protegidos contra intempéries, corrosão e contaminação mecânica.
5. **Controle de Alterações:** Mudanças de projeto ou método executivo são formalmente aprovadas pela Engenharia e CQ antes da aplicação.

### 8.6 Liberação de Produtos e Serviços
- As inspeções intermediárias (Hold Points) e finais (Witness Points) são conduzidas pelo Controle da Qualidade conforme Plano de Inspeção e Testes (PIT).
- Procedimentos técnicos específicos balizam as inspeções: **PR-CQ-14** (Ensaio Visual), **EVS-PSC-01** (Procedimento de Inspeção de Solda), **IT-CQ-08** (Retubagem de Permutadores) e testes hidrostáticos.
- A liberação final para expedição exige a aprovação do checklist dimensional, encerramento da OS e emissão do Romaneio de Embarque (**FSGQ 8.6-11**).

### 8.7 Controle de Saídas Não Conformes
Quando são identificados desvios ou defeitos em materiais, processos ou produtos acabados, a atividade é paralisada e aberto um Relatório de Não Conformidade (**RNC**) conforme **PSGQ 8.7**, aplicando-se segregação física, identificação visual e definição imediata da disposição (rejeição, retrabalho ou concessão formal do cliente).

---

## 9. AVALIAÇÃO DE DESEMPENHO

### 9.1 Monitoramento, Medição, Análise e Avaliação
A PSC monitora o desempenho de todos os processos do SGQ através de indicadores mensais, reuniões de coordenação operacional e avaliações periódicas de produtividade e qualidade.

### 9.2 Auditoria Interna
Conforme **PSGQ 9.2**, auditorias internas planejadas são realizadas anualmente por auditores qualificados e independentes dos setores auditados, cobrindo todos os requisitos da ABNT NBR ISO 9001:2015 e os processos internos da PSC.

### 9.3 Análise Crítica pela Direção
Semestralmente, a Alta Direção reúne os gestores de GQ, CQ, PCP, Produção, Suprimentos, Engenharia e Comercial para avaliar:
- Status de ações de análises críticas anteriores;
- Mudanças em questões externas e internas relevantes;
- Informações sobre o desempenho do SGQ (não conformidades, reclamações de clientes, resultados de auditorias, fornecedores e cumprimento de objetivos);
- Suficiência de recursos;
- Oportunidades de melhoria contínua e investimentos necessários.

---

## 10. MELHORIA

### 10.1 Generalidades
A PSC determina e seleciona oportunidades de melhoria e implementa ações necessárias para atender aos requisitos dos clientes e aumentar sua satisfação.

### 10.2 Não Conformidade e Ação Corretiva
Ao ocorrer uma não conformidade fabril ou apontada por cliente:
1. Reagir prontamente à não conformidade tomando ação de contenção e correção imediata;
2. Investigar a causa-raiz através de metodologias consagradas (5 Porquês, Diagrama de Ishikawa);
3. Implementar plano de ação corretiva com prazos e responsáveis definidos;
4. Avaliar a eficácia das ações implementadas e atualizar a análise de riscos, se necessário.

### 10.3 Melhoria Contínua
A organização aprimora continuamente a adequação, suficiência e eficácia do SGQ mediante o uso da Política da Qualidade, objetivos da qualidade, resultados de auditorias, análise crítica de dados operacionais e decisões da Alta Direção.

---

## 11. MATRIZ DE CORRELAÇÃO DE DOCUMENTOS DO SGQ

| Requisito ISO 9001:2015 | Procedimento Associado | Instrução de Trabalho | Registros / Formulários |
| :--- | :--- | :--- | :--- |
| **4. Contexto da Organização** | PSGQ 5.1 | - | FSGQ 5.1-1 |
| **5. Liderança e Comprometimento** | PSGQ 5.0 | - | FSGQ 5.0-3, FSGQ 5.0-4 |
| **6. Planejamento do SGQ** | PSGQ 5.1, PSGQ 8.5.2 | - | Indicadores SGQ |
| **7.1 Recursos e Calibração** | PSGQ 7.1.5 | - | Certificados RBC |
| **7.2 Competência e Treinamento** | PSGQ 7.2 | ITSGQ 7.2.1, ITSGQ 7.2.3 | FSGQ 7.2-1, FSGQ 7.2-3 |
| **7.5 Informação Documentada** | PSGQ 7.5 | - | Lista Mestra de Documentos |
| **8.2 Processos com Clientes** | PSGQ 8.2 | - | FSGQ 8.2-7 |
| **8.3 Projeto e Desenvolvimento** | PSGQ 8.3 | ITSGQ 8.3-1 | Desenhos e Memoriais |
| **8.4 Fornecedores e Suprimentos**| PSGQ 8.4 | - | FSGQ 8.4-2, FSGQ 8.6-8 |
| **8.5 Produção e Serviço** | PSGQ 8.5 | ITSGQ 8.5-7, ITSGQ 8.5-2 | FSGQ 8.5-6, FSGQ 8.5-8 |
| **8.6 Inspeção e Liberação** | PSGQ 8.6 | PR-CQ-14, EVS-PSC-01, IT-CQ-08 | FSGQ 8.6-8, FSGQ 8.6-11 |
| **8.7 Saídas Não Conformes** | PSGQ 8.7 | - | RNC |
| **9.2 Auditorias Internas** | PSGQ 9.2 | - | Relatório de Auditoria |
| **9.3 Análise Crítica Direção** | PSGQ 5.0 | - | Ata de Análise Crítica |
| **10. Melhoria e Ação Corretiva** | PSGQ 8.7, PSGQ 10.0 | - | Plano de Ação SGQ |
`

    var targetDoc = null
    try {
      targetDoc = app.findFirstRecordByData('documents', 'id', TARGET_DOC_ID)
    } catch (_) {}

    if (targetDoc) {
      targetDoc.set('content', MSGQ_1_CONTENT)
      targetDoc.set('revision', '07')
      targetDoc.set('template_family', TEMPLATE_FAMILY)
      targetDoc.set('status', 'Under Review')
      targetDoc.set('revision_history', revisionHistory)
      targetDoc.set('effective_date', '2023-09-10 00:00:00.000Z')
      targetDoc.set('prepared_by', 'Roberta Junqueira')
      targetDoc.set('approved_by', 'Marcos Maciel')
      app.save(targetDoc)
      console.log(
        'Migration 0103: Documento MSGQ-1 da PSC atualizado com sucesso (id=' + targetDoc.id + ')',
      )
    } else {
      console.log('Migration 0103: AVISO - Documento com id=' + TARGET_DOC_ID + ' não encontrado!')
    }
  },
  (app) => {
    // Reversão
    try {
      var targetDoc = app.findFirstRecordByData('documents', 'id', 'y71katw65s3atps')
      if (targetDoc) {
        targetDoc.set('content', '')
        targetDoc.set('revision', '4')
        targetDoc.set('status', 'Active')
        targetDoc.set('prepared_by', '')
        targetDoc.set('approved_by', '')
        app.save(targetDoc)
      }
    } catch (_) {}
  },
)
