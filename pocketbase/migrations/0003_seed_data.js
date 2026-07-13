migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // Admin Manager
    let admin
    try {
      admin = app.findAuthRecordByEmail('_pb_users_auth_', 'devaldoss@gmail.com')
    } catch (_) {
      admin = new Record(usersCol)
      admin.setEmail('devaldoss@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
    }
    admin.set('name', 'Quality Manager')
    admin.set('role', 'Manager')
    app.save(admin)

    // Welder User
    let welder
    try {
      welder = app.findAuthRecordByEmail('_pb_users_auth_', 'welder@psc.com')
    } catch (_) {
      welder = new Record(usersCol)
      welder.setEmail('welder@psc.com')
      welder.setPassword('Skip@Pass')
      welder.setVerified(true)
    }
    welder.set('name', 'João Soldador')
    welder.set('role', 'Welder')
    const pastDate = new Date()
    pastDate.setMonth(pastDate.getMonth() - 5) // 5 months ago
    welder.set('qualification_expiry', pastDate.toISOString().replace('T', ' '))
    app.save(welder)

    // QCC User
    let qcc
    try {
      qcc = app.findAuthRecordByEmail('_pb_users_auth_', 'qcc@psc.com')
    } catch (_) {
      qcc = new Record(usersCol)
      qcc.setEmail('qcc@psc.com')
      qcc.setPassword('Skip@Pass')
      qcc.setVerified(true)
    }
    qcc.set('name', 'Maria QCC')
    qcc.set('role', 'QCC')
    app.save(qcc)

    // Seed Checklists
    const checkCol = app.findCollectionByNameOrId('checklists')

    const d1 = new Date()
    d1.setDate(d1.getDate() + 20) // Green
    const d2 = new Date()
    d2.setDate(d2.getDate() + 4) // Yellow
    const d3 = new Date()
    d3.setDate(d3.getDate() - 2) // Red (Expired)

    const items = [
      {
        title: 'Assinar e emitir a Declaração de Política e Autoridade',
        role: 'Director',
        ref: 'Prefácio II',
        critical: true,
        status: 'pending',
        due: d1,
      },
      {
        title: 'Garantir que o SCQ seja implementado',
        role: 'Director',
        ref: 'Prefácio II',
        critical: true,
        status: 'completed',
        due: d1,
      },
      {
        title: 'Controlar revisões do MCQ e retirar obsoletas',
        role: 'QCC',
        ref: 'Seção 1.1',
        critical: false,
        status: 'pending',
        due: d2,
      },
      {
        title: 'Revisar e aprovar cálculos de projeto',
        role: 'QCC',
        ref: 'Seção 4.1',
        critical: true,
        status: 'pending',
        due: d1,
      },
      {
        title: 'Preparar Plano de Inspeção e Teste (ITP)',
        role: 'Inspector',
        ref: 'Seção 6.1',
        critical: true,
        status: 'pending',
        due: d2,
      },
      {
        title: 'Documentar aceitação no ITP (Hold Points)',
        role: 'AI',
        ref: 'Seção 6.1',
        critical: true,
        status: 'pending',
        due: d1,
      },
      {
        title: 'Manter registro de continuidade de qualificação',
        role: 'Welder',
        ref: 'Seção 8.4',
        critical: true,
        status: 'pending',
        due: d3,
      },
      {
        title: 'Executar soldagem conforme WPS',
        role: 'Welder',
        ref: 'Seção 8.5',
        critical: true,
        status: 'completed',
        due: d1,
      },
      {
        title: 'Emitir relatórios de END documentados',
        role: 'NDE',
        ref: 'Seção 9.4',
        critical: false,
        status: 'pending',
        due: d1,
      },
      {
        title: 'Preparar MDeR para certificação',
        role: 'Engineer',
        ref: 'Seção 4.5',
        critical: true,
        status: 'pending',
        due: d2,
      },
    ]

    for (const item of items) {
      try {
        app.findFirstRecordByData('checklists', 'title', item.title)
      } catch (_) {
        const rec = new Record(checkCol)
        rec.set('title', item.title)
        rec.set('role_assigned', item.role)
        rec.set('mcq_ref', item.ref)
        rec.set('status', item.status)
        rec.set('is_critical', item.critical)
        rec.set('due_date', item.due.toISOString().replace('T', ' '))
        app.save(rec)
      }
    }
  },
  (app) => {},
)
