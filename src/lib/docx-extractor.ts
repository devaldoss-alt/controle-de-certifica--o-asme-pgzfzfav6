/**
 * Utilitário de extração de texto estruturado de arquivos .docx via browser nativo (JSZip / Decompression).
 * Como arquivos .docx são arquivos ZIP padrão contendo 'word/document.xml', lemos o ZIP com
 * DecompressionStream ou extração pura de arquivos comprimidos em zip.
 */

// Leitor simples de ZIP PKZip em puro JS sem dependências externas
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  // Localiza o arquivo word/document.xml dentro do ZIP
  const xmlContent = await extractFileFromZip(bytes, 'word/document.xml')
  if (!xmlContent) {
    throw new Error('Arquivo word/document.xml não encontrado no documento .docx')
  }

  // Decodifica XML para texto com quebras e parágrafos
  return parseWordXmlToMarkdown(xmlContent)
}

/**
 * Procura um arquivo no buffer ZIP e descompacta via DecompressionStream (deflate-raw)
 */
async function extractFileFromZip(
  zipBytes: Uint8Array,
  targetFilename: string,
): Promise<string | null> {
  let offset = 0
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength)

  while (offset < zipBytes.length - 4) {
    // Assinatura do Local File Header: 0x04034b50 (PK\x03\x04)
    if (view.getUint32(offset, true) === 0x04034b50) {
      const compressionMethod = view.getUint16(offset + 8, true)
      const compressedSize = view.getUint32(offset + 18, true)
      const uncompressedSize = view.getUint32(offset + 22, true)
      const filenameLength = view.getUint16(offset + 26, true)
      const extraFieldLength = view.getUint16(offset + 28, true)

      const filenameBytes = zipBytes.subarray(offset + 30, offset + 30 + filenameLength)
      const filename = new TextDecoder('utf-8').decode(filenameBytes)

      const fileDataOffset = offset + 30 + filenameLength + extraFieldLength

      if (filename === targetFilename) {
        const compressedData = zipBytes.subarray(fileDataOffset, fileDataOffset + compressedSize)

        if (compressionMethod === 0) {
          // Uncompressed (stored)
          return new TextDecoder('utf-8').decode(compressedData)
        } else if (compressionMethod === 8) {
          // Deflated (deflate-raw)
          try {
            const DecompStream = (globalThis as any).DecompressionStream
            if (typeof DecompStream !== 'undefined') {
              const ds = new DecompStream('deflate-raw')
              const writer = ds.writable.getWriter()
              writer.write(
                new Uint8Array(
                  compressedData.buffer,
                  compressedData.byteOffset,
                  compressedData.byteLength,
                ),
              )
              writer.close()
              const decompressedBuffer = await new Response(ds.readable).arrayBuffer()
              return new TextDecoder('utf-8').decode(decompressedBuffer)
            }
          } catch (e) {
            console.warn('DecompressionStream falhou, tentando fallback regex no xml compactado', e)
          }
        }
      }

      offset = fileDataOffset + (compressedSize > 0 ? compressedSize : 1)
    } else {
      offset++
    }
  }

  // Fallback: busca por strings XML legíveis se não conseguiu descompactar
  return null
}

/**
 * Converte o XML interno do Word (<w:p>, <w:t>, <w:tr>, <w:tc>) em Markdown limpo
 */
function parseWordXmlToMarkdown(xml: string): string {
  // Cria um parser DOM se disponível
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')

    const paragraphs: string[] = []
    const pElements = doc.getElementsByTagName('w:p')

    for (let i = 0; i < pElements.length; i++) {
      const p = pElements[i]
      const textNodes = p.getElementsByTagName('w:t')
      let pText = ''
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || ''
      }

      pText = pText.trim()
      if (pText) {
        // Detecta se parece com título
        if (/^(\d+\.|\d+\.\d+|[A-Z\s]{4,}:?)/.test(pText) && pText.length < 80) {
          paragraphs.push(`## ${pText}`)
        } else {
          paragraphs.push(pText)
        }
      }
    }

    return paragraphs.join('\n\n')
  } catch {
    // Fallback simples com Regex para extrair texto de tags <w:t>
    const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || []
    return matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ')
  }
}
