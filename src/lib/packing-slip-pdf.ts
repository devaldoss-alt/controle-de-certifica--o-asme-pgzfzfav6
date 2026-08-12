import { PackingSlip } from '@/services/packing-slips'

export function generatePackingSlipPDF(slip: PackingSlip, companyName: string = 'PSC Proserco') {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Por favor, permita pop-ups para visualizar/imprimir o PDF do Romaneio.')
    return
  }

  const itemsRows = (slip.items || [])
    .map(
      (it, index) => `
    <tr>
      <td style="text-align: center;">${it.item || index + 1}</td>
      <td style="text-align: center;">${it.quantity ?? ''}</td>
      <td style="text-align: center;">${it.unit ?? ''}</td>
      <td>${it.description ?? ''}</td>
      <td>${it.observation ?? ''}</td>
    </tr>
  `,
    )
    .join('')

  // Pad to at least 7 rows for visual fidelity
  const padCount = Math.max(0, 7 - (slip.items?.length || 0))
  let paddedRows = ''
  for (let i = 0; i < padCount; i++) {
    const itemNum = (slip.items?.length || 0) + i + 1
    paddedRows += `
      <tr>
        <td style="text-align: center;">${itemNum}</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
    `
  }

  const grvRows = (slip.grv_info || [])
    .map(
      (grv) => `
    <tr>
      <td>${grv.code ?? ''}</td>
      <td>${grv.description ?? ''}</td>
      <td style="text-align: right;">${grv.value ? Number(grv.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}</td>
      <td>${grv.type ?? ''}</td>
      <td>${grv.sector ?? ''}</td>
      <td>${grv.requester ?? ''}</td>
    </tr>
  `,
    )
    .join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Romaneio ${slip.number} - ${slip.type}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #000;
          margin: 0;
          padding: 0;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        .header-table td, .header-table th {
          border: 1px solid #000;
          padding: 4px;
        }
        .logo-cell {
          width: 25%;
          text-align: center;
          font-weight: bold;
          font-size: 14px;
        }
        .title-cell {
          width: 50%;
          text-align: center;
          font-size: 13px;
          font-weight: bold;
        }
        .doc-code-cell {
          width: 25%;
          text-align: center;
          font-weight: bold;
          font-size: 11px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .info-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          vertical-align: top;
        }
        .label {
          font-size: 9px;
          font-weight: bold;
          text-transform: uppercase;
          color: #333;
          display: block;
        }
        .val {
          font-size: 11px;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        .items-table th, .items-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          font-size: 10px;
        }
        .items-table th {
          background-color: #e0e0e0;
          text-transform: uppercase;
          font-size: 9px;
        }
        .section-header {
          background-color: #f0f0f0;
          font-weight: bold;
          font-size: 10px;
          padding: 4px;
          border: 1px solid #000;
          text-transform: uppercase;
          margin-top: 10px;
        }
        .type-badge {
          display: inline-block;
          padding: 3px 8px;
          font-weight: bold;
          color: #fff;
          border-radius: 3px;
        }
        .type-Entrada { background-color: #16a34a; }
        .type-Saida { background-color: #dc2626; }
        .type-Cancelamento { background-color: #d97706; }
        .footer-signatures {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .footer-signatures td {
          border: 1px solid #000;
          padding: 6px;
          width: 33.33%;
          height: 45px;
          vertical-align: top;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="padding: 8px 16px; background-color: #2563eb; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Imprimir / Salvar PDF</button>
      </div>

      <!-- Cabeçalho idêntico à Planilha FSGQ 8.5-22 -->
      <table class="header-table">
        <tr>
          <td class="logo-cell">
            ${companyName.toUpperCase()}
          </td>
          <td class="title-cell">
            ROMANEIO DE ENTRADA E SAÍDA DE MERCADORIAS
          </td>
          <td class="doc-code-cell">
            FSGQ 8.5-22 - REV.02
          </td>
        </tr>
      </table>

      <!-- Dados de Identificação -->
      <table class="info-table">
        <tr>
          <td style="width: 25%;">
            <span class="label">ROMANEIO Nº:</span>
            <span class="val" style="font-size: 13px;">${slip.number}</span>
          </td>
          <td style="width: 25%;">
            <span class="label">TIPO:</span>
            <span class="val">
              <span class="type-badge type-${slip.type === 'Saída' ? 'Saida' : slip.type}">
                ${slip.type.toUpperCase()}
              </span>
            </span>
          </td>
          <td style="width: 25%;">
            <span class="label">DATA DE EMISSÃO:</span>
            <span class="val">${slip.issue_date ? new Date(slip.issue_date).toLocaleDateString('pt-BR') : ''}</span>
          </td>
          <td style="width: 25%;">
            <span class="label">O.S.:</span>
            <span class="val">${slip.expand?.os_id?.number || ''}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="label">PARA / DESTINATÁRIO:</span>
            <span class="val">${slip.recipient_origin || ''}</span>
          </td>
          <td>
            <span class="label">O.C.:</span>
            <span class="val">${slip.oc_number || ''}</span>
          </td>
          <td>
            <span class="label">NF-e:</span>
            <span class="val">${slip.nfe_number || ''}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="label">LOCAL DE ORIGEM:</span>
            <span class="val">${slip.origin_location || ''}</span>
          </td>
          <td>
            <span class="label">DOC Ñ OFICIAL:</span>
            <span class="val">${slip.doc_non_official || ''}</span>
          </td>
          <td>
            <span class="label">C.M.:</span>
            <span class="val">${slip.cm_number || ''}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <span class="label">LOCAL DE DESTINO:</span>
            <span class="val">${slip.destination_location || ''}</span>
          </td>
          <td colspan="2">
            <span class="label">RESPONSÁVEL PELA ENTREGA:</span>
            <span class="val">${slip.delivery_responsible || slip.expand?.responsible_id?.name || ''}</span>
          </td>
        </tr>
      </table>

      <!-- Tabela de Itens Principal -->
      <div style="font-weight: bold; font-size: 10px; margin-bottom: 3px;">ITENS DO ROMANEIO:</div>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 6%;">ITEM</th>
            <th style="width: 10%;">QTDE</th>
            <th style="width: 8%;">UND</th>
            <th style="width: 46%;">DESCRIÇÃO</th>
            <th style="width: 30%;">OBSERVATIVO</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          ${paddedRows}
        </tbody>
      </table>

      <!-- Informações Adicionais / GRV -->
      ${
        slip.grv_info && slip.grv_info.length > 0
          ? `
        <div class="section-header">INFORMAÇÕES ADICIONAIS (CÓDIGO GRV / CUSTOS)</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 15%;">CÓDIGO GRV</th>
              <th style="width: 35%;">DESCRIÇÃO GRV</th>
              <th style="width: 15%;">VALOR</th>
              <th style="width: 10%;">TIPO</th>
              <th style="width: 12%;">SETOR</th>
              <th style="width: 13%;">SOLICITANTE</th>
            </tr>
          </thead>
          <tbody>
            ${grvRows}
          </tbody>
        </table>
      `
          : ''
      }

      <!-- Assinaturas e Responsáveis -->
      <table class="footer-signatures">
        <tr>
          <td>
            <span class="label">FONE P/ CONTATO:</span>
            <span class="val">${slip.contact_phone || ''}</span>
          </td>
          <td>
            <span class="label">RESPONSÁVEL ALMOXARIFADO:</span>
            <span class="val">${slip.warehouse_responsible || ''}</span>
          </td>
          <td>
            <span class="label">RESPONSÁVEL C.Q. / P.C.P.:</span>
            <span class="val">${slip.cq_pcp_responsible || ''}</span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="label">SETOR:</span>
            <span class="val">${slip.sector || ''}</span>
          </td>
          <td>
            <span class="label">SOLICITANTE:</span>
            <span class="val">${slip.requester || ''}</span>
          </td>
          <td>
            <span class="label">ENCARREGADO:</span>
            <span class="val">${slip.in_charge || ''}</span>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
