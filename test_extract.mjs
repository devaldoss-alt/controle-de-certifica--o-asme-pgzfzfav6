import fs from 'node:fs'
import zlib from 'node:zlib'

function extractTextFromPdf(filePath) {
  const data = fs.readFileSync(filePath)
  let pos = 0
  const texts = []

  while (pos < data.length) {
    const streamStart = data.indexOf(Buffer.from('stream'), pos)
    if (streamStart === -1) break

    let dataStart = streamStart + 6
    if (data[dataStart] === 0x0d && data[dataStart + 1] === 0x0a) {
      dataStart += 2
    } else if (data[dataStart] === 0x0a || data[dataStart] === 0x0d) {
      dataStart += 1
    }

    const streamEnd = data.indexOf(Buffer.from('endstream'), dataStart)
    if (streamEnd === -1) break

    // Check dictionary before stream
    const dictStart = data.lastIndexOf(Buffer.from('<<'), streamStart)
    const dict = dictStart !== -1 ? data.slice(dictStart, streamStart).toString('binary') : ''

    const rawStream = data.slice(dataStart, streamEnd)
    let decompressed = rawStream

    if (dict.includes('/FlateDecode')) {
      try {
        decompressed = zlib.inflateSync(rawStream)
      } catch (e) {
        // sometimes raw deflate without zlib header
        try {
          decompressed = zlib.inflateRawSync(rawStream)
        } catch (e2) {
          decompressed = null
        }
      }
    }

    if (decompressed) {
      const str = decompressed.toString('latin1')
      // Extract text inside BT ... ET blocks or string literals ( ... ) Tj or TJ
      // Let's grab all strings between parentheses
      const strMatches = []
      // Look for TJ array or Tj string
      // Tj: (string) Tj
      // TJ: [(string) 123 (string)] TJ
      const tjRegex = /\(([^)]*)\)\s*Tj/g
      let m
      while ((m = tjRegex.exec(str)) !== null) {
        strMatches.push(m[1])
      }
      const arrayTjRegex = /\[(.*?)\]\s*TJ/gs
      while ((m = arrayTjRegex.exec(str)) !== null) {
        const innerRegex = /\(([^)]*)\)/g
        let innerM
        let combined = ''
        while ((innerM = innerRegex.exec(m[1])) !== null) {
          combined += innerM[1]
        }
        if (combined) strMatches.push(combined)
      }

      if (strMatches.length > 0) {
        texts.push(strMatches.join(' '))
      }
    }

    pos = streamEnd + 9
  }

  return texts.join('\n\n')
}

const itsgq = extractTextFromPdf(
  'src/assets/itsgq-8.5-7-planejamento-e-controle-de-ordens-de-servico-rev.01-a5364.pdf',
)
fs.writeFileSync('temp_itsgq.txt', itsgq)
console.log('ITSGQ length:', itsgq.length)
