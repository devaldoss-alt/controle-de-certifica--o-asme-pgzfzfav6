migrate(
  (app) => {
    var interCol = app.findCollectionByNameOrId('interactions')
    if (!interCol.fields.getByName('mcq_ref')) {
      interCol.fields.add(new TextField({ name: 'mcq_ref' }))
    }
    app.save(interCol)

    app.truncateCollection(app.findCollectionByNameOrId('checklists'))
    app.truncateCollection(app.findCollectionByNameOrId('interactions'))

    var checkCol = app.findCollectionByNameOrId('checklists')
    var now = new Date()

    function daysFromNow(days) {
      var d = new Date(now)
      d.setDate(d.getDate() + days)
      return d.toISOString().replace('T', ' ')
    }

    var items = [
      {
        title: 'Assinei a Declaração de Política e Autoridade do MCQ?',
        role: 'Director',
        ref: 'Prefácio II',
        critical: true,
        status: 'pending',
        due: 20,
      },
      {
        title: 'O SCQ está implementado e mantido ativamente?',
        role: 'Director',
        ref: 'Prefácio II',
        critical: true,
        status: 'completed',
        due: 20,
      },
      {
        title: 'Recursos suficientes foram alocados para manutenção da certificação ASME/NBIC?',
        role: 'Director',
        ref: 'Seção 2.1',
        critical: true,
        status: 'pending',
        due: 15,
      },
      {
        title: 'Revisões gerenciais do sistema de qualidade são conduzidas periodicamente?',
        role: 'Director',
        ref: 'Seção 2.3',
        critical: false,
        status: 'pending',
        due: 30,
      },
      {
        title: 'A autoridade para interromper trabalhos não conformes foi claramente delegada?',
        role: 'Director',
        ref: 'Prefácio II',
        critical: true,
        status: 'pending',
        due: 15,
      },
      {
        title: 'As responsabilidades de cada função estão documentadas e comunicadas?',
        role: 'Director',
        ref: 'Seção 2.2',
        critical: false,
        status: 'completed',
        due: 20,
      },

      {
        title: 'O Manual de Controle de Qualidade está atualizado e aprovado?',
        role: 'QCC',
        ref: 'Seção 1.1',
        critical: true,
        status: 'pending',
        due: 10,
      },
      {
        title: 'Revisões obsoletas do MCQ foram retiradas de circulação?',
        role: 'QCC',
        ref: 'Seção 1.1',
        critical: false,
        status: 'pending',
        due: 5,
      },
      {
        title: 'Cálculos de projeto foram revisados e aprovados?',
        role: 'QCC',
        ref: 'Seção 4.1',
        critical: true,
        status: 'pending',
        due: 8,
      },
      {
        title: 'Auditorias internas são conduzidas conforme calendário estabelecido?',
        role: 'QCC',
        ref: 'Seção 15.5',
        critical: true,
        status: 'pending',
        due: 12,
      },
      {
        title: 'Registros de qualidade estão organizados e acessíveis?',
        role: 'QCC',
        ref: 'Seção 14.1',
        critical: false,
        status: 'completed',
        due: 10,
      },
      {
        title: 'ITPs foram distribuídos aos responsáveis?',
        role: 'QCC',
        ref: 'Seção 6.1',
        critical: true,
        status: 'pending',
        due: 4,
      },
      {
        title: 'Pontos de espera (Hold Points) estão coordenados com o AI?',
        role: 'QCC',
        ref: 'Seção 6.1',
        critical: true,
        status: 'pending',
        due: 4,
      },
      {
        title: 'Não-conformidades identificadas foram registradas e tratadas?',
        role: 'QCC',
        ref: 'Seção 15.4',
        critical: true,
        status: 'pending',
        due: -2,
      },

      {
        title: 'O Plano de Inspeção e Teste (ITP) foi preparado?',
        role: 'Inspector',
        ref: 'Seção 6.1',
        critical: true,
        status: 'pending',
        due: 5,
      },
      {
        title: 'Inspeções realizadas estão documentadas?',
        role: 'Inspector',
        ref: 'Seção 6.2',
        critical: true,
        status: 'pending',
        due: 7,
      },
      {
        title: 'Conformidade com WPS foi verificada durante a inspeção?',
        role: 'Inspector',
        ref: 'Seção 8.5',
        critical: true,
        status: 'completed',
        due: 7,
      },
      {
        title: 'Materiais recebidos foram inspecionados e aceitos/rejeitados?',
        role: 'Inspector',
        ref: 'Seção 5.1',
        critical: true,
        status: 'pending',
        due: 3,
      },
      {
        title: 'Testes foram presenciados e documentados?',
        role: 'Inspector',
        ref: 'Seção 6.3',
        critical: false,
        status: 'pending',
        due: 10,
      },
      {
        title: 'Hold Points foram solicitados ao AI com antecedência?',
        role: 'Inspector',
        ref: 'Seção 6.1',
        critical: true,
        status: 'pending',
        due: 4,
      },
      {
        title: 'Registros de inspeção estão completos e assinados?',
        role: 'Inspector',
        ref: 'Seção 6.2',
        critical: false,
        status: 'pending',
        due: 8,
      },

      {
        title: 'Verificação independente de conformidade foi executada?',
        role: 'AI',
        ref: 'Seção 6.4',
        critical: true,
        status: 'pending',
        due: 12,
      },
      {
        title: 'Hold Points foram testemunhados e documentados no ITP?',
        role: 'AI',
        ref: 'Seção 6.1',
        critical: true,
        status: 'pending',
        due: 6,
      },
      {
        title: 'MDeR foi revisado para certificação?',
        role: 'AI',
        ref: 'Seção 12.1',
        critical: true,
        status: 'pending',
        due: 15,
      },
      {
        title: 'Qualificações de soldadores foram verificadas?',
        role: 'AI',
        ref: 'Seção 8.4',
        critical: false,
        status: 'pending',
        due: 10,
      },
      {
        title: 'Não-conformidades identificadas foram reportadas ao QCC?',
        role: 'AI',
        ref: 'Seção 15.4',
        critical: true,
        status: 'pending',
        due: 5,
      },
      {
        title: 'Conformidade com código ASME foi confirmada?',
        role: 'AI',
        ref: 'Seção 6.4',
        critical: true,
        status: 'completed',
        due: 12,
      },

      {
        title: 'Cálculos de projeto (Div 1) foram preparados?',
        role: 'Designer',
        ref: 'Seção 4.1',
        critical: true,
        status: 'pending',
        due: 10,
      },
      {
        title: 'Materiais foram selecionados conforme ASME Section II?',
        role: 'Designer',
        ref: 'Seção 5.1',
        critical: true,
        status: 'pending',
        due: 8,
      },
      {
        title: 'Registros de projeto estão mantidos e atualizados?',
        role: 'Designer',
        ref: 'Seção 4.2',
        critical: false,
        status: 'completed',
        due: 10,
      },
      {
        title: 'Aprovação de projeto dentro do escopo foi obtida?',
        role: 'Designer',
        ref: 'Seção 4.3',
        critical: true,
        status: 'pending',
        due: 6,
      },
      {
        title: 'Desenhos de fabricação estão disponíveis e aprovados?',
        role: 'Designer',
        ref: 'Seção 4.2',
        critical: false,
        status: 'pending',
        due: 7,
      },
      {
        title: 'Especificações de soldagem foram preparadas?',
        role: 'Designer',
        ref: 'Seção 8.2',
        critical: true,
        status: 'pending',
        due: 9,
      },

      {
        title: 'Cálculos de engenharia (Div 2) foram preparados?',
        role: 'Engineer',
        ref: 'Seção 4.1',
        critical: true,
        status: 'pending',
        due: 10,
      },
      {
        title: 'MDeR (Manufacturer Design Report) foi preparado?',
        role: 'Engineer',
        ref: 'Seção 4.5',
        critical: true,
        status: 'pending',
        due: 8,
      },
      {
        title: 'Conformidade de projeto foi verificada?',
        role: 'Engineer',
        ref: 'Seção 4.3',
        critical: true,
        status: 'pending',
        due: 7,
      },
      {
        title: 'Análise de tensões foi documentada?',
        role: 'Engineer',
        ref: 'Seção 4.4',
        critical: false,
        status: 'pending',
        due: 12,
      },
      {
        title: 'Revisão de engenharia foi concluída e aprovada?',
        role: 'Engineer',
        ref: 'Seção 4.3',
        critical: true,
        status: 'completed',
        due: 10,
      },
      {
        title: 'MDeR foi submetido ao Engenheiro Certificador?',
        role: 'Engineer',
        ref: 'Seção 4.5',
        critical: true,
        status: 'pending',
        due: 5,
      },

      {
        title: 'MDeR foi revisado e certificado?',
        role: 'CertifyingEngineer',
        ref: 'Seção 4.5',
        critical: true,
        status: 'pending',
        due: 6,
      },
      {
        title: 'Toda documentação de projeto foi revisada?',
        role: 'CertifyingEngineer',
        ref: 'Seção 4.5',
        critical: true,
        status: 'pending',
        due: 5,
      },
      {
        title: 'Certificação final de conformidade foi emitida?',
        role: 'CertifyingEngineer',
        ref: 'Seção 12.1',
        critical: true,
        status: 'pending',
        due: 8,
      },
      {
        title: 'Interpretação de código ASME foi aplicada corretamente?',
        role: 'CertifyingEngineer',
        ref: 'Seção 12.2',
        critical: false,
        status: 'pending',
        due: 10,
      },
      {
        title: 'MDeR foi assinado e arquivado?',
        role: 'CertifyingEngineer',
        ref: 'Seção 4.5',
        critical: true,
        status: 'pending',
        due: 4,
      },

      {
        title: 'A WPS aplicável está disponível e foi lida antes de soldar?',
        role: 'Welder',
        ref: 'Seção 8.1',
        critical: true,
        status: 'pending',
        due: 3,
      },
      {
        title: 'Execução de soldagem está conforme WPS aprovado?',
        role: 'Welder',
        ref: 'Seção 8.5',
        critical: true,
        status: 'completed',
        due: 3,
      },
      {
        title: 'Registro de continuidade de qualificação está atualizado?',
        role: 'Welder',
        ref: 'Seção 8.4',
        critical: true,
        status: 'pending',
        due: -2,
      },
      {
        title: 'Soldas executadas foram documentadas?',
        role: 'Welder',
        ref: 'Seção 8.5',
        critical: false,
        status: 'pending',
        due: 5,
      },
      {
        title: 'Trabalho não conforme foi rejeitado e reportado?',
        role: 'Welder',
        ref: 'Seção 8.5',
        critical: true,
        status: 'pending',
        due: 7,
      },
      {
        title: 'Equipamentos de soldagem estão calibrados?',
        role: 'Welder',
        ref: 'Seção 8.3',
        critical: false,
        status: 'pending',
        due: 10,
      },
      {
        title: 'Preparação de juntas está conforme procedimento?',
        role: 'Welder',
        ref: 'Seção 8.2',
        critical: true,
        status: 'pending',
        due: 4,
      },

      {
        title: 'Relatórios de END foram emitidos e documentados?',
        role: 'NDE',
        ref: 'Seção 9.4',
        critical: true,
        status: 'pending',
        due: 8,
      },
      {
        title: 'Equipamentos de END estão calibrados?',
        role: 'NDE',
        ref: 'Seção 9.2',
        critical: true,
        status: 'pending',
        due: 5,
      },
      {
        title: 'Procedimentos de END estão aprovados e disponíveis?',
        role: 'NDE',
        ref: 'Seção 9.1',
        critical: true,
        status: 'completed',
        due: 10,
      },
      {
        title: 'Pessoal de END está qualificado conforme ASNT?',
        role: 'NDE',
        ref: 'Seção 9.3',
        critical: true,
        status: 'pending',
        due: 7,
      },
      {
        title: 'Resultados de END foram avaliados (aceitar/rejeitar)?',
        role: 'NDE',
        ref: 'Seção 9.4',
        critical: false,
        status: 'pending',
        due: 6,
      },
      {
        title: 'Relatórios de END foram entregues ao Inspetor?',
        role: 'NDE',
        ref: 'Seção 9.4',
        critical: true,
        status: 'pending',
        due: 4,
      },
    ]

    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      var rec = new Record(checkCol)
      rec.set('title', item.title)
      rec.set('role_assigned', item.role)
      rec.set('mcq_ref', item.ref)
      rec.set('status', item.status)
      rec.set('is_critical', item.critical)
      rec.set('due_date', daysFromNow(item.due))
      rec.set('approval_status', 'pending')
      rec.set('locked', false)
      app.save(rec)
    }

    var interactionsData = [
      {
        source: 'Director',
        target: 'QCC',
        desc: 'Delegar implementação do SCQ e revisões do MCQ.',
        ref: 'Prefácio II',
      },
      {
        source: 'QCC',
        target: 'AI',
        desc: 'Interface principal para submissão de ITP e certificação de MDR.',
        ref: 'Seção 6.1/12',
      },
      {
        source: 'QCC',
        target: 'Inspector',
        desc: 'Distribuir ITPs e coordenar pontos de espera.',
        ref: 'Seção 6.1',
      },
      {
        source: 'Inspector',
        target: 'AI',
        desc: 'Solicitar testemunho em Hold Points.',
        ref: 'Seção 6.1',
      },
      {
        source: 'AI',
        target: 'QCC',
        desc: 'Reportar não-conformidades identificadas.',
        ref: 'Seção 15.4',
      },
      {
        source: 'Designer',
        target: 'Engineer',
        desc: 'Submeter cálculos de projeto para revisão de engenharia.',
        ref: 'Seção 4.1',
      },
      {
        source: 'Engineer',
        target: 'CertifyingEngineer',
        desc: 'Submeter MDeR para certificação final.',
        ref: 'Seção 4.5',
      },
      {
        source: 'CertifyingEngineer',
        target: 'AI',
        desc: 'Notificar certificação de MDeR para verificação.',
        ref: 'Seção 12.1',
      },
      {
        source: 'Welder',
        target: 'QCC',
        desc: 'Reportar continuidade de qualificação mensal.',
        ref: 'Seção 8.4',
      },
      {
        source: 'Welder',
        target: 'Inspector',
        desc: 'Solicitar inspeção de solda executada.',
        ref: 'Seção 8.5',
      },
      {
        source: 'NDE',
        target: 'Inspector',
        desc: 'Entregar relatórios de END para aceitação.',
        ref: 'Seção 9.4',
      },
      {
        source: 'Manager',
        target: 'Director',
        desc: 'Reportar status de conformidade e auditorias.',
        ref: 'Seção 15.5',
      },
      {
        source: 'QCC',
        target: 'NDE',
        desc: 'Solicitar ensaios não destrutivos conforme ITP.',
        ref: 'Seção 9.1',
      },
      {
        source: 'Inspector',
        target: 'Welder',
        desc: 'Verificar conformidade com WPS durante execução.',
        ref: 'Seção 8.5',
      },
    ]

    for (var j = 0; j < interactionsData.length; j++) {
      var inter = interactionsData[j]
      var iRec = new Record(interCol)
      iRec.set('source_role', inter.source)
      iRec.set('target_role', inter.target)
      iRec.set('description', inter.desc)
      iRec.set('mcq_ref', inter.ref)
      iRec.set('status', 'pending')
      app.save(iRec)
    }
  },
  (app) => {
    var col = app.findCollectionByNameOrId('interactions')
    if (col.fields.getByName('mcq_ref')) {
      col.fields.removeByName('mcq_ref')
    }
    app.save(col)
  },
)
