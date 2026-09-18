migrate(
  (app) => {
    // Remoção dos 9 registros inválidos criados acidentalmente pelo parser na collection non_conformities
    if (app.hasTable('non_conformities')) {
      const invalidIds = [
        'as8955rwa8c86po', // Data de Abertura:
        'mjf9m4zyo95lcxa', // 45684 (com resumo de pessoas/compras)
        'xsbhfb8xhgicha0', // CUSTO DA NÃO QUALIDADE
        '9tqkfq6bco2yqm2', // MP: R$
        '6pkg3ra281fndod', // Insumos: R$
        '151k9k10w8eeuvd', // Serviços: R$
        'fp1sbcz0dfzcrqm', // TOTAL: R$
        'nes6mzkk82o8fce', // ( ) Preparação de Máquina
        'l4c3abf14tfaswb', // TOTAL: R$ 00
      ]

      for (let i = 0; i < invalidIds.length; i++) {
        try {
          const record = app.findRecordById('non_conformities', invalidIds[i])
          app.delete(record)
        } catch (_) {}
      }

      // Limpeza defensiva caso existam outros registros com rótulos de template na coluna number
      const labelKeywords = [
        'TOTAL: R$',
        'MP: R$',
        'Serviços: R$',
        'Insumos: R$',
        'Data de Abertura:',
        'CUSTO DA NÃO QUALIDADE',
        '( ) Preparação de Máquina',
      ]

      for (let j = 0; j < labelKeywords.length; j++) {
        try {
          const records = app.findRecordsByFilter(
            'non_conformities',
            `number ~ '${labelKeywords[j]}'`,
            '',
            100,
            0,
          )
          for (let k = 0; k < records.length; k++) {
            app.delete(records[k])
          }
        } catch (_) {}
      }
    }
  },
  (app) => {
    // Reversão não é necessária para registros inválidos excluídos
  },
)
