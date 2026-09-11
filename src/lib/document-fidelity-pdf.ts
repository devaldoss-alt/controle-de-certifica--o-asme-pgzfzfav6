import { Company } from '@/services/companies'
import { DocumentRecord, RevisionHistoryItem } from '@/services/documents'
import { inferTemplateFamily, getDocumentSubjectType } from './document-template-helper'
import pb from './pocketbase/client'

export interface DocumentPrintOptions {
  language?: 'pt' | 'en' | 'bilingual'
  company?: Company | null
}

function getCompanyLogoUrl(company?: Company | null): string | null {
  if (!company?.logo) return null
  return pb.files.getURL({ id: company.id, collectionName: 'companies' } as any, company.logo)
}

function parseRevisionHistory(doc: DocumentRecord): RevisionHistoryItem[] {
  if (Array.isArray(doc.revision_history)) {
    return doc.revision_history
  }
  if (typeof doc.revision_history === 'string' && doc.revision_history.trim()) {
    try {
      const parsed = JSON.parse(doc.revision_history)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // fallback
    }
  }

  // Gera histórico padrão a partir dos metadados existentes se vazio
  const rev = doc.revision || '00'
  const dateFormatted = doc.effective_date
    ? new Date(doc.effective_date).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')
  const prep = doc.prepared_by || 'GQ / Elaboração'
  const apprv = doc.approved_by || 'Diretoria'

  return [
    {
      revision: '00',
      date: '05/06/2023',
      changes: 'Primeira emissão – conforme norma NBR ISO 9001:2015.',
      preparedBy: 'Devaldo Silva',
      approvedBy: 'Marcos Maciel',
    },
    {
      revision: rev.padStart(2, '0'),
      date: dateFormatted,
      changes: 'Revisão e adequação sistemática SGQ.',
      preparedBy: prep,
      approvedBy: apprv,
    },
  ]
}

function renderLogoOrPlaceholder(company?: Company | null, customHeight: number = 44): string {
  const logoUrl = getCompanyLogoUrl(company)
  const name = company?.name || 'PSC INDUSTRIA COMERCIO E SERVIÇOS LTDA'

  if (logoUrl) {
    return `<img src="${logoUrl}" alt="${name}" style="max-height: ${customHeight}px; max-width: 150px; object-fit: contain; display: block; margin: auto;" />`
  }

  return `
    <div style="border: 1px dashed #64748b; padding: 4px 8px; border-radius: 4px; text-align: center; background: #f8fafc; color: #1e293b; font-size: 10px; font-weight: bold; line-height: 1.2;">
      <span style="display: block; font-size: 8px; text-transform: uppercase; color: #64748b; margin-bottom: 2px;">LOGOMARCA</span>
      ${name}
    </div>
  `
}

/**
 * GERA O HTML DO TEMPLATE FAMÍLIA A: SGQ Português (PSGQ, FSGQ, ITSGQ)
 */
export function generateFamilyAPrintHTML(
  doc: DocumentRecord,
  company?: Company | null,
  lang: 'pt' | 'en' = 'pt',
): string {
  const fullCode = doc.prefix && doc.code ? `${doc.prefix} ${doc.code}` : doc.code || doc.title
  const revNum = (doc.revision || '00').padStart(2, '0')
  const subject = getDocumentSubjectType(doc.prefix)
  const title = lang === 'en' && doc.title_en ? doc.title_en : doc.title
  const content = lang === 'en' && doc.content_en ? doc.content_en : doc.content || ''
  const effectiveDateStr = doc.effective_date
    ? new Date(doc.effective_date).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  const preparedBy = doc.prepared_by || 'Roberta Junqueira /\nGestora da Qualidade'
  const approvedBy = doc.approved_by || 'Marcos Maciel /\nDiretor'
  const revHistory = parseRevisionHistory(doc)

  const revRows = revHistory
    .map(
      (r) => `
    <tr>
      <td style="text-align: center; font-weight: bold; width: 60px;">${r.revision}</td>
      <td style="text-align: center; width: 90px;">${r.date}</td>
      <td style="text-align: left; padding: 4px 8px;">${r.changes}</td>
      <td style="text-align: center; width: 110px;">${r.preparedBy || '—'}</td>
      <td style="text-align: center; width: 110px;">${r.approvedBy || '—'}</td>
    </tr>
  `,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${fullCode} - ${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 15mm 12mm;
      @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
        font-size: 9px;
        font-family: Arial, sans-serif;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10.5pt;
      line-height: 1.45;
      color: #000;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Tabela mestra com cabeçalho thead e rodapé tfoot fixos em todas as páginas */
    table.master-layout {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }
    table.master-layout > thead {
      display: table-header-group;
    }
    table.master-layout > tfoot {
      display: table-footer-group;
    }
    table.master-layout > tbody > tr > td {
      padding: 0;
      border: none;
    }

    /* Cabeçalho da Família A */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2px;
    }
    .header-table td {
      border: 1.5px solid #000;
      padding: 4px 6px;
      vertical-align: middle;
    }
    .header-logo-cell {
      width: 25%;
      text-align: center;
      background: #fff;
    }
    .header-title-cell {
      width: 50%;
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-code-cell {
      width: 25%;
      padding: 0 !important;
    }
    .code-subtable {
      width: 100%;
      border-collapse: collapse;
      height: 100%;
    }
    .code-subtable td {
      border: none !important;
      border-bottom: 1px solid #000 !important;
      text-align: center;
      font-size: 10pt;
      padding: 3px !important;
    }
    .code-subtable tr:last-child td {
      border-bottom: none !important;
    }
    .header-subject-box {
      border: 1.5px solid #000;
      padding: 3px 6px;
      font-size: 9.5pt;
      font-weight: bold;
      margin-bottom: 12px;
      background: #fff;
    }

    /* Assinaturas Família A */
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .signatures-table th, .signatures-table td {
      border: 1px solid #000;
      text-align: center;
    }
    .signatures-table th {
      background: #e5e7eb;
      font-size: 9pt;
      padding: 4px;
      text-transform: uppercase;
    }
    .signatures-subhead {
      background: #f3f4f6;
      font-size: 8.5pt;
      font-weight: bold;
    }
    .sign-row td {
      height: 52px;
      vertical-align: bottom;
      padding: 4px 6px;
      font-size: 9pt;
    }
    .sign-name {
      white-space: pre-line;
      font-weight: 500;
      color: #111;
    }

    /* Tabela de Histórico de Revisões */
    .section-title-box {
      background: #e5e7eb;
      border: 1px solid #000;
      font-weight: bold;
      font-size: 10pt;
      padding: 4px 6px;
      text-transform: uppercase;
      margin-bottom: 0px;
    }
    .rev-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border: 1px solid #000;
    }
    .rev-table th, .rev-table td {
      border: 1px solid #000;
      padding: 4px;
      font-size: 8.5pt;
    }
    .rev-table th {
      background: #f3f4f6;
      text-align: center;
      text-transform: uppercase;
    }

    /* Conteúdo / Corpo do Documento */
    .document-body {
      padding-top: 4px;
    }
    .document-body h1, .document-body h2 {
      background: #e5e7eb;
      border: 1px solid #000;
      padding: 4px 6px;
      font-size: 10.5pt;
      font-weight: bold;
      margin-top: 14px;
      margin-bottom: 8px;
      text-transform: uppercase;
      page-break-after: avoid;
    }
    .document-body h3 {
      font-size: 10.5pt;
      font-weight: bold;
      margin-top: 10px;
      margin-bottom: 4px;
      page-break-after: avoid;
    }
    .document-body p {
      margin: 0 0 8px 0;
      text-align: justify;
    }
    .document-body ul, .document-body ol {
      margin: 4px 0 8px 24px;
      padding: 0;
    }
    .document-body li {
      margin-bottom: 4px;
      text-align: justify;
    }
    .document-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px 0;
    }
    .document-body table th, .document-body table td {
      border: 1px solid #000;
      padding: 4px 6px;
      font-size: 9pt;
    }
    .document-body table th {
      background: #f3f4f6;
    }

    .page-footer-spacer {
      height: 12px;
    }

    @media print {
      .no-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Botão de impressão na tela -->
  <div class="no-print" style="margin-bottom: 12px; text-align: right; background: #f8fafc; padding: 10px 14px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 13px; font-weight: bold; color: #334155;">
      Template SGQ (Família A) — ${fullCode} — Rev.${revNum}
    </span>
    <div>
      <button onclick="window.print()" style="padding: 7px 18px; background-color: #2563eb; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px;">
        Imprimir / Salvar PDF
      </button>
    </div>
  </div>

  <table class="master-layout">
    <!-- CABEÇALHO REPETIDO EM TODAS AS PÁGINAS -->
    <thead>
      <tr>
        <td>
          <table class="header-table">
            <tr>
              <td class="header-logo-cell">
                ${renderLogoOrPlaceholder(company, 42)}
              </td>
              <td class="header-title-cell">
                ${title}
              </td>
              <td class="header-code-cell">
                <table class="code-subtable">
                  <tr>
                    <td style="font-weight: bold; font-size: 11pt;">${fullCode}</td>
                  </tr>
                  <tr>
                    <td>Página: <span class="page-current"></span> de <span class="page-total"></span></td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold;">Rev.${revNum}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <div class="header-subject-box">
            Assunto: ${subject}
          </div>
        </td>
      </tr>
    </thead>

    <!-- CORPO DO DOCUMENTO -->
    <tbody>
      <tr>
        <td>
          <!-- Bloco de Assinaturas (Página 1) -->
          <table class="signatures-table">
            <tr>
              <th colspan="2" style="width: 50%;">Elaboração / Revisão</th>
              <th colspan="2" style="width: 50%;">Aprovação / Reaprovação</th>
            </tr>
            <tr class="signatures-subhead">
              <td style="width: 25%;">Assinatura</td>
              <td style="width: 25%;">Data</td>
              <td style="width: 25%;">Assinatura</td>
              <td style="width: 25%;">Data</td>
            </tr>
            <tr class="sign-row">
              <td>
                <div style="border-bottom: 1px dotted #888; width: 85%; margin: 0 auto 6px auto; height: 26px;"></div>
                <div class="sign-name">${preparedBy}</div>
              </td>
              <td style="vertical-align: middle; font-weight: bold; font-size: 9.5pt;">
                ${effectiveDateStr}
              </td>
              <td>
                <div style="border-bottom: 1px dotted #888; width: 85%; margin: 0 auto 6px auto; height: 26px;"></div>
                <div class="sign-name">${approvedBy}</div>
              </td>
              <td style="vertical-align: middle; font-weight: bold; font-size: 9.5pt;">
                ${effectiveDateStr}
              </td>
            </tr>
          </table>

          <!-- 1. Histórico de Revisões -->
          <div class="section-title-box">1. HISTÓRICO DE REVISÕES</div>
          <table class="rev-table">
            <thead>
              <tr>
                <th>REVISÃO</th>
                <th>DATA</th>
                <th>ALTERAÇÃO</th>
                <th>ELABORADO</th>
                <th>APROVADO</th>
              </tr>
            </thead>
            <tbody>
              ${revRows}
            </tbody>
          </table>

          <!-- Corpo do Procedimento -->
          <div class="document-body">
            ${content}
          </div>
        </td>
      </tr>
    </tbody>

    <!-- RODAPÉ REPETIDO -->
    <tfoot>
      <tr>
        <td>
          <div class="page-footer-spacer"></div>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`
}

/**
 * GERA O HTML DO TEMPLATE FAMÍLIA B: Técnico / CQ Bilíngue (CDE-PSC-01, etc.)
 */
export function generateFamilyBPrintHTML(
  doc: DocumentRecord,
  company?: Company | null,
  langOption: 'pt' | 'en' | 'bilingual' = 'bilingual',
): string {
  const fullCode = doc.prefix && doc.code ? `${doc.prefix}-${doc.code}` : doc.code || doc.title
  const revNum = (doc.revision || '00').padStart(2, '0')
  const ptTitle = doc.title || 'Procedimento Técnico'
  const enTitle = doc.title_en || 'Technical Procedure'
  const defaultQualif =
    doc.inspector_qualification ||
    'PROCEDIMENTO QUALIFICADO E DE ACORDO COM AS REGRAS DAS NORMAS ASME VIII; TEMA E N268.\nRÔMULO DO NASCIMENTO SNQC/END\nNÍVEL 2 Nº 16482 (CD-CL)'

  const revHistory = parseRevisionHistory(doc)
  const effectiveDateStr = doc.effective_date
    ? new Date(doc.effective_date).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  // Revision table headers e rows em formato Família B (colunas por revisão no rodapé ou tabela horizontal)
  const revIdxRows = revHistory
    .map(
      (r) => `
    <tr>
      <td style="text-align: center; font-weight: bold; width: 45px;">${r.revision}</td>
      <td style="padding: 4px 6px;">${r.changes}</td>
    </tr>
  `,
    )
    .join('')

  // Tabela de elaboradores por revisão (como no CDE real)
  const dateCols = revHistory.map((r) => `<th>REV. ${r.revision}</th>`).join('')
  const dateVals = revHistory.map((r) => `<td>${r.date || effectiveDateStr}</td>`).join('')
  const prepVals = revHistory
    .map((r) => `<td>${r.preparedBy || doc.prepared_by || 'RÔMULO DO NASCIMENTO'}</td>`)
    .join('')
  const verifVals = revHistory
    .map((r) => `<td>${r.verifiedBy || doc.verified_by || 'GERALDO TIMÓTEO'}</td>`)
    .join('')
  const apprvVals = revHistory
    .map((r) => `<td>${r.approvedBy || doc.approved_by || 'RÔMULO DO NASCIMENTO'}</td>`)
    .join('')

  // Montagem do corpo:
  // Se bilíngue: renderiza blocos ou pares
  let bodyContent = ''
  if (langOption === 'pt') {
    bodyContent = doc.content || ''
  } else if (langOption === 'en') {
    bodyContent = doc.content_en || doc.content || ''
  } else {
    // Bilíngue: Se content_en estiver preenchido e content também, exibe ambos ou pares
    if (doc.content_en && doc.content) {
      bodyContent = `
        <div class="bilingual-grid">
          <div class="bilingual-col en-col">
            <div class="col-flag-header">ENGLISH (EN)</div>
            ${doc.content_en}
          </div>
          <div class="bilingual-col pt-col">
            <div class="col-flag-header">PORTUGUÊS (PT)</div>
            ${doc.content}
          </div>
        </div>
      `
    } else {
      bodyContent = doc.content || doc.content_en || ''
    }
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${fullCode} - ${ptTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 15mm 12mm;
      @bottom-right {
        content: "Pag.: " counter(page) " de " counter(pages);
        font-size: 9px;
        font-family: Arial, sans-serif;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #000;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Master layout com thead e tfoot repetidos */
    table.master-layout {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }
    table.master-layout > thead {
      display: table-header-group;
    }
    table.master-layout > tfoot {
      display: table-footer-group;
    }
    table.master-layout > tbody > tr > td {
      padding: 0;
      border: none;
    }

    /* Cabeçalho Família B */
    .header-box {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 4px;
    }
    .header-box td {
      border: 1.5px solid #000;
      padding: 4px 6px;
      vertical-align: middle;
    }
    .logo-cell {
      width: 24%;
      text-align: center;
      background: #fff;
    }
    .header-center-cell {
      width: 52%;
      text-align: center;
      padding: 4px 8px;
    }
    .header-top-tag {
      font-size: 9pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .header-doc-title {
      font-size: 11pt;
      font-weight: bold;
      line-height: 1.25;
    }
    .header-doc-title em {
      font-weight: 600;
      font-style: italic;
      display: block;
      margin-top: 2px;
      font-size: 10.5pt;
    }
    .header-code-col {
      width: 24%;
      padding: 0 !important;
    }
    .b-code-table {
      width: 100%;
      border-collapse: collapse;
      height: 100%;
    }
    .b-code-table td {
      border: none !important;
      border-bottom: 1px solid #000 !important;
      text-align: center;
      padding: 3px !important;
      font-size: 9.5pt;
    }
    .b-code-table tr:last-child td {
      border-bottom: none !important;
    }
    .header-qms-subbar {
      border: 1.5px solid #000;
      padding: 4px;
      text-align: center;
      font-weight: bold;
      font-size: 9.5pt;
      background: #fff;
      margin-bottom: 8px;
    }

    /* Bloco de Qualificação do Inspetor */
    .qualification-box {
      border: 1px solid #000;
      padding: 6px;
      margin: 8px 0 12px 0;
      text-align: center;
      font-size: 8.5pt;
      font-weight: bold;
      white-space: pre-line;
      line-height: 1.35;
      background: #fff;
    }

    /* Tabela de Revisões da Família B */
    .rev-idx-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      border: 1px solid #000;
    }
    .rev-idx-table th, .rev-idx-table td {
      border: 1px solid #000;
      padding: 4px 6px;
      font-size: 8.5pt;
    }
    .rev-idx-table th {
      background: #f1f5f9;
      text-transform: uppercase;
      font-size: 8pt;
    }

    .rev-authors-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border: 1px solid #000;
    }
    .rev-authors-table th, .rev-authors-table td {
      border: 1px solid #000;
      padding: 4px;
      text-align: center;
      font-size: 8pt;
    }
    .rev-authors-table th {
      background: #e2e8f0;
    }
    .row-header {
      font-weight: bold;
      background: #f8fafc;
      text-align: left !important;
      width: 150px;
      padding-left: 6px !important;
    }

    /* Colunas Bilíngues */
    .bilingual-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .bilingual-col {
      padding: 4px;
    }
    .col-flag-header {
      font-size: 8.5pt;
      font-weight: bold;
      text-transform: uppercase;
      background: #e2e8f0;
      padding: 2px 6px;
      margin-bottom: 8px;
      border: 1px solid #000;
      text-align: center;
    }

    /* Formatação Geral do Conteúdo */
    .content-area h1, .content-area h2 {
      font-size: 10.5pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 12px;
      margin-bottom: 4px;
      page-break-after: avoid;
    }
    .content-area p {
      margin: 0 0 6px 0;
      text-align: justify;
    }
    .content-area ul, .content-area ol {
      margin: 4px 0 6px 20px;
      padding: 0;
    }
    .content-area li {
      margin-bottom: 3px;
    }

    @media print {
      .no-print { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Botão de impressão na tela -->
  <div class="no-print" style="margin-bottom: 12px; text-align: right; background: #f8fafc; padding: 10px 14px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 13px; font-weight: bold; color: #334155;">
      Template Técnico / CQ Bilíngue (Família B) — ${fullCode} — Rev.${revNum} [${langOption.toUpperCase()}]
    </span>
    <div>
      <button onclick="window.print()" style="padding: 7px 18px; background-color: #2563eb; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px;">
        Imprimir / Salvar PDF
      </button>
    </div>
  </div>

  <table class="master-layout">
    <!-- CABEÇALHO REPETIDO EM TODAS AS PÁGINAS -->
    <thead>
      <tr>
        <td>
          <table class="header-box">
            <tr>
              <td class="logo-cell">
                ${renderLogoOrPlaceholder(company, 42)}
              </td>
              <td class="header-center-cell">
                <div class="header-top-tag">PROCEDURE / PROCEDIMENTO</div>
                <div class="header-doc-title">
                  ${enTitle} /
                  <em>${ptTitle}</em>
                </div>
              </td>
              <td class="header-code-col">
                <table class="b-code-table">
                  <tr>
                    <td style="font-weight: bold; font-size: 10.5pt;">${fullCode}</td>
                  </tr>
                  <tr>
                    <td>Pag.: <span class="page-current"></span></td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold;">Rev.: ${revNum}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <div class="header-qms-subbar">
            Quality Management System / <em>Sistema de Gestão da Qualidade</em>
          </div>
        </td>
      </tr>
    </thead>

    <!-- CORPO -->
    <tbody>
      <tr>
        <td>
          <!-- Qualificação do Inspetor (topo da pág 1) -->
          <div class="qualification-box">
            ${defaultQualif}
          </div>

          <!-- Índice de Revisões da Família B -->
          <div style="font-weight: bold; font-size: 9.5pt; text-align: center; margin-bottom: 4px; font-style: italic;">
            Revision History Index / Índice de Revisões
          </div>
          <table class="rev-idx-table">
            <thead>
              <tr>
                <th style="width: 45px;">Rev.</th>
                <th>DESCRIPTION AND/OR AFFECTED LEAVES / DESCRIÇÃO E/OU FOLHAS ATINGIDAS</th>
              </tr>
            </thead>
            <tbody>
              ${revIdxRows}
            </tbody>
          </table>

          <!-- Tabela de Autores por Revisão -->
          <table class="rev-authors-table">
            <thead>
              <tr>
                <th class="row-header">DATE / DATA</th>
                ${dateCols}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="row-header">PREPARED BY / ELABORADO</td>
                ${prepVals}
              </tr>
              <tr>
                <td class="row-header">VERIFIED BY / VERIFICADO</td>
                ${verifVals}
              </tr>
              <tr>
                <td class="row-header">APPROVED BY / APROVADO</td>
                ${apprvVals}
              </tr>
            </tbody>
          </table>

          <!-- Corpo do Procedimento -->
          <div class="content-area">
            ${bodyContent}
          </div>

          <!-- Rodapé com carimbo do Inspetor na página final -->
          <div style="margin-top: 24px; text-align: center; page-break-inside: avoid;">
            <div style="border-top: 1px solid #888; width: 240px; margin: 20px auto 4px auto;"></div>
            <div style="font-size: 8.5pt; font-weight: bold; text-transform: uppercase;">
              ${doc.prepared_by || 'RÔMULO DO NASCIMENTO SNQC/END'}
            </div>
            <div style="font-size: 8pt; color: #444;">
              NÍVEL 2 Nº 16482 (CD-CL)
            </div>
          </div>
        </td>
      </tr>
    </tbody>

    <tfoot>
      <tr>
        <td>
          <div style="height: 12px;"></div>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`
}

/**
 * Função de despacho que abre a janela de impressão no formato e família corretos
 */
export function openDocumentFidelityPrint(
  doc: DocumentRecord,
  company?: Company | null,
  forceFamily?: 'SGQ — Português (PSGQ/FSGQ/ITSGQ)' | 'Técnico/CQ — Bilíngue (CDE)',
  forceLang: 'pt' | 'en' | 'bilingual' = 'pt',
) {
  const family = forceFamily || doc.template_family || inferTemplateFamily(doc.prefix, doc.code)

  let html = ''
  if (family === 'SGQ — Português (PSGQ/FSGQ/ITSGQ)') {
    const lang = forceLang === 'en' ? 'en' : 'pt'
    html = generateFamilyAPrintHTML(doc, company, lang)
  } else {
    html = generateFamilyBPrintHTML(doc, company, forceLang)
  }

  const win = window.open('', '_blank')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
  } else {
    alert('Por favor, permita pop-ups no seu navegador para imprimir o documento.')
  }
}
