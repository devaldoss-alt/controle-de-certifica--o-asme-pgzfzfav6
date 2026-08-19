export async function parseSpreadsheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await file.text()
    return parseCSV(text)
  }
  if (name.endsWith('.xlsx')) {
    return parseXLSX(file)
  }
  throw new Error('Formato não suportado. Use CSV ou XLSX.')
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          currentField += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        currentField += char
        i++
      }
    } else {
      if (char === '"') {
        inQuotes = true
        i++
      } else if (char === ',' || char === ';') {
        currentRow.push(currentField.trim())
        currentField = ''
        i++
      } else if (char === '\n') {
        currentRow.push(currentField.trim())
        rows.push(currentRow)
        currentRow = []
        currentField = ''
        i++
      } else if (char === '\r') {
        i++
      } else {
        currentField += char
        i++
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    rows.push(currentRow)
  }
  return rows.filter((r) => r.some((c) => c.length > 0))
}

function colLettersToIndex(letters: string): number {
  let result = 0
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64)
  }
  return result - 1
}

/* ------------------------------------------------------------------ */
/* XLSX (Office Open XML) parsing                                      */
/* ------------------------------------------------------------------ */

const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

async function unzipXlsx(buffer: ArrayBuffer): Promise<Record<string, Uint8Array>> {
  const view = new DataView(buffer)
  const decoder = new TextDecoder()
  const files: Record<string, Uint8Array> = {}
  let offset = 0

  while (offset < buffer.byteLength - 4) {
    const sig = view.getUint32(offset, true)
    if (sig !== 0x04034b50) {
      offset++
      continue
    }
    const compressionMethod = view.getUint16(offset + 8, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const fileNameLength = view.getUint16(offset + 26, true)
    const extraFieldLength = view.getUint16(offset + 28, true)
    const fileName = decoder.decode(new Uint8Array(buffer, offset + 30, fileNameLength))
    const dataOffset = offset + 30 + fileNameLength + extraFieldLength
    const compressedData = new Uint8Array(buffer, dataOffset, compressedSize)

    if (compressionMethod === 0) {
      files[fileName] = new Uint8Array(compressedData)
    } else if (compressionMethod === 8) {
      try {
        const blob = new Blob([compressedData])
        const ds = new DecompressionStream('deflate-raw')
        const stream = blob.stream().pipeThrough(ds)
        const decompressed = await new Response(stream).arrayBuffer()
        files[fileName] = new Uint8Array(decompressed)
      } catch {
        offset = dataOffset + compressedSize
        continue
      }
    }
    offset = dataOffset + compressedSize
  }
  return files
}

function readSharedStrings(files: Record<string, Uint8Array>): string[] {
  const sharedStrings: string[] = []
  const decoder = new TextDecoder()
  const ssKey = Object.keys(files).find((k) => k.includes('sharedStrings'))
  if (ssKey) {
    const xml = decoder.decode(files[ssKey])
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const sis = doc.getElementsByTagName('si')
    for (let i = 0; i < sis.length; i++) {
      const ts = sis[i].getElementsByTagName('t')
      let text = ''
      for (let j = 0; j < ts.length; j++) text += ts[j].textContent || ''
      sharedStrings.push(text)
    }
  }
  return sharedStrings
}

function parseWorksheetXml(sheetXml: string, sharedStrings: string[]): string[][] {
  const sheetDoc = new DOMParser().parseFromString(sheetXml, 'text/xml')
  const rowsEl = sheetDoc.getElementsByTagName('row')
  const result: string[][] = []

  for (let i = 0; i < rowsEl.length; i++) {
    const cells = rowsEl[i].getElementsByTagName('c')
    const cellMap: Record<number, string> = {}
    let maxCol = -1

    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j]
      const ref = cell.getAttribute('r') || ''
      const colLetters = ref.match(/^[A-Z]+/)
      if (!colLetters) continue
      const colIdx = colLettersToIndex(colLetters[0])
      const type = cell.getAttribute('t')
      const vElem = cell.getElementsByTagName('v')[0]
      const isElem = cell.getElementsByTagName('is')[0]
      let value = ''

      if (type === 's' && vElem) {
        value = sharedStrings[parseInt(vElem.textContent || '0', 10)] || ''
      } else if (type === 'inlineStr' && isElem) {
        const ts = isElem.getElementsByTagName('t')
        for (let k = 0; k < ts.length; k++) value += ts[k].textContent || ''
      } else if (vElem) {
        value = vElem.textContent || ''
      }
      cellMap[colIdx] = value
      if (colIdx > maxCol) maxCol = colIdx
    }

    const rowData: string[] = []
    for (let c = 0; c <= maxCol; c++) rowData.push(cellMap[c] || '')
    if (rowData.some((v) => v.length > 0)) result.push(rowData)
  }
  return result
}

async function parseXLSX(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer()
  const files = await unzipXlsx(buffer)
  const sharedStrings = readSharedStrings(files)
  const decoder = new TextDecoder()

  const sheetKey = Object.keys(files).find((k) => k.match(/^xl\/worksheets\/sheet1\.xml$/))
  if (!sheetKey) throw new Error('Planilha não encontrada no arquivo XLSX.')
  const sheetXml = decoder.decode(files[sheetKey])
  return parseWorksheetXml(sheetXml, sharedStrings)
}

/* ------------------------------------------------------------------ */
/* Multi-sheet parsing (used by the team/collaborator importer)        */
/* ------------------------------------------------------------------ */

export interface SheetData {
  name: string
  data: string[][]
}

function getRelationId(el: Element): string {
  return el.getAttribute('r:id') || el.getAttributeNS(REL_NS, 'id') || el.getAttribute('id') || ''
}

function resolveSheetKey(target: string, files: Record<string, Uint8Array>): string {
  if (!target) return ''
  const t = target.replace(/\\/g, '/').replace(/^\/+/, '')
  const candidates = [
    t,
    t.startsWith('xl/') ? t : `xl/${t}`,
    t.replace(/^xl\//, ''),
    t.replace(/^worksheets\//, 'xl/worksheets/'),
  ]
  for (const c of candidates) {
    if (files[c]) return c
  }
  return ''
}

export async function parseXLSXSheets(file: File): Promise<SheetData[]> {
  const buffer = await file.arrayBuffer()
  const files = await unzipXlsx(buffer)
  const sharedStrings = readSharedStrings(files)
  const decoder = new TextDecoder()

  const resolved: { name: string; fileKey: string }[] = []

  const wbKey = Object.keys(files).find((k) => k === 'xl/workbook.xml')
  if (wbKey) {
    const wbXml = decoder.decode(files[wbKey])
    const wbDoc = new DOMParser().parseFromString(wbXml, 'text/xml')
    const sheetEls = wbDoc.getElementsByTagName('sheet')

    const relsMap: Record<string, string> = {}
    const relsKey = Object.keys(files).find((k) => k === 'xl/_rels/workbook.xml.rels')
    if (relsKey) {
      const relsXml = decoder.decode(files[relsKey])
      const relsDoc = new DOMParser().parseFromString(relsXml, 'text/xml')
      const relEls = relsDoc.getElementsByTagName('Relationship')
      for (let i = 0; i < relEls.length; i++) {
        const id = relEls[i].getAttribute('Id') || ''
        const target = relEls[i].getAttribute('Target') || ''
        if (id && target) relsMap[id] = target
      }
    }

    for (let i = 0; i < sheetEls.length; i++) {
      const name = sheetEls[i].getAttribute('name') || `Aba ${i + 1}`
      const rid = getRelationId(sheetEls[i])
      const target = relsMap[rid] || ''
      let fileKey = resolveSheetKey(target, files)
      if (!fileKey) {
        // Positional fallback: workbook sheet[i] usually maps to sheet(i+1).xml
        const guess = `xl/worksheets/sheet${i + 1}.xml`
        if (files[guess]) fileKey = guess
      }
      if (fileKey) resolved.push({ name, fileKey })
    }
  }

  // Fallback: no workbook.xml or nothing resolved — scan worksheet files in order
  if (resolved.length === 0) {
    const sheetFiles = Object.keys(files)
      .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
      .sort((a, b) => {
        const na = parseInt(a.match(/sheet(\d+)\.xml$/)?.[1] || '0', 10)
        const nb = parseInt(b.match(/sheet(\d+)\.xml$/)?.[1] || '0', 10)
        return na - nb
      })
    for (let i = 0; i < sheetFiles.length; i++) {
      resolved.push({ name: `Aba ${i + 1}`, fileKey: sheetFiles[i] })
    }
  }

  if (resolved.length === 0) {
    const sheetKey = Object.keys(files).find((k) => k.match(/^xl\/worksheets\/sheet1\.xml$/))
    if (!sheetKey) throw new Error('Planilha não encontrada no arquivo XLSX.')
    resolved.push({ name: 'Aba 1', fileKey: sheetKey })
  }

  const result: SheetData[] = []
  for (const s of resolved) {
    try {
      const xml = decoder.decode(files[s.fileKey])
      const data = parseWorksheetXml(xml, sharedStrings)
      result.push({ name: s.name, data })
    } catch {
      // skip unreadable sheet
    }
  }
  if (result.length === 0) {
    throw new Error('Nenhuma aba legível encontrada no arquivo XLSX.')
  }
  return result
}

export async function parseSpreadsheetSheets(file: File): Promise<SheetData[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await file.text()
    return [{ name: 'CSV', data: parseCSV(text) }]
  }
  if (name.endsWith('.xlsx')) {
    return parseXLSXSheets(file)
  }
  throw new Error('Formato não suportado. Use CSV ou XLSX.')
}

/* ------------------------------------------------------------------ */
/* People-sheet detection (for the collaborator importer)              */
/* ------------------------------------------------------------------ */

// Headers typical of a people/collaborator sheet
const PEOPLE_HEADER_KEYWORDS = [
  'nome',
  'colaborador',
  'colaboradores',
  'funcionario',
  'funcionarios',
  'pessoa',
  'pessoas',
  'empresa',
  'departamento',
  'cargo',
  'funcao',
  'setor',
  'area',
  'matricula',
  'cpf',
  'rg',
  'admissao',
  'telefone',
  'email',
  'endereco',
  'contato',
]

// Headers typical of a packing-slip / materials sheet — such sheets must be ignored
const MATERIAL_HEADER_KEYWORDS = [
  'objeto',
  'quantidade',
  'feixe tubular',
  'feixe',
  'material',
  'romaneio',
  'codigo',
  'unidade',
  'peso',
  'bitola',
  'diametro',
  'desenho',
  'fornecedor',
  'item',
]

export interface PeopleSheetScore {
  headerIdx: number
  peopleScore: number
  materialScore: number
  qualifies: boolean
}

export function scoreSheetForPeople(data: string[][], maxScan = 20): PeopleSheetScore {
  const limit = Math.min(data.length, maxScan)
  let best = { headerIdx: 0, peopleScore: 0, materialScore: 0 }

  for (let i = 0; i < limit; i++) {
    const cells = data[i].map(normalizeText)
    let p = 0
    let m = 0
    for (const cell of cells) {
      if (!cell) continue
      if (PEOPLE_HEADER_KEYWORDS.some((kw) => cell === kw || (kw.length >= 3 && cell.includes(kw))))
        p++
      if (
        MATERIAL_HEADER_KEYWORDS.some((kw) => cell === kw || (kw.length >= 3 && cell.includes(kw)))
      )
        m++
    }
    const better = p > best.peopleScore || (p === best.peopleScore && m < best.materialScore)
    if (i === 0 || better) {
      best = { headerIdx: i, peopleScore: p, materialScore: m }
    }
  }

  const qualifies = best.peopleScore >= 2 && best.peopleScore > best.materialScore
  return { ...best, qualifies }
}

const SHEET_NAME_KEYWORDS = [
  'funcionario',
  'funcionarios',
  'colaborador',
  'colaboradores',
  'pessoa',
  'pessoas',
  'pessoal',
  'rh',
  'team',
  'equipe',
]

export function findPeopleSheet(
  sheets: SheetData[],
): { sheet: SheetData; score: PeopleSheetScore } | null {
  let best: { sheet: SheetData; score: PeopleSheetScore; rank: number } | null = null
  for (const sheet of sheets) {
    const score = scoreSheetForPeople(sheet.data)
    if (!score.qualifies) continue
    const nameNorm = normalizeText(sheet.name)
    const nameBonus = SHEET_NAME_KEYWORDS.some((kw) => nameNorm.includes(kw)) ? 2 : 0
    const rank = score.peopleScore - score.materialScore + nameBonus
    if (!best || rank > best.rank) {
      best = { sheet, score, rank }
    }
  }
  return best ? { sheet: best.sheet, score: best.score } : null
}

/* ------------------------------------------------------------------ */
/* Date / text helpers                                                 */
/* ------------------------------------------------------------------ */

export function normalizeDate(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) return trimmed
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return null
}

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const KNOWN_HEADER_KEYWORDS = [
  'tipo',
  'codigo',
  'identificacao',
  'revisao',
  'status',
  'documento que se aplica',
  'setor',
  'data de aprovacao',
  'prazo de revisao',
  'observacao',
]

export function findHeaderRow(rows: string[][], maxScan = 20): number {
  for (let i = 0; i < Math.min(rows.length, maxScan); i++) {
    const normalizedCells = rows[i].map(normalizeText)
    const matchCount = normalizedCells.filter(
      (cell) => cell.length > 0 && KNOWN_HEADER_KEYWORDS.some((h) => cell.includes(h)),
    ).length
    if (matchCount >= 2) return i
  }
  return 0
}
