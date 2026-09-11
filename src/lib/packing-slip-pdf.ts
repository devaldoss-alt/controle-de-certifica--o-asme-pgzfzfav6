import { PackingSlip } from '@/services/packing-slips'

export function generatePackingSlipPDF(slip: PackingSlip, companyName: string = 'PSC Proserco') {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Por favor, permita pop-ups para visualizar/imprimir o PDF do Romaneio.')
    return
  }

  // Format date and time
  const formattedDate = slip.issue_date ? new Date(slip.issue_date).toLocaleDateString('pt-BR') : ''
  const formattedTime =
    slip.issue_time ||
    (slip.issue_date && slip.issue_date.includes('T')
      ? new Date(slip.issue_date).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '')

  // Render items rows with 3 questions (Sim/Não) and notes
  const itemsRows = (slip.items || [])
    .map((it, index) => {
      const qAnswers: string[] = []
      if (it.is_raw_material !== undefined) {
        qAnswers.push(
          `Mat. Prima: <strong>${it.is_raw_material ? 'SIM' : 'NÃO'}</strong>${it.raw_material_evidence ? ` (${it.raw_material_evidence})` : ''}`,
        )
      }
      if (it.has_certificate !== undefined) {
        qAnswers.push(
          `Certificado: <strong>${it.has_certificate ? 'SIM' : 'NÃO'}</strong>${it.certificate_evidence ? ` (${it.certificate_evidence})` : ''}`,
        )
      }
      if (slip.type === 'Entrada' && it.has_invoice !== undefined) {
        qAnswers.push(
          `Veio c/ Nota: <strong>${it.has_invoice ? 'SIM' : 'NÃO'}</strong>${it.invoice_evidence ? ` (${it.invoice_evidence})` : ''}`,
        )
      }

      const questionsHtml =
        qAnswers.length > 0 ? `<div class="item-checklist-info">${qAnswers.join(' | ')}</div>` : ''

      const obsHtml = it.observation ? `<div>${it.observation}</div>` : ''

      return `
        <tr>
          <td style="text-align: center; vertical-align: middle;">${it.item || index + 1}</td>
          <td style="text-align: center; vertical-align: middle;">${it.quantity ?? ''}</td>
          <td style="text-align: center; vertical-align: middle;">${it.unit ?? ''}</td>
          <td>
            <strong>${it.description ?? ''}</strong>
            ${questionsHtml}
          </td>
          <td>${obsHtml || '&nbsp;'}</td>
        </tr>
      `
    })
    .join('')

  // Pad to at least 5 rows for visual fidelity if fewer
  const padCount = Math.max(0, 5 - (slip.items?.length || 0))
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

  // Render photos evidence if available
  const itemsWithPhotos = (slip.items || []).filter((it) => it.photos && it.photos.length > 0)

  let photosSectionHtml = ''
  if (itemsWithPhotos.length > 0) {
    const photoCards = itemsWithPhotos
      .map((it) => {
        const itemPhotos = (it.photos || [])
          .map(
            (url, pIdx) => `
          <div class="photo-card">
            <img src="${url}" alt="Foto item ${it.item} - ${pIdx + 1}" />
            <div class="photo-caption">Item ${it.item}: ${it.description.slice(0, 35)}</div>
          </div>
        `,
          )
          .join('')
        return itemPhotos
      })
      .join('')

    photosSectionHtml = `
      <div class="evidence-page-break">
        <div class="section-title">EVIDÊNCIAS FOTOGRÁFICAS DOS MATERIAIS (ESTADO FÍSICO NA ${slip.type.toUpperCase()})</div>
        <div class="photos-grid">
          ${photoCards}
        </div>
      </div>
    `
  }

  // GRV rows
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

  // Label for in_charge (encarregado)
  const inChargeLabel = slip.type === 'Saída' ? 'ENCARREGADO PELO RECEBIMENTO' : 'ENCARREGADO'

  // Special service info text if applicable
  const reasonText = slip.movement_reason
    ? slip.movement_reason === 'Outro' && slip.movement_reason_other
      ? `Outro: ${slip.movement_reason_other}`
      : slip.movement_reason
    : ''

  const specialServiceInfo =
    slip.movement_reason === 'Serviço Especial'
      ? `<div class="special-service-box">
          <strong>MOTIVO: SERVIÇO ESPECIAL (${slip.special_service_type || 'Geral'})</strong> —
          Status: <strong>${slip.special_service_status || 'Aguardando retorno'}</strong>
          ${slip.days_out !== undefined && slip.days_out !== null ? ` | Tempo Fora: <strong>${slip.days_out} dia(s)</strong>` : ''}
          ${slip.return_date ? ` | Retorno em: <strong>${new Date(slip.return_date).toLocaleDateString('pt-BR')}</strong>` : ''}
         </div>`
      : reasonText
        ? `<div class="special-service-box"><strong>MOTIVO DA MOVIMENTAÇÃO:</strong> ${reasonText}</div>`
        : ''

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Romaneio ${slip.number} - ${slip.type}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 10mm 15mm 10mm;
          @bottom-right {
            content: "Pág. " counter(page) " de " counter(pages);
            font-size: 9px;
            font-family: Arial, sans-serif;
          }
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10.5px;
          color: #000;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Tabela estrutural que engloba tudo para repetir thead e tfoot em todas as páginas */
        table.slip-master-layout {
          width: 100%;
          border-collapse: collapse;
          border: none;
        }
        table.slip-master-layout > thead {
          display: table-header-group;
        }
        table.slip-master-layout > tfoot {
          display: table-footer-group;
        }
        table.slip-master-layout > tbody > tr > td {
          padding: 0;
          border: none;
        }

        .header-box {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 4px;
        }
        .header-box td {
          border: 1px solid #000;
          padding: 5px;
        }
        .logo-cell {
          width: 25%;
          text-align: center;
          font-weight: bold;
          font-size: 13px;
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
          font-size: 10px;
        }

        .table-items-header {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
        }
        .table-items-header th {
          border: 1px solid #000;
          background-color: #e2e8f0;
          font-size: 9px;
          text-transform: uppercase;
          padding: 4px 6px;
        }

        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
        }
        .info-table td {
          border: 1px solid #000;
          padding: 3px 5px;
          vertical-align: top;
        }
        .label {
          font-size: 8.5px;
          font-weight: bold;
          text-transform: uppercase;
          color: #222;
          display: block;
          margin-bottom: 1px;
        }
        .val {
          font-size: 10.5px;
          font-weight: 600;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
        }
        .items-table th, .items-table td {
          border: 1px solid #000;
          padding: 4px 5px;
          font-size: 9.5px;
        }
        .items-table th {
          background-color: #e2e8f0;
          text-transform: uppercase;
          font-size: 8.5px;
        }
        .item-checklist-info {
          font-size: 8px;
          color: #334155;
          margin-top: 2px;
          padding: 2px 4px;
          background: #f1f5f9;
          border-radius: 2px;
          border-left: 2px solid #2563eb;
        }

        .section-header {
          background-color: #f1f5f9;
          font-weight: bold;
          font-size: 9.5px;
          padding: 3px 6px;
          border: 1px solid #000;
          text-transform: uppercase;
          margin-top: 6px;
        }
        .special-service-box {
          border: 1px solid #000;
          background: #fffbeb;
          padding: 4px 6px;
          font-size: 9.5px;
          margin-bottom: 6px;
        }

        .type-badge {
          display: inline-block;
          padding: 2px 6px;
          font-weight: bold;
          color: #fff;
          border-radius: 3px;
          font-size: 10px;
        }
        .type-Entrada { background-color: #16a34a; }
        .type-Saida { background-color: #dc2626; }
        .type-Cancelamento { background-color: #d97706; }

        .footer-signatures {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
        }
        .footer-signatures td {
          border: 1px solid #000;
          padding: 4px 5px;
          width: 33.33%;
          height: 38px;
          vertical-align: top;
        }
        .footer-bottom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8.5px;
          color: #555;
          padding-top: 4px;
          border-top: 1px solid #ccc;
          margin-top: 4px;
        }

        .photos-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 8px;
          margin-bottom: 12px;
        }
        .photo-card {
          border: 1px solid #000;
          padding: 4px;
          background: #fafafa;
          page-break-inside: avoid;
        }
        .photo-card img {
          width: 100%;
          height: 140px;
          object-fit: cover;
          display: block;
        }
        .photo-caption {
          font-size: 8.5px;
          font-weight: 600;
          margin-top: 3px;
          text-align: center;
          color: #111;
        }
        .evidence-page-break {
          page-break-before: auto;
          margin-top: 10px;
        }
        .section-title {
          font-size: 10px;
          font-weight: bold;
          background: #e2e8f0;
          border: 1px solid #000;
          padding: 4px 6px;
          text-transform: uppercase;
        }

        @media print {
          .no-print { display: none; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 15px; text-align: right; background: #f8fafc; padding: 10px; border-bottom: 1px solid #e2e8f0;">
        <span style="font-size: 12px; margin-right: 12px; color: #475569;">
          Romaneio #${slip.number} — Cabeçalho e rodapé fixos em todas as páginas
        </span>
        <button onclick="window.print()" style="padding: 8px 18px; background-color: #2563eb; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Imprimir / Salvar PDF</button>
      </div>

      <table class="slip-master-layout">
        <!-- Cabeçalho fixo / repetido em todas as páginas que quebrarem -->
        <thead>
          <tr>
            <td>
              <table class="header-box">
                <tr>
                  <td class="logo-cell">
                    ${companyName.toUpperCase()}
                  </td>
                  <td class="title-cell">
                    ROMANEIO DE ENTRADA E SAÍDA DE MERCADORIAS
                  </td>
                  <td class="doc-code-cell">
                    FSGQ 8.5-22 - REV.02<br/>
                    <span style="font-size: 9px; font-weight: normal;">SGQ ISO 9001 / ASME</span>
                  </td>
                </tr>
              </table>

              <!-- Mini resumo de cabeçalho na repetição de páginas -->
              <table class="table-items-header">
                <tr>
                  <th style="width: 25%; text-align: left;">ROMANEIO Nº ${slip.number}</th>
                  <th style="width: 25%; text-align: center;">TIPO: ${slip.type.toUpperCase()}</th>
                  <th style="width: 25%; text-align: center;">EMISSÃO: ${formattedDate} ${formattedTime}</th>
                  <th style="width: 25%; text-align: right;">O.S.: ${slip.expand?.os_id?.number || 'N/A'}</th>
                </tr>
              </table>
            </td>
          </tr>
        </thead>

        <!-- Rodapé fixo / repetido ao final de cada folha -->
        <tfoot>
          <tr>
            <td>
              <div class="footer-bottom-bar">
                <span>UQualiHub SGQ — FSGQ 8.5-22 Romaneio #${slip.number}</span>
                <span>Documento emitido automaticamente em ${formattedDate} às ${formattedTime || '--:--'}</span>
                <span>Assinaturas na folha final</span>
              </div>
            </td>
          </tr>
        </tfoot>

        <!-- Corpo Principal com Conteúdo -->
        <tbody>
          <tr>
            <td>
              <!-- Dados Completos de Identificação -->
              <table class="info-table" style="margin-top: 4px;">
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
                    <span class="label">DATA / HORA EMISSÃO:</span>
                    <span class="val">${formattedDate} ${formattedTime}</span>
                  </td>
                  <td style="width: 25%;">
                    <span class="label">O.S. VINCULADA:</span>
                    <span class="val">${slip.expand?.os_id?.number ? `#${slip.expand.os_id.number} - ${slip.expand.os_id.client || ''}` : 'N/A'}</span>
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

              ${specialServiceInfo}

              <!-- Tabela de Itens Principal -->
              <div style="font-weight: bold; font-size: 9.5px; margin-bottom: 2px;">ITENS DO ROMANEIO (COM VERIFICAÇÃO TÉCNICA E MATÉRIA-PRIMA):</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 6%;">ITEM</th>
                    <th style="width: 10%;">QTDE</th>
                    <th style="width: 8%;">UND</th>
                    <th style="width: 48%;">DESCRIÇÃO & RESPOSTAS TÉCNICAS</th>
                    <th style="width: 28%;">OBSERVAÇÕES</th>
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

              <!-- Seção de Fotos / Evidências -->
              ${photosSectionHtml}

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
                    <span class="label">${inChargeLabel}:</span>
                    <span class="val">${slip.in_charge || ''}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
