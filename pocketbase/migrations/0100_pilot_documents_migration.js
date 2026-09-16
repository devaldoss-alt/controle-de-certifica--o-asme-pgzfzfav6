migrate(
  (app) => {
    // -------------------------------------------------------------
    // Migration 0100: Migração piloto de 3 documentos reais para a biblioteca de documentos
    // Documentos:
    // 1. PR-CQ-14: PROCEDIMENTO DE ENSAIO VISUAL (8 páginas, bilíngue EN/PT)
    // 2. EVS-PSC-01: PROCEDIMENTO DE ENSAIO VISUAL DE SOLDA (54 páginas, bilíngue EN/PT, Tabelas 1-16 + Anexo)
    // 3. IT-CQ-08: FABRICAÇÃO DE TUBOS PARA FEIXE TUBULAR DE PERMUTADORES DE CALOR COM TUBOS EM U (3 páginas, PT, quadro)
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

    // =============================================================
    // 1. CONTEÚDO PR-CQ-14 REV. 02
    // =============================================================
    var PR_CQ_14_CONTENT = `# VISUAL INSPECTION PROCEDURE / PROCEDIMENTO DE ENSAIO VISUAL

**Código / Code:** PR-CQ-14  
**Revisão / Rev.:** 02  
**Sistema de Gestão da Qualidade / Quality Management System**  
**Páginas / Pages:** 1 de 8  

---

### Controle de Assinaturas / Signature Control

| Elaboração/Revisão / *Elaboration/Revision* | Data / *Date* | Aprovação/Reaprovação / *Approval/Reapproval* | Data / *Date* |
| :--- | :--- | :--- | :--- |
| **Geraldo Timóteo**<br>Quality Control Coordinator / Coordenador do Controle de Qualidade | 08/12/2025 | **Marcos Maciel**<br>Director / Diretor | 08/12/2025 |

---

## INDEX / ÍNDICE

0. REVISION HISTORY / 0. HISTÓRICO DE REVISÕES  
1. OBJECTIVE / 1. OBJETIVO  
2. APPLICATION / 2. APLICAÇÃO  
3. REFERENCE DOCUMENTS / 3. DOCUMENTOS DE REFERÊNCIA  
4. DEFINITIONS / 4. DEFINIÇÕES  
5. RESPONSIBILITIES / 5. RESPONSABILIDADES  
  5.1 INSPECTION SECTOR / 5.1 SETOR DE INSPEÇÃO  
6. TEST FREQUENCY / 6. FREQUÊNCIA DE ENSAIO  
7. PROCEDURE / 7. PROCEDIMENTO  
  7.1 ILLUMINATION / 7.1 ILUMINAÇÃO  
  7.2 MATERIALS USED / 7.2 MATERIAIS UTILIZADOS  
8. GENERAL CONDITIONS / 8. CONDIÇÕES GERAIS  
9. ACCEPTANCE CRITERIA / 9. CRITÉRIOS DE ACEITAÇÃO  
  9.1 ACQUIRED MATERIALS / 9.1 MATERIAIS ADQUIRIDOS  
10. MANUFACTURED PRODUCTS / 10. PRODUTOS FABRICADOS  
11. RECORDS / 11. REGISTROS  

---

## 0. REVISION HISTORY / HISTÓRICO DE REVISÕES

| REVISION / REVISÃO | DATE / DATA | CHANGE / ALTERAÇÃO | PREPARED BY / ELABORADO | APPROVED BY / APROVADO |
| :---: | :---: | :--- | :--- | :--- |
| **02** | 08/12/2025 | General Review for adaptation to ASME Standard. / *Revisão Geral para adaptação à Norma ASME.* | Geraldo Timóteo / Laira Menezes | Marcos Maciel |
| **01** | 08/06/25 | Change of Logo / *Mudança Logomarca.* | Leonardo Fontes | Marcos Maciel |
| **00** | 05/06/23 | Initial Issue / *Emissão inicial.* | Geraldo Timóteo | Marcos Maciel |

---

## 1. OBJECTIVE
Establish acceptance criteria through visual inspection, with the aim of evaluating the surface and identifying possible defects or discontinuities in the analyzed part or component.

## 1. OBJETIVO
Estabelecer critérios de aceitação por meio de inspeção visual, com o objetivo de avaliar a superfície e identificar possíveis defeitos ou descontinuidades na peça ou componente analisado.

---

## 2. APPLICATION
Through visual testing, it is possible to identify defects such as cracks, corrosion, wear, irregularities, and other imperfections that may compromise the performance of equipment components, and can be applied to the most diverse types of materials.

This procedure applies to the visual testing of the following materials:
- Castings;
- Laminates;
- Forgings;
- Finishing of machined parts;
- Equipment assembly;
- Preparation for shipping components and equipment;

## 2. APLICAÇÃO
Através do ensaio visual é possível identificar defeitos como trincas, corrosão, desgastes, irregularidades e outras imperfeições que podem comprometer o desempenho dos componentes de um equipamento, podendo ser aplicada aos mais diversos tipos de materiais.

Este procedimento se aplica no ensaio visual dos seguintes materiais:
- Fundidos;
- Laminados;
- Forjados;
- Acabamento de peças usinadas;
- Montagem de equipamentos;
- Preparação de embarque de componentes e equipamento;

---

## 3. REFERENCE DOCUMENTS
- Quality Manual MSGQ;
- PR-CQ-03 INSPECTION AND TESTING;
- ABNT NBR 5426 - Sampling Plans and Procedures in Attribute Inspection;
- N-1597 – Non-Destructive Visual Testing;
- ASME Section V Nondestructive Examination;
- ASME Seção VIII, Div. 1 e 2;
- NBIC - National Board Inspection Code.

## 3. DOCUMENTOS DE REFERÊNCIA
- Manual da Qualidade MSGQ;
- PR-CQ-03 INSPEÇÃO E ENSAIOS;
- ABNT NBR 5426 - Planos de Amostragem e Procedimentos na Inspeção por Atributos;
- N-1597 – Ensaio Não Destrutivo Visual;
- ASME Section V Nondestructive Examination;
- ASME Seção VIII, Div. 1 e 2;
- NBIC – Código Nacional de Inspeção do Conselho.

---

## 4. DEFINITIONS
- **Visual Inspection:** Non-destructive testing method that evaluates the part as acceptable or not, according to acceptance criteria.
- **Surface Defects:** Defects present on the material surface.

## 4. DEFINIÇÕES
- **Inspeção Visual:** Método de ensaio não destrutivo que avalia a peça como aceitável ou não, de acordo com os critérios de aceitação.
- **Defeitos Superficiais:** São defeitos apresentados na superfície do material.

---

## 5. RESPONSIBILITIES / 5. RESPONSABILIDADES

### 5.1 INSPECTION SECTOR
- Perform visual inspection and record in the Receiving Inspection Report.

### 5.1 SETOR DE INSPEÇÃO
- Realizar inspeção visual e registra no Relatório de Inspeção de recebimento.

---

## 6. TEST FREQUENCY
Visual testing must be performed on all incoming materials as well as on internally manufactured components. The scope of the test is in accordance with item: 5.3.1 of PR-CQ-03 INSPECTION AND TESTING.

## 6. FREQUÊNCIA DE ENSAIO
O ensaio visual deve ser realizado em todo o recebimento de materiais bem como nos componentes fabricados internamente. Sendo a abrangência do ensaio conforme item: 5.3.1 do PR-CQ-03 INSPEÇÃO E ENSAIOS.

---

## 7. PROCEDURE / 7. PROCEDIMENTO

### 7.1 ILLUMINATION
Direct and remote testing methods must be performed with illumination of at least 1050 lux.

### 7.1. ILUMINAÇÃO
Os métodos de ensaio direto e remoto devem ser realizados com iluminação de no mínimo, 1050 lux.

### 7.2 MATERIALS USED
To improve visibility, the inspector may use the following materials:
- Lenses;
- Mirrors;
- Borescope.

### 7.2. MATERIAIS UTILIZADOS
Para melhorar a visibilidade, o inspetor pode contar com o auxílio dos seguintes materiais:
- Lentes;
- Espelhos;
- Boroscópio.

---

## 8. GENERAL CONDITIONS
The location where the visual inspection is performed must be clean, organized, and sufficiently lit, with adequate illumination. Areas with inaccessible visibility can be checked with the aid of materials such as lenses, mirrors, or borescope.

The location needs to be illuminated, and reflections on the surface should be avoided in reflective materials, such as aluminum and stainless steel; the recommended illumination is 1076 lux.

The visual testing must be executed as recommended in the standards or specifications for design, manufacturing, construction, and assembly related to the inspected equipment, except for modifications, additions, and deletions mentioned in the specific conditions.

In surface preparation, products or methods that may contaminate the tested material or harm subsequent non-destructive tests should not be used.

## 8. CONDIÇÕES GERAIS
O local onde se realiza a inspeção visual, deve estar limpo, organizado e suficientemente claro, com iluminação adequada. As áreas com visibilidade inacessível podem ser verificadas com auxílio de materiais como lentes, espelhos ou boroscópio.

O local precisa ser iluminado e se deve evitar os reflexos na superfície em materiais reflexivos, como alumínio e aço inoxidável a iluminação recomendada é de 1076 lux.

O ensaio por meio de ensaio visual deve ser executado conforme preconizado nas normas ou especificações de projeto, fabricação, construção e montagem relativa ao equipamento inspecionado, exceto quanto às modificações, adições e supressões mencionadas nas condições específicas.

Na preparação de superfície não devem ser empregados produtos ou métodos que possam contaminar o material ensaiado ou prejudicar ensaios não-destrutivos posteriores.

---

## 9. ACCEPTANCE CRITERIA / 9. CRITÉRIOS DE ACEITAÇÃO

### 9.1 ACQUIRED MATERIALS
- Bars;
- Tubes;
- Plates;
- Flanges;
- Profiles;
- Elastomers;
- Bolts;
- Eyebolts.

These acquired/purchased products must have the following acceptance criteria in visual inspection:
- The material must be free of oxidation;
- The material must not present damage to the physical integrity of the item, that is, scratches, cracks, crusts, deformations, and other surface defects above 0.8mm;
- For inspection approval, the linear aspect of the surface must not lead to a lower level of finish compared to the original of the other parts of the component;
- Corrosion cannot exceed grade C of ISO 8501-1 for the following materials: carbon steels; molybdenum alloy steels; chrome-molybdenum alloy steels and any degree of corrosion for stainless steels and non-ferrous metals.

### 9.1 MATERIAIS ADQUIRIDOS
- Barras;
- Tubos;
- Chapas;
- Flanges;
- Perfis;
- Elastômeros;
- Parafusos;
- Olhais.

Esses produtos adquiridos /comprados, devem ter os seguintes critérios de aceitação na inspeção visual:
- O material deve estar isento de oxidação;
- O material não deve apresentar danos a integridade física do item, isto é, riscos, trincas, crostas, deformações e demais defeitos superficiais acima de 0,8mm;
- Para aprovação da inspeção o aspecto linear da superfície não deve conduzir a um nível inferior de acabamento em relação ao original das demais partes do componente;
- Corrosão não pode ser acima do grau C da ISO 8501-1 para os seguintes materiais: aços-carbono; aços liga molibdênio; aços liga cromo-molibdênio e qualquer grau de corrosão para os aços inoxidáveis e metais não ferrosos.

---

## 10. MANUFACTURED PRODUCTS
The products manufactured by PSC must have the following acceptance criteria in visual inspection:
- The component or equipment must be free of oxidation;
- The component or equipment must be free of surface defects that compromise operation;
- Areas in the drawings where tool scratches and other surface defects are not permitted must be inspected and approved in accordance with what is specified in the drawings;
- In the surface preparation of austenitic stainless steels, duplex or super duplex, and nickel alloys, by brushing, sanding, and grinding, the preparation tools used must meet the following requirements: Be made of stainless steel or coated with this material; cutting and grinding discs must have a nylon core or similar.

## 10. PRODUTOS FABRICADOS
Os produtos fabricados pela PSC, devem ter os seguintes critérios de aceitação na inspeção visual:
- O componente ou equipamento devem estar isentos de oxidação;
- O componente ou equipamento devem estar isentos de defeitos superficiais que comprometam o funcionamento;
- Áreas nos desenhos que não sejam permitidos riscos de ferramentas e outros defeitos superficiais, devem ser inspecionadas e aprovadas em conformidades com o especificado nos desenhos;
- Na preparação da superfície de aços inoxidáveis austeníticos, duplex ou super. duplex e ligas de níquel, por escovamento, lixamento e esmerilhamento, as ferramentas de preparação utilizadas devem atender aos seguintes requisitos: Serem de aço inoxidável ou revestidas com este material; os discos de corte e esmerilhamento devem ter alma de náilon ou similar.

---

## 11. RECORDS
- **FSGQ 8.6-8** - Receiving Inspection Report - RIR
- **FSGQ 8.6-11** - LV Equipment Shipment

## 11. REGISTROS
- **FSGQ 8.6-8** - Relatório de Inspeção de Recebimento - RIR
- **FSGQ 8.6-11** - LV Embarque de Equipamento
`

    // =============================================================
    // 2. CONTEÚDO EVS-PSC-01 REV. 02
    // =============================================================
    var EVS_PSC_01_CONTENT = `# PROCEDURE / PROCEDIMENTO: EVS-PSC-01
## Ndt Procedure - Visual Welding Test / Procedimento De End - Ensaio Visual De Solda

**Código / Code:** EVS-PSC-01  
**Revisão / Rev.:** 02  
**Sistema de Gestão da Qualidade / Quality Management System**  
**Páginas / Pages:** 1 a 54  
**Qualificação Técnica:** THE PROCEDURE IS QUALIFIED AND IN ACCORDANCE WITH THE RULES OF THE AFOREMENTIONED STANDARDS. / PROCEDIMENTO QUALIFICADO E DE ACORDO COM AS REGRAS DAS NORMAS CITADAS.  
**Responsável Técnico / Technical Responsible:** SANDRO OSMAR RISSI / SNQC/END NÍVEL 3 Nº 00083 (EV)  

---

### Revision History Index / Índice de Revisões

| Rev. | DESCRIPTION AND/OR AFFECTED LEAVES / DESCRIÇÃO E/OU FOLHAS ATINGIDAS |
| :---: | :--- |
| **0** | ORIGINAL ISSUE / EMISSÃO ORIGINAL |
| **1** | UPDATE ITEMS: 2; 6.2 / ATUALIZAÇÃO ITENS: 2; 6.2 |
| **2** | GENERAL REVIEW TO COMPLY WITH ASME STANDARDS / REVISÃO GERAL PARA ATENDIMENTO À NORMA ASME |

| FUNÇÃO / FUNCTION | REV. 0 (10/06/2022) | REV. 1 (07/02/2025) | REV. 2 (08/12/2025) | REV. 3 |
| :--- | :--- | :--- | :--- | :--- |
| **DATE / DATA** | 10/06/2022 | 07/02/2025 | 08/12/2025 | |
| **PREPARED BY / ELABORADO** | SANDRO RISSI | SANDRO RISSI | SANDRO RISSI | |
| **VERIFIED BY / VERIFICADO** | SANDRO RISSI | SANDRO RISSI | SANDRO RISSI | |
| **APPROVED BY / APROVADO** | SANDRO RISSI | SANDRO RISSI | SANDRO RISSI | |

---

## INDEX / ÍNDICE

1. OBJECTIVE / OBJETIVO  
2. REFERENCE STANDARDS / NORMAS DE REFERÊNCIA  
3. INSPECTION METHOD / MÉTODO DE ENSAIO  
4. SURFACE CONDITION / CONDIÇÃO SUPERFICIAL (4.1 Surface Conditions / Estado das Superfícies)  
5. SURFACE PREPARATION METHOD / MÉTODO DE PREPARAÇÃO DA SUPERFÍCIE  
6. ILLUMINATION / ILUMINAÇÃO  
7. INSTRUMENTS / INSTRUMENTOS  
8. INSPECTION SEQUENCE / SEQUÊNCIA DE REALIZAÇÃO DO ENSAIO  
9. DISCONTINUITY RECORDING AND ACCEPTANCE CRITERIA / CRITÉRIO DE REGISTRO E ACEITAÇÃO DE DESCONTINUIDADE  
10. RESULTS RECORDING SYSTEM / SISTEMÁTICA DE REGISTRO DE RESULTADOS  
11. RESULTS RECORD REPORT / RELATÓRIO DE REGISTRO DOS RESULTADOS  
12. PERSONNEL QUALIFICATION / QUALIFICAÇÃO DO PESSOAL  
13. ENVIRONMENTAL AND SAFETY REQUIREMENTS / REQUISITOS AMBIENTAIS E DE SEGURANÇA  
14. TABLES / TABELAS  
15. ANNEX - VISUAL INSPECTION REPORT / ANEXO - RELATÓRIO DE ENSAIO VISUAL  

---

## 1. OBJECTIVE / OBJETIVO

This procedure establishes the required conditions for direct visual and dimensional inspection of joints prepared for welding and welded joints, meeting the minimum requirements of the standards.

Este procedimento fixa as condições exigíveis para o ensaio visual direto e dimensional de juntas preparadas para soldagem e de juntas soldadas, atendendo aos requisitos mínimos das normas.

---

## 2. REFERENCE STANDARDS / NORMAS DE REFERÊNCIA

- **ABENDI - NA-001** - Qualification of Personnel in Non-Destructive Testing; / *Qualificação de Pessoal em Ensaios Não Destrutivos;*
- **ABNT NBR 14842** - Qualification and Certification of Welding Inspectors; / *Qualificação e Certificação de Inspetores de Soldagem;*
- **ABNT NBR 15179** - Non-Destructive Testing - Visual Inspection - Terminology; / *Ensaios Não Destrutivos - Ensaio Visual - Terminologia;*
- **ABNT NM 315** - Non-Destructive Testing - Visual Inspection - Procedure; / *Ensaios Não Destrutivos - Ensaio Visual - Procedimento;*
- **API 650** - Welded Steel Tanks for Oil Storage;
- **API 620** - Welded, Low-pressure Storage Tanks;
- **ASME Section V - Article 9 - Appendix A** - Visual Examination;
- **ASME Section VIII, Div. 1 and Div. 2**;
- **NBIC** - National Board Inspection Code / *Código Nacional de Inspeção do Conselho;*
- **ASME B 31.1** - Power Piping;
- **ASME B 31.3** - Process Piping;
- **ASME B 31.4** - Pipeline Transportation Systems for Liquid Hydrocarbons and Other Liquids;
- **API 1104** - Welding of Pipelines and Related Facilities;
- **AWS D1.1** - American Welding Society;
- **PETROBRAS N-1597** - Non-Destructive Testing - Visual; / *Ensaio Não Destrutivo - Visual;*
- **PETROBRAS N-1738** - Discontinuities in Welded Joints, Castings, Forgings and Laminates; / *Descontinuidades em Juntas Soldadas, Fundidos, Forjados e Laminados;*
- **PETROBRAS N-1438** - Welding Terminology; / *Terminologia de soldagem;*
- **PETROBRAS N-133** - Welding. / *Soldagem.*

---

## 3. INSPECTION METHOD / MÉTODO DE ENSAIO

**3.1.** The visual inspection must be performed using the direct method. For the direct method, the inspector must have visual access to the surface under examination so that the view is located at a maximum distance of 600 mm, and at an observation angle of at least 30 degrees in relation to the inspected surface (Figure 1: POSIÇÃO DO OBSERVADOR: DISTÂNCIA MÁXIMA = 600 mm, ÂNGULO MÍNIMO = 30° / ÁREA DO ENSAIO VISUAL DIRETO / SUPERFÍCIE EXAMINADA). Mirrors can be used to improve the viewing angle and magnifying glasses can be used to assist in visualization.

*3.1. O ensaio visual deve ser realizado pelo método direto. Para o método direto o inspetor deve ter um acesso visual à superfície em exame para que a vista se localize a uma distância máxima de 600 mm, e a um ângulo de observação de, no mínimo, 30 graus em relação à superfície ensaiada (figura 1). Espelhos podem ser utilizados para melhorar o ângulo de visão e lupas podem ser utilizadas para ajudar na visualização.*

**3.2.** If visual access to the surface does not allow direct visual inspection (as per item 3.1), remote visual inspection must be used, requiring a qualified procedure detailing the technique, instruments and equipment to be used.

*3.2. Caso o acesso visual à superfície não permita o exame visual direto (conforme item 3.1) o ensaio visual remoto deve ser utilizado, devendo ser qualificado um procedimento detalhando a técnica, instrumentos e equipamentos a serem utilizados.*

---

## 4. SURFACE CONDITION / CONDIÇÃO SUPERFICIAL

### 4.1 Surface Conditions / 4.1 Estado das Superfícies

**4.1.1 Joints prepared for welding** - The surfaces to be inspected must be free of oil, grease, scale, corrosion, paint and other residues that may interfere with the quality of the weld. The protective varnish on the bevels does not need to be removed as long as the application method and commercial brand are qualified in the welding procedure, or if permanence is desired for procedure qualification. Irregularities resulting from oxyfuel cutting or carbon electrode cutting must be removed, as well as carbon and slag residues. The maximum roughness degree will be equal to 2, according to AWS C4.1 standard. In addition to the bevels, a strip of at least 20 mm on each side of the groove must be clean.

*4.1.1 Juntas preparadas para soldagem - As superfícies a serem ensaiadas deverão estar isentas de óleo, graxa, carepas, corrosão, tinta e outros resíduos que possam interferir na qualidade da solda. O verniz de proteção dos biséis não necessita ser removido desde que o método de aplicação e a marca comercial estejam qualificados no procedimento de soldagem, ou se é desejada a permanência para qualificação de procedimentos. Irregularidades resultantes do oxicorte ou do corte com eletrodos de carvão devem ser removidas, bem como os resíduos de carbono e escórias. O grau de rugosidade máximo será igual a 2, conforme padrão AWS C4.1. Além dos biséis, uma faixa de no mínimo 20 mm para cada lado do chanfro deve estar limpa.*

**4.1.2 Welded joints** - The surfaces to be inspected and a 20 mm strip on each side must be free of slag, corrosion, spatter, arc strikes, grease, oil, paint, etc.

*4.1.2 Juntas soldadas - As superfícies a serem ensaiadas e uma faixa de 20 mm para cada lado deverão estar isentas de escórias, corrosões, respingos, aberturas de arco, graxa, óleo, tinta, etc.*

---

## 5. SURFACE PREPARATION METHOD / MÉTODO DE PREPARAÇÃO DA SUPERFÍCIE

**5.1.** The surfaces of the bevels and welded joints will be prepared by grinding or brushing, sandblasting or chemical cleaning, meeting the surface condition requirements detailed in item 4.1.1.

*5.1. As superfícies dos biséis e das juntas soldadas serão preparadas por esmerilhamento ou escovamento, jateamento ou limpeza química, atendendo aos requisitos de estado da superfície detalhado no item 4.1.1.*

**5.2.** When the material to be prepared is austenitic stainless steel and nickel alloys, the tools and products must meet the following requirements:
- Be made of stainless steel or coated with this material; (*Ser de aço inoxidável ou revestida com este material;*)
- The cutting and/or grinding discs must have a nylon core; (*Os discos de corte e/ou desbaste devem ter a alma de nylon;*)
- The solvent products must not contain fractions of contaminating elements (chlorine and fluorine for austenitic stainless steels and titanium, and sulfur for nickel-based alloys), above the limits established by ASME Section V - Art. 6. (*Os produtos solventes não devem conter frações de elementos contaminantes (cloro e flúor para aços inoxidáveis austeníticos e titânio, e enxofre para as ligas à base de níquel), acima dos limites estabelecidos pelo ASME Section V - Art. 6.*)

---

## 6. ILLUMINATION / ILUMINAÇÃO

**6.1.** Illumination can be natural or artificial with the aid of lamps or 3-battery flashlights.  
*6.1. A iluminação pode ser natural ou artificial com o auxílio de lâmpadas ou lanternas de 3 pilhas.*

**6.2.** The minimum luminosity to be maintained during the inspection must be 1100 lux. The intensity must be verified on the surface to be inspected using a calibrated luxmeter.  
*6.2. A luminosidade mínima a ser mantida durante o ensaio deve ser de 1100 lux. A intensidade deve ser verificada na superfície a ser ensaiada utilizando-se um luxímetro calibrado.*

---

## 7. INSTRUMENTS / INSTRUMENTOS

**7.1** For the dimensional inspection of joints prepared for welding and welded joints, the following instruments may be used:  
*7.1 Para o ensaio dimensional de juntas preparadas para soldagem e de juntas soldadas podem ser utilizados os seguintes instrumentos:*
- Hi-lo gauge; (*Calibre de desalinhamento - High-low;*)
- Multi-function weld gauge - FBTS standard or similar; (*Calibre de solda múltiplas funções - padrão FBTS ou similar;*)
- Caliper; (*Paquímetro;*)
- Goniometer; (*Goniômetro;*)
- Gauge for checking root opening; (*Calibre para verificação da abertura da raiz;*)
- Specific templates for typical configurations; (*Gabaritos específicos a configurações típicas;*)
- Tape measure. (*Trena.*)

**7.2** For visual inspection, the following instruments may be used:  
*7.2 Para o ensaio visual podem ser utilizados os seguintes instrumentos:*
- Magnifying glass with diopter up to 2.5 times; (*Lupa com dioptria até 2,5 vezes;*)
- Flat or concave face mirror, with or without extension handle. (*Espelho de face plana ou côncava, com ou sem haste de extensão.*)

---

## 8. INSPECTION SEQUENCE / SEQUÊNCIA DE REALIZAÇÃO DO ENSAIO

**8.1** Verify if the preparation and cleaning of the surface are adequate.  
*8.1 Verificar se a preparação e limpeza da superfície são adequadas.*

**8.2** Verify if the light intensity on the surface to be inspected is satisfactory.  
*8.2 Verificar se a intensidade luminosa na superfície a ser ensaiada é satisfatória.*

**8.3** Perform the visual and dimensional inspection of the joint prepared for welding, verifying the dimensions and tolerances established in the welding execution and inspection instructions regarding:  
*8.3 Efetuar a inspeção visual e dimensional da junta preparada para a soldagem, verificando as dimensões e tolerâncias estabelecidas nas instruções de execução e inspeção de soldagem quanto a:*
- Bevel angle; (*Ângulo do bisel;*)
- Groove angle; (*Ângulo do chanfro;*)
- Root opening; (*Abertura da raiz;*)
- Root face height; (*Altura da face da raiz;*)
- Preparation depth; (*Profundidade de preparação;*)
- Misalignment; (*Desalinhamento;*)
- Double lamination; (*Dupla laminação;*)
- Excessive roughness; (*Rugosidade excessiva;*)
- Pitting and corrosion states. (*Pontos e estados de corrosão.*)

**8.4** Perform the visual and dimensional inspection of the welded joint, observing the existence of unacceptable discontinuities and verifying the dimensions and tolerances established in the reference documents, such as:  
*8.4 Efetuar a inspeção visual e dimensional da junta soldada, observando a existência de descontinuidades inaceitáveis e verificando as dimensões e tolerâncias estabelecidas nos documentos de referência, tais como:*
- Arc strike; (*Abertura de arco;*)
- Cracks; (*Trincas;*)
- Lack of fusion; (*Falta de fusão;*)
- Lack of penetration; (*Falta de penetração;*)
- Craters; (*Crateras;*)
- Excessive reinforcement angle; (*Ângulo excessivo de reforço;*)
- Concavity; (*Concavidade;*)
- Excessive concavity; (*Concavidade excessiva;*)
- Excessive convexity; (*Convexidade excessiva;*)
- Undercut; (*Embicamento;*)
- Undercut; (*Mordedura;*)
- Root undercut; (*Mordedura na raiz;*)
- Excessive penetration; (*Penetração excessiva;*)
- Burn-through; (*Perfuração;*)
- Surface pore; (*Poro superficial;*)
- Crater shrinkage; (*Rechupe de cratera;*)
- Excessive reinforcement; (*Reforço excessivo;*)
- Spatter; (*Respingos;*)
- Overlap; (*Sobreposição;*)
- Asymmetrical fillet weld; (*Solda em ângulo assimétrico;*)
- Angular deformation; (*Deformação angular;*)
- Insufficient deposition. (*Deposição insuficiente.*)

**8.5** Record and evaluate the indications according to items 9, 10 and 11 below.  
*8.5 Registrar e avaliar as indicações conforme itens 9, 10 e 11 a seguir.*

---

## 9. DISCONTINUITY RECORDING AND ACCEPTANCE CRITERIA / CRITÉRIO DE REGISTRO E ACEITAÇÃO DE DESCONTINUIDADE

**9.1.** The detected discontinuities will be evaluated according to the criteria defined in this procedure, and in its omission, according to the criterion defined by the equipment design standard under inspection.  
*9.1. As descontinuidades detectadas serão avaliadas conforme critérios definidos neste procedimento, e na omissão deste, conforme critério definido pela norma de projeto do equipamento sob ensaio.*

**9.2.** In case of no visual inspection criterion in the design standard, the discontinuities will be evaluated according to ASME Section VIII Division 1, as per Tables 1, 2 and 3.  
*9.2. Em caso de inexistência de critério para o ensaio visual na norma de projeto, as descontinuidades serão avaliadas de acordo com a norma ASME Seção VIII Divisão 1, conforme Tabelas 1, 2 e 3.*

**9.3.** For visual inspection of pressure vessels, according to ASME Section VIII Division 1, the discontinuity acceptance criterion will be as per tables 1, 2 and 3, except for vessels manufactured with ferritic steels with mechanical properties improved by heat treatment (materials listed in table UHT-23 of the standard), where the acceptance criterion will be as per tables 4, 5 and 6.  
*9.3. Para o ensaio visual de vasos de pressão, conforme a norma ASME Seção VIII Divisão 1, o critério de aceitação de descontinuidades será conforme tabelas 1, 2 e 3, exceto para vasos fabricados com aços ferríticos com propriedades mecânicas melhoradas por tratamento térmico (materiais listados na tabela UHT-23 da norma), onde o critério de aceitação será conforme tabelas 4, 5 e 6.*

**9.4.** For visual inspection of pressure vessels, according to ASME Section VIII Division 2, the discontinuity acceptance criterion will be as per tables 7, 8 and 9, except for vessels manufactured with high-strength quenched and tempered steels, where the misalignment acceptance criterion must be as per table 10.  
*9.4. Para o ensaio visual de vasos de pressão, conforme a norma ASME Seção VIII Divisão 2, o critério de aceitação de descontinuidades será conforme tabelas 7, 8 e 9, exceto para vasos fabricados com aços de alta resistência temperado e revenido, onde o critério de aceitação para desalinhamento deve ser conforme tabela 10.*

**9.5.** For visual inspection of metallic structures, according to AWS D1.1 standard, the acceptance criterion will be as per table 11.  
*9.5. Para o ensaio visual de estruturas metálicas, conforme a norma AWS D1.1, o critério de aceitação será conforme tabela 11.*

**9.6.** For visual examination in steam piping according to ASME B 31.1 Standard, the acceptance criterion will be as per table 12.  
*9.6. Para o exame visual em tubulações de vapor conforme a Norma ASME B 31.1 o critério de aceitação será conforme a tabela 12.*

**9.7.** For visual examination in petrochemical piping according to ASME B 31.3 Standard, the acceptance criterion will be as per table 13.  
*9.7. Para o exame visual em tubulações petroquímicas conforme a Norma ASME B 31.3 o critério de aceitação será conforme a tabela 13.*

**9.8.** For visual examination in storage tanks, according to API 650, the acceptance criterion will be as per Table 14.  
*9.8. Para o exame visual em tanques de armazenamento, conforme API 650, o critério de aceitação será conforme Tabela 14.*

**9.9.** For visual examination in large low-pressure welded storage tanks according to API 620, the acceptance criterion will be as per Table 15.  
*9.9. Para o exame visual em grandes tanques de armazenamento soldados de baixa pressão conforme API 620, o critério de aceitação será conforme Tabela 15.*

**9.10.** For visual examination in piping according to ASME B31.4, API 1104 and ASME B31.8 standards, the acceptance criterion will be as per Table 16.  
*9.10. Para o exame visual em tubulações conforme Norma ASME B31.4, API 1104 e ASME B31.8 o critério de aceitação será conforme Tabela 16.*

---

## 10. RESULTS RECORDING SYSTEM / SISTEMÁTICA DE REGISTROS DOS RESULTADOS

**10.1.** Unacceptable discontinuities according to the applicable acceptance criterion will be indicated with wax crayon, industrial marker or permanent marker on the piece itself.  
*10.1. As descontinuidades inaceitáveis pelo critério de aceitação aplicável serão indicadas com giz de cera, marcador industrial ou pincel atômico na própria peça.*

**10.2.** The inspected areas will be identified in the report, with the necessary references so that it is possible to correlate the inspected location and the position of the detected discontinuities, with the report and vice-versa. If necessary, a sketch or drawing must be attached to the report.  
*10.2. As áreas inspecionadas serão identificadas no relatório, com as referências necessárias para que seja possível correlacionar o local ensaiado e a posição das descontinuidades detectadas, com o relatório e vice-versa. Caso necessário, deve ser anexado ao relatório um croqui ou desenho.*

---

## 11. RESULTS RECORD REPORT / RELATÓRIO DE REGISTRO DOS RESULTADOS

**11.1.** An inspection report will be issued containing at least:  
*11.1. Será emitido um relatório de ensaio contendo no mínimo:*
- Company Logo; (*Logotipo da Empresa;*)
- Report Number; (*Número do relatório;*)
- Identification of the part, equipment or piping; (*Identificação da peça, equipamento ou tubulação;*)
- Procedure number and revision; (*Número e revisão do procedimento;*)
- Results record; (*Registro dos resultados;*)
- Standards or reference values for results interpretation; (*Normas ou valores de referência para interpretação dos resultados;*)
- Report indicating acceptance, rejection or recommendation for complementary inspection; (*Laudo indicando aceitação, rejeição ou recomendação de ensaio complementar;*)
- Date; (*Data;*)
- Identification and signature of the responsible inspector. (*Identificação e assinatura do inspetor responsável.*)

**11.2.** The report form will be the form according to annex I, and may be replaced by another that meets the minimum content mentioned in 11.1.  
*11.2. O formulário para relatório será o formulário conforme anexo I, podendo ser substituído por outro que atenda ao conteúdo mínimo citado em 11.1.*

**11.3.** All reports must be submitted for supervisor approval before sending to the Contractor.  
*11.3. Todos os relatórios devem ser submetidos à aprovação do supervisor antes do envio ao Contratante.*

---

## 12. PERSONNEL QUALIFICATION / QUALIFICAÇÃO DO PESSOAL

The visual inspection will be performed by an inspector qualified by SNQC – ABENDI - as EV-N2-S, according to ABENDI NA-001 standard or by SNQC-IS-FBTS- as IS-N1 or IS-N2, according to ABNT NBR 14842 standard or even as VT-L2 from ASNT, according to the recommendations of the Written Practice of SNT-TC-1A.

*O ensaio visual será executado por inspetor qualificado pelo SNQC – ABENDI - como EV-N2-S, conforme norma ABENDI NA-001 ou pelo SNQC-IS-FBTS- como IS-N1 ou IS-N2, conforme norma ABNT NBR 14842 ou ainda como VT-L2 da ASNT, de acordo com as recomendações da Prática Escrita da SNT-TC-1A.*

---

## 13. ENVIRONMENTAL AND SAFETY REQUIREMENTS / REQUISITOS AMBIENTAIS E DE SEGURANÇA

**13.1.** For the execution of the visual inspection, the inspector must use the necessary PPE (Personal Protective Equipment) to ensure their personal safety, in compliance with Regulatory Standard NR-6.  
*13.1. Para a execução do ensaio visual, o inspetor deverá utilizar os EPI (Equipamentos de Proteção Individual) necessários para garantir a sua segurança pessoal, em atendimento à Norma Regulamentadora NR-6.*

**13.2.** The environmental aspects and impacts and risks and hazards caused by the inspection activities to be carried out must be considered. Before starting the inspection work, the procedures and instructions that define the safety requirements of each company must be met.  
*13.2. Devem ser considerados os aspectos e impactos ambientais e riscos e perigos causados pelas atividades de ensaio a serem realizados. Antes do início dos trabalhos de inspeção, devem ser atendidos os procedimentos e instruções que definem os requisitos de segurança de cada empresa.*

**13.3.** The inspector will only perform the visual inspection if the equipment under inspection has full safety conditions regarding access, falling objects, existence of toxic or explosive gases or liquids, etc.  
*13.3. O inspetor somente executará o ensaio visual se o equipamento sob ensaio tiver condições plenas de segurança quanto ao acesso, queda de objetos, existência de gases ou líquidos tóxicos ou explosivos, etc.*

**13.4.** Within PETROBRAS facilities, a work permit must be obtained, according to PETROBRAS N-2162 standard, where the safety requirements for carrying out the inspection work are defined. In case of non-conformity, communicate to the industrial and environmental safety management body.  
*13.4. Dentro das instalações PETROBRAS deve ser obtida uma permissão de trabalho, conforme a norma PETROBRAS N-2162, onde são definidos os requisitos de segurança para a execução dos trabalhos de inspeção. Em caso de não conformidade, comunicar ao órgão gestor de segurança industrial e meio ambiente.*

**13.5.** All consumable material used in the inspection, which is subject to disposal, must be discarded in an appropriate location defined by the company where the inspections are being carried out.  
*13.5. Todo material consumível utilizado no ensaio, que seja objeto de descarte, deve ser descartado em local apropriado e definido pela empresa em que os ensaios estão sendo realizados.*

---

## 14. TABLES / TABELAS

### Table 1 - Acceptance Criteria for Pressure Vessels According to ASME Section VIII, Div. 1
### *Tabela 1 - Critério de Aceitação para Vasos de Pressão conforme a Norma ASME Seção VIII, Div. 1*

| Discontinuity / *Descontinuidade* | Acceptance Criteria / *Critério de Aceitação* |
| :--- | :--- |
| **Arc Strike** / *Abertura de arco* | Unacceptable / *Inaceitável* |
| **Excessive Reinforcement Angle** / *Ângulo excessivo de reforço* | Unacceptable / *Inaceitável* |
| **Longitudinal Weld Concavity** / *Concavidade em solda longitudinal* | Unacceptable / *Inaceitável* |
| **Circumferential Weld Concavity** / *Concavidade em solda circunferencial* | Maximum Depth = Height of the Weld Reinforcement in the Same Region / *Profundidade máxima = altura do reforço da solda na mesma região* |
| **Excessive Concavity (Fillet Weld)** / *Concavidade excessiva (solda em ângulo)* | According to Equipment Design Tolerance or EPS / *Conforme tolerância de projeto do equipamento ou da EPS* |
| **Angular Deformation** / *Deformação angular* | According to Equipment Design Tolerance or EPS / *Conforme tolerância de projeto do equipamento ou da EPS* |
| **Insufficient Deposition** / *Deposição insuficiente* | Unacceptable / *Inaceitável* |
| **Misalignment** / *Desalinhamento* | See Table 2 / *Ver tabela 2* |
| **Undercut** / *Embicamento* | According to Equipment Design Tolerance or EPS / *Conforme tolerância de projeto do equipamento ou da EPS* |
| **Lack of Fusion** / *Falta de fusão* | Unacceptable / *Inaceitável* |
| **Lack of Penetration** / *Falta de penetração* | Unacceptable / *Inaceitável* |
| **Undercut** / *Mordedura* | Unacceptable / *Inaceitável* |
| **Root Undercut** / *Mordedura na raiz* | Unacceptable / *Inaceitável* |
| **Excessive Penetration** / *Penetração excessiva* | Maximum = Maximum Allowed Reinforcement Height / *Máxima = altura máxima do reforço permitido* |
| **Burn-through** / *Perfuração* | Unacceptable / *Inaceitável* |
| **Surface Pore** / *Poro superficial* | Unacceptable / *Inaceitável* |
| **Weld Reinforcement Height** / *Altura do reforço da solda* | See Table 3 (except for material SA-517 where the reinforcement maximum is 10% of the plate thickness or 3.0 mm (the smaller)) / *Ver tabela 3 (exceto para material SA-517 onde o reforço máximo é de 10% da espessura da chapa ou 3,0 mm (o menor))* |
| **Spatter** / *Respingos* | Unacceptable / *Inaceitável* |
| **Overlap** / *Sobreposição* | Unacceptable / *Inaceitável* |
| **Asymmetrical Fillet Weld** / *Solda em ângulo assimétrica* | According to Equipment Design Tolerance or EPS / *Conforme tolerância de projeto do equipamento ou da EPS* |
| **Cracks** / *Trincas* | Unacceptable / *Inaceitável* |

---

### Table 2 - Tolerance for Misalignment (ASME Section VIII Div. 1 - Table UW-33)
### *Tabela 2 - Tolerância para desalinhamento (ASME Seção VIII Divisão 1 - Tabela UW-33)*

| Piece Thickness (t) (nominal (mm)) / *Espessura da peça (t) (nominal (mm))* | Category A (mm) / *Categoria A (mm)* | Categories B, C and D (mm) / *Categorias B, C e D (mm)* |
| :--- | :---: | :---: |
| Up to 13 / *Até 13* | ¼ t | ¼ t |
| > 13 to 19 / *> 13 até 19* | 3 | ¼ t |
| > 19 to 38 / *> 19 até 38* | 3 | 5 |
| > 38 to 51 / *> 38 até 51* | 3 | 1/8 t |
| > 51 to 76 / *> 51 a 76* | 6 | 4 |
| > 76 to 102 / *> 76 a 102* | 6 | 5,5 |
| > 102 to 127 / *> 102 a 127* | 6 | 6 |
| > 127 / *> 127* | 8 | 8 |

*Note: t = nominal thickness of the thinnest member of a joint / Obs.: t = espessura nominal do membro mais fino de uma junta*

---

### Table 3 - Tolerance for Weld Reinforcement (ASME Section VIII Div. 1 - Table UW-35)
### *Tabela 3 - Tolerância para reforço da solda (ASME Seção VIII Divisão 1 - Tabela UW-35)*

| Piece Thickness (mm) / *Espessura da peça (mm)* | Longitudinal (mm) / *Longitudinal (mm)* | Circumferential (mm) / *Circunferencial (mm)* |
| :--- | :---: | :---: |
| < 2,4 | 2,5 | 0,8 |
| 2,4 até 4,8 | 3 | 1,5 |
| > 4,8 a 13 | 4 | 2,5 |
| > 13 a 25 | 5 | 2,5 |
| > 25 a 51 | 6 | 3 |
| > 51 a 76 | 6 | 4 |
| > 76 a 102 | 6 | 5,5 |
| > 102 a 127 | 6 | 6 |
| > 127 | 8 | 8 |

*Note: t = nominal thickness of the thinnest member of a joint / Obs.: t = espessura nominal do membro mais fino de uma junta*

---

### Table 4 - Acceptance Criteria for Pressure Vessels Manufactured According to UHT-23
### *Tabela 4 - Critério de Aceitação para Vasos de Pressão Fabricados conforme UHT-23*

| Discontinuity / *Descontinuidade* | Acceptance Criteria / *Critério de Aceitação* |
| :--- | :--- |
| **Arc Strike** / *Abertura de arco* | Unacceptable / *Inaceitável* |
| **Excessive Reinforcement Angle** / *Ângulo excessivo de reforço* | Unacceptable / *Inaceitável* |
| **Longitudinal Weld Concavity** / *Concavidade em solda longitudinal* | Unacceptable / *Inaceitável* |
| **Circumferential Weld Concavity** / *Concavidade em solda circunferencial* | Maximum Depth = Height of the Weld Reinforcement in the Same Region / *Profundidade máxima = altura do reforço da solda na mesma região* |
| **Excessive Concavity (Fillet Weld)** / *Concavidade excessiva (solda em ângulo)* | According to Equipment Design Tolerance or EPS / *Conforme tolerância de projeto do equipamento ou da EPS* |
| **Angular Deformation** / *Deformação angular* | According to Equipment Design Tolerance or EPS / *Conforme tolerância de projeto do equipamento ou da EPS* |
| **Insufficient Deposition** / *Deposição insuficiente* | Unacceptable / *Inaceitável* |
| **Misalignment** / *Desalinhamento* | See Table 5 / *Ver tabela 5* |
| **Undercut** / *Embicamento* | According to Equipment Design Tolerance or EPS / *Conforme tolerância de projeto do equipamento ou da EPS* |
| **Lack of Fusion** / *Falta de fusão* | Unacceptable / *Inaceitável* |
| **Lack of Penetration** / *Falta de penetração* | Unacceptable / *Inaceitável* |
| **Undercut** / *Mordedura* | Unacceptable / *Inaceitável* |
| **Root Undercut** / *Mordedura na raiz* | Unacceptable / *Inaceitável* |
| **Excessive Penetration** / *Penetração excessiva* | Maximum = Maximum Allowed Reinforcement Height / *Máxima = altura máxima do reforço permitido* |
| **Burn-through** / *Perfuração* | Unacceptable / *Inaceitável* |
| **Surface Pore** / *Poro superficial* | Unacceptable / *Inaceitável* |
| **Weld Reinforcement Height** / *Altura do reforço da solda* | See Table 6 (except for material SA-517 where the reinforcement maximum is 10% of the plate thickness or 3.0 mm (the smaller)) / *Ver tabela 6 (exceto para material SA-517 onde o reforço máximo é de 10% da espessura da chapa ou 3,0 mm (o menor))* |
| **Spatter** / *Respingos* | Unacceptable / *Inaceitável* |
| **Overlap** / *Sobreposição* | Unacceptable / *Inaceitável* |
| **Asymmetrical Fillet Weld** / *Solda em ângulo assimétrica* | According to Equipment Design Tolerance or EPS / *Conforme tolerância de projeto do equipamento ou da EPS* |
| **Cracks** / *Trincas* | Unacceptable / *Inaceitável* |

---

### Table 5 - Tolerance for Misalignment ASME Section VIII Div. 1 - Materials UHT-23
### *Tabela 5 - Tolerância para desalinhamento ASME Seção VIII Div. 1 - Materiais UHT-23*

| Piece Thickness (t) (nominal (mm)) / *Espessura da peça (t) (nominal (mm))* | Butt Joints, Category B&C Welds (mm) / *Juntas de Topo, Soldas de categoria B&C (mm)* | Other Welds (mm) / *Outras soldas (mm)* |
| :--- | :---: | :---: |
| < 2,4 | 2,5 | 0,8 |
| 2,4 até 4,8 | 3 | 1,5 |
| > 4,8 a 13 | 4 | 2,5 |
| > 13 a 25 | 5 | 2,5 |
| > 25 a 51 | 6 | 3 |
| > 51 a 76 | 6 | 4 |
| > 76 a 102 | 6 | 5,5 |
| > 102 a 127 | 6 | 6 |
| > 127 | 8 | 8 |

---

### Table 6 - Tolerance for Weld Reinforcement ASME Section VIII Div. 1 - Materials UHT-23
### *Tabela 6 - Tolerância para reforço da solda ASME Seção VIII Div. 1 - Materiais UHT-23*

| Piece Thickness (mm) / *Espessura da peça (mm)* | Longitudinal (mm) / *Longitudinal (mm)* | Circumferential (mm) / *Circunferencial (mm)* |
| :--- | :---: | :---: |
| até 13 | 0,2 t | 0,2 t |
| > 13 até 24 | 2,5 | 0,2 t |
| > 24 até 38 | 2,5 | 5 |
| > 38 | 2,5 | 1/8 t ou 6 (o menor) |

---

### Table 7 - Acceptance Criteria for Pressure Vessels According to ASME Section VIII, Div. 2
### *Tabela 7 - Critério e Aceitação para Vasos de Pressão conforme a Norma ASME Seção VIII, Div. 2*

| Discontinuity / *Descontinuidade* | Figure / *Figura* | Acceptance Criteria / *Critério de Aceitação* |
| :--- | :---: | :--- |
| **Cracks (All Types)** / *Trincas (Todos os Tipos)* | … | Not Allowed / *Não Permitido* |
| **Gas or Shrinkage Cavities (All types)** / *Cavidades Gasosas ou de Contração (Todos os tipos)* | [Ilustração de Cavidade / Shrinkage Cavity] | Not Allowed / *Não Permitido* |
| **Slag Inclusions / Flux Inclusions / Oxide Inclusions / Metallic Inclusions (All types)** / *Inclusões de Escórias / Fluxos / Óxidos / Metálicas (Todos os tipos)* | … | Not Allowed when they occur on the surface (2) / *Não Permitido quando ocorrerem na superfície (2)* |
| **Lack of Fusion** / *Falta de Fusão* | [Ilustração: Fusão Incompleta] | Not Allowed / *Não Permitido* |
| **Lack of Penetration** / *Falta de Penetração* | [Ilustração: Falta de Penetração] | Not Allowed, if total penetration is required / *Não Permitido, se Penetração total é requerida* |
| **Undercut** / *Mordedura* | [Ilustração: Mordedura de profundidade h1, h2] | The undercut depth is acceptable if both conditions are met: a) The remaining thickness due to undercut must not reduce the material thickness below the minimum required at any point. b) The undercut depth must not be superior to 0.8 mm or 10% of the nominal thickness, whichever is smaller. / *A profundidade da mordedura é aceitável se ambas condições foram atendidas: a) A espessura remanescente devido a mordedura, não deve reduzir a espessura do material abaixo da espessura mínima requerida em qualquer ponto. b) A profundidade da mordedura não deve ser superior a 0,8 mm ou 10% da espessura nominal, o que for menor.* |
| **Weld Reinforcement** / *Reforço de Solda* | [Ilustração: Reforço com largura b e altura h] | At any point, the weld metal surface must not be inferior to the surface of adjacent base metals. The acceptable limits for Weld Reinforcements are described in table 9 (6.6). It is required a smooth transition from the weld reinforcement to the base metal. For butt joints of high strength quenched and tempered steels, the maximum height of the weld reinforcement must be 0.1t or 3 mm, whichever is smaller. / *Em qualquer ponto, a superfície do metal de solda não deve ser inferior a superfície dos metais de base adjacentes. Os limites aceitáveis para Reforços de Solda estão descritos na tabela 9 (6.6). É requerido uma transição suave partindo do reforço de solda para o metal de base. Para juntas de topo de aços de alta resistência temperado e revenido, a altura máxima do reforço de solda deve ser 0,1t ou 3 mm, o que for menor.* |
| **Misalignment** / *Desalinhamento* | … | For pressure vessels of Cylindrical Shells, Spherical Shells and Hemispherical Heads welded to Cylindrical Shells, the acceptable limits are described in Table 8 (6.4). For butt joints of quenched and tempered high strength steels, verify the acceptable limits in table 10 (6.6.5.4). / *Para vasos de pressão de Cascos Cilíndricos, Cascos Esféricos e Tampos Hemisféricos soldados a Cascos Cilíndricos, os limites aceitáveis estão descritos na Tabela 8 (6.4). Para juntas de topo de aços de alta resistência temperado e revenido, verificar os limites aceitáveis na tabela 10 (6.6.5.4).* |
| **Undercut** / *Embicamento* | … | Verify the acceptable limits of undercut for butt joints in paragraph 6.1.6 of the ASME Section VIII Div. 2 code. / *Verificar os limites aceitáveis de embicamento para juntas de topo no parágrafo 6.1.6 do código ASME Seção VIII Div. 2.* |
| **Arc Strike** / *Abertura de Arco* | … | Not Allowed (2) / *Não Permitido (2)* |
| **Spatter** / *Respingos* | … | Spatter must be minimized (2) / *Respingos devem ser minimizados (2)* |
| **Surface Notches, Grinding Marks, Burr Marks** / *Entalhes na Superfície, Marcas de Esmerilhamento, Marcas de Rebarbas* | … | Not Allowed (2) / *Não Permitido (2)* |
| **Concavity** / *Concavidade* | [Ilustração: Concavidade na raiz de profundidade h] | Concavity originating in the root pass of a joint welded from one side only, is acceptable when the resulting weld thickness is equal or superior to the thickness of the thinnest member to be joined and the concavity transition is smooth. / *Concavidade originada no passe de raiz de uma junta soldada apenas por um lado, é aceitável quando a espessura resultante da solda é igual ou superior a espessura do membro mais fino a ser unido e a transição da concavidade for suave.* |

#### Notes / Notas (Tabela 7):
- **(1) Legend / Legenda:**  
  - a = Effective Throat for Fillet Joint / *Garganta Efetiva para Junta de Ângulo*  
  - b = Weld Reinforcement Width / *Largura do Reforço de Solda*  
  - d = Diameter of a Pore / *Diâmetro de um Poro*  
  - h = Height of Imperfections / *Altura das Imperfeições*  
  - t = Thickness / *Espessura*  
- **(2)** These discontinuities or imperfections can be removed by smooth grinding. / *Estas descontinuidades ou imperfeições podem ser removidas por esmerilhamento suave.*  
- **(3)** Disallowed discontinuities must be removed or reduced to acceptable dimension. When the discontinuity is removed by grinding without subsequent welding, the area must have its contours smoothed. / *Descontinuidades não permitidas, deverão ser removidas ou reduzidas até a dimensão aceitável. Quando a descontinuidade for removida por esmerilhamento sem posterior soldagem, a área deve ter seus contornos suavizados.*  

---

### Table 8 - Tolerance for Misalignment (ASME Section VIII Div. 2 - Table 6.4)
### *Tabela 8 - Tolerância para desalinhamento (ASME Seção VIII Divisão 2 - Tabela 6.4)*

| Piece Thickness (t) (mm) / *Espessura da peça (t) (mm)* | Category A (mm) / *Categoria A (mm)* | Categories B, C and D (mm) / *Categorias B, C e D (mm)* |
| :--- | :---: | :---: |
| < 2,5 | 2,5 | 0,8 |
| 2,5 ≤ t < 5 | 2,5 | 1,5 |
| 5 ≤ t < 13 | 3 | 2,5 |
| 13 ≤ t < 25 | 4 | 2,5 |
| 25 ≤ t < 50 | 4 | 3 |
| 50 ≤ t < 76 | 4 | 4 |
| 76 ≤ t < 100 | 5,5 | 5,5 |
| 100 ≤ t < 125 | 6 | 6 |
| t ≥ 125 | 8 | 8 |

*Note: t = nominal thickness of the thinnest member of a joint / Obs.: t = espessura nominal do membro mais fino de uma junta*

---

### Table 9 - Tolerance for Weld Reinforcement (ASME Section VIII Div. 2 - Table 6.6)
### *Tabela 9 - Tolerância para reforço da solda (ASME Seção VIII Divisão 2 - Tabela 6.6)*

| Piece Thickness (t) (mm) / *Espessura da peça (t) (mm)* | Longitudinal Welds (mm) / *Soldas Longitudinais (mm)* | Circumferential Welds (mm) / *Soldas Circunferenciais (mm)* |
| :--- | :---: | :---: |
| Any / *Qualquer* | - - | 0,2t or 2,5 (the smaller) / *0,2t ou 2,5 (o menor)* |
| ≤ 24 | 0,2t | - - |
| 24 < t ≤ 38 | 5 | - - |
| > 38 até 51 | 3 | - - |
| > 51 | 1/16t or 10 (the smaller) / *1/16t ou 10 (o menor)* | 1/8t or 19 (the smaller) / *1/8t ou 19 (o menor)* |

*Note: t = nominal thickness of the thinnest member of a joint / Obs.: t = espessura nominal do membro mais fino de uma junta*

---

### Table 10 - Tolerance for Misalignment (ASME Section VIII Div. 2 - Parag. 6.6.5.4)
### *Tabela 10 - Tolerância para desalinhamento (ASME Seção VIII Divisão 2 - Parág. 6.6.5.4)*

| Piece Thickness (t) (mm) / *Espessura da peça (t) (mm)* | Circumferential Welds (mm) / *Soldas Circunferenciais (mm)* | Longitudinal Welds (mm) / *Soldas Longitudinais (mm)* |
| :--- | :---: | :---: |
| Any / *Qualquer* | - | 0,2t ou 2,5 (o menor) / *0.2t or 2.5 (whichever is smaller)* |
| ≤ 24 | 0,2t | - |
| 24 < t ≤ 38 | 5 | - |
| > 38 to 51 / *> 38 até 51* | 3 | - |

*Note: t = nominal thickness of the thinnest member of a joint / Obs.: t = espessura nominal do membro mais fino de uma junta*

---

### Table 11 - Acceptance Criteria for Metallic Structures According to AWS D1.1 Code
### *Tabela 11 - Critério de Aceitação para Estruturas Metálicas conforme Código AWS D1.1*

| Criteria / *Critérios de Aceitação* | Description / *Descrição* | Statically Loaded Structures / *Estruturas Estaticamente Carregadas* | Cyclically Loaded Structures / *Estruturas Ciclicamente Carregadas* | Tubular Connections / *Conexões Tubulares* |
| :--- | :--- | :---: | :---: | :---: |
| **(1) Cracks** / *Trincas* | The weld must not present cracks. / *A solda não deve apresentar trincas.* | X | X | X |
| **(2) Fusion in Weld and Base Metal** / *Fusão na solda e metal base* | Complete fusion must exist between weld metal layers and between weld metal and base metal. / *Fusão total deve existir entre as camadas de metal de solda e entre metal de solda e metal de base.* | X | X | X |
| **(3) Crater Shrinkage** / *Rechupes de Cratera* | All crater shrinkages must be filled with weld so that the weld profile is as specified, except for the end of intermittent fillet welds located outside their effective length. / *Todos os Rechupes de cratera devem estar preenchidos com solda para que o perfil da solda esteja como especificado, exceto para o final de soldas em ângulo intermitente situados fora de seu comprimento efetivo.* | X | X | X |
| **(4) Weld Profiles** / *Perfis das soldas* | Weld profiles must be in accordance with figure 5.4 of the AWS D1.1 standard. For butt welds the maximum reinforcement height on both sides of the joints is 3mm. / *Os perfis das soldas devem estar de acordo com a figura 5.4 da norma AWS D1.1. Para soldas de topo a altura máxima do reforço em ambos os lados das juntas é de 3mm.* | X | X | X |
| **(5) Inspection Time** / *Hora do ensaio* | Visual inspection for all steels can be performed immediately after completion and cooling of the weld. The acceptance criterion for ASTM A514, A517 and A709 Grades 100 and 100W steels must be based on visual inspection performed at least 48 hours after weld completion. / *O ensaio visual para todos os aços pode ser realizado imediatamente após a conclusão e resfriamento da solda. O critério de aceitação para os aços ASTM A514, A517 e A709 Graus 100 e 100W, deve ser baseado no ensaio visual realizado após pelo menos 48 horas após a conclusão da solda.* | X | X | X |
| **(6) Dimensional Variation of Fillet Welds** / *Variação dimensional de soldas em ângulo* | A continuous fillet weld may be allowed to have dimension below the nominal specified up to 1/16” (1.6mm) without correction, provided that the undersized portion does not exceed 10% of the weld length. / *Uma solda em ângulo contínua pode ser permitido que tenha dimensão abaixo da medida nominal especificada em até 1/16” (1,6mm) sem correção, desde que a porção com medida inferior não exceda 10% do comprimento da solda.* | X | X | X |
| **(7) Undercuts** / *Mordeduras* (a) | (a) For materials with less than 1” (25mm) thickness, undercuts must not exceed 1/32” (1mm), except that a maximum of 1/16” (2mm) is allowed provided the accumulated length in 12” (305mm) does not exceed 2” (50mm). For materials with thickness greater or equal to 1” (25mm), undercuts must not exceed 1/16” (2mm) depth. / *(a) Para materiais com menos que 1” (25mm) de espessura, as mordeduras não devem exceder 1/32” (1mm), exceto que um máximo de 1/16” (2mm) é permitido desde que o comprimento acumulado em 12” (305mm) não ultrapasse 2” (50mm). Para materiais com espessura maior ou igual a 1” (25mm), as mordeduras não devem exceder 1/16” (2mm) de profundidade.* | X | - | - |
| **(7) Undercuts** / *Mordeduras* (b) | (b) In primary members, undercuts must not exceed 0.01” (0.25mm) depth when the weld is transverse to tensile stresses, for any design conditions. Undercuts must not exceed 1/32” (1mm) depth for all other situations. / *(b) Em membros primários, mordeduras não devem exceder 0,01” (0,25mm) de profundidade quando a solda for transversal aos esforços de tração, para quaisquer condições de projeto. Mordeduras não devem exceder 1/32” (1mm) de profundidade para todas as outras situações.* | - | X | X |
| **(8) Porosity** / *Porosidade* (a) | (a) Complete penetration butt joints transverse to tensile stresses must not have visible porosity. For all other groove and fillet welds, the sum of visible porosities with 1/32” (1mm) or more diameter must not exceed 3/8” (10mm) in any linear inch of weld and must not have more than ¾” (19mm) in any 12” (305mm) of weld. / *(a) Juntas de topo com penetração total transversais aos esforços de tração não devem ter porosidade visível. Para todas as outras soldas em chanfro e em ângulo, o somatório das porosidades visíveis com 1/32” (1mm) ou mais de diâmetro, não deve exceder 3/8” (10mm) em qualquer polegada de solda linear e não deve ter mais que ¾” (19mm) em qualquer 12” (305mm) de solda.* | X | - | - |
| **(8) Porosity** / *Porosidade* (b) | (b) The amount of porosity in fillet joints must not exceed one every 4” (100mm) of weld and the maximum diameter must not exceed 3/32” (2mm). Exception: For fillet joints fixed and welded on the web, the sum of diameters of porosities must not exceed 3/8” (10mm) in any linear inch of weld and must not have more ¾” (20mm) in any 12” (300mm) of weld length. / *(b) A quantidade de porosidade em juntas de ângulo não deve exceder a uma a cada 4” (100mm) de solda e o diâmetro máximo não deve exceder 3/32” (2mm). Exceção: Para juntas de ângulo fixadas e soldadas na alma, a soma dos diâmetros das porosidades não devem exceder a 3/8” (10mm) em qualquer polegada de solda linear e não deve ter mais ¾” (20mm) em qualquer 12 “ (300mm) de comprimento de solda.* | - | X | X |
| **(8) Porosity** / *Porosidade* (c) | (c) Complete penetration butt joints transverse to tensile stresses must not have visible porosity. For all other groove welds the amount of porosity must not exceed one every 4” (100mm) of weld and the maximum diameter must not exceed 3/32” (2mm). / *(c) Juntas de topo com penetração total transversais aos esforços de tração não devem ter porosidade visível. Para todas as outras soldas em chanfro a quantidade de porosidade não deve exceder a uma a cada 4” (100mm) de solda e o diâmetro máximo não deve exceder 3/32” (2mm).* | - | X | X |
| **(9) Misalignment for Butt Welds** / *Desalinhamento para soldas de topo* | The maximum allowed misalignment must be 10% of the smallest thickness involved in the joint or 3mm, whichever is larger must be unacceptable. / *O desalinhamento máximo permitido deve ser de 10% da menor espessura envolvida na junta ou 3mm, o que for maior deve ser inaceitável.* | X | X | X |

*Note: "X" indicates that the criterion is applicable. / OBS.: "X" indica que o critério é aplicável.*

---

### Table 12 - Acceptance Criteria for Pressure and Steam Piping According to ASME B31.1
### *Tabela 12 - Critérios de Aceitação para Tubulações de Pressão e Vapor conforme ASME B31.1*

The following indications are unacceptable: / *São inaceitáveis as seguintes indicações:*
- Cracks / *Trincas;*
- Undercuts greater than 1.0 mm depth / *Mordeduras maiores que 1,0 mm de profundidade;*
- Lack of Penetration / *Falta de Penetração;*
- Lack of Fusion / *Falta de Fusão;*
- Any linear indication greater than 5.0 mm length / *Qualquer indicação linear maior que 5,0 mm de comprimento;*
- Surface porosities greater than 5.0 mm diameter / *Porosidades superficiais maiores que 5,0 mm de diâmetro;*
- Four or more indications separated by a distance of 2.0 mm measured edge to edge in any direction / *Quatro ou mais indicações separadas por uma distância de 2,0 mm medidos borda a borda em qualquer direção;*
- Reinforcement Height according to the table below / *Altura do Reforço conforme tabela abaixo:*

| Base Metal Thickness (Note 2) / *Espessura do metal base (Nota 2)* | Piping Operating Up to 175°C / *Tubulações operando até 175°C* | Piping Operating Between 175° to 400°C / *Tubulações operando entre 175° a 400°C* | Piping Operating Above 400°C / *Tubulações operando a mais de 400°C* |
| :--- | :---: | :---: | :---: |
| Up to 3mm / *Até 3mm* | 5,0 mm | 2,5 mm | 2,0 mm |
| 3 to 5mm / *3 a 5mm* | 5,0 mm | 3,0 mm | 2,0 mm |
| 5 to 13mm / *5 a 13mm* | 5,0 mm | 4,0 mm | 2,0 mm |
| 13 to 25mm / *13 a 25mm* | 5,0 mm | 5,0 mm | 2,5 mm |
| 25 to 50mm / *25 a 50mm* | 6,0 mm | 6,0 mm | 3,0 mm |
| Greater than 50mm / *Maior que 50mm* | Note 1 / *Nota 1* | Note 1 / *Nota 1* | 4,0 mm |

- **Note 1 / Nota 1:** Whichever is greater than ¼” (6 mm) or 1/8 (0.125) times the weld width (in millimeters). / *O que for maior que ¼” (6 mm) ou 1/8 (0,125) vezes a largura da solda (em milímetros).*
- **Note 2 / Nota 2:** The weld thickness is based on the thinnest member of the joint. / *A espessura da solda é baseada no membro mais fino da junta.*

---

### Table 13 - Acceptance Criteria for Process Piping According to ASME B31.3
### *Tabela 13 - Critério de Aceitação para Tubulações de Processo conforme ASME B31.3*

| Type of Imperfection / *Tipo de Imperfeição* | Normal and Category M Fluid Service - Circumferential or Branch Welds | Normal and Category M - Longitudinal (or Spiral) Welds of Pipes | Normal and Category M - Fillet Welds | Severe Cyclic Condition - Circumferential or Branch Welds | Severe Cyclic - Longitudinal Welds | Severe Cyclic - Fillet Welds | Category D Fluid Service - Circumferential Welds | Category D - Longitudinal Welds | Category D - Fillet Welds | Category D - Branch Welds |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Crack** / *Trinca* | A | A | A | A | A | A | A | A | A | A |
| **Lack of Fusion** / *Falta de Fusão* | A | A | A | A | A | A | C | A | N/A | A |
| **Incomplete Penetration** / *Penetração Incompleta* | B | A | N/A | A | A | N/A | C | A | N/A | B |
| **Undercut** / *Mordedura* | H | A | H | A | A | A | I | A | H | H |
| **Exposed Slag Inclusion or Porosity** / *Porosidade ou Inclusão de escória exposta* | A | A | A | A | A | A | A | A | A | A |
| **Surface Finish** / *Acabamento Superficial* | N/A | N/A | N/A | J | J | J | N/A | N/A | N/A | N/A |
| **Root Concavity** / *Concavidade na Raiz* | K | K | N/A | K | K | N/A | K | K | N/A | K |
| **Reinforcement Height or Root Penetration** / *Altura do Reforço ou Penetração da Raiz* | L | L | L | L | L | L | M | M | M | M |

#### Acceptance Criteria / Critério de Aceitação (Tabela 13):
- **A** - Unacceptable / *Inaceitável*
- **B** - Incomplete Penetration Depth: The smaller value between: ≤ 1 mm and 0.2 x T. Accumulated Incomplete Penetration Length: ≤ 38 mm in any 150 mm. / *Profundidade da Penetração Incompleta: O menor valor entre: ≤ 1 mm e 0,2 x T. Comprimento Acumulado da Penetração Incompleta: ≤ 38 mm em qualquer 150 mm;*
- **C** - Incomplete Penetration or Lack of Fusion Depth: ≤ 0.2 x T. Accumulated Incomplete Penetration or Lack of Fusion Length: ≤ 38 mm in any 150 mm. / *Profundidade da Penetração Incompleta ou Falta de Fusão: ≤ 0,2 x T. Comprimento Acumulado da Penetração Incompleta ou Falta de Fusão: ≤ 38 mm em qualquer 150 mm;*
- **H** - Undercut Depth: The smaller value between: ≤ 1 mm and 0.25 x T. / *Profundidade da Mordedura: O menor valor entre: ≤ 1 mm e 0,25 x T.*
- **I** - Undercut Depth: The smaller value between: ≤ 1.5 mm and [(0.25 x T) or 1 mm, whichever is larger]. / *Profundidade da Mordedura: O menor valor entre: ≤ 1,5 mm e [(0,25 x T) ou 1 mm, o que for maior].*
- **J** - Surface Roughness: ≤ 500 µin Ra according to ASME B46.1. / *Rugosidade Superficial: ≤ 500 µin Ra conforme ASME B46.1.*
- **K** - Root Concavity Depth: The total joint thickness (including reinforcement) must be superior to T. / *Profundidade da Concavidade da Raiz: A espessura total da junta (incluindo o reforço) deve ser superior a T.*
- **L** - Reinforcement Height or Root Penetration / *Altura do Reforço ou Penetração da Raiz:*  
  For Aluminum Alloys, the root penetration must not exceed: 1.5 mm for thicknesses ≤ 2 mm; 2.5 mm for thicknesses > 2 mm and ≤ 6 mm.  
  Other thicknesses, according to the table below:

| Thickness / *Espessura* | Reinforcement Height / *Altura do Reforço* |
| :--- | :---: |
| ≤ 6 mm | ≤ 1,5 mm |
| > 6 mm e ≤ 13 mm | ≤ 3 mm |
| > 13 mm e ≤ 25 mm | ≤ 4 mm |
| > 25 mm | ≤ 5 mm |

- **M** - Reinforcement Height or Root Penetration: The acceptance criterion is the double of the value allowed in item L. / *Altura do Reforço ou Penetração da Raiz: O critério de aceitação é o dobro do valor permitido no item L.*
- **Obs.:** For joint coupling, before welding, the maximum allowed misalignment must be according to specified by EPS or IEIS. / *Para acoplamento de juntas, antes da soldagem, o desalinhamento máximo permitido deve estar conforme especificado pela EPS ou IEIS.*
- **T** = Nominal Thickness of the thinnest component of a butt joint. / *Espessura Nominal do componente mais fino de uma junta de topo.*

---

### Table 14 - Acceptance Criteria for Storage Tanks According to API 650
### *Tabela 14 - Critérios de Aceitação para Tanques de Armazenamento, conforme API 650*

a) The welds must present complete fusion and complete penetration. / *As soldas devem apresentar fusão completa e penetração completa.*  
b) The welds must be free of crater cracks or any other cracks. / *As soldas devem estar livres de trincas de crateras ou quaisquer outras trincas.*  
c) There must not be arc strike on the weld or adjacent metal to the weld. / *Não pode haver abertura de arco na solda ou metal adjacente a solda.*  
d) Undercuts / *Mordeduras:*
- For vertical joints, the maximum undercut depth must be 0.4 mm. / *Para juntas verticais, a profundidade máxima das mordeduras deve ser de 0,4 mm;*
- For horizontal joints, the maximum undercut depth must be 0.8 mm. / *Para juntas horizontais, a profundidade máxima das mordeduras deve ser de 0,8 mm;*
- For other types, the maximum undercut depth must be 0.4 mm. / *Para os demais tipos, a profundidade máxima das mordeduras deve ser de 0,4 mm;*  
e) Porosity: The frequency of surface porosity must not exceed one cluster (one or more pores) in any 100 mm length and the diameter of each cluster must not exceed 2.5 mm. / *Porosidade: A frequência de porosidade superficial não deve exceder uma aglomeração (um ou mais poros) em qualquer comprimento de 100 mm e o diâmetro de cada aglomeração não deve exceder a 2,5 mm.*  
f) Maximum height for the reinforcement for both sides of the joints cannot exceed: / *Altura máxima para o reforço para ambos os lados das juntas não pode exceder:*

| Thickness / *Espessura* | Vertical Welds / *Soldas Verticais* | Horizontal Welds / *Soldas Horizontais* |
| :--- | :---: | :---: |
| ≤ 13 mm | 2,5 mm | 3 mm |
| > 13 mm e ≤ 25 mm | 3 mm | 5 mm |
| > 25 mm | 5 mm | 6 mm |

g) Tolerance for Misalignment / *Tolerância para Desalinhamento:*

| Thickness / *Espessura* | Vertical Joints / *Juntas Verticais* | Horizontal Joints / *Juntas Horizontais* |
| :--- | :---: | :---: |
| ≤ 16 mm | ≤ 1,5 mm | ≤ 1,5 mm |
| > 16 mm | 10% da Espessura ou 3 mm, o que for menor | 20% da Espessura ou 3 mm, o que for menor |

---

### Table 15 - Acceptance Criteria for Low-Pressure Welded Tanks According to API 620
### *Tabela 15 - Critérios de Aceitação para Tanques Soldados de Baixa Pressão, conforme API 620*

a) The welds must present complete fusion and complete penetration. / *As soldas devem apresentar fusão completa e penetração completa.*  
b) The welds must be free of crater cracks or any other cracks. / *As soldas devem estar livres de trincas de crateras ou quaisquer outras trincas;*  
c) There must not be arc strike on the weld or adjacent metal. / *Não pode haver abertura de arco na solda ou metal adjacente a solda.*  
d) Undercuts / *Mordeduras:*
- For vertical joints, the maximum undercut depth must be 0.4 mm; / *Para juntas verticais, a profundidade máxima das mordeduras deve ser de 0,4 mm;*
- For horizontal joints, the maximum undercut depth must be 0.8 mm; / *Para juntas horizontais, a profundidade máxima das mordeduras deve ser de 0,8 mm;*
- For other types, the maximum undercut depth must be 0.4 mm; / *Para os demais tipos, a profundidade máxima das mordeduras deve ser de 0,4 mm;*  
e) Porosity: The frequency of surface porosity must not exceed one cluster (one or more pores) in any 100 mm length and the diameter of each cluster must not exceed 2.5 mm. / *Porosidade: A frequência de porosidade superficial não deve exceder uma aglomeração (um ou mais poros) em qualquer comprimento de 100 mm e o diâmetro de cada aglomeração não deve exceder a 2,5 mm.*  
f) Maximum height for the reinforcement for both sides of the joints cannot exceed: / *Altura máxima para o reforço para ambos os lados das juntas não pode exceder:*

| Thickness / *Espessura* | Vertical Welds / *Soldas Verticais* | Horizontal Welds / *Soldas Horizontais* |
| :--- | :---: | :---: |
| ≤ 13 mm | 2,5 mm | 3 mm |
| > 13 mm and ≤ 25 mm | 3 mm | 5 mm |
| > 25 mm | 5 mm | 6 mm |

g) Tolerance for Misalignment / *Tolerância para Desalinhamento:*
- For plates with thicknesses up to 6 mm: 1.5 mm. / *Para chapas com espessuras de até 6 mm: 1,5 mm.*
- For plates with thicknesses above 6 mm: 3 mm or 20% of the Thickness of the plate, whichever is smaller. / *Para chapas com espessuras acima de 6 mm: 3 mm ou 20% da Espessura da chapa, o que for menor.*

---

### Table 16 - Acceptance Criteria for Piping According to ASME B31.8, ASME B31.4 and API 1104
### *Tabela 16 - Critérios de Aceitação para Tubulações conforme ASME B31.8, ASME B31.4 e API 1104*

| Discontinuity / *Descontinuidade* | Acceptance Criteria / *Critério de Aceitação* |
| :--- | :--- |
| **Longitudinal Welds** / *Soldas longitudinais* | Minimum offset of 50 mm. / *Defasagem mínima de 50 mm.* |
| **Joint Cleaning** / *Limpeza da junta* | Coated Electrode - Minimum 50 mm at the bevel end, internally and externally, according to ST-3 standard. TIG – Minimum of 10 mm at the bevel end, internally and externally to bright metal. / *Eletrodo Revestido - Mínimo 50 mm na extremidade do bisel, interna e externamente, conforme padrão ST-3. TIG – Mínimo de 10 mm na extremidade do bisel, interna e externa ao metal brilhante.* |
| **Discontinuity in Bevel** / *Descontinuidade no bisel* | Maximum 2 mm depth. / *Máximo 2 mm de profundidade.* |
| **Misalignment** / *Desalinhamento* | Maximum 3 mm. / *Máximo 3 mm.* |
| **Reinforcement Width** / *Largura do reforço* | Maximum 3 mm larger than the groove (1.6 mm on each margin). / *Máximo 3 mm maior que o chanfro (1,6 mm em cada margem).* |
| **Reinforcement Height** / *Altura do reforço* | Maximum 1.6 mm, cannot be below the tube surface at any point. / *Máximo 1,6 mm, não podendo estar abaixo da superfície do tubo em nenhum ponto.* |
| **Excess Penetration** / *Excesso de Penetração* | When it is possible to evaluate it, use the same criterion for reinforcement height. / *Quando for possível avaliá-lo usar o mesmo critério para a altura de reforço.* |
| **Undercut** / *Embicamento* | Visually check the occurrence of undercut. / *Verificar a ocorrência de embicamento visualmente.* |
| **Lack of Penetration with Misalignment** / *Falta de Penetração com desalinhamento* | Maximum 50 mm individually or 75 mm summed for a total length of 300 mm continuous weld. / *Máximo 50 mm individualmente ou 75 mm somadas para um comprimento total de 300 mm de solda contínua.* |
| **Lack of Penetration without Misalignment** / *Falta de Penetração sem desalinhamento* | Maximum 25 mm individually or summed, for a total length of 300 mm continuous weld. In less than 300 mm, maximum of 8% of the weld length. / *Máximo 25 mm individualmente ou somadas, para um comprimento total de 300 mm de solda contínua. Em menos de 300 mm, máximo de 8% do comprimento da solda.* |
| **Lack of Fusion** / *Falta de Fusão* | Maximum 25 mm individually or summed, for a total length of 300mm continuous weld. In less than 300 mm, maximum of 8% of the weld length. / *Máximo 25 mm individualmente ou somadas, para um comprimento total de 300mm de solda contínua. Em menos de 300 mm, máximo de 8% do comprimento da solda.* |
| **Undercut** / *Mordedura* | Depth less than or equal to 0.4 mm or 6% of thickness, whichever is smaller – acceptable in any length. Depth greater than 0.4 mm or greater than 6% up to 12.5% of thickness, whichever is smaller. Maximum 50 mm in 300 mm continuous weld or 1/6 of weld length, whichever is smaller. Depth greater than 0.8 mm or greater than 12.5% of tube thickness, whichever is smaller – unacceptable. / *Profundidade menor ou igual a 0,4 mm ou 6% da espessura, o que for menor – aceitável em qualquer comprimento. Profundidade maior que 0,4 mm ou maior que 6% até 12,5% da espessura, o que for menor. Máximo 50 mm em 300 mm de solda contínua ou 1/6 de comprimento da solda, o que for menor. Profundidade maior que 0,8 mm ou maior que 12,5% da espessura do tubo, o que for menor – inaceitável.* |
| **Porosity** / *Porosidade* | Unacceptable / *Inaceitável* |
| **Crack** / *Trinca* | Unacceptable / *Inaceitável* |
| **Elongated Slag Inclusions** / *Inclusão de Escória Alongadas* | Maximum 50 mm individual or summed length, for a total length of 300 mm continuous weld and maximum 1.6mm width. The sum of the lengths of elongated and isolated indications exceed 8% of the total weld length. / *Máximo 50 mm de comprimento individualmente ou somadas, para um comprimento total de 300 mm de solda contínua e máximo de 1,6mm de largura. A soma do comprimento das indicações alongadas e isoladas exceder a 8% do comprimento total da solda.* |
| **Isolated Slag Inclusions** / *Inclusão de Escória Isoladas* | Maximum 13 mm summed length, for a total length of 300 mm continuous weld and maximum 3 mm width. More than four indications with maximum width of 3 mm present, for a total length of 300 mm continuous weld. The sum of the lengths of elongated and isolated indications exceed 8% of the total weld length. / *Máximo 13 mm de comprimento somadas, para um comprimento total de 300 mm de solda contínua e máximo de 3 mm de largura. Mais de quatro indicações com largura máxima de 3 mm presentes, para um comprimento total de 300 mm de solda contínua. A soma do comprimento das indicações alongadas e isoladas exceder a 8% do comprimento total da solda.* |
| **Accumulation of Discontinuity** / *Acúmulo de Descontinuidade* | Maximum of 50 mm in 300 mm of weld, or more than 8% of its total length. Except misalignment and undercuts. / *Máximo de 50 mm em 300 mm de solda, ou mais que 8% do seu comprimento total. Exceto desalinhamento e mordeduras.* |

---

## 15. ANNEX - VISUAL INSPECTION REPORT / ANEXO - RELATÓRIO DE ENSAIO VISUAL

### Formulário FSGQ 8.6-7 Rev.03 - Relatório de Inspeção Visual e Dimensional de Solda
### *Visual Inspection Report and Welding Dimensional*

- **Número / Number:** EVS-PBS-50.3-25/2025  
- **Data / Date:** 03/12/2025  
- **Folha / Sheet:** 1/1  
- **Cliente / Customer:** PETROBRAS  
- **Obra / Fabricante (Work / Manufacturer):** PSC  
- **Equipamento / Tubulação (Equipment / Pipe):** FEIXE "U" TAG: P-1238001 A/B  
- **Contrato / Contract:** 451436712  
- **Componente / Component:** FEIXE "U"  
- **Procedimento Nº / Revisão (Procedure / Revision):** EVS-PSC-01 REV. 1  
- **Especificação / Norma de Referência (Specification / Reference Standard):** ASME IX ED.2023 / N-133 / N-466  
- **Critério de Aceitação (Acceptance Criteria):** ASME IX ED.2023 / N-133  
- **Desenho Referência:** DE-3010.0J-1238-451-CZ3-003 REV. 00  
- **Temperatura da Superfície (Surface Temperature):** 29°C  
- **Condição Superficial (Surface Condition):** ESCOVADO  
- **Equip. de Iluminação (Lighting Equipment):** LANTERNA  
- **Iluminação (Lighting):** 1840 Lux  
- **Finalidade Principal do END (Home Purpose of Test):** GARANTIR QUALIDADE DAS JUNTAS SOLDADAS  
- **Metal de Base 1:** SA-240 Gr.316L  
- **Metal de Base 2:** AISI 316L / SA-213 Gr. TP316/316L  
- **Espessura mm (Thickness):** 1,24 / 8 / 135  
- **Processo de Soldagem (Welding Process):** GTAW  
- **Metal de Adição (Addition of Metal):** ER 316L  
- **Lote:** MK24L1010  
- **Local:** OFICINA  
- **Antes do TT:** SIM [ ] NÃO [X] | **Depois do TT:** SIM [ ] NÃO [X]  
- **EPS / RQPS:** PSC 001/25 GTAW  
- **Notas:** Ver identificações das soldas no Mapa de Soldagem nº MS-PBS-50.3-25/2025  

#### Registro dos Resultados / Results Record:

| Identificação da Solda | Junta | Ø | Tipo de Junta | EPS / IEIS | Soldadores (Raiz / Enc / Acab) | Descontinuidade | Localização (mm) | Comprimento (mm) | Ensaio | Local | Laudo (DJ / DS) | OBS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| TUBO X ESPELHO (SELAGEM) | C. 01 | 3/4" | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X CHAPA SUPORTE | C. 02 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X TIRANTE | C. 03 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X CHICANA | C. 04 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X TIRANTE | C. 05 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X CHAPA SUPORTE | C. 06 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X TIRANTE | C. 07 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| CHAPA DEFLETORA X ESPAÇADOR | C. 08 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| CHAPA DEFLETORA X ESPAÇADOR | C. 09 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| CHICANA X BARRA DE SELAGEM | C. 10 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X CHICANA | C. 11 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X TIRANTE | C. 12 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X CHAPA SUPORTE | C. 13 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X TIRANTE | C. 14 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X CHAPA SUPORTE | C. 15 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X TIRANTE | C. 16 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |
| PORCA X TIRANTE | C. 17 | - | ÂNGULO | PSC 001/25 GTAW | S-25 | - | - | - | - | - | A / A | GTAW |

#### Legenda / Abbreviations:
- **A** - APROVADO (APPROVED)
- **R** - REPROVADO (REJECTED)
- **REC** - RECOMENDAÇÃO DE ENSAIO COMPLEMENTAR (RECOMMENDATION OF COMPLEMENTARY TEST)
- **TT** - TRINCA (CRACK)
- **MO** - MORDEDURA (UNDERCUT)
- **SO** - SOBREPOSIÇÃO (OVERLAP)
- **FF** - FALTA DE FUSÃO (LACK OF FUSION)
- **FP** - FALTA DE PENETRAÇÃO (LACK OF PENETRATION)
- **PE** - PENETRAÇÃO EXCESSIVA / PERFURAÇÃO (PENETRATION EXCESSIVE / DRILLING)
- **PO** - POROSIDADE (POROSITY)
- **EM** - EMBICAMENTO (BEAKED)
- **DE** - DESALINHAMENTO (MISALIGNMENT)
- **DA** - DEFORMAÇÃO ANGULAR (DEFORMATION ANGLE)
- **CO** - CONCAVIDADE (CONCAVITY)
- **DI** - DEPOSIÇÃO INSUFICIENTE (DEPOSITION INSUFFICIENT)
- **DJ** - DIMENSIONAL DA JUNTA (DIMENSIONAL OF THE BOARD)
- **DS** - DIMENSIONAL DA SOLDA (SOLDER DIMENSIONAL)
- **AA** - ABERTURA DE ARCO (ARC OPENING)
- **RE** - REFORÇO EXCESSIVO (STRENGTHENING EXCESSIVE)
- **IE** - INCLUSÃO DE ESCÓRIA (SLAG INCLUSION)
- **R** - RESPIGO (SPLASH)

#### Instrumentos Utilizados / Instruments Used:
- **TRE-01:** Trena de 0 a 5000mm Nº 69-D-2307001, Val. 07/2026;
- **LUX-01:** Luxímetro Nº C347631/25, Val. 11/2026;
- **TER-02:** Termômetro infravermelho Nº 69T25101, Val. 10/2027;
- **CS-02:** Calibre de Solda Múltiplo Nº 69-D2303003, Val. 03/2026.

**Inspetor (Inspector):** [Assinatura] Data: 03/12/2025  
**Coordenador (Coordinator):** [Assinatura] Data: 03/12/2025  
**Cliente (Customer):** Data: [ ]
`

    // =============================================================
    // 3. CONTEÚDO IT-CQ-08 REV. 01
    // =============================================================
    var IT_CQ_08_CONTENT = `# INSTRUÇÃO DE TRABALHO: IT-CQ-08
## FABRICAÇÃO DE TUBOS PARA FEIXE TUBULAR DE PERMUTADORES DE CALOR COM TUBOS EM U

**Sistema de Gestão da Qualidade**  
**Código:** IT-CQ-08  
**Data:** 07.07.2025  
**Revisão:** 01  
**Página:** 1 a 3  

---

### Controle de Assinaturas

| Elaboração/Revisão | Data | Aprovação/Reaprovação | Data |
| :--- | :---: | :--- | :---: |
| **Leonardo Fontes**<br>Ass. de Gestão da Qualidade | 07.07.2025 | **Marcos Maciel**<br>Diretor | 07.07.2025 |

---

## 1. HISTÓRICO DE REVISÃO

| DATA | REVISÃO | ALTERAÇÃO |
| :---: | :---: | :--- |
| 14.11.2023 | **00** | Primeira emissão – conforme norma NBR ISO 9001:2015 |
| 07.07.2025 | **01** | Mudança da Logomarca da PSC. |

---

## 2. OBJETIVO
Estabelecer os requisitos técnicos necessários, definindo uma sequência lógica de serviços para a remontagem de feixe tubular de permutadores de calor com tubos em “U”, assim como uniformizar as informações entre os participantes dos trabalhos.

---

## 3. INTRODUÇÃO
Os requisitos técnicos citados nesta instrução abrangem os serviços mais usuais na fabricação de tubos para feixe tubular de trocadores de calor com tubos em U.

---

## 4. DOCUMENTOS DE REFERÊNCIA
- Manual do SGQ
- Procedimento PSGQ 8.6 INSPEÇÃO E TESTE;
- Procedimento PSGQ-8.5 (Produção e fornecimento de serviço);
- Procedimento PSGQ 7.5 INFORMAÇÃO DOCUMENTADA.

---

## 5. MÉTODOS DE EXECUÇÃO

### 5.1 SERVIÇOS PRELIMINARES
- Providenciar desenhos de projetos e RI’s;
- Providenciar lista de materiais (tubos);
- Selecionar matrizes para dobramento de tubos;
- Providenciar dispositivo para TTAT dos tubos em “U”.

---

### 5.2 SERVIÇOS DE RETUBAGEM

| ITEM | O QUE FAZER | COMO FAZER | PORQUE FAZER | RISCOS / CUIDADOS |
| :---: | :--- | :--- | :--- | :--- |
| **01** | Verificar detalhes de fabricação. | - Verificar medidas dos raios de curvatura.<br>- Verificar tipo do material dos tubos a serem dobrados.<br>- Verificar a necessidade de soldas de selagens e de fixação. | Prever os recursos com antecedência. | - |
| **02** | Inspecionar os tubos novos. | Verificar as dimensões de acordo com a norma aplicável e o solicitado no desenho. | Atender às solicitações do desenho de projeto. | Utilizar instrumentos calibrados e aferidos. |
| **03** | Inspecionar os tubos novos. | Verificar as dimensões de acordo com a norma aplicável e o solicitado no desenho. | Atender às solicitações do desenho de projeto. | Utilizar instrumentos calibrados e aferidos. |
| **04** | Dobrar os tubos em U. | - Utilizar a dobradeira de tubos manual com as matrizes de acordo com os raios solicitados no desenho de projeto.<br><br>**Obs. 1:** Caso a região que sofreu o dobramento apresente ovalização acima do permitido (10% do diâmetro externo) os tubos devem ser pressurizados ou colocado areia compactada no seu interior.<br><br>**Obs. 2:** Quando solicitado no desenho de projeto o tratamento térmico de alívio de tensões dos tubos os mesmos deverão ser posicionados sobre gabaritos. O tratamento térmico poderá ser feito no forno ou localizado nas regiões do dobramento e de acordo com os requisitos da norma aplicável.<br><br>- Cortar os tubos utilizando policorte com auxilio de gabarito e acréscimo de 5,0 mm de sobre-comprimento.<br><br>- Efetuar o teste hidrostático com a pressão de teste do lado dos tubos indicada no desenho de projeto para os tubos com o raio de curvatura inferior a 40,0mm exceto para os tubos dobrados sob pressão interna. | - Permitir a montagem dos tubos sem deformações.<br>- Evitar a deformação dos tubos.<br>- Evitar o empeno dos tubos.<br>- Verificar a resistência mecânica na região de curvatura dos tubos. | Utilizar EPIs adequado ao serviço. |

---

## 6. RESPONSABILIDADES E AUTORIDADES

### É de responsabilidade da supervisão:
- Solicitar/controlar o treinamento para os executantes neste procedimento;
- Verificar se os serviços estão sendo executados conforme procedimento;
- Garantir que os executantes envolvidos possuam a qualificação exigida;
- Discutir quanto aos aspectos de segurança antes do início dos serviços.

### É de responsabilidade do executante:
- Executar os serviços conforme procedimento;
- Solicitar a orientação da supervisão quando surgir alguma anormalidade;
- Atender aos itens de segurança.

---

## 7. RECURSOS
- Trena;
- Nível.

---

## 8. SEGURANÇA
- Utilizar ferramenta adequada e em bom estado de conservação;
- Usar sempre os EPI's adequados ao serviço;
- Isolar e sinalizar o equipamento durante o teste.
`

    // =============================================================
    // ATUALIZAÇÃO IDEMPOTENTE DOS DOCUMENTOS
    // =============================================================

    // Helper para buscar documento de forma flexível (por código, prefixo ou título)
    function findTargetDoc(prefixVal, codeVal, titlePart) {
      // 1. Tentar por prefixo e código exatos na PSC
      try {
        var res = app.findRecordsByFilter(
          'documents',
          'company_id = {:comp} && prefix = {:pfx} && code = {:code}',
          'created',
          1,
          0,
          { comp: PSC_ID, pfx: prefixVal, code: codeVal },
        )
        if (res && res.length > 0) return res[0]
      } catch (_) {}

      // 2. Tentar por código direto (caso prefixo esteja no code, ex: code='PR-CQ-14')
      try {
        var res2 = app.findRecordsByFilter(
          'documents',
          'company_id = {:comp} && code = {:fullCode}',
          'created',
          1,
          0,
          { comp: PSC_ID, fullCode: prefixVal + '-' + codeVal },
        )
        if (res2 && res2.length > 0) return res2[0]
      } catch (_) {}

      // 3. Tentar por title matching na PSC
      if (titlePart) {
        try {
          var res3 = app.findRecordsByFilter(
            'documents',
            'company_id = {:comp} && title ~ {:titlePart}',
            'created',
            1,
            0,
            { comp: PSC_ID, titlePart: titlePart },
          )
          if (res3 && res3.length > 0) return res3[0]
        } catch (_) {}
      }

      // 4. Fallback global sem filtro de company_id caso necessário
      try {
        var res4 = app.findRecordsByFilter(
          'documents',
          'prefix = {:pfx} && code = {:code}',
          'created',
          1,
          0,
          { pfx: prefixVal, code: codeVal },
        )
        if (res4 && res4.length > 0) return res4[0]
      } catch (_) {}

      return null
    }

    var updatedCount = 0

    // -------------------------------------------------------------
    // DOC 1: PR-CQ-14
    // -------------------------------------------------------------
    var docPrCq14 = findTargetDoc('PR-CQ', '14', 'ENSAIO VISUAL')
    if (docPrCq14) {
      var currentContent = (docPrCq14.getString('content') || '').trim()
      if (!currentContent) {
        docPrCq14.set('content', PR_CQ_14_CONTENT)
        docPrCq14.set('status', 'Under Review') // Em Revisão / Rascunho
        docPrCq14.set('template_family', FAMILY_B) // Técnico/CQ Bilíngue
        app.save(docPrCq14)
        updatedCount++
        console.log('Migration 0100: PR-CQ-14 preenchido com sucesso (id=' + docPrCq14.id + ')')
      } else {
        console.log('Migration 0100: PR-CQ-14 já possui conteúdo, ignorando para idempotência')
      }
    } else {
      console.log('Migration 0100: AVISO - Documento PR-CQ-14 não encontrado!')
    }

    // -------------------------------------------------------------
    // DOC 2: EVS-PSC-01 (prefix='EVS', code='1' ou '01')
    // -------------------------------------------------------------
    var docEvs = findTargetDoc('EVS', '1', 'VISUAL DE SOLDA')
    if (!docEvs) docEvs = findTargetDoc('EVS', '01', 'VISUAL DE SOLDA')
    if (!docEvs) docEvs = findTargetDoc('EVS-PSC', '01', 'VISUAL DE SOLDA')
    if (docEvs) {
      var currentEvsContent = (docEvs.getString('content') || '').trim()
      if (!currentEvsContent) {
        docEvs.set('content', EVS_PSC_01_CONTENT)
        docEvs.set('status', 'Under Review') // Em Revisão / Rascunho
        // Preserva ou reforça template_family B
        if (!docEvs.getString('template_family')) {
          docEvs.set('template_family', FAMILY_B)
        }
        app.save(docEvs)
        updatedCount++
        console.log('Migration 0100: EVS-PSC-01 preenchido com sucesso (id=' + docEvs.id + ')')
      } else {
        console.log('Migration 0100: EVS-PSC-01 já possui conteúdo, ignorando para idempotência')
      }
    } else {
      console.log('Migration 0100: AVISO - Documento EVS-PSC-01 não encontrado!')
    }

    // -------------------------------------------------------------
    // DOC 3: IT-CQ-08 (prefix='IT-CQ', code='6', '8' ou '08' com título de Tubos em U)
    // -------------------------------------------------------------
    var docItCq08 = findTargetDoc('IT-CQ', '8', 'TUBOS EM U')
    if (!docItCq08) docItCq08 = findTargetDoc('IT-CQ', '08', 'TUBOS EM U')
    if (!docItCq08) docItCq08 = findTargetDoc('IT-CQ', '6', 'TUBOS EM U')
    if (docItCq08) {
      var currentItContent = (docItCq08.getString('content') || '').trim()
      if (!currentItContent) {
        docItCq08.set('content', IT_CQ_08_CONTENT)
        docItCq08.set('status', 'Under Review') // Em Revisão / Rascunho
        if (!docItCq08.getString('template_family')) {
          docItCq08.set('template_family', FAMILY_B)
        }
        app.save(docItCq08)
        updatedCount++
        console.log('Migration 0100: IT-CQ-08 preenchido com sucesso (id=' + docItCq08.id + ')')
      } else {
        console.log('Migration 0100: IT-CQ-08 já possui conteúdo, ignorando para idempotência')
      }
    } else {
      console.log('Migration 0100: AVISO - Documento IT-CQ-08 não encontrado!')
    }

    console.log('Migration 0100 finalizada: ' + updatedCount + ' documentos atualizados.')
  },
  (app) => {
    // Revert opcional
  },
)
