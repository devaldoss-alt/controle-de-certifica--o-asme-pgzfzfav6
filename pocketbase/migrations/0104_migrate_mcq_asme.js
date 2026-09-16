migrate(
  (app) => {
    // -------------------------------------------------------------
    // Migration 0104: Migração do MCQ ASME (PSC)
    // MANUAL DE CONTROLE DA QUALIDADE ASME / ASME QUALITY CONTROL MANUAL
    // Edição 1 / Rev. 00 - 19/12/2025
    // Coleção: documents
    // Empresa: PSC INDÚSTRIA COMÉRCIO E SERVIÇOS LTDA (company_id: a631bv695rr4gef)
    // Template Family: "Técnico/CQ — Bilíngue (CDE)"
    // -------------------------------------------------------------

    var COMPANY_ID = 'a631bv695rr4gef'
    var TEMPLATE_FAMILY = 'Técnico/CQ — Bilíngue (CDE)'

    var revisionHistory = JSON.stringify([
      {
        revision: '00',
        date: '19/12/2025',
        changes:
          'Emissão inicial da Edição 1 do Manual de Controle da Qualidade ASME (MCQ) para certificação ASME Section VIII Div. 1 e Div. 2 / Initial issue of ASME Quality Control Manual Edition 1 for ASME Section VIII Div. 1 & Div. 2 certification.',
        preparedBy: 'Armando',
        approvedBy: 'Marcos Maciel',
      },
    ])

    var MCQ_CONTENT = `# MANUAL DE CONTROLE DA QUALIDADE ASME / ASME QUALITY CONTROL MANUAL
## PSC INDÚSTRIA COMÉRCIO E SERVIÇOS LTDA.

**Documento / Document:** MCQ  
**Código / Code:** MCQ  
**Edição / Edition:** 1  
**Revisão / Revision:** 00  
**Data de Vigência / Effective Date:** 19/12/2025  
**Classificação / Classification:** Interno / Internal  
**Sistema de Qualidade / Quality System:** ASME Boiler and Pressure Vessel Code (BPVC) Section VIII, Divisions 1 & 2 / NBIC  

---

### FOLHA DE APROVAÇÃO E CONTROLE DE ASSINATURAS / APPROVAL AND SIGNATURE SHEET

| Função / Role | Nome / Name | Cargo / Title | Assinatura / Signature | Data / Date |
| :--- | :--- | :--- | :---: | :---: |
| **Elaboração / Prepared by** | Armando | Controle da Qualidade / Quality Control | [Assinado / Signed] | 19/12/2025 |
| **Aprovação / Approved by** | Marcos Maciel | Diretor / Managing Director | [Assinado / Signed] | 19/12/2025 |

---

### HISTÓRICO DE REVISÕES / REVISION HISTORY

| Edição/Rev. / Edition/Rev. | Data / Date | Descrição da Revisão / Description of Change | Elaborado / Prepared by | Aprovado / Approved by |
| :---: | :---: | :--- | :--- | :--- |
| **Ed. 1 / Rev. 00** | 19/12/2025 | Emissão original do Manual de Controle da Qualidade ASME / Original issue of the ASME Quality Control Manual. | Armando | Marcos Maciel |

---

## PREFÁCIO I — GLOSSÁRIO DE TERMOS E SIGLAS / PREFACE I — GLOSSARY OF TERMS AND ACRONYMS

### Glossário / Glossary

- **AI (Authorized Inspector / Inspetor Autorizado):**  
  *EN:* An inspector regularly employed by an ASME-accredited Authorized Inspection Agency (AIA) who has been qualified by written examination under the rules of any state of the United States or province of Canada which has adopted the ASME Code.  
  *PT:* Inspetor regularmente empregado por uma Agência de Inspeção Autorizada (AIA) credenciada pela ASME, qualificado por exame formal sob as regras de jurisdição reconhecida pelo Código ASME.

- **AIA (Authorized Inspection Agency / Agência de Inspeção Autorizada):**  
  *EN:* An inspection agency accredited by ASME in accordance with ASME QAI-1 to provide authorized inspection services.  
  *PT:* Agência de inspeção credenciada pela ASME de acordo com a norma ASME QAI-1 para prestação de serviços de inspeção autorizada.

- **ASME (American Society of Mechanical Engineers):**  
  *EN:* American Society of Mechanical Engineers, publisher of the Boiler and Pressure Vessel Code (BPVC).  
  *PT:* Sociedade Americana de Engenheiros Mecânicos, responsável pela publicação do Código de Caldeiras e Vasos de Pressão (BPVC).

- **MDeR (Manufacturer's Design Report / Relatório de Projeto do Fabricante):**  
  *EN:* Design report required for ASME Section VIII Division 2 vessels, certifying that design calculations and stress analyses comply with Code requirements.  
  *PT:* Relatório de projeto mandatório para vasos de pressão construídos conforme ASME Seção VIII Divisão 2, certificando que os cálculos e análises de tensões atendem aos requisitos do Código.

- **MDR (Manufacturer's Data Report / Relatório de Dados do Fabricante):**  
  *EN:* The official ASME data report form (such as Form U-1, U-1A, A-1) completed and signed by the Manufacturer and the Authorized Inspector certifying Code compliance.  
  *PT:* Formulário oficial de registro de dados ASME (ex.: U-1, U-1A, A-1) preenchido e assinado pelo Fabricante e pelo Inspetor Autorizado, certificando a conformidade com o Código.

- **NBIC (National Board Inspection Code):**  
  *EN:* Standard published by the National Board of Boiler and Pressure Vessel Inspectors governing installation, inspection, repair, and alteration of pressure-retaining items.  
  *PT:* Código publicado pelo National Board que rege a instalação, inspeção, reparo e alteração de itens de retenção de pressão.

- **ITP (Inspection and Test Plan / Plano de Inspeção e Testes):**  
  *EN:* Document specifying sequence of fabrication operations, inspection milestones, witness points, and hold points.  
  *PT:* Documento que detalha a sequência das etapas fabris, marcos de inspeção, pontos de testemunho (witness) e pontos de parada obrigatória (hold points).

- **WPS (Welding Procedure Specification / Especificação de Procedimento de Soldagem):**  
  *EN:* A document providing the required welding variables for a specific application per ASME Section IX.  
  *PT:* Documento que estabelece os parâmetros e variáveis mandatórias de soldagem conforme ASME Seção IX.

- **PQR (Procedure Qualification Record / Registro de Qualificação de Procedimento):**  
  *EN:* A record of welding variables and test results documenting the qualification of a WPS.  
  *PT:* Registro que documenta as variáveis reais de soldagem e os resultados dos ensaios de qualificação de uma EPS/WPS.

- **WPQ (Welder Performance Qualification / Qualificação de Desempenho do Soldador):**  
  *EN:* Documentation demonstrating a welder's ability to deposit sound weld metal per ASME Section IX.  
  *PT:* Documento que comprova a habilidade de um soldador em executar juntas sadias conforme ASME Seção IX.

- **NDE / END (Nondestructive Examination / Ensaios Não Destrutivos):**  
  *EN:* Examination methods that do not impair the future usefulness of the material or component (VT, PT, MT, RT, UT).  
  *PT:* Métodos de ensaio que não comprometem a integridade ou uso futuro dos materiais ou componentes (EV, LP, PM, ER, US).

- **QCM / MCQ (Quality Control Manual / Manual de Controle da Qualidade):**  
  *EN:* This document describing the Quality Management System for ASME Code fabrication.  
  *PT:* Este documento que descreve o Sistema de Controle da Qualidade para fabricação segundo os Códigos ASME.

---

## PREFÁCIO II — DECLARAÇÃO DE POLÍTICA E AUTORIDADE / PREFACE II — STATEMENT OF POLICY AND AUTHORITY

### Statement of Policy and Authority (English)
The management of **PSC INDÚSTRIA COMÉRCIO E SERVIÇOS LTDA.** is fully committed to the fabrication of pressure vessels, heat exchangers, and pressure components in full compliance with the requirements of the **ASME Boiler and Pressure Vessel Code (Section VIII, Divisions 1 and 2)** and the **National Board Inspection Code (NBIC)**.

This Quality Control Manual (MCQ) establishes the policies, organizational responsibilities, and procedural controls mandatory for all personnel involved in activities affecting quality.

The **Quality Control Coordinator (QCC)** is hereby delegated full organizational authority and independent latitude to identify quality problems; initiate, recommend, or provide solutions; verify implementation of corrective actions; and **stop any work, process, or shipment** that does not strictly comply with ASME Code requirements and this Manual.

No departmental priority, commercial deadline, or operational pressure shall override the quality requirements established herein.

The Authorized Inspector (AI) shall have free access at all times to all parts of the shop, field sites, and documentation related to the work, and shall be notified in advance of all established inspection points.

### Declaração de Política e Autoridade (Português)
A diretoria da **PSC INDÚSTRIA COMÉRCIO E SERVIÇOS LTDA.** assume o compromisso irrestrito de fabricar vasos de pressão, permutadores de calor e componentes pressurizados em total conformidade com as exigências do **Código ASME de Caldeiras e Vasos de Pressão (Seção VIII, Divisões 1 e 2)** e do **National Board Inspection Code (NBIC)**.

Este Manual de Controle da Qualidade (MCQ) estabelece as políticas, responsabilidades organizacionais e controles procedimentais mandatórios para todos os colaboradores envolvidos em atividades que afetam a qualidade.

O **Coordenador do Controle da Qualidade (QCC)** possui autoridade organizacional delegada e total independência para identificar problemas de qualidade; propor e implementar soluções; verificar a eficácia das ações corretivas; e **interromper qualquer trabalho, processo ou expedição** que não esteja em conformidade estrita com os requisitos do Código ASME e com este Manual.

Nenhuma prioridade de produção, prazo comercial ou pressão operacional poderá sobrepor-se aos requisitos de qualidade aqui estabelecidos.

O Inspetor Autorizado (AI) terá livre acesso a qualquer momento a todas as áreas da fábrica, obras e documentos técnicos pertinentes aos equipamentos abrangidos pelo Código ASME, devendo ser notificado previamente de todos os pontos de inspeção estabelecidos.

---

## SEÇÃO 1 — ORGANIZAÇÃO E CONTROLE DE REVISÕES DO MANUAL / SECTION 1 — ORGANIZATION AND MANUAL REVISION CONTROL

### 1.1 Escopo e Aplicação / Scope and Application
- *EN:* This section describes the organizational structure of PSC and the system for maintaining, revising, and distributing the ASME Quality Control Manual (MCQ).
- *PT:* Esta seção descreve a estrutura organizacional da PSC e a sistemática para manutenção, revisão e distribuição do Manual de Controle da Qualidade ASME (MCQ).

### 1.2 Responsabilidades Organizacionais / Organizational Responsibilities
- **Diretor Geral / Managing Director:**  
  *EN:* Exercises overall executive authority, provides necessary resources, signs the Statement of Policy and Authority, and approves all revisions to this Manual.  
  *PT:* Exerce autoridade executiva máxima, provê os recursos necessários, assina a Declaração de Política e Autoridade e aprova todas as revisões deste Manual.

- **Coordenador do Controle da Qualidade (QCC) / Quality Control Coordinator:**  
  *EN:* Reports directly to the Managing Director regarding ASME Code matters. Responsible for the administration, maintenance, and distribution of the MCQ, coordination with the Authorized Inspection Agency (AIA), and resolution of nonconformities.  
  *PT:* Reporta-se diretamente ao Diretor Geral para matérias pertinentes ao Código ASME. Responsável pela administração, manutenção e distribuição do MCQ, interface com a Agência de Inspeção Autorizada (AIA) e tratamento de não conformidades.

- **Engenharia de Projeto / Engineering & Design:**  
  *EN:* Responsible for Code design calculations, drawings, specifications, stress analysis, and preparation of Manufacturer's Design Reports (MDeR) when required.  
  *PT:* Responsável pelos cálculos de projeto conforme o Código, desenhos executivos, especificações, memória de cálculo e elaboração do Relatório de Projeto do Fabricante (MDeR) quando aplicável.

- **Inspetor da Qualidade / Quality Inspector:**  
  *EN:* Conducts receiving, in-process, and final inspections, monitors welding and NDE, verifies test setups, and maintains inspection documentation.  
  *PT:* Executa inspeções de recebimento, fabricação e liberação final, monitora operações de soldagem e END, acompanha ensaios e mantém atualizada a documentação de inspeção.

- **Inspetor Autorizado (AI) / Authorized Inspector:**  
  *EN:* Performs independent third-party verification of Code compliance, reviews calculations and drawings, monitors quality activities, and signs official ASME data reports.  
  *PT:* Executa a verificação independente de conformidade com o Código ASME, revisa cálculos e desenhos, acompanha atividades de fabricação/ensaios e assina os formulários oficiais de dados (MDR).

### 1.3 Controle de Revisões do Manual / Manual Revision Control
1. *EN:* Revisions to this Manual may be initiated by the QCC, Managing Director, or as requested by the Authorized Inspection Agency (AIA) / ASME.
2. *PT:* Revisões deste Manual podem ser propostas pelo QCC, Diretor Geral ou solicitadas pela Agência de Inspeção Autorizada (AIA) / ASME.
3. *EN:* Prior to implementation, all revisions to the MCQ must be submitted to the Authorized Inspector (AI) for review and acceptance.
4. *PT:* Antes da implementação, todas as revisões do MCQ devem ser submetidas ao Inspetor Autorizado (AI) para análise e aceitação formal.
5. *EN:* Upon approval by the Managing Director and acceptance by the AI, the QCC distributes controlled copies and ensures obsolete editions are immediately withdrawn and marked "SUPERSEDED" or destroyed.
6. *PT:* Após aprovação da Diretoria e aceitação do AI, o QCC distribui cópias controladas e assegura que versões obsoletas sejam prontamente recolhidas e carimbadas como "OBSOLETO" ou destruídas.

---

## SEÇÃO 2 — SISTEMA DA QUALIDADE ASME / SECTION 2 — ASME QUALITY CONTROL SYSTEM

### 2.1 Visão Geral do Sistema / System Overview
- *EN:* The PSC Quality Control System encompasses all technical, fabrication, testing, and inspection operations to ensure pressure vessels and parts meet the ASME BPVC Section VIII Division 1, Division 2, and NBIC requirements.
- *PT:* O Sistema de Controle da Qualidade da PSC abrange todas as operações técnicas, de fabricação, ensaios e inspeção para assegurar que vasos de pressão e componentes cumpram os requisitos do ASME BPVC Seção VIII Divisão 1, Divisão 2 e NBIC.

### 2.2 Análise Crítica de Contratos e Pedidos / Contract and Order Review
- *EN:* Each customer inquiry and contract is reviewed by Engineering and QCC to identify Code of construction, edition, addenda, jurisdictional requirements, special user requirements, and necessary Authorized Inspection arrangements.
- *PT:* Cada consulta e pedido de cliente é analisado criticamente pela Engenharia e CQ para definir o Código de construção aplicável, edição, adendas, exigências legais e acordos com a Inspeção Autorizada.

### 2.3 Gestão e Interface com o Inspetor Autorizado (AI) / Authorized Inspector Interface
- *EN:* The AI is provided uninterrupted access to shop, field, and records. The AI is informed in timely fashion of production schedules and hold points specified on the ITP.
- *PT:* O Inspetor Autorizado tem livre acesso à fábrica, canteiros e registros técnicos. O AI é notificado tempestivamente sobre o cronograma produtivo e pontos de parada estabelecidos no ITP.

---

## SEÇÃO 4 — CONTROLE DE PROJETO E CÁLCULOS / SECTION 4 — DESIGN CONTROL AND CALCULATIONS

### 4.1 Controle de Cálculos ASME VIII Div. 1 e Div. 2 / Design Calculations Control
- *EN:* All pressure vessel designs shall be executed in accordance with ASME Section VIII, Division 1 or Division 2 as specified in the purchase order and User's Design Specification (UDS).
- *PT:* Todos os projetos de vasos de pressão devem ser realizados de acordo com o ASME Seção VIII, Divisão 1 ou Divisão 2, conforme especificado no pedido de compra e na Especificação de Projeto do Usuário (UDS).

### 4.2 Verificação Independente de Projeto / Design Verification
- *EN:* Calculations and drawings are prepared by qualified design engineers and independently checked and approved by an authorized engineering supervisor prior to release for fabrication.
- *PT:* Cálculos e desenhos executivos são elaborados por engenheiros projetistas qualificados e checados de forma independente por supervisor técnico antes da liberação fabril.

### 4.3 Relatório de Projeto do Fabricante (MDeR) / Manufacturer's Design Report (MDeR)
- *EN:* For ASME Section VIII Division 2 vessels, a comprehensive Manufacturer's Design Report (MDeR) including finite element analysis (FEA) and fatigue evaluation shall be certified by a registered Professional Engineer (PE) or Certifying Engineer.
- *PT:* Para vasos ASME Seção VIII Divisão 2, um Relatório de Projeto do Fabricante (MDeR) completo, incluindo análise por elementos finitos (FEA) e avaliação de fadiga, deve ser certificado por Engenheiro Certificador habilitado.

### 4.4 Controle de Alterações de Projeto / Design Change Control
- *EN:* Revisions to drawings and design calculations follow the same review, checking, approval, and AI review process as the original documentation.
- *PT:* Revisões de desenhos e cálculos de projeto seguem o mesmo fluxo rigoroso de verificação, aprovação e submissão ao AI que a documentação inicial.

---

## SEÇÃO 5 — CONTROLE DE MATERIAIS / SECTION 5 — MATERIAL CONTROL

### 5.1 Seleção e Especificação conforme ASME Seção II / Material Selection per ASME Section II
- *EN:* All pressure-retaining materials and welding consumables must conform to ASME Section II (Parts A, B, C, D) or applicable ASME Code Cases.
- *PT:* Todos os materiais pressurizados e consumíveis de soldagem devem cumprir as especificações da Seção II do ASME (Partes A, B, C, D) ou Code Cases aprovados.

### 5.2 Inspeção de Recebimento e Certificados (MTR) / Receiving Inspection and MTRs
1. *EN:* Upon receipt, materials are quarantined until inspected by the Quality Inspector.
2. *PT:* Ao chegarem à fábrica, os materiais ficam segregados em quarentena até inspeção formal do CQ.
3. *EN:* Certified Material Test Reports (CMTR / MTR) are verified against ASME Section II specifications (chemistry, mechanical properties, heat treatment condition).
4. *PT:* Os Certificados de Teste de Material (MTR) são confrontados com as exigências da norma ASME Seção II (composição química, ensaios mecânicos, tratamento térmico).
5. *EN:* The AI has the right to review MTRs and examine received materials prior to fabrication.
6. *PT:* O Inspetor Autorizado possui a prerrogativa de analisar os MTRs e examinar os materiais antes do processamento.

### 5.3 Rastreabilidade e Marcação / Traceability and Marking
- *EN:* Heat numbers, material grade, and unique piece mark numbers must be transferred before cutting or sectioning, using low-stress vibro-etching, stenciling, or tagging approved by the AI.
- *PT:* Número de corrida, grau do material e código de identificação devem ser transferidos antes de qualquer corte mecânico ou térmico, utilizando punção de baixa tensão, estêncil ou plaqueta aceita pelo AI.

---

## SEÇÃO 6 — CONTROLE DE INSPEÇÃO E PROGRAMA DE ENSAIOS / SECTION 6 — INSPECTION CONTROL AND TEST PROGRAM

### 6.1 Plano de Inspeção e Testes (ITP) / Inspection and Test Plan (ITP)
- *EN:* Prior to fabrication, QCC prepares a job-specific ITP identifying all fabrication steps, mandatory examination methods, witness points (W), and hold points (H).
- *PT:* Antes do início da fabricação, o CQ elabora um ITP específico detalhando cada etapa produtiva, ensaios mandatórios, pontos de testemunho (W) e pontos de parada obrigatória (H).

### 6.2 Pontos de Parada do Inspetor Autorizado (AI Hold Points) / AI Hold Points
- *EN:* The AI selects hold points on the ITP (such as material verification, fit-up, root pass, NDE review, internal visual, hydrotest, and nameplate stamping).
- *PT:* O Inspetor Autorizado assinala seus Hold Points no ITP (ex.: conferência de materiais, montagem/ponteamento, passe de raiz, análise de END, exame visual interno, teste hidrostático e aposição da estampa).
- *EN:* Fabrication shall not proceed past an AI hold point without written release or sign-off by the AI.
- *PT:* A fabricação não pode prosseguir além de um ponto de parada do AI sem liberação formal por escrito ou assinatura do Inspetor Autorizado.

### 6.3 Teste Hidrostático e Pneumático / Hydrostatic and Pneumatic Testing
- *EN:* Pressure testing shall be performed strictly in accordance with ASME Section VIII (Div. 1 UG-99/UG-100; Div. 2 Part 8). Test pressure gauges must be calibrated within 30 days or before each test series. Test must be witnessed and accepted by the AI.
- *PT:* Os testes de pressão devem ser realizados rigorosamente conforme o ASME Seção VIII (Div. 1 UG-99/UG-100; Div. 2 Parte 8). Manômetros devem estar calibrados com validade máxima de 30 dias. O teste deve ser presenciado e aceito pelo Inspetor Autorizado.

---

## SEÇÃO 8 — CONTROLE DE SOLDAGEM / SECTION 8 — WELDING CONTROL

### 8.1 Procedimentos de Soldagem (WPS e PQR) / Welding Procedures (WPS & PQR)
- *EN:* All welding must be performed using Welding Procedure Specifications (WPS) qualified by Procedure Qualification Records (PQR) in full compliance with ASME Section IX.
- *PT:* Todas as operações de soldagem devem ser executadas com EPS/WPS qualificadas por RQPS/PQR em plena conformidade com a Seção IX do ASME.
- *EN:* WPS and PQR documents are submitted to the AI for review and acceptance before production welding commences.
- *PT:* As WPS e PQRs são disponibilizadas ao Inspetor Autorizado para análise e aceitação antes do início da produção.

### 8.2 Qualificação de Soldadores e Operadores (WPQ) / Welder Performance Qualification (WPQ)
- *EN:* Welders and welding operators are tested and qualified in accordance with ASME Section IX. Welder performance qualification records (WPQ) are maintained on file.
- *PT:* Soldadores e operadores de soldagem são testados e qualificados segundo o ASME Seção IX. Os registros de qualificação (WPQ) são mantidos atualizados.

### 8.3 Registro de Continuidade de Soldagem / Welder Continuity Record
- *EN:* Welder qualification continuity must be verified and logged at least once every six (6) months for each process used. If a welder fails to weld with a process for six months, qualification lapses.
- *PT:* A continuidade dos soldadores é registrada a cada seis (6) meses para cada processo de soldagem. A ausência de registro implica na expiração da qualificação.

### 8.4 Armazenamento e Manuseio de Consumíveis / Consumables Storage and Handling
- *EN:* Low-hydrogen electrodes and fluxes must be stored in holding ovens at temperatures per manufacturer recommendations and ASME Section II Part C.
- *PT:* Eletrodos revestidos de baixo hidrogênio e fluxos devem ser mantidos em estufas e estufins conforme recomendações do fabricante e ASME Seção II Parte C.

---

## SEÇÃO 9 — ENSAIOS NÃO DESTRUTIVOS (END) / SECTION 9 — NONDESTRUCTIVE EXAMINATION (NDE)

### 9.1 Procedimentos de END conforme ASME Seção V / NDE Procedures per ASME Section V
- *EN:* All NDE activities (Visual, Liquid Penetrant, Magnetic Particle, Radiography, Ultrasonic) shall be performed using written procedures qualified to ASME Section V and applicable Section VIII requirements.
- *PT:* Todos os métodos de END (Visual, Líquido Penetrante, Partícula Magnética, Radiografia, Ultrassom) devem ser realizados conforme procedimentos aprovados baseados no ASME Seção V e Seção VIII.

### 9.2 Qualificação de Pessoal de END / NDE Personnel Qualification
- *EN:* NDE personnel shall be qualified and certified in accordance with PSC's Written Practice formulated per ASNT SNT-TC-1A or CP-189.
- *PT:* O pessoal de END é qualificado e certificado de acordo com a Prática Escrita da PSC estruturada conforme a ASNT SNT-TC-1A ou CP-189.
- *EN:* Level III certification records, examiner qualifications, and eye examination records are subject to review by the AI.
- *PT:* Registros de Nível III, certificados de examinadores e laudos de acuidade visual ficam à disposição do AI.

### 9.3 Relatórios e Aceitação de Laudos / Examination Reports and Acceptance
- *EN:* NDE reports (including radiographic films or digital radiographs) are reviewed and approved by certified Level II/III personnel and submitted to the AI for final acceptance.
- *PT:* Laudos de END (incluindo filmes radiográficos e relatórios digitais) são avaliados por inspetores Nível II/III certificados e apresentados ao Inspetor Autorizado para liberação.

---

## SEÇÃO 12 — CERTIFICAÇÃO ASME E ESTAMPA / SECTION 12 — ASME CERTIFICATION AND STAMPING

### 12.1 Relatório de Dados do Fabricante (MDR) / Manufacturer's Data Report (MDR)
- *EN:* The QCC prepares the appropriate ASME Data Report (Form U-1, U-1A, or A-1). The document is signed by PSC's designated representative and countersigned by the Authorized Inspector (AI).
- *PT:* O CQ elabora o Formulário de Dados ASME cabível (U-1, U-1A ou A-1). O documento é assinado pelo responsável formal da PSC e referendado com a assinatura do Inspetor Autorizado (AI).

### 12.2 Placa de Identificação e Estampa ASME / Nameplate and ASME Code Stamping
- *EN:* Stamping with the ASME "U", "U2", and/or National Board "NB" / "R" symbol shall only be applied in the presence and with the direct authorization of the Authorized Inspector (AI).
- *PT:* A aposição da estampa do símbolo ASME ("U", "U2") e/ou National Board ("NB", "R") na placa de identificação só pode ser efetuada na presença e com a expressa autorização do Inspetor Autorizado.

### 12.3 Registro no National Board / National Board Registration
- *EN:* When required by contract or jurisdiction, vessels stamped with ASME Code symbols are registered with the National Board of Boiler and Pressure Vessel Inspectors and copies of the MDR are filed accordingly.
- *PT:* Conforme exigência contratual ou legal, os equipamentos são registrados no National Board com envio de via autêntica do MDR.

---

## SEÇÃO 14 — REGISTROS DA QUALIDADE E DATA-BOOK / SECTION 14 — QUALITY RECORDS AND DATA BOOKS

### 14.1 Compilação do Data-Book / Data Book Compilation
- *EN:* PSC compiles a comprehensive Manufacturer's Data Book for each Code vessel containing: calculations, drawings, MTRs, ITP, WPS/PQR, weld maps, NDE reports, PWHT charts, pressure test certificates, MDR, and nameplate rubbings.
- *PT:* A PSC organiza o Data-Book da qualidade contendo: memória de cálculo, desenhos aprovados, MTRs, ITP, EPS/RQPS, mapa de soldas, laudos de END, gráficos de tratamento térmico, laudo de teste hidrostático, MDR e decalque da placa.

### 14.2 Retenção e Arquivamento de Registros / Records Retention
- *EN:* Quality records and Manufacturer's Data Reports must be safely retained for a minimum period of five (5) years for ASME Section VIII Div. 1, or ten (10) years for Div. 2, or as required by the jurisdiction / contract.
- *PT:* Os registros da qualidade e MDRs devem ser custodiados com segurança por período mínimo de 5 anos (Div. 1) ou 10 anos (Div. 2), ou prazo contratual superior.

---

## SEÇÃO 15 — NÃO CONFORMIDADES E AUDITORIAS / SECTION 15 — NONCONFORMITIES AND AUDITS

### 15.1 Identificação e Segregação de Não Conformidades / Identification and Segregation
- *EN:* Any material, component, or operation not conforming to Code or drawings is tagged with a "HOLD / REJECTED" tag and physically segregated to prevent unintended use.
- *PT:* Qualquer item ou operação com desvio em relação ao Código ou desenho é identificado imediatamente com etiqueta "NÃO CONFORME / HOLD" e segregado fisicamente.

### 15.2 Disposição e Concordância do AI / Disposition and AI Concurrence
- *EN:* Nonconformance reports (NCR) specify proposed dispositions: Scrap, Repair, or Acceptance as-is. Dispositions involving Code repairs must be submitted to the Authorized Inspector (AI) for agreement before starting repair.
- *PT:* Os Relatórios de Não Conformidade (RNC) definem a disposição: Sucata, Retrabalho ou Reparo sob Código. Disposições que envolvam reparo de solda em itens pressurizados exigem a prévia anuência do AI.

### 15.3 Auditorias Internas e Análise Crítica / Internal Audits and Management Review
- *EN:* Internal audits of the ASME Quality Control System are conducted annually by independent qualified auditors. Results are reviewed by top management during the annual ASME Quality Review.
- *PT:* Auditorias internas do Sistema de Controle da Qualidade ASME são executadas anualmente por auditores qualificados e independentes. Os resultados são examinados pela Diretoria na Reunião de Análise Crítica ASME.
`

    // Verificar se já existe registro com prefix='MCQ' ou code='MCQ' na empresa
    var existingDoc = null
    try {
      var records = app.findRecordsByFilter(
        'documents',
        "company_id = '" + COMPANY_ID + "' && (code = 'MCQ' || prefix = 'MCQ')",
        '-created',
        1,
        0,
      )
      if (records && records.length > 0) {
        existingDoc = records[0]
      }
    } catch (_) {}

    var docCol = app.findCollectionByNameOrId('documents')
    var targetDoc = existingDoc || new Record(docCol)

    targetDoc.set('company_id', COMPANY_ID)
    targetDoc.set('code', 'MCQ')
    targetDoc.set('prefix', 'MCQ')
    targetDoc.set('prefix_en', 'MCQ - Quality Control Manual')
    targetDoc.set('title', 'MANUAL DE CONTROLE DA QUALIDADE ASME')
    targetDoc.set('title_en', 'ASME QUALITY CONTROL MANUAL')
    targetDoc.set('revision', '00')
    targetDoc.set('status', 'Under Review')
    targetDoc.set('document_type', 'Internal')
    targetDoc.set('category', 'ASME')
    targetDoc.set('language', 'Portuguese')
    targetDoc.set('sector', 'CQ')
    targetDoc.set('template_family', TEMPLATE_FAMILY)
    targetDoc.set('effective_date', '2025-12-19 00:00:00.000Z')
    targetDoc.set('prepared_by', 'Armando')
    targetDoc.set('approved_by', 'Marcos Maciel')
    targetDoc.set('verified_by', '')
    targetDoc.set('revision_history', revisionHistory)
    targetDoc.set('content', MCQ_CONTENT)
    targetDoc.set('content_en', '')

    app.save(targetDoc)

    console.log(
      'Migration 0104: Documento MCQ ASME criado/atualizado com sucesso! (id=' + targetDoc.id + ')',
    )
  },
  (app) => {
    // Reversão da migration 0104
    try {
      var records = app.findRecordsByFilter(
        'documents',
        "company_id = 'a631bv695rr4gef' && code = 'MCQ'",
        '-created',
        1,
        0,
      )
      if (records && records.length > 0) {
        app.delete(records[0])
      }
    } catch (_) {}
  },
)
