/**
 * Utilitários para conversão bidirecional Markdown <-> HTML e limpeza de estilos Word/Office
 */

/**
 * Limpa estilos e tags do Word/Office mantendo a estrutura semântica:
 * títulos (h1, h2, h3), parágrafos, listas (ul, ol, li), tabelas (table, tr, td, th), negrito (b, strong) e itálico (i, em).
 */
export function cleanWordHtml(rawHtml: string): string {
  if (!rawHtml) return ''

  let html = rawHtml

  // Remove comentários condicionais do Office (<!--[if ...]>...<![endif]-->)
  html = html.replace(/<!--[\s\S]*?-->/gi, '')

  // Remove blocos de estilo e scripts
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '')
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  html = html.replace(/<xml[\s\S]*?<\/xml>/gi, '')
  html = html.replace(/<meta[\s\S]*?>/gi, '')
  html = html.replace(/<link[\s\S]*?>/gi, '')

  // Remove tags com namespace Office (o:p, w:*, etc)
  html = html.replace(/<\/?\w+:[^>]*>/gi, '')

  // Remove atributos comuns do Word/Office
  html = html.replace(/\s*(class|style|lang|id|v:shapes|color|face|size)="[^"]*"/gi, '')
  html = html.replace(/\s*(class|style|lang|id|v:shapes|color|face|size)='[^']*'/gi, '')

  // Limpa spans vazios ou supérfluos
  html = html.replace(/<span>(.*?)<\/span>/gi, '$1')
  html = html.replace(/<font[^>]*>(.*?)<\/font>/gi, '$1')

  // Remove divs supérfluas substituindo por parágrafos
  html = html.replace(/<div[^>]*>(.*?)<\/div>/gi, '<p>$1</p>')

  // Normaliza tags de negrito e itálico
  html = html.replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>')
  html = html.replace(/<i>/gi, '<em>').replace(/<\/i>/gi, '</em>')

  // Remove parágrafos vazios repetidos
  html = html.replace(/<p>(&nbsp;|\s)*<\/p>/gi, '')

  return html.trim()
}

/**
 * Converte Markdown puro para HTML limpo
 */
export function markdownToHtml(md: string): string {
  if (!md) return ''

  const lines = md.split(/\r?\n/)
  const result: string[] = []

  let inList = false
  let listType: 'ul' | 'ol' = 'ul'
  let inTable = false
  let tableHeaderParsed = false

  const closeListIfOpen = () => {
    if (inList) {
      result.push(listType === 'ul' ? '</ul>' : '</ol>')
      inList = false
    }
  }

  const closeTableIfOpen = () => {
    if (inTable) {
      result.push('</tbody></table>')
      inTable = false
      tableHeaderParsed = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Linha vazia
    if (!trimmed) {
      closeListIfOpen()
      closeTableIfOpen()
      continue
    }

    // Tabela Markdown (| Col 1 | Col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeListIfOpen()

      // Linha separadora (|---|---|)
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        continue
      }

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => formatInline(c.trim()))

      if (!inTable) {
        inTable = true
        tableHeaderParsed = true
        result.push('<table border="1"><thead><tr>')
        cells.forEach((cell) => result.push(`<th>${cell}</th>`))
        result.push('</tr></thead><tbody>')
      } else {
        result.push('<tr>')
        cells.forEach((cell) => result.push(`<td>${cell}</td>`))
        result.push('</tr>')
      }
      continue
    } else {
      closeTableIfOpen()
    }

    // Títulos H1..H4
    if (trimmed.startsWith('#### ')) {
      closeListIfOpen()
      result.push(`<h4>${formatInline(trimmed.slice(5))}</h4>`)
      continue
    }
    if (trimmed.startsWith('### ')) {
      closeListIfOpen()
      result.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`)
      continue
    }
    if (trimmed.startsWith('## ')) {
      closeListIfOpen()
      result.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`)
      continue
    }
    if (trimmed.startsWith('# ')) {
      closeListIfOpen()
      result.push(`<h1>${formatInline(trimmed.slice(2))}</h1>`)
      continue
    }

    // Listas desordenadas (- ou * ou •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (bulletMatch) {
      if (!inList || listType !== 'ul') {
        closeListIfOpen()
        inList = true
        listType = 'ul'
        result.push('<ul>')
      }
      result.push(`<li>${formatInline(bulletMatch[1])}</li>`)
      continue
    }

    // Listas ordenadas (1. ou 1) ou a) ou a.)
    const orderedMatch = trimmed.match(/^(\d+|[a-zA-Z])[.)]\s+(.*)$/)
    if (orderedMatch) {
      if (!inList || listType !== 'ol') {
        closeListIfOpen()
        inList = true
        listType = 'ol'
        result.push('<ol>')
      }
      result.push(`<li>${formatInline(orderedMatch[2])}</li>`)
      continue
    }

    // Fechar lista se era texto comum
    closeListIfOpen()

    // Parágrafo comum
    result.push(`<p>${formatInline(trimmed)}</p>`)
  }

  closeListIfOpen()
  closeTableIfOpen()

  return result.join('\n')
}

/**
 * Formata tags inline de Markdown: **bold**, *italic*, `code`, [link](url)
 */
function formatInline(text: string): string {
  let res = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Negrito e itálico combinados ***texto***
  res = res.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
  // Negrito **texto** ou __texto__
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  res = res.replace(/__(.*?)__/g, '<strong>$1</strong>')
  // Itálico *texto* ou _texto_
  res = res.replace(/\*(.*?)\*/g, '<em>$1</em>')
  res = res.replace(/_([^_]+)_/g, '<em>$1</em>')
  // Código `texto`
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Links [label](url)
  res = res.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  )

  return res
}

/**
 * Converte HTML para Markdown puro (útil ao alternar de Visual -> Markdown)
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''

  let text = html

  // Remove scripts e styles
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '')

  // Títulos
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n# $1\n\n')
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n## $1\n\n')
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n### $1\n\n')
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n\n#### $1\n\n')

  // Negrito e itálico
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

  // Listas
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, '\n')

  // Parágrafos e quebras
  text = text.replace(/<br\s*[/]?>/gi, '\n')
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

  // Tabelas simples
  text = text.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (tableHtml: string) => {
    const rows: string[] = []
    const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []
    rowMatches.forEach((rowHtml: string, rIdx: number) => {
      const cells = (rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []).map((c: string) =>
        c.replace(/<[^>]+>/g, '').trim(),
      )
      if (cells.length > 0) {
        rows.push('| ' + cells.join(' | ') + ' |')
        if (rIdx === 0) {
          rows.push('| ' + cells.map(() => '---').join(' | ') + ' |')
        }
      }
    })
    return '\n\n' + rows.join('\n') + '\n\n'
  })

  // Limpa quaisquer outras tags residuais
  text = text.replace(/<[^>]+>/g, '')

  // Decodifica entidades comuns
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')

  // Normaliza quebras de linha múltiplas
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}
