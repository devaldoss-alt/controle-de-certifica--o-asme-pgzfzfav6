/**
 * Módulo de parsing e normalização de planilhas e arquivos JSON no formato FSGQ 8.7-2
 * e FSGQ 8.7-1 (Relatório de Não Conformidade).
 */

import { normalizeText, parseXLSXSheets, type SheetData } from './spreadsheet-parser'

export const COMPANY_IDS = {
  PSC: 'a631bv695rr4gef',
  KOALA: 'i7kjauu378swxg6',
} as const

export interface FSGQParsedRecord {
  number: string // PRESERVAR exatamente como está (ex: '002/2024', '011/25', '005-26', 'NC001', '43')
  date: string // YYYY-MM-DD
  issuer?: string
  service_order_number?: string
  part_item?: string // Peça/Equipamento/Evento
  involved_parties?: string // Envolvidos / setores envolvidos
  description: string // Descrição da NC
  responsible?: string // Responsável NC
  immediate_action?: string // Correção
  reinspection_notes?: string // Reinspeção
  root_cause?: string // Causa raiz
  root_cause_details?: string // Detalhes da causa
  corrective_action?: string // Ação corretiva/preventiva
  is_effective: 'SIM' | 'NÃO' | 'Pendente' // Eficaz?
  notes?: string // Observações
  status: 'Fechada' | 'Em Andamento' // Critério: correção/ação preenchidas E eficácia definida => Fechada
  company_id: string // PSC ou Koala
  company_name: string
  year: number // 2025, 2026, etc.
  rawSheetName: string
}

export interface SheetCompanyYear {
  company_id: string
  company_name: string
  year: number
}

/**
 * Identifica empresa e ano a partir do nome da aba:
 * - 'PSC ...' -> PSC (a631bv695rr4gef)
 * - 'Koala ...' (inclusive grafias alternativas como 'Koala Siystem', 'Koala System') -> Koala System (i7kjauu378swxg6)
 * - Ano: busca 2024, 2025, 2026, etc. no nome da aba
 */
export function identifyCompanyAndYearFromSheetName(sheetName: string): SheetCompanyYear | null {
  const norm = normalizeText(sheetName)

  // Abas a ignorar
  if (isIgnoredSheet(sheetName)) {
    return null
  }

  let company_id = ''
  let company_name = ''

  if (norm.includes('psc')) {
    company_id = COMPANY_IDS.PSC
    company_name = 'PSC Indústria'
  } else if (
    norm.includes('koala') ||
    norm.includes('koala siystem') ||
    norm.includes('koala system')
  ) {
    company_id = COMPANY_IDS.KOALA
    company_name = 'Koala System'
  }

  if (!company_id) {
    return null
  }

  // Extrair ano do nome da aba (ex: 2025, 2026, 25, 26)
  let year = 2025
  const yearMatch = sheetName.match(/\b(202[0-9])\b/)
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10)
  } else {
    // Tenta padrões como '25 ou '26
    const shortYearMatch = sheetName.match(/\b([2-3][0-9])\b/)
    if (shortYearMatch) {
      year = 2000 + parseInt(shortYearMatch[1], 10)
    }
  }

  return { company_id, company_name, year }
}

/**
 * Abas a ignorar: índice, inconsistências, resumo, relatório geral, etc.
 */
export function isIgnoredSheet(sheetName: string): boolean {
  const norm = normalizeText(sheetName)
  const blacklist = [
    'indice',
    'relatorio',
    'inconsistencias',
    'inconsistencia',
    'resumo',
    'dashboard',
    'grafico',
    'graficos',
    'parametros',
    'instrucoes',
    'menu',
  ]
  return blacklist.some(
    (term) => norm === term || norm.startsWith(`${term} `) || norm.includes(` ${term}`),
  )
}

/**
 * Normaliza datas mistas (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, serial Excel, etc.)
 */
export function normalizeMixedDate(val: unknown, fallbackYear?: number): string {
  if (val === null || val === undefined) {
    const y = fallbackYear || new Date().getFullYear()
    return `${y}-01-01`
  }

  // Se já for Date
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0]
  }

  const str = String(val).trim()
  if (!str) {
    const y = fallbackYear || new Date().getFullYear()
    return `${y}-01-01`
  }

  // 1. Serial Excel numérico (ex: 45678)
  if (/^\d{4,6}(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str)
    if (!isNaN(serial) && serial >= 1000 && serial <= 100000) {
      const utcMillis = Math.round((serial - 25569) * 86400 * 1000)
      const d = new Date(utcMillis)
      if (!isNaN(d.getTime())) {
        const y = d.getUTCFullYear()
        const m = String(d.getUTCMonth() + 1).padStart(2, '0')
        const day = String(d.getUTCDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
    }
  }

  // 2. DD.MM.YYYY ou DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (brMatch) {
    const day = String(parseInt(brMatch[1], 10)).padStart(2, '0')
    const month = String(parseInt(brMatch[2], 10)).padStart(2, '0')
    let year = parseInt(brMatch[3], 10)
    if (year < 100) year = year < 50 ? 2000 + year : 1900 + year
    return `${year}-${month}-${day}`
  }

  // 3. YYYY-MM-DD ou YYYY.MM.DD
  const isoMatch = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  if (isoMatch) {
    const year = isoMatch[1]
    const month = String(parseInt(isoMatch[2], 10)).padStart(2, '0')
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const y = fallbackYear || new Date().getFullYear()
  return `${y}-01-01`
}

/**
 * Mapeamento flexível por nome de coluna (match sem acento, case-insensitive):
 * Requisitos verbatim:
 * - Nº RNC → número (PRESERVAR exatamente como está — ex. '002/2024', '011/25', '005-26')
 * - Data abertura → data (normalizar formatos mistos: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, serial Excel)
 * - Emitente → emissor
 * - Nº OS → ordem de serviço
 * - Peça/Equipamento/Evento → peça/item
 * - Envolvidos → setores envolvidos
 * - Descrição da NC → descrição
 * - Responsável NC → responsável
 * - Correção → correção
 * - Reinspeção → reinspeção
 * - Causa raiz → causas raiz
 * - Detalhes da causa → detalhes
 * - Ação corretiva/preventiva → ação corretiva
 * - Eficaz? → eficácia (Sim→eficaz)
 * - Observações → observações
 */
interface ColumnMappingIndex {
  colNumber: number
  colDate: number
  colIssuer: number
  colOS: number
  colPartItem: number
  colInvolved: number
  colDescription: number
  colResponsible: number
  colCorrection: number
  colReinspection: number
  colRootCause: number
  colRootCauseDetails: number
  colCorrectiveAction: number
  colEffectiveness: number
  colObservations: number
}

function resolveColumnIndices(headers: string[]): ColumnMappingIndex {
  const normHeaders = headers.map(normalizeText)

  const findIdx = (patterns: string[]): number => {
    return normHeaders.findIndex((h) =>
      patterns.some((pat) => {
        const pNorm = normalizeText(pat)
        return h === pNorm || h.includes(pNorm)
      }),
    )
  }

  return {
    // Nº RNC / RNC / Nº / Num / Codigo
    colNumber: findIdx([
      'n rnc',
      'no rnc',
      'n° rnc',
      'numero rnc',
      'num rnc',
      'numero',
      'rnc',
      'codigo',
    ]),
    // Data abertura / Data / Emissao
    colDate: findIdx(['data abertura', 'data de abertura', 'abertura', 'data emissao', 'data']),
    // Emitente / Emissor / Aberto por / Inspetor
    colIssuer: findIdx(['emitente', 'emissor', 'aberto por', 'inspetor', 'origem']),
    // Nº OS / OS / Ordem de servico
    colOS: findIdx(['n os', 'no os', 'n° os', 'numero os', 'ordem de servico', 'os']),
    // Peça/Equipamento/Evento / Peca / Equipamento / Evento / Item
    colPartItem: findIdx([
      'peca/equipamento/evento',
      'peca',
      'equipamento',
      'evento',
      'item',
      'componente',
      'produto',
    ]),
    // Envolvidos / Setores envolvidos / Setor / Processo / Area
    colInvolved: findIdx([
      'envolvidos',
      'setores envolvidos',
      'setor',
      'processo',
      'area',
      'departamento',
    ]),
    // Descrição da NC / Descricao / Desvio / Resumo
    colDescription: findIdx([
      'descricao da nc',
      'descricao do desvio',
      'descricao',
      'desvio',
      'problema',
      'resumo',
    ]),
    // Responsável NC / Responsavel tratativa / Responsavel
    colResponsible: findIdx([
      'responsavel nc',
      'responsavel tratativa',
      'responsavel pelo plano',
      'responsavel',
    ]),
    // Correção / Disposicao / Acao imediata / Contencao
    colCorrection: findIdx([
      'correcao imediata',
      'correcao',
      'disposicao',
      'acao imediata',
      'contencao',
    ]),
    // Reinspeção / Reinspecao / Laudo / Parecer
    colReinspection: findIdx([
      'reinspecao',
      'resultado reinspecao',
      'laudo reinspecao',
      'reinspecionado',
    ]),
    // Causa raiz / Causa / Categorizacao
    colRootCause: findIdx(['causa raiz', 'categoria da causa', 'causa']),
    // Detalhes da causa / Detalhes / Por que
    colRootCauseDetails: findIdx([
      'detalhes da causa',
      'detalhes da causa raiz',
      'detalhes',
      'por que',
    ]),
    // Ação corretiva/preventiva / Acao corretiva / Acao preventiva / Tratativa
    colCorrectiveAction: findIdx([
      'acao corretiva/preventiva',
      'acao corretiva',
      'acao preventiva',
      'plano de acao',
      'tratativa',
    ]),
    // Eficaz? / Eficacia / Resultado eficacia
    colEffectiveness: findIdx([
      'eficaz?',
      'eficaz',
      'eficacia',
      'resultado eficacia',
      'foi eficaz',
    ]),
    // Observações / Observacoes / Obs / Notas
    colObservations: findIdx(['observacoes', 'observacao', 'obs', 'notas', 'comentarios']),
  }
}

/**
 * Avalia eficácia e define status:
 * Critério verbatim:
 * "correção/ação preenchidas E eficácia definida → 'Fechada'; tratamento vazio ou sem desfecho → 'Em Andamento'"
 */
export function determineStatusAndEffectiveness(
  correction: string,
  correctiveAction: string,
  rawEffectiveness: string,
): { status: 'Fechada' | 'Em Andamento'; is_effective: 'SIM' | 'NÃO' | 'Pendente' } {
  const effNorm = normalizeText(rawEffectiveness || '')
  let is_effective: 'SIM' | 'NÃO' | 'Pendente' = 'Pendente'

  if (
    effNorm.includes('sim') ||
    effNorm === 's' ||
    effNorm === 'ok' ||
    (effNorm.includes('eficaz') && !effNorm.includes('ineficaz') && !effNorm.includes('nao'))
  ) {
    is_effective = 'SIM'
  } else if (
    effNorm.includes('nao') ||
    effNorm.includes('não') ||
    effNorm === 'n' ||
    effNorm.includes('ineficaz')
  ) {
    is_effective = 'NÃO'
  }

  const hasTreatment =
    (correction && correction.trim().length > 0) ||
    (correctiveAction && correctiveAction.trim().length > 0)

  const isEffectivenessDefined = is_effective === 'SIM' || is_effective === 'NÃO'

  const status: 'Fechada' | 'Em Andamento' =
    hasTreatment && isEffectivenessDefined ? 'Fechada' : 'Em Andamento'

  return { status, is_effective }
}

/**
 * Mescla duas linhas com o MESMO número de NC na MESMA empresa em um único registro,
 * acumulando ações, causas, evidências e observações.
 */
export function mergeDuplicateRecords(
  existing: FSGQParsedRecord,
  incoming: FSGQParsedRecord,
): FSGQParsedRecord {
  const combine = (a?: string, b?: string, separator = ' | '): string => {
    const cleanA = (a || '').trim()
    const cleanB = (b || '').trim()
    if (!cleanA) return cleanB
    if (!cleanB) return cleanA
    if (cleanA.toLowerCase().includes(cleanB.toLowerCase())) return cleanA
    if (cleanB.toLowerCase().includes(cleanA.toLowerCase())) return cleanB
    return `${cleanA}${separator}${cleanB}`
  }

  const description = combine(existing.description, incoming.description, '\n---\n')
  const immediate_action = combine(existing.immediate_action, incoming.immediate_action, ' / ')
  const corrective_action = combine(existing.corrective_action, incoming.corrective_action, ' / ')
  const root_cause = combine(existing.root_cause, incoming.root_cause, ' / ')
  const root_cause_details = combine(
    existing.root_cause_details,
    incoming.root_cause_details,
    ' / ',
  )
  const reinspection_notes = combine(
    existing.reinspection_notes,
    incoming.reinspection_notes,
    ' / ',
  )
  const notes = combine(existing.notes, incoming.notes, '\n')
  const involved_parties = combine(existing.involved_parties, incoming.involved_parties, ', ')
  const part_item = combine(existing.part_item, incoming.part_item, ', ')

  // Eficácia: se alguma das duas foi SIM, prevalece SIM
  let is_effective: 'SIM' | 'NÃO' | 'Pendente' = existing.is_effective
  if (incoming.is_effective === 'SIM' || existing.is_effective === 'SIM') {
    is_effective = 'SIM'
  } else if (incoming.is_effective === 'NÃO' || existing.is_effective === 'NÃO') {
    is_effective = 'NÃO'
  }

  // Recalcular status após acúmulo
  const { status } = determineStatusAndEffectiveness(
    immediate_action,
    corrective_action,
    is_effective,
  )

  return {
    ...existing,
    description,
    immediate_action,
    corrective_action,
    root_cause,
    root_cause_details,
    reinspection_notes,
    notes,
    involved_parties,
    part_item,
    responsible: existing.responsible || incoming.responsible,
    issuer: existing.issuer || incoming.issuer,
    service_order_number: existing.service_order_number || incoming.service_order_number,
    is_effective,
    status,
  }
}

export interface ParseResultFSGQ {
  records: FSGQParsedRecord[]
  summaryByCompanyYear: Array<{
    company_id: string
    company_name: string
    year: number
    count: number
  }>
  totalRecords: number
  mergedCount: number
  ignoredSheets: string[]
  processedSheets: string[]
  duplicateNumbersList: string[]
}

/**
 * Processa planilhas (XLSX com múltiplas abas) no formato FSGQ 8.7-2
 */
export async function parseFSGQSpreadsheet(file: File): Promise<ParseResultFSGQ> {
  const sheets: SheetData[] = await parseXLSXSheets(file)
  return parseFSGQSheetsData(sheets)
}

/**
 * Processa dados brutos de abas (SheetData[]) ou JSON
 */
export function parseFSGQSheetsData(sheets: SheetData[]): ParseResultFSGQ {
  const recordsMap = new Map<string, FSGQParsedRecord>() // chave: `${company_id}::${normalizedNumber}`
  const ignoredSheets: string[] = []
  const processedSheets: string[] = []
  let mergedCount = 0
  const duplicateNumbersList: string[] = []

  for (const sheet of sheets) {
    const sheetMeta = identifyCompanyAndYearFromSheetName(sheet.name)
    if (!sheetMeta) {
      ignoredSheets.push(sheet.name)
      continue
    }

    processedSheets.push(sheet.name)
    const rows = sheet.data
    if (!rows || rows.length < 2) continue

    // Localizar linha de cabeçalho
    let headerRowIdx = -1
    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const rowNorm = rows[r].map(normalizeText)
      const hasNumber = rowNorm.some(
        (c) =>
          c.includes('rnc') || c.includes('numero') || c.includes('n°') || c.includes('codigo'),
      )
      const hasDateOrDesc = rowNorm.some(
        (c) => c.includes('data') || c.includes('descricao') || c.includes('desvio'),
      )
      if (hasNumber && hasDateOrDesc) {
        headerRowIdx = r
        break
      }
    }
    if (headerRowIdx === -1) headerRowIdx = 0

    const colIdx = resolveColumnIndices(rows[headerRowIdx])
    const dataRows = rows.slice(headerRowIdx + 1)

    for (const row of dataRows) {
      if (!row || !row.some((c) => c && String(c).trim())) continue

      const rawNumber = colIdx.colNumber >= 0 ? row[colIdx.colNumber] : row[0]
      if (!rawNumber || !String(rawNumber).trim()) continue

      const originalNumber = String(rawNumber).trim()

      // Pular cabeçalhos repetidos ou linhas de totais
      const numNorm = normalizeText(originalNumber)
      if (
        numNorm === 'numero' ||
        numNorm === 'n rnc' ||
        numNorm === 'rnc' ||
        numNorm === 'total' ||
        numNorm.startsWith('total ')
      ) {
        continue
      }

      const rawDate = colIdx.colDate >= 0 ? row[colIdx.colDate] : ''
      const date = normalizeMixedDate(rawDate, sheetMeta.year)

      const issuer = colIdx.colIssuer >= 0 ? String(row[colIdx.colIssuer] || '').trim() : ''
      const service_order_number = colIdx.colOS >= 0 ? String(row[colIdx.colOS] || '').trim() : ''
      const part_item = colIdx.colPartItem >= 0 ? String(row[colIdx.colPartItem] || '').trim() : ''
      const involved_parties =
        colIdx.colInvolved >= 0 ? String(row[colIdx.colInvolved] || '').trim() : ''
      const rawDesc =
        colIdx.colDescription >= 0 ? String(row[colIdx.colDescription] || '').trim() : ''
      const description =
        rawDesc || `RNC ${originalNumber} - ${part_item || 'Não conformidade registrada'}`
      const responsible =
        colIdx.colResponsible >= 0 ? String(row[colIdx.colResponsible] || '').trim() : ''
      const immediate_action =
        colIdx.colCorrection >= 0 ? String(row[colIdx.colCorrection] || '').trim() : ''
      const reinspection_notes =
        colIdx.colReinspection >= 0 ? String(row[colIdx.colReinspection] || '').trim() : ''
      const root_cause =
        colIdx.colRootCause >= 0 ? String(row[colIdx.colRootCause] || '').trim() : ''
      const root_cause_details =
        colIdx.colRootCauseDetails >= 0 ? String(row[colIdx.colRootCauseDetails] || '').trim() : ''
      const corrective_action =
        colIdx.colCorrectiveAction >= 0 ? String(row[colIdx.colCorrectiveAction] || '').trim() : ''
      const rawEff =
        colIdx.colEffectiveness >= 0 ? String(row[colIdx.colEffectiveness] || '').trim() : ''
      const notes =
        colIdx.colObservations >= 0 ? String(row[colIdx.colObservations] || '').trim() : ''

      const { status, is_effective } = determineStatusAndEffectiveness(
        immediate_action,
        corrective_action,
        rawEff,
      )

      const parsedItem: FSGQParsedRecord = {
        number: originalNumber, // PRESERVAR exatamente como está
        date,
        issuer,
        service_order_number,
        part_item,
        involved_parties,
        description,
        responsible,
        immediate_action,
        reinspection_notes,
        root_cause,
        root_cause_details,
        corrective_action,
        is_effective,
        notes,
        status,
        company_id: sheetMeta.company_id,
        company_name: sheetMeta.company_name,
        year: sheetMeta.year,
        rawSheetName: sheet.name,
      }

      // Chave única para duplicidades na MESMA empresa
      const normNumberKey = originalNumber.toUpperCase().replace(/[^A-Z0-9]/g, '')
      const uniqueKey = `${sheetMeta.company_id}::${normNumberKey}`

      if (recordsMap.has(uniqueKey)) {
        const existing = recordsMap.get(uniqueKey)!
        recordsMap.set(uniqueKey, mergeDuplicateRecords(existing, parsedItem))
        mergedCount++
        if (!duplicateNumbersList.includes(originalNumber)) {
          duplicateNumbersList.push(originalNumber)
        }
      } else {
        recordsMap.set(uniqueKey, parsedItem)
      }
    }
  }

  const records = Array.from(recordsMap.values())

  // Agrupamento de resumo por empresa/ano
  const summaryMap = new Map<
    string,
    { company_id: string; company_name: string; year: number; count: number }
  >()
  for (const r of records) {
    const key = `${r.company_id}_${r.year}`
    const curr = summaryMap.get(key) || {
      company_id: r.company_id,
      company_name: r.company_name,
      year: r.year,
      count: 0,
    }
    curr.count++
    summaryMap.set(key, curr)
  }

  return {
    records,
    summaryByCompanyYear: Array.from(summaryMap.values()),
    totalRecords: records.length,
    mergedCount,
    ignoredSheets,
    processedSheets,
    duplicateNumbersList,
  }
}

/**
 * Processa arquivo JSON enviado pelo usuário
 */
export function parseFSGQJson(jsonString: string): ParseResultFSGQ {
  const parsed = JSON.parse(jsonString)
  // O JSON pode ser um array de registros ou um objeto no formato { sheets: [...] }
  if (Array.isArray(parsed)) {
    // Converte para formato de abas fictícias
    const sheetsMap = new Map<string, string[][]>()
    for (const item of parsed) {
      const sheetName = item.sheetName || item.empresa || item.company || 'PSC 2025'
      const rows = sheetsMap.get(sheetName) || [
        [
          'Nº RNC',
          'Data abertura',
          'Emitente',
          'Nº OS',
          'Peça/Equipamento/Evento',
          'Envolvidos',
          'Descrição da NC',
          'Responsável NC',
          'Correção',
          'Reinspeção',
          'Causa raiz',
          'Detalhes da causa',
          'Ação corretiva/preventiva',
          'Eficaz?',
          'Observações',
        ],
      ]
      rows.push([
        item.number || item.numero || item.rnc || '',
        item.date || item.data || '',
        item.issuer || item.emitente || item.emissor || '',
        item.service_order_number || item.os || item.ordem_servico || '',
        item.part_item || item.peca || item.equipamento || item.item || '',
        item.involved_parties || item.envolvidos || item.setor || '',
        item.description || item.descricao || '',
        item.responsible || item.responsavel || '',
        item.immediate_action || item.correcao || '',
        item.reinspection_notes || item.reinspecao || '',
        item.root_cause || item.causa_raiz || '',
        item.root_cause_details || item.detalhes || '',
        item.corrective_action || item.acao_corretiva || '',
        item.is_effective || item.eficaz || '',
        item.notes || item.observacoes || '',
      ])
      sheetsMap.set(sheetName, rows)
    }

    const sheets: SheetData[] = Array.from(sheetsMap.entries()).map(([name, data]) => ({
      name,
      data,
    }))
    return parseFSGQSheetsData(sheets)
  }

  if (parsed.sheets && Array.isArray(parsed.sheets)) {
    return parseFSGQSheetsData(parsed.sheets)
  }

  throw new Error(
    'Formato JSON não reconhecido. Forneça um array de registros de RNC ou objeto com { sheets: [...] }',
  )
}
