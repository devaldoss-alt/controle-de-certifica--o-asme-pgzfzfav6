routerAdd('GET', '/backend/extract-mcq-meta', (e) => {
  try {
    const fs = require('fs')
    // Check if file exists or list src/assets
    const res = {}
    const dir = $os.getenv('PWD') || '.'
    res.pwd = dir

    // Check if $documents is available
    res.hasDocuments = typeof $documents !== 'undefined'

    // Let's see if we can read the file
    const path = 'src/assets/mcq-psc-asme-edicao-1-rev00-19.12.2025armando-6994f.pdf'

    // In Goja / PocketBase, how can we access files?
    // Let's test $documents.toMarkdown if possible
    // Note: $documents.toMarkdown expects { file: ... } or { record: ..., field: ... }

    return e.json(200, res)
  } catch (err) {
    return e.json(500, { error: err.message, stack: err.stack })
  }
})
