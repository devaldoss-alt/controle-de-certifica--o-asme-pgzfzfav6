import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { getInventoryItem, registerStockMovement, type InventoryItem } from './inventory'

export type MaterialRequisitionStatus = 'pendente' | 'em_separacao' | 'retirado' | 'cancelado'
export type PurchaseRequestStatus = 'pendente' | 'cotado' | 'comprado' | 'recebido' | 'cancelado'

export interface MaterialRequisition {
  id: string
  item_id: string
  company_id: string
  quantity: number
  os_id?: string
  requester_id?: string
  requester_name: string
  requester_role?: string
  requester_company?: string
  tool_equipment?: string
  requisition_date?: string
  status: MaterialRequisitionStatus
  separated_by?: string
  separated_by_name?: string
  confirmation_date?: string
  cancel_reason?: string
  notes?: string
  created: string
  updated: string
  expand?: {
    item_id?: InventoryItem
    company_id?: { id: string; name: string }
    os_id?: { id: string; number: string; client?: string }
    requester_id?: { id: string; name: string; department?: string; role?: string }
    separated_by?: { id: string; name: string; role?: string }
  }
}

export interface PurchaseRequest {
  id: string
  item_description: string
  item_id?: string
  company_id: string
  quantity: number
  unit?: string
  os_id?: string
  requester_id?: string
  requester_name: string
  requester_role?: string
  requester_company?: string
  status: PurchaseRequestStatus
  supplier?: string
  estimated_unit_price?: number
  received_date?: string
  received_by?: string
  received_by_name?: string
  cancel_reason?: string
  notes?: string
  created: string
  updated: string
  expand?: {
    item_id?: InventoryItem
    company_id?: { id: string; name: string }
    os_id?: { id: string; number: string; client?: string }
    requester_id?: { id: string; name: string; department?: string; role?: string }
    received_by?: { id: string; name: string; role?: string }
  }
}

export interface WarehouseIndicatorsSummary {
  taxaAtendimento: number
  pedidosAtendidos: number
  pedidosTotais: number
  itensRuptura: number
  valorConsumidoMes: number
  period: string
}

/**
 * Tolerant notification sender: failure never throws or breaks the main operation.
 */
export async function sendWarehouseNotification(params: {
  userId: string
  message: string
  companyId?: string
}): Promise<void> {
  try {
    if (!params.userId || !params.message) return
    await pb.collection('notifications').create({
      user_id: params.userId,
      message: params.message,
      read: false,
      company_id: params.companyId,
      type: 'submission',
    })
  } catch (e) {
    console.warn('[warehouse-notifications] Silent error sending notification:', e)
  }
}

/**
 * Notifies all managers and users with inventory access in the company about a warehouse event.
 */
export async function notifyWarehouseStakeholders(params: {
  companyId: string
  message: string
}): Promise<void> {
  try {
    const users = await pb.collection('users').getFullList<{ id: string; role?: string }>({
      fields: 'id,role',
    })
    const targetUsers = users.filter((u) => {
      const r = u.role ? (Array.isArray(u.role) ? u.role : [u.role]) : []
      return r.includes('Manager') || r.includes('QCC') || r.includes('Apontador')
    })

    await Promise.all(
      targetUsers.map((u) =>
        sendWarehouseNotification({
          userId: u.id,
          message: params.message,
          companyId: params.companyId,
        }),
      ),
    )
  } catch (e) {
    console.warn('[warehouse-notifications] notifyWarehouseStakeholders failed silently:', e)
  }
}

/* =========================================================================
 * 1. MATERIAL REQUISITIONS
 * ========================================================================= */

export async function getMaterialRequisitions(params: {
  companyId?: string
  status?: string
  osId?: string
  search?: string
  requesterId?: string
  startDate?: string
  endDate?: string
}): Promise<MaterialRequisition[]> {
  const filters: string[] = []
  if (params.companyId && params.companyId !== 'all') {
    filters.push(`company_id = "${params.companyId}"`)
  }
  if (params.status && params.status !== 'all') {
    filters.push(`status = "${params.status}"`)
  }
  if (params.osId && params.osId !== 'all') {
    filters.push(`os_id = "${params.osId}"`)
  }
  if (params.requesterId && params.requesterId !== 'all') {
    filters.push(`requester_id = "${params.requesterId}"`)
  }
  if (params.startDate) {
    filters.push(`created >= "${params.startDate} 00:00:00"`)
  }
  if (params.endDate) {
    filters.push(`created <= "${params.endDate} 23:59:59"`)
  }
  if (params.search && params.search.trim()) {
    const s = params.search.trim()
    filters.push(
      `(requester_name ~ "${s}" || requester_role ~ "${s}" || notes ~ "${s}" || tool_equipment ~ "${s}")`,
    )
  }

  try {
    const list = await pb.collection('material_requisitions').getFullList<MaterialRequisition>({
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: '-created',
      expand: 'item_id,company_id,os_id,requester_id,separated_by',
    })
    return safeArray<MaterialRequisition>(list)
  } catch (e) {
    console.error('getMaterialRequisitions failed:', e)
    return []
  }
}

export async function createMaterialRequisition(
  data: Partial<MaterialRequisition>,
): Promise<MaterialRequisition> {
  const payload = {
    ...data,
    status: data.status || 'pendente',
    requisition_date: data.requisition_date || new Date().toISOString(),
  }
  const created = await pb
    .collection('material_requisitions')
    .create<MaterialRequisition>(payload, {
      expand: 'item_id,company_id,os_id,requester_id',
    })

  // Silent notification to warehouse managers
  notifyWarehouseStakeholders({
    companyId: created.company_id,
    message: `Nova requisição de retirada: ${data.quantity}x do item solicitado por ${data.requester_name || 'Operador'}`,
  })

  // Trigger non-blocking indicator calculation
  recalculateWarehouseIndicators({ companyId: created.company_id })

  return created
}

export async function updateMaterialRequisitionStatus(params: {
  requisitionId: string
  newStatus: MaterialRequisitionStatus
  userId?: string
  userName?: string
  cancelReason?: string
  notes?: string
}): Promise<MaterialRequisition> {
  const existing = await pb
    .collection('material_requisitions')
    .getOne<MaterialRequisition>(params.requisitionId, {
      expand: 'item_id',
    })

  const item = existing.expand?.item_id || (await getInventoryItem(existing.item_id))

  // INSPECTION BLOCK: If trying to confirm checkout and item requires CQ inspection and is not released
  if (params.newStatus === 'retirado') {
    if (item.requires_cq_inspection && item.inspection_status !== 'Liberado') {
      const err = new Error(
        `Retirada BLOQUEADA pelo Controle de Qualidade: o item "${item.description}" está com status "${item.inspection_status || 'Aguardando inspeção'}". Liberação do QCC é obrigatória.`,
      )
      err.name = 'CQInspectionBlockError'
      throw err
    }

    // Verify stock availability
    const curStock = Number(item.current_stock ?? 0)
    if (curStock < existing.quantity) {
      throw new Error(
        `Saldo insuficiente em estoque. Saldo atual: ${curStock} ${item.unit}. Quantidade requisitada: ${existing.quantity}.`,
      )
    }
  }

  const patch: Partial<MaterialRequisition> = {
    status: params.newStatus,
  }

  if (params.newStatus === 'em_separacao') {
    patch.separated_by = params.userId
    patch.separated_by_name = params.userName
  } else if (params.newStatus === 'retirado') {
    patch.confirmation_date = new Date().toISOString()
    if (!existing.separated_by) {
      patch.separated_by = params.userId
      patch.separated_by_name = params.userName
    }

    // Give automatic stock movement (Saída)
    await registerStockMovement({
      itemId: existing.item_id,
      companyId: existing.company_id,
      movementType: 'Saída',
      quantity: existing.quantity,
      unitPrice: item.unit_price,
      responsibleId: params.userId,
      responsibleName: params.userName || 'Almoxarife',
      osId: existing.os_id,
      notes: `Baixa automática via Requisição de Retirada #${existing.id.slice(-6).toUpperCase()} (${existing.requester_name})`,
    })

    // Check if new balance crosses minimum stock
    const newBalance = Math.max(0, (item.current_stock ?? 0) - existing.quantity)
    if (
      item.minimum_stock !== undefined &&
      item.minimum_stock !== null &&
      newBalance <= item.minimum_stock
    ) {
      notifyWarehouseStakeholders({
        companyId: existing.company_id,
        message: `⚠️ Alerta de Estoque Mínimo: o item "${item.description}" atingiu saldo ${newBalance} ${item.unit} (mínimo: ${item.minimum_stock}).`,
      })
    }
  } else if (params.newStatus === 'cancelado') {
    patch.cancel_reason = params.cancelReason || 'Cancelado pelo operador'
  }

  if (params.notes) {
    patch.notes = existing.notes ? `${existing.notes} | ${params.notes}` : params.notes
  }

  const updated = await pb
    .collection('material_requisitions')
    .update<MaterialRequisition>(params.requisitionId, patch, {
      expand: 'item_id,company_id,os_id,requester_id,separated_by',
    })

  // Recalculate indicators asynchronously
  recalculateWarehouseIndicators({ companyId: existing.company_id })

  return updated
}

/* =========================================================================
 * 2. PURCHASE REQUESTS
 * ========================================================================= */

export async function getPurchaseRequests(params: {
  companyId?: string
  status?: string
  osId?: string
  search?: string
}): Promise<PurchaseRequest[]> {
  const filters: string[] = []
  if (params.companyId && params.companyId !== 'all') {
    filters.push(`company_id = "${params.companyId}"`)
  }
  if (params.status && params.status !== 'all') {
    filters.push(`status = "${params.status}"`)
  }
  if (params.osId && params.osId !== 'all') {
    filters.push(`os_id = "${params.osId}"`)
  }
  if (params.search && params.search.trim()) {
    const s = params.search.trim()
    filters.push(
      `(item_description ~ "${s}" || requester_name ~ "${s}" || supplier ~ "${s}" || notes ~ "${s}")`,
    )
  }

  try {
    const list = await pb.collection('purchase_requests').getFullList<PurchaseRequest>({
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: '-created',
      expand: 'item_id,company_id,os_id,requester_id,received_by',
    })
    return safeArray<PurchaseRequest>(list)
  } catch (e) {
    console.error('getPurchaseRequests failed:', e)
    return []
  }
}

export async function createPurchaseRequest(
  data: Partial<PurchaseRequest>,
): Promise<PurchaseRequest> {
  const payload = {
    ...data,
    status: data.status || 'pendente',
  }
  const created = await pb.collection('purchase_requests').create<PurchaseRequest>(payload, {
    expand: 'item_id,company_id,os_id,requester_id',
  })

  notifyWarehouseStakeholders({
    companyId: created.company_id,
    message: `Nova Solicitação de Compra: ${data.quantity} ${data.unit || 'UN'} de "${data.item_description}" solicitado por ${data.requester_name}`,
  })

  return created
}

export async function updatePurchaseRequestStatus(params: {
  requestId: string
  newStatus: PurchaseRequestStatus
  supplier?: string
  estimatedUnitPrice?: number
  userId?: string
  userName?: string
  cancelReason?: string
  notes?: string
}): Promise<PurchaseRequest> {
  const existing = await pb
    .collection('purchase_requests')
    .getOne<PurchaseRequest>(params.requestId, {
      expand: 'item_id,requester_id',
    })

  const patch: Partial<PurchaseRequest> = {
    status: params.newStatus,
  }
  if (params.supplier) patch.supplier = params.supplier
  if (params.estimatedUnitPrice !== undefined)
    patch.estimated_unit_price = params.estimatedUnitPrice
  if (params.cancelReason) patch.cancel_reason = params.cancelReason
  if (params.notes) {
    patch.notes = existing.notes ? `${existing.notes} | ${params.notes}` : params.notes
  }

  // When received: automatic inventory entrance + notification to original requester
  if (params.newStatus === 'recebido') {
    patch.received_date = new Date().toISOString()
    patch.received_by = params.userId
    patch.received_by_name = params.userName

    // Check if item_id exists in inventory or create one
    let targetItemId = existing.item_id
    if (!targetItemId) {
      // Find by exact description and company
      try {
        const found = await pb.collection('inventory_items').getList<InventoryItem>(1, 1, {
          filter: `company_id = "${existing.company_id}" && description ~ "${existing.item_description.trim()}"`,
        })
        if (found.items.length > 0) {
          targetItemId = found.items[0].id
        }
      } catch {
        /* intentionally ignored */
      }
    }

    if (targetItemId) {
      // Existing item: give entrada via stock_movements
      await registerStockMovement({
        itemId: targetItemId,
        companyId: existing.company_id,
        movementType: 'Entrada',
        quantity: existing.quantity,
        unitPrice: params.estimatedUnitPrice || existing.estimated_unit_price,
        responsibleId: params.userId,
        responsibleName: params.userName || 'Suprimentos / Almoxarifado',
        osId: existing.os_id,
        notes: `Entrada via Solicitação de Compra #${existing.id.slice(-6).toUpperCase()} (${existing.supplier || 'Fornecedor'})`,
      })
    } else {
      // Create new inventory item
      const newItem = await pb.collection('inventory_items').create<InventoryItem>({
        description: existing.item_description,
        company_id: existing.company_id,
        category: 'Insumo',
        unit: existing.unit || 'UN',
        unit_price: params.estimatedUnitPrice || existing.estimated_unit_price || 0,
        current_stock: existing.quantity,
        minimum_stock: 0,
        location: 'Almoxarifado',
        os_id: existing.os_id,
        requires_cq_inspection: false,
        inspection_status: 'Não aplicável',
        supplier: params.supplier || existing.supplier || '',
        notes: `Criado automaticamente no recebimento da Compra #${existing.id.slice(-6).toUpperCase()}`,
      })
      patch.item_id = newItem.id

      // Register initial stock movement
      await pb.collection('stock_movements').create({
        item_id: newItem.id,
        company_id: existing.company_id,
        movement_type: 'Entrada',
        quantity: existing.quantity,
        unit_price: params.estimatedUnitPrice || 0,
        responsible_id: params.userId,
        responsible_name: params.userName || 'Suprimentos',
        os_id: existing.os_id,
        movement_date: new Date().toISOString(),
        notes: `Recebimento da compra de "${newItem.description}"`,
        balance_after: existing.quantity,
      })
    }

    // Notify requester: "O item que você pediu chegou!"
    // Try to find user associated with requester name or notify stakeholders
    try {
      const users = await pb.collection('users').getFullList<{ id: string; name: string }>({
        filter: `name ~ "${existing.requester_name}"`,
      })
      const requesterUser = users[0]
      if (requesterUser) {
        await sendWarehouseNotification({
          userId: requesterUser.id,
          message: `📦 O item que você pediu chegou! "${existing.item_description}" (${existing.quantity} ${existing.unit || 'UN'}) já está disponível no Almoxarifado.`,
          companyId: existing.company_id,
        })
      }
    } catch {
      /* intentionally ignored */
    }

    // Also notify warehouse managers
    notifyWarehouseStakeholders({
      companyId: existing.company_id,
      message: `Recebimento concluído: "${existing.item_description}" (${existing.quantity} ${existing.unit || 'UN'}) deu entrada no estoque. Solicitante original: ${existing.requester_name}`,
    })
  }

  const updated = await pb
    .collection('purchase_requests')
    .update<PurchaseRequest>(params.requestId, patch, {
      expand: 'item_id,company_id,os_id,requester_id,received_by',
    })

  recalculateWarehouseIndicators({ companyId: existing.company_id })

  return updated
}

/* =========================================================================
 * 3. SMART MINIMUM STOCK & PENDING REQUESTS SUM
 * ========================================================================= */

/**
 * Returns pending requisition quantities per item to calculate effective available balance:
 * (current_stock - pending_withdrawals) or (current_stock + pending_purchases)
 */
export async function getItemPendingTotals(companyId: string): Promise<{
  pendingWithdrawalsByItem: Record<string, number>
  pendingPurchasesByItem: Record<string, number>
}> {
  const pendingWithdrawalsByItem: Record<string, number> = {}
  const pendingPurchasesByItem: Record<string, number> = {}

  try {
    const filterCompany = companyId && companyId !== 'all' ? `company_id = "${companyId}" && ` : ''

    // Open requisitions (pendente or em_separacao)
    const requisitions = await pb
      .collection('material_requisitions')
      .getFullList<MaterialRequisition>({
        filter: `${filterCompany}(status = "pendente" || status = "em_separacao")`,
        fields: 'item_id,quantity',
      })
    requisitions.forEach((r) => {
      pendingWithdrawalsByItem[r.item_id] =
        (pendingWithdrawalsByItem[r.item_id] || 0) + Number(r.quantity || 0)
    })

    // Open purchase requests (pendente, cotado, comprado)
    const purchases = await pb.collection('purchase_requests').getFullList<PurchaseRequest>({
      filter: `${filterCompany}(status = "pendente" || status = "cotado" || status = "comprado")`,
      fields: 'item_id,quantity',
    })
    purchases.forEach((p) => {
      if (p.item_id) {
        pendingPurchasesByItem[p.item_id] =
          (pendingPurchasesByItem[p.item_id] || 0) + Number(p.quantity || 0)
      }
    })
  } catch (e) {
    console.warn('[warehouse] getItemPendingTotals error:', e)
  }

  return { pendingWithdrawalsByItem, pendingPurchasesByItem }
}

/* =========================================================================
 * 4. PERFORMANCE INDICATORS CALCULATION & SYNC
 * ========================================================================= */

export async function computeWarehouseIndicators(
  companyId: string,
): Promise<WarehouseIndicatorsSummary> {
  if (!companyId || companyId === 'all') {
    return {
      taxaAtendimento: 100,
      pedidosAtendidos: 0,
      pedidosTotais: 0,
      itensRuptura: 0,
      valorConsumidoMes: 0,
      period: new Date().toISOString().slice(0, 7),
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const monthStr = String(now.getMonth() + 1).padStart(2, '0')
  const startOfMonth = `${year}-${monthStr}-01 00:00:00`

  // 1. Requisitions this month for Taxa de Atendimento
  let allReqs: MaterialRequisition[] = []
  try {
    const list = await pb.collection('material_requisitions').getFullList<MaterialRequisition>({
      filter: `company_id = "${companyId}" && created >= "${startOfMonth}"`,
      fields: 'id,status,quantity',
    })
    allReqs = safeArray<MaterialRequisition>(list)
  } catch (e) {
    console.warn('Failed to fetch requisitions for indicators:', e)
  }

  const pedidosTotais = allReqs.length
  const pedidosAtendidos = allReqs.filter((r) => r.status === 'retirado').length
  const taxaAtendimento =
    pedidosTotais > 0 ? Number(((pedidosAtendidos / pedidosTotais) * 100).toFixed(1)) : 100

  // 2. Itens em Ruptura: stock items with current_stock <= minimum_stock or current_stock = 0
  let itensRuptura = 0
  try {
    const items = await pb.collection('inventory_items').getFullList<InventoryItem>({
      filter: `company_id = "${companyId}"`,
      fields: 'id,current_stock,minimum_stock',
    })
    itensRuptura = items.filter(
      (i) =>
        (i.current_stock ?? 0) <= 0 ||
        (i.minimum_stock !== undefined &&
          i.minimum_stock !== null &&
          (i.current_stock ?? 0) <= i.minimum_stock),
    ).length
  } catch (e) {
    console.warn('Failed to fetch items for ruptura indicator:', e)
  }

  // 3. Valor Consumido por OS/Mês: stock movements with movement_type = "Saída" and os_id != null this month
  let valorConsumidoMes = 0
  try {
    const movements = await pb.collection('stock_movements').getFullList<{
      quantity: number
      unit_price: number
      movement_type: string
      os_id: string
    }>({
      filter: `company_id = "${companyId}" && movement_type = "Saída" && os_id != "" && movement_date >= "${startOfMonth}"`,
      fields: 'quantity,unit_price',
    })
    valorConsumidoMes = movements.reduce((acc, m) => {
      const q = Number(m.quantity || 0)
      const p = Number(m.unit_price || 0)
      return acc + q * p
    }, 0)
    valorConsumidoMes = Number(valorConsumidoMes.toFixed(2))
  } catch (e) {
    console.warn('Failed to compute valor consumido por OS:', e)
  }

  return {
    taxaAtendimento,
    pedidosAtendidos,
    pedidosTotais,
    itensRuptura,
    valorConsumidoMes,
    period: `${year}-${monthStr}`,
  }
}

/**
 * Recalculates indicators and silently syncs to `indicators` and `indicator_history`.
 */
export async function recalculateWarehouseIndicators(params: {
  companyId: string
}): Promise<WarehouseIndicatorsSummary | null> {
  const { companyId } = params
  if (!companyId || companyId === 'all') return null

  try {
    const summary = await computeWarehouseIndicators(companyId)

    // Load indicators for this company
    const inds = await pb.collection('indicators').getFullList<{
      id: string
      title: string
      current_value: number
    }>({
      filter: `company_id = "${companyId}"`,
    })

    const taxaInd = inds.find((i) => i.title.includes('Taxa de Atendimento'))
    const rupturaInd = inds.find((i) => i.title.includes('Itens em Ruptura'))
    const valorInd = inds.find((i) => i.title.includes('Valor Consumido por OS'))

    if (taxaInd) {
      await pb
        .collection('indicators')
        .update(taxaInd.id, {
          current_value: summary.taxaAtendimento,
        })
        .catch(() => {})
      await syncIndicatorHistory(
        taxaInd.id,
        companyId,
        summary.taxaAtendimento,
        `Taxa de Atendimento: ${summary.pedidosAtendidos}/${summary.pedidosTotais} pedidos atendidos no mês`,
      )
    }

    if (rupturaInd) {
      await pb
        .collection('indicators')
        .update(rupturaInd.id, {
          current_value: summary.itensRuptura,
        })
        .catch(() => {})
      await syncIndicatorHistory(
        rupturaInd.id,
        companyId,
        summary.itensRuptura,
        `Contagem de itens em ruptura de estoque (saldo zero ou abaixo do mínimo)`,
      )
    }

    if (valorInd) {
      await pb
        .collection('indicators')
        .update(valorInd.id, {
          current_value: summary.valorConsumidoMes,
        })
        .catch(() => {})
      await syncIndicatorHistory(
        valorInd.id,
        companyId,
        summary.valorConsumidoMes,
        `Valor monetário total consumido por Ordens de Serviço no mês`,
      )
    }

    return summary
  } catch (e) {
    console.warn('[warehouse-indicators] recalculateWarehouseIndicators silent error:', e)
    return null
  }
}

async function syncIndicatorHistory(
  indicatorId: string,
  companyId: string,
  value: number,
  notes: string,
) {
  try {
    const now = new Date()
    const monthStr = String(now.getMonth() + 1).padStart(2, '0')
    const periodDate = `${now.getFullYear()}-${monthStr}-01 00:00:00.000Z`

    const existing = await pb.collection('indicator_history').getList<{ id: string }>(1, 1, {
      filter: `indicator_id = "${indicatorId}" && period_date >= "${now.getFullYear()}-${monthStr}-01 00:00:00" && period_date <= "${now.getFullYear()}-${monthStr}-01 23:59:59"`,
    })

    if (existing.items.length > 0) {
      await pb.collection('indicator_history').update(existing.items[0].id, {
        value,
        notes,
      })
    } else {
      await pb.collection('indicator_history').create({
        indicator_id: indicatorId,
        company_id: companyId,
        period_date: periodDate,
        value,
        notes,
      })
    }
  } catch (e) {
    console.warn('syncIndicatorHistory silent warning:', e)
  }
}
