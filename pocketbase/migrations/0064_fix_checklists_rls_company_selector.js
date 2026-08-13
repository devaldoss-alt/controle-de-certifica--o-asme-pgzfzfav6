migrate(
  (app) => {
    // ETAPA A: Os checklists existem no banco (~18 por empresa, com due_date em
    // ago-set/2026), mas nao chegam ao frontend porque o RLS da colecao checklists
    // filtra por primary_company_id do usuario logado, ignorando o companyId
    // selecionado no seletor de empresa. O seletor de empresa no topo ja restringe
    // as empresas as alocacoes do usuario (availableCompanyIds), e todas as queries
    // do app aplicam `company_id = "<selected>"`. Portanto, para leitura (list/view)
    // basta exigir autenticacao — o isolamento por empresa continua sendo aplicado
    // pela camada de aplicacao (filtro company_id em cada query).
    // Escritas (create/update/delete) continuam restritas a Manager ou a empresa
    // primaria do usuario, preservando o controle existente.
    var auth = "@request.auth.id != ''"
    var authWrite =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"

    var chkCol = app.findCollectionByNameOrId('checklists')
    chkCol.listRule = auth
    chkCol.viewRule = auth
    chkCol.createRule = auth
    chkCol.updateRule = authWrite
    chkCol.deleteRule = authWrite
    app.save(chkCol)
  },
  (app) => {
    // Reverte para o comportamento anterior (0062).
    var auth = "@request.auth.id != ''"
    var rule =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id || company_id = '')"
    var authWrite =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id)"

    var chkCol = app.findCollectionByNameOrId('checklists')
    chkCol.listRule = rule
    chkCol.viewRule = rule
    chkCol.createRule = auth
    chkCol.updateRule = authWrite
    chkCol.deleteRule = authWrite
    app.save(chkCol)
  },
)
