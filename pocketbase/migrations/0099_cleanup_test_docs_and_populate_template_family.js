// Migration 0099 — Limpeza dos documentos de teste e população do template_family
// Conforme regra do usuário:
// 1. Excluir documentos de teste: "Procedimento de Soldagem WPS-001 para Vaso HP-101" e "Relatório de Inspeção END do Tanque TA-200"
//    (IDs conhecidos: kpkzabhudtno9ca e aq0fegr0iqxb5uf, ou por título/categoria ASME sem prefixo da Lista Mestra).
// 2. Popular template_family dos documentos reais restantes:
//    - Prefixo PSGQ ou MSGQ -> "SGQ — Português (PSGQ/FSGQ/ITSGQ)" (Família A)
//    - Prefixo FSGQ, IT (incluindo IT-CQ e ITSGQ) ou EVS -> "Técnico/CQ — Bilíngue (CDE)" (Família B)
//    - Demais prefixos (PR-CQ, CDE, LP, ASME PSC, ISSGQ, etc.) -> deixar inalterado/vazio
// 3. Idempotência e segurança: nenhuma alteração em títulos, revisões, datas ou permissões.

migrate(
  (app) => {
    var db = app.db()

    // -------------------------------------------------------------
    // 1. IDENTIFICAÇÃO E EXCLUSÃO DOS DOCUMENTOS DE TESTE
    // -------------------------------------------------------------
    var testTitles = [
      'Procedimento de Soldagem WPS-001 para Vaso HP-101',
      'Relatório de Inspeção END do Tanque TA-200',
    ]

    var testIds = ['kpkzabhudtno9ca', 'aq0fegr0iqxb5uf']

    // Busca registros correspondentes
    for (var i = 0; i < testTitles.length; i++) {
      try {
        var recByTitle = app.findFirstRecordByData('documents', 'title', testTitles[i])
        if (recByTitle && testIds.indexOf(recByTitle.id) === -1) {
          testIds.push(recByTitle.id)
        }
      } catch (_) {}
    }

    var deletedCount = 0
    for (var j = 0; j < testIds.length; j++) {
      var docId = testIds[j]
      try {
        // Verificar e limpar quaisquer referências órfãs antes de excluir
        try {
          db.newQuery(
            "DELETE FROM document_reading_sessions WHERE document_id = '" + docId + "'",
          ).execute()
        } catch (_) {}
        try {
          db.newQuery("DELETE FROM quiz_attempts WHERE document_id = '" + docId + "'").execute()
        } catch (_) {}
        try {
          db.newQuery("DELETE FROM document_quizzes WHERE document_id = '" + docId + "'").execute()
        } catch (_) {}

        var docRecord = app.findFirstRecordByData('documents', 'id', docId)
        if (docRecord) {
          app.delete(docRecord)
          deletedCount++
          console.log(
            'Migration 0099: Deleted test document id=' +
              docId +
              ' title="' +
              docRecord.getString('title') +
              '"',
          )
        }
      } catch (err) {
        // Fallback direto via SQL se findFirst falhar
        try {
          db.newQuery("DELETE FROM documents WHERE id = '" + docId + "'").execute()
          deletedCount++
          console.log('Migration 0099: Deleted test document via SQL id=' + docId)
        } catch (sqlErr) {
          console.log('Migration 0099: Notice deleting doc id ' + docId + ': ' + sqlErr)
        }
      }
    }

    // Exclusão de segurança adicional caso exista algum registro com os títulos de teste
    try {
      db.newQuery(
        "DELETE FROM documents WHERE title IN ('Procedimento de Soldagem WPS-001 para Vaso HP-101', 'Relatório de Inspeção END do Tanque TA-200')",
      ).execute()
    } catch (_) {}

    console.log('Migration 0099: Total test documents deleted: ' + deletedCount)

    // -------------------------------------------------------------
    // 2. POPULAÇÃO DO template_family NOS DOCUMENTOS RESTANTES
    // -------------------------------------------------------------
    // Regra verbatim:
    // PSGQ ou MSGQ -> Família A: "SGQ — Português (PSGQ/FSGQ/ITSGQ)"
    // FSGQ, IT (inclui IT-CQ, ITSGQ) ou EVS -> Família B: "Técnico/CQ — Bilíngue (CDE)"
    //
    // Outros prefixos ficam inalterados / vazios.

    var FAMILY_A = 'SGQ — Português (PSGQ/FSGQ/ITSGQ)'
    var FAMILY_B = 'Técnico/CQ — Bilíngue (CDE)'

    var allDocs = []
    try {
      allDocs = app.findRecordsByFilter('documents', "id != ''", 'created', 50000, 0)
    } catch (e) {
      console.log('Migration 0099: Error fetching documents: ' + e)
      return
    }

    var countA = 0
    var countB = 0
    var countEmpty = 0
    var unassignedPrefixes = {}

    for (var k = 0; k < allDocs.length; k++) {
      var doc = allDocs[k]
      var rawPrefix = (doc.getString('prefix') || '').trim().toUpperCase()
      var code = (doc.getString('code') || '').trim().toUpperCase()
      var title = (doc.getString('title') || '').trim().toUpperCase()

      // Identificar prefixo canônico se o campo prefix estiver vazio ou com sufixo (-KS, etc.)
      var normPrefix = rawPrefix
      if (normPrefix.endsWith('-KS')) normPrefix = normPrefix.slice(0, -3).trim()
      if (normPrefix.endsWith('-PSC')) normPrefix = normPrefix.slice(0, -4).trim()

      if (!normPrefix) {
        if (title.startsWith('PSGQ') || code.startsWith('PSGQ')) normPrefix = 'PSGQ'
        else if (title.startsWith('MSGQ') || code.startsWith('MSGQ')) normPrefix = 'MSGQ'
        else if (title.startsWith('FSGQ') || code.startsWith('FSGQ')) normPrefix = 'FSGQ'
        else if (title.startsWith('ITSGQ') || code.startsWith('ITSGQ')) normPrefix = 'ITSGQ'
        else if (title.startsWith('IT-CQ') || code.startsWith('IT-CQ') || title.startsWith('IT CQ'))
          normPrefix = 'IT-CQ'
        else if (title.startsWith('EVS') || code.startsWith('EVS')) normPrefix = 'EVS'
        else if (title.startsWith('PR-CQ') || code.startsWith('PR-CQ') || title.startsWith('PR CQ'))
          normPrefix = 'PR-CQ'
        else if (title.startsWith('CDE') || code.startsWith('CDE')) normPrefix = 'CDE'
        else if (title.startsWith('CQS') || code.startsWith('CQS')) normPrefix = 'CQS'
        else if (title.startsWith('LP') || code.startsWith('LP')) normPrefix = 'LP'
      }

      var targetFamily = null

      // Regra 1: PSGQ ou MSGQ -> A
      if (
        normPrefix === 'PSGQ' ||
        normPrefix === 'MSGQ' ||
        normPrefix.startsWith('PSGQ') ||
        normPrefix.startsWith('MSGQ')
      ) {
        targetFamily = FAMILY_A
      }
      // Regra 2: FSGQ, IT (incluindo IT-CQ e ITSGQ) ou EVS -> B
      else if (
        normPrefix === 'FSGQ' ||
        normPrefix.startsWith('FSGQ') ||
        normPrefix === 'IT' ||
        normPrefix.startsWith('IT') ||
        normPrefix === 'EVS' ||
        normPrefix.startsWith('EVS')
      ) {
        targetFamily = FAMILY_B
      }

      if (targetFamily) {
        doc.set('template_family', targetFamily)
        if (targetFamily === FAMILY_A) countA++
        if (targetFamily === FAMILY_B) countB++
        try {
          app.save(doc)
        } catch (saveErr) {
          console.log(
            'Migration 0099: Error saving template_family for doc id=' + doc.id + ': ' + saveErr,
          )
        }
      } else {
        countEmpty++
        var pKey = normPrefix || '(SEM PREFIXO)'
        unassignedPrefixes[pKey] = (unassignedPrefixes[pKey] || 0) + 1
      }
    }

    console.log('Migration 0099 Summary:')
    console.log('- Total documents processed: ' + allDocs.length)
    console.log('- Family A (PSGQ/MSGQ): ' + countA)
    console.log('- Family B (FSGQ/IT/EVS): ' + countB)
    console.log('- Unassigned / Empty: ' + countEmpty)
    console.log('- Unassigned prefixes breakdown: ' + JSON.stringify(unassignedPrefixes))
  },
  (app) => {
    // Revert opcional: não re-insere dados de teste de forma intencional
  },
)
