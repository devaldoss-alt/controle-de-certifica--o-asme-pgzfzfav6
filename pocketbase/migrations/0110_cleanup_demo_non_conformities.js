migrate(
  (app) => {
    // Limpeza dos 6 registros de demonstração da collection non_conformities
    if (app.hasTable('non_conformities')) {
      const demoIds = [
        'odu240o9mgewjwx', // RNC-001/2024
        'kkov52g9iuoxdpy', // RNC-002/2024
        '522mfzzbox2kzrr', // RNC-003/2024
        'ssoncyme2mx59jm', // RNC-004/2024
        '19qds5id7hql7ho', // RNC 015-26
        '2ayuzs0hkpz19ua', // RNC-018/2026
      ]

      for (let i = 0; i < demoIds.length; i++) {
        try {
          const record = app.findRecordById('non_conformities', demoIds[i])
          app.delete(record)
        } catch (_) {}
      }

      // Garantir remoção adicional caso existam registros com números de demonstração conhecidos
      const demoNumbers = [
        'RNC-001/2024',
        'RNC-002/2024',
        'RNC-003/2024',
        'RNC-004/2024',
        'RNC 015-26',
        'RNC-018/2026',
        'RNC-021/2026',
      ]

      for (let j = 0; j < demoNumbers.length; j++) {
        try {
          const records = app.findRecordsByFilter(
            'non_conformities',
            `number = '${demoNumbers[j]}'`,
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
    // Reversão não é necessária para dados de teste/demonstração removidos
  },
)
