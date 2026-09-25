// 0135 — Cadastro de diretores multi-cargo (Frente 1)
//
// (1) Preenche o campo `role` dos 3 diretores já existentes no cadastro de
//     equipe da PSC (a631bv695rr4gef) — hoje com departamento DIRETORIA e
//     cargo vazio — com múltiplos cargos separados por "; ".
// (2) Cria os mesmos 3 diretores como registros de EQUIPE em Koala System
//     (i7kjauu378swxg6) e Genti (zt57khfow39nwa1), com departamento DIRETORIA
//     e os cargos específicos de cada empresa.

const PSC = 'a631bv695rr4gef'
const KOALA = 'i7kjauu378swxg6'
const GENTI = 'zt57khfow39nwa1'

const DIRECTORS = [
  {
    name: 'MARCOS VINÍCIUS MACIEL SANDES',
    psc: 'Diretor Geral; Diretor Comercial; Vendedor',
    koala: 'Diretor Comercial; Vendedor',
    genti: 'Diretor Comercial',
  },
  {
    name: 'ALEJANDRO DROGUETT',
    psc: 'Diretor Administrativo; TI; Coordenador de Projetos',
    koala: 'Diretor Geral; Diretor Administrativo; TI; Coordenador de Projetos',
    genti: 'Diretor Geral; Diretor Administrativo; TI',
  },
  {
    name: 'EDUARDO BRUNO AGUILERA',
    psc: 'Diretor Técnico; Coordenador de Engenharia/Projetos',
    koala: 'Diretor Técnico; Coordenador de Engenharia/Projetos',
    genti: 'Diretor Técnico',
  },
]

function upsertDirector(app, companyId, name, role) {
  const teamCol = app.findCollectionByNameOrId('team')
  const filter = `name ~ "${name}" && company_id = "${companyId}"`
  const existing = app.findRecordsByFilter('team', filter, '', 1, 0)

  if (existing && existing.length > 0) {
    const rec = existing[0]
    rec.set('role', role)
    rec.set('department', 'DIRETORIA')
    rec.set('is_active', true)
    app.save(rec)
    return rec.id
  }

  const record = new Record(teamCol)
  record.set('name', name)
  record.set('company_id', companyId)
  record.set('department', 'DIRETORIA')
  record.set('role', role)
  record.set('is_indicator', false)
  record.set('is_active', true)
  record.set('linked_operators', [])
  app.save(record)
  return record.id
}

migrate(
  (app) => {
    for (const d of DIRECTORS) {
      upsertDirector(app, PSC, d.name, d.psc)
      upsertDirector(app, KOALA, d.name, d.koala)
      upsertDirector(app, GENTI, d.name, d.genti)
    }
    console.log('0135_diretores_multicargo: diretores atualizados/criados com sucesso')
  },
  (app) => {
    for (const d of DIRECTORS) {
      try {
        const pscRecs = app.findRecordsByFilter(
          'team',
          `name ~ "${d.name}" && company_id = "${PSC}"`,
          '',
          1,
          0,
        )
        if (pscRecs.length > 0) {
          pscRecs[0].set('role', '')
          app.save(pscRecs[0])
        }
      } catch (_) {}

      try {
        const otherRecs = app.findRecordsByFilter(
          'team',
          `name ~ "${d.name}" && (company_id = "${KOALA}" || company_id = "${GENTI}")`,
          '',
          10,
          0,
        )
        for (const rec of otherRecs) {
          app.delete(rec)
        }
      } catch (_) {}
    }
  },
)
