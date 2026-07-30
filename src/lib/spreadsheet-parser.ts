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

async function parseXLSX(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer()
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

  const sharedStrings: string[] = []
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

  const sheetKey = Object.keys(files).find((k) => k.match(/^xl\/worksheets\/sheet1\.xml$/))
  if (!sheetKey) throw new Error('Planilha não encontrada no arquivo XLSX.')
  const sheetXml = decoder.decode(files[sheetKey])
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
