import fs from 'fs'

const buf = fs.readFileSync(
  'src/assets/itsgq-8.5-7-planejamento-e-controle-de-ordens-de-servico-rev.01-a5364.pdf',
)
const text = buf.toString('binary')
const hasFlate = text.includes('/FlateDecode')
const streamCount = (text.match(/stream[\r\n]/g) || []).length
const fontMatches = text.match(/\/BaseFont\s*\/([^\s\/>]+)/g) || []
fs.writeFileSync(
  'output-info.txt',
  `ITSGQ 8.5-7 size: ${buf.length}, streams: ${streamCount}, fonts: ${fontMatches.join(', ')}`,
)
if (fontMatches.length === 0) {
  process.exit(1)
}
