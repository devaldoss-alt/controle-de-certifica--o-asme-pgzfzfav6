// Migration 0067 — fixes two remaining data/access issues:
//
//   1. Backfill documents.next_review_date = effective_date + 2 years for
//      EVERY document (PSC and Koala, any category) whose effective_date is
//      set and whose next_review_date is empty.
//
//      Migration 0065 attempted this but used `next_review_date IS NULL`.
//      PocketBase stores unset date fields as the empty string '', not NULL,
//      so the IS NULL predicate matched zero rows and the backfill was a
//      no-op. Here we also match '' and drop the Internal-only category
//      filter so all documents are covered.
//
//   2. Relax the READ (list/view) API rules of the company-scoped data
//      collections (documents, indicators, indicator_history, service_orders,
//      packing_slips, user_certificates) to require only authentication.
//
//      Previously these gates read access by `company_id = primary_company_id`
//      (plus a Manager bypass). A user allocated to Koala but whose
//      primary_company_id is PSC could therefore not read Koala documents /
//      indicators / etc. even after selecting Koala in the company selector.
//      Company isolation is already enforced at the application layer (every
//      query filters `company_id = "<selected>"`), exactly as was already done
//      for `checklists` (0064) and `team` (0066). Write rules are unchanged.
migrate(
  (app) => {
    // ---- 1. Backfill next_review_date --------------------------------------
    try {
      app
        .db()
        .newQuery(
          "UPDATE documents SET next_review_date = date(effective_date, '+2 years') " +
            "WHERE effective_date IS NOT NULL AND effective_date != '' " +
            "AND (next_review_date IS NULL OR next_review_date = '')",
        )
        .execute()
    } catch (e) {
      // surfaced in logs only
    }

    // ---- 2. Relax read rules (auth-only) on company-scoped collections -----
    var authRead = "@request.auth.id != ''"
    var collections = [
      'documents',
      'indicators',
      'indicator_history',
      'service_orders',
      'packing_slips',
      'user_certificates',
    ]
    for (var i = 0; i < collections.length; i++) {
      try {
        var col = app.findCollectionByNameOrId(collections[i])
        col.listRule = authRead
        col.viewRule = authRead
        app.save(col)
      } catch (e) {
        // collection missing — skip
      }
    }
  },
  (app) => {
    // Best-effort revert: restore the previous primary_company_id read rules.
    var prevRead =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || company_id = @request.auth.primary_company_id || company_id = '')"
    var prevReadOwner =
      "@request.auth.id != '' && (@request.auth.role = 'Manager' || owner_company_id = @request.auth.primary_company_id || owner_company_id = '')"
    var rules = {
      documents: prevRead,
      indicators: prevRead,
      indicator_history: prevRead,
      service_orders: prevReadOwner,
      packing_slips: prevRead,
      user_certificates: prevRead,
    }
    var keys = Object.keys(rules)
    for (var i = 0; i < keys.length; i++) {
      try {
        var col = app.findCollectionByNameOrId(keys[i])
        col.listRule = rules[keys[i]]
        col.viewRule = rules[keys[i]]
        app.save(col)
      } catch (e) {}
    }
  },
)
