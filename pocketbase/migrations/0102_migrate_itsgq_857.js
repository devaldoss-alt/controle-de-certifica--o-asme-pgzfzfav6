migrate(
  (app) => {
    // -------------------------------------------------------------
    // Migration 0102: Migração de ITSGQ 8.5-7
    // INSTRUÇÃO DE TRABALHO DO SISTEMA DE GESTÃO DA QUALIDADE
    // ITSGQ 8.5-7 PLANEJAMENTO E CONTROLE DE ORDENS DE SERVIÇO REV. 01
    // -------------------------------------------------------------

    var PSC_ID = 'a631bv695rr4gef'
    try {
      var pscCompany = app.findFirstRecordByData(
        'companies',
        'name',
        'PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA',
      )
      if (pscCompany) PSC_ID = pscCompany.id
    } catch (_) {}

    var FAMILY_B = 'Técnico/CQ — Bilíngue (CDE)'

    // Transcrição fiel estruturada do procedimento ITSGQ 8.5-7 (5 páginas, português)
    var ITSGQ_857_CONTENT = `# INSTRUÇÃO DE TRABALHO: ITSGQ 8.5-7
## PLANEJAMENTO E CONTROLE DE ORDENS DE SERVIÇO

**Sistema de Gestão da Qualidade**  
**Código:** ITSGQ 8.5-7  
**Revisão:** 01  
**Data:** 07.07.2025  
**Página:** 1 a 5  

---

### Controle de Assinaturas

| Elaboração / Revisão | Data | Aprovação / Reaprovação | Data |
| :--- | :---: | :--- | :---: |
| **PCP / Coordenação de Produção** | 07.07.2025 | **Marcos Maciel**<br>Diretor | 07.07.2025 |

---

## 1. HISTÓRICO DE REVISÕES

| DATA | REVISÃO | ALTERAÇÃO | ELABORADO | APROVADO |
| :---: | :---: | :--- | :--- | :--- |
| **05.06.2023** | **00** | Primeira emissão – conforme norma NBR ISO 9001:2015. | PCP / CQ | Marcos Maciel |
| **07.07.2025** | **01** | Revisão geral, adequação do fluxo de planejamento e controle de OS e atualização da logomarca da PSC. | PCP / GQ | Marcos Maciel |

---

## 2. OBJETIVO

Estabelecer a sistemática para o planejamento, programação, emissão, distribuição, acompanhamento e encerramento das Ordens de Serviço (OS) na PSC Indústria Comércio e Serviços Ltda., assegurando que todas as etapas produtivas, requisitos contratuais, especificações técnicas de clientes e critérios de qualidade sejam integralmente cumpridos nos prazos acordados.

---

## 3. CAMPO DE APLICAÇÃO

Esta instrução de trabalho aplica-se a todas as Ordens de Serviço executadas pela PSC Indústria Comércio e Serviços Ltda., abrangendo serviços de caldeiraria, usinagem, soldagem, conformação, retubagem, montagem, manutenção e ensaios em equipamentos industriais (vasos de pressão, permutadores de calor, feixes tubulares, tanques e estruturas correlatas).

---

## 4. DOCUMENTOS DE REFERÊNCIA

- **Manual do SGQ (MSGQ-1)**
- **PSGQ 8.5** - Produção e Fornecimento de Serviço
- **PSGQ 7.5** - Informação Documentada
- **PSGQ 8.6** - Inspeção e Ensaios
- **ITSGQ 8.3-1** - Análise, Distribuição e Controle de Desenhos Técnicos
- **FSGQ 8.2-7** - Ordem de Serviços
- **FSGQ 8.5-6** - Registro Diário de Obra (RDO)
- **FSGQ 8.5-8** - Controle no Cumprimento de Requisitos da Qualidade nas Ordens de Serviços
- **FSGQ 8.6-8** - Relatório de Inspeção de Recebimento (RIR)
- **ABNT NBR ISO 9001:2015** - Sistemas de Gestão da Qualidade – Requisitos

---

## 5. DEFINIÇÕES E SIGLAS

- **OS (Ordem de Serviço):** Documento formal emitido para autorizar, instruir e controlar a execução de um escopo de trabalho específico solicitado por cliente interno ou externo.
- **PCP:** Planejamento e Controle da Produção.
- **CQ:** Controle da Qualidade.
- **GQ:** Gestão da Qualidade.
- **RDO:** Registro Diário de Obra / Produção.
- **Data-Book:** Compêndio de registros da qualidade, certificados de materiais, relatórios de ensaios e evidências de conformidade do produto fabricado.

---

## 6. RESPONSABILIDADES E AUTORIDADES

### 6.1 DIRETORIA
- Aprovar recursos necessários para atendimento aos prazos e demandas contratuais das Ordens de Serviço.
- Aprovar revisões desta Instrução de Trabalho.

### 6.2 PCP (PLANEJAMENTO E CONTROLE DA PRODUÇÃO)
- Emitir a Ordem de Serviço formal (FSGQ 8.2-7) após recebimento e validação do pedido/contrato e desenhos de fabricação.
- Elaborar o cronograma de fabricação e definir as prioridades produtivas por posto de trabalho.
- Coordenar a abertura das requisições de insumos e matérias-primas junto ao Almoxarifado e Suprimentos.
- Acompanhar diariamente o avanço físico das etapas produtivas e atualizar os indicadores de prazo e capacidade instalada.
- Distribuir as ordens de serviço e desenhos aprovados às frentes de trabalho.

### 6.3 COORDENAÇÃO DE PRODUÇÃO / SUPERVISÃO / ENCARREGADOS
- Executar os serviços em estrita conformidade com os requisitos da Ordem de Serviço, procedimentos e desenhos vigentes.
- Registrar os apontamentos diários de mão de obra e horas executadas em cada OS.
- Garantir que os operadores e soldadores alocados estejam qualificados e com certificados válidos.
- Informar imediatamente ao PCP qualquer divergência, interrupção ou necessidade de ajuste no cronograma planejado.

### 6.4 CONTROLE DA QUALIDADE (CQ)
- Realizar as inspeções dimensionais, ensaios visuais e ensaios não destrutivos previstos no plano de inspeção e testes de cada OS.
- Preencher o formulário **FSGQ 8.5-8** (Controle no Cumprimento de Requisitos da Qualidade nas Ordens de Serviços).
- Liberar as etapas de fabricação subsequentes mediante aprovação formal dos ensaios e registros.
- Reunir os laudos e certificados aplicáveis para a montagem final do Data-Book.

---

## 7. PROCEDIMENTO DE EXECUÇÃO

### 7.1 EMISSÃO E ABERTURA DA ORDEM DE SERVIÇO
1. Após a aprovação comercial do contrato ou pedido de compras e a liberação da documentação de engenharia (desenhos de fabricação, folhas de dados, especificações do cliente), o PCP emite formalmente a Ordem de Serviço através do formulário **FSGQ 8.2-7**.
2. Cada Ordem de Serviço recebe numeração sequencial e única de identificação contendo:
   - Número da OS;
   - Identificação do Cliente e Contrato;
   - Descrição detalhada do equipamento / serviço;
   - Tag / Código de identificação do equipamento;
   - Prazo de entrega contratual e datas-marco dos marcos intermediários;
   - Desenhos de referência e suas respectivas revisões vigentes;
   - Normas aplicáveis (ASME, TEMA, NR-13, ISO 9001, Petrobras);
   - Requisitos especiais de cliente, ensaios e testes requeridos.

### 7.2 PLANEJAMENTO, PROGRAMAÇÃO E REQUISIÇÃO DE MATERIAIS
1. O PCP analisa o projeto técnico e desmembra a Ordem de Serviço nas ordens de fabricação específicas por setor operacional (Corte/Conformação, Caldeiraria, Solda, Usinagem, Montagem, Tratamento Térmico/Pintura e CQ).
2. O PCP calcula a estimativa de horas e a capacidade de carga-máquina disponível, estabelecendo o cronograma executivo de barras (Gantt) ou linha de fluxo produtivo.
3. As matérias-primas, consumíveis e componentes são requisitados formalmente ao Almoxarifado conforme as listas de materiais da OS.
4. Nenhum material é liberado para transformação sem a confirmação do Relatório de Inspeção de Recebimento (FSGQ 8.6-8) e respectivo certificado de matéria-prima aprovado pelo CQ.

### 7.3 EXECUÇÃO E APONTAMENTO OPERACIONAL
1. A Ordem de Serviço física ou eletrônica é disponibilizada na área de produção junto aos desenhos carimbados como "CÓPIA CONTROLADA" conforme **ITSGQ 8.3-1**.
2. Os executantes (caldeireiros, soldadores, torneiros e montadores) realizam suas atividades observando as instruções técnicas e procedimentos aplicáveis.
3. Diariamente, o apontador ou encarregado registra o progresso físico e as horas trabalhadas na OS através do Registro Diário de Obra (FSGQ 8.5-6) e nos boletins de apontamento do sistema.
4. Havendo necessidade de retrabalho ou desvio identificado, a atividade é paralisada até avaliação do CQ e emissão do respectivo Registro de Não Conformidade (RNC), se aplicável.

### 7.4 CONTROLE DE QUALIDADE INTERMEDIÁRIO E FINAL
1. Em cada ponto de parada (Hold Point) e inspeção (Witness Point) definido no Plano de Inspeção e Testes (PIT) da OS, o inspetor do CQ é acionado.
2. O inspetor realiza os ensaios aplicáveis (dimensional, visual de solda, líquido penetrante, partícula magnética, ultrassom, teste hidrostático) e emite os relatórios específicos.
3. O cumprimento de todos os requisitos de qualidade é atestado no formulário **FSGQ 8.5-8**.
4. Não é permitido o avanço para fases subsequentes ou expedição sem a liberação formal do inspetor responsável.

### 7.5 ENCERRAMENTO E EXPEDIÇÃO DA ORDEM DE SERVIÇO
1. Concluídas todas as operações fabris e inspeções mandatórias, o CQ e a Supervisão emitem o laudo final de liberação.
2. O PCP atualiza o status da Ordem de Serviço para "Concluída" e realiza a baixa das pendências no sistema.
3. O setor de Logística/Expedição emite o Romaneio de Embarque correspondente (**FSGQ 8.6-11**) e providencia o carregamento e envio ao cliente.
4. O processo é finalizado com a entrega formal do Data-Book ao cliente, quando exigido contratualmente.

---

## 8. FLUXOGRAMA RESUMIDO DO PROCESSO

\`\`\`
[ Pedido / Contrato Validado ]
             │
             ▼
[ Análise Crítica e Documentos de Engenharia (ITSGQ 8.3-1) ]
             │
             ▼
[ Emissão da OS pelo PCP (FSGQ 8.2-7) ]
             │
             ▼
[ Programação da Produção & Requisição de Materiais ]
             │
             ▼
[ Execução nas Frentes de Trabalho & Apontamento Diário (FSGQ 8.5-6) ]
             │
             ▼
[ Inspeções em Pontos de Parada pelo CQ (FSGQ 8.5-8 & Laudos) ]
             │
             ▼
[ Encerramento Técnico, Emissão de Romaneio e Entrega do Data-Book ]
\`\`\`

---

## 9. REGISTROS ASSOCIADOS

- **FSGQ 8.2-7:** Ordem de Serviços
- **FSGQ 8.5-6:** Registro Diário de Obra (RDO)
- **FSGQ 8.5-8:** Controle no Cumprimento de Requisitos da Qualidade nas Ordens de Serviços
- **FSGQ 8.6-8:** Relatório de Inspeção de Recebimento (RIR)
- **FSGQ 8.6-11:** LV Embarque de Equipamento
`

    // Localizar documento com code "ITSGQ 8.5-7" na coleção documents
    var existingDoc = null

    // 1. Tentar busca exata por code
    try {
      var r1 = app.findRecordsByFilter(
        'documents',
        "code = 'ITSGQ 8.5-7' || (prefix = 'ITSGQ' && code = '8.5-7')",
        'created',
        1,
        0,
      )
      if (r1 && r1.length > 0) existingDoc = r1[0]
    } catch (_) {}

    // 2. Tentar busca flexível com company_id
    if (!existingDoc) {
      try {
        var r2 = app.findRecordsByFilter(
          'documents',
          "company_id = {:comp} && (code = 'ITSGQ 8.5-7' || code = '8.5-7' || title ~ 'PLANEJAMENTO E CONTROLE DE ORDENS DE SERVIÇO')",
          'created',
          1,
          0,
          { comp: PSC_ID },
        )
        if (r2 && r2.length > 0) existingDoc = r2[0]
      } catch (_) {}
    }

    if (existingDoc) {
      // Documento já existe: atualiza os campos mantendo fidelidade
      existingDoc.set('code', 'ITSGQ 8.5-7')
      existingDoc.set('prefix', 'ITSGQ')
      existingDoc.set('title', 'Planejamento e Controle de Ordens de Serviço')
      existingDoc.set('revision', '01')
      existingDoc.set('template_family', FAMILY_B)
      existingDoc.set('status', 'Under Review')
      existingDoc.set('content', ITSGQ_857_CONTENT)
      existingDoc.set('language', 'Portuguese')
      existingDoc.set('category', 'Internal')
      existingDoc.set('document_type', 'Internal')
      existingDoc.set('sector', 'PCP/PROD/GQ')
      app.save(existingDoc)
      console.log(
        'Migration 0102: Documento ITSGQ 8.5-7 atualizado com sucesso (id=' + existingDoc.id + ')',
      )
    } else {
      // Documento não existe: cria novo registro
      var documentsCol = app.findCollectionByNameOrId('documents')
      var newDoc = new Record(documentsCol)
      newDoc.set('company_id', PSC_ID)
      newDoc.set('prefix', 'ITSGQ')
      newDoc.set('code', 'ITSGQ 8.5-7')
      newDoc.set('title', 'Planejamento e Controle de Ordens de Serviço')
      newDoc.set('revision', '01')
      newDoc.set('template_family', FAMILY_B)
      newDoc.set('status', 'Under Review')
      newDoc.set('content', ITSGQ_857_CONTENT)
      newDoc.set('language', 'Portuguese')
      newDoc.set('category', 'Internal')
      newDoc.set('document_type', 'Internal')
      newDoc.set('sector', 'PCP/PROD/GQ')
      newDoc.set('effective_date', '2025-07-07 00:00:00.000Z')
      app.save(newDoc)
      console.log(
        'Migration 0102: Novo documento ITSGQ 8.5-7 criado com sucesso (id=' + newDoc.id + ')',
      )
    }
  },
  (app) => {
    // Reversão
    try {
      var records = app.findRecordsByFilter('documents', "code = 'ITSGQ 8.5-7'", 'created', 10, 0)
      for (var i = 0; i < records.length; i++) {
        app.delete(records[i])
      }
    } catch (_) {}
  },
)
