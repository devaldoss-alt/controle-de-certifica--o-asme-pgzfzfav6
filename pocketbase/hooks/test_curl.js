// Test /bin tools
onRecordAfterCreateSuccess((e) => {
  try {
    let binTools = []
    const checkTools = ['unzip', 'zip', 'tar', 'gzip', 'busybox', 'sh', 'ash']
    for (let t of checkTools) {
      try {
        const stat = $os.stat('/bin/' + t)
        if (stat) binTools.push(t)
      } catch (_) {}
    }
    // Test busybox unzip
    let bb = ''
    try {
      const c = $os.cmd('/bin/busybox', 'unzip', '--help')
      bb = String.fromCharCode.apply(null, c.output().slice(0, 80))
    } catch (err2) {
      bb = 'bb err: ' + err2.message
    }
    e.record.set('notes', 'binTools: ' + binTools.join(',') + ' | bb: ' + bb)
    $app.save(e.record)
  } catch (err) {
    e.record.set('notes', 'ERROR: ' + (err && err.message))
    $app.save(e.record)
  }
}, 'document_reading_sessions')
