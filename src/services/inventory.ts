import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'

export type InventoryCategory =
  | 'Insumo'
  | 'Consumível'
  | 'Gás-Cilindro'
  | 'Ferramenta'
  | 'Equipamento'
  | 'Outro'

export type InventoryLocation = 'Almoxarifado' | 'Área Externa' | 'Oficina' | 'Outro'

export type InspectionStatus = 'Aguardando inspeção' | 'Liberado' | 'Rejeitado' | 'Não aplicável'

export type MovementType = 'Saldo Inicial' | 'Entrada' | 'Saída' | 'Ajuste'

export interface InventoryItem {
  id: string
  description: string
  company_id: string
  category: InventoryCategory
  unit: string
  unit_price?: number
  current_stock: number
  minimum_stock?: number
  location?: InventoryLocation
  os_id?: string
  requires_cq_inspection: boolean
  inspection_status: InspectionStatus
  is_consigned: boolean
  supplier?: string
  is_controlled: boolean
  tracking_code?: string
  inspected_by?: string
  inspected_at?: string
  notes?: string
  created: string
  updated: string
  expand?: {
    company_id?: { id: string; name: string }
    os_id?: { id: string; number: string; client?: string }
    inspected_by?: { id: string; name: string; role?: string }
  }
}

export interface StockMovement {
  id: string
  item_id: string
  company_id: string
  movement_type: MovementType
  quantity: number
  unit_price?: number
  responsible_id?: string
  responsible_name?: string
  os_id?: string
  movement_date: string
  notes?: string
  balance_after: number
  created: string
  updated: string
  expand?: {
    item_id?: { id: string; description: string; tracking_code?: string }
    company_id?: { id: string; name: string }
    responsible_id?: { id: string; name: string }
    os_id?: { id: string; number: string }
  }
}

export interface InventoryImportRow {
  description: string
  company_id?: string
  company_name?: string
  category?: string
  unit?: string
  quantity?: number
  unit_price?: number
  minimum_stock?: number
  location?: string
  os_number?: string
  requires_cq_inspection?: boolean | string
  is_consigned?: boolean | string
  supplier?: string
  is_controlled?: boolean | string
  notes?: string
}

export interface InventoryImportResult {
  success: number
  created: number
  updated: number
  errors: { row: number; error: string }[]
}

export type InventoryImportProgressCallback = (current: number, total: number) => void

/**
 * Generate tracking code based on company acronym + serial number:
 * e.g. PSC-EST-000123
 */
export async function generateTrackingCode(
  companyId: string,
  companyName?: string,
): Promise<string> {
  let prefix = 'EST'
  if (companyName) {
    const upper = companyName.toUpperCase()
    if (upper.includes('PSC')) prefix = 'PSC-EST'
    else if (upper.includes('KOALA') || upper.includes('KS')) prefix = 'KS-EST'
    else if (upper.includes('GENTI')) prefix = 'GENTI-EST'
    else {
      const acronym = companyName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 3)
        .toUpperCase()
      prefix = `${acronym}-EST`
    }
  }

  try {
    const filter = `company_id = "${companyId}"`
    const count = await pb.collection('inventory_items').getList(1, 1, { filter })
    const seq = count.totalItems + 1
    return `${prefix}-${String(seq).padStart(6, '0')}`
  } catch (e) {
    const randomSeq = Math.floor(100000 + Math.random() * 900000)
    return `${prefix}-${randomSeq}`
  }
}

export async function getInventoryItems(params: {
  companyId?: string
  search?: string
  category?: string
  status?: string
  lowStockOnly?: boolean
}): Promise<InventoryItem[]> {
  const filters: string[] = []
  const { companyId, search, category, status, lowStockOnly } = params

  if (companyId && companyId !== 'all') {
    filters.push(`company_id = "${companyId}"`)
  }

  if (search && search.trim()) {
    const s = search.trim()
    filters.push(`(description ~ "${s}" || tracking_code ~ "${s}" || supplier ~ "${s}")`)
  }

  if (category && category !== 'all') {
    filters.push(`category = "${category}"`)
  }

  if (status && status !== 'all') {
    filters.push(`inspection_status = "${status}"`)
  }

  try {
    const result = await pb.collection('inventory_items').getFullList<InventoryItem>({
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: '-created',
      expand: 'company_id,os_id,inspected_by',
    })

    const items = safeArray<InventoryItem>(result)
    if (lowStockOnly) {
      return items.filter(
        (i) =>
          i.minimum_stock !== undefined &&
          i.minimum_stock !== null &&
          (i.current_stock ?? 0) <= i.minimum_stock,
      )
    }
    return items
  } catch (e) {
    console.error('getInventoryItems failed:', e)
    return []
  }
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  return pb.collection('inventory_items').getOne<InventoryItem>(id, {
    expand: 'company_id,os_id,inspected_by',
  })
}

export async function createInventoryItem(
  data: Partial<InventoryItem>,
  initialMovement?: {
    responsibleId?: string
    responsibleName?: string
    notes?: string
  },
): Promise<InventoryItem> {
  const stock = Number(data.current_stock ?? 0)
  const requiresCQ = !!data.requires_cq_inspection
  const inspectionStatus: InspectionStatus = requiresCQ
    ? data.inspection_status || 'Aguardando inspeção'
    : 'Não aplicável'

  const created = await pb.collection('inventory_items').create<InventoryItem>({
    ...data,
    current_stock: stock,
    requires_cq_inspection: requiresCQ,
    inspection_status: inspectionStatus,
  })

  // Create initial movement record
  try {
    await pb.collection('stock_movements').create<StockMovement>({
      item_id: created.id,
      company_id: created.company_id,
      movement_type: 'Saldo Inicial',
      quantity: stock,
      unit_price: created.unit_price ?? 0,
      responsible_id: initialMovement?.responsibleId,
      responsible_name: initialMovement?.responsibleName || 'Sistema (Cadastro Inicial)',
      os_id: created.os_id,
      movement_date: new Date().toISOString(),
      notes: initialMovement?.notes || 'Saldo inicial cadastrado no sistema',
      balance_after: stock,
    })
  } catch (e) {
    console.error('Failed to create initial stock movement:', e)
  }

  return created
}

export async function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>,
): Promise<InventoryItem> {
  return pb.collection('inventory_items').update<InventoryItem>(id, data)
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  return pb.collection('inventory_items').delete(id)
}

/**
 * Inspection clearance by QCC role
 */
export async function releaseCQInspection(
  itemId: string,
  userId: string,
  status: 'Liberado' | 'Rejeitado' = 'Liberado',
  notes?: string,
): Promise<InventoryItem> {
  const updateData: Partial<InventoryItem> = {
    inspection_status: status,
    inspected_by: userId,
    inspected_at: new Date().toISOString(),
  }
  if (notes) {
    const existing = await getInventoryItem(itemId)
    updateData.notes = existing.notes
      ? `${existing.notes}\n[CQ ${status}]: ${notes}`
      : `[CQ ${status}]: ${notes}`
  }
  return pb.collection('inventory_items').update<InventoryItem>(itemId, updateData)
}

/**
 * Register a stock movement (Entrada, Saída, Ajuste) and automatically update item stock
 */
export async function registerStockMovement(params: {
  itemId: string
  companyId: string
  movementType: MovementType
  quantity: number
  unitPrice?: number
  responsibleId?: string
  responsibleName?: string
  osId?: string
  notes?: string
}): Promise<{ movement: StockMovement; updatedItem: InventoryItem }> {
  const item = await getInventoryItem(params.itemId)
  const curStock = Number(item.current_stock ?? 0)
  const qty = Number(params.quantity)

  let newBalance = curStock
  if (params.movementType === 'Entrada') {
    newBalance = curStock + Math.abs(qty)
  } else if (params.movementType === 'Saída') {
    newBalance = Math.max(0, curStock - Math.abs(qty))
  } else if (params.movementType === 'Ajuste' || params.movementType === 'Saldo Inicial') {
    newBalance = qty
  }

  const movement = await pb.collection('stock_movements').create<StockMovement>({
    item_id: params.itemId,
    company_id: params.companyId,
    movement_type: params.movementType,
    quantity: qty,
    unit_price: params.unitPrice ?? item.unit_price ?? 0,
    responsible_id: params.responsibleId,
    responsible_name: params.responsibleName,
    os_id: params.osId || item.os_id,
    movement_date: new Date().toISOString(),
    notes: params.notes,
    balance_after: newBalance,
  })

  const updatedItem = await pb.collection('inventory_items').update<InventoryItem>(params.itemId, {
    current_stock: newBalance,
    ...(params.unitPrice !== undefined ? { unit_price: params.unitPrice } : {}),
  })

  return { movement, updatedItem }
}

export async function getStockMovements(params: {
  itemId?: string
  companyId?: string
  movementType?: string
  limit?: number
}): Promise<StockMovement[]> {
  const filters: string[] = []
  if (params.itemId) filters.push(`item_id = "${params.itemId}"`)
  if (params.companyId && params.companyId !== 'all')
    filters.push(`company_id = "${params.companyId}"`)
  if (params.movementType && params.movementType !== 'all')
    filters.push(`movement_type = "${params.movementType}"`)

  try {
    const result = await pb.collection('stock_movements').getFullList<StockMovement>({
      filter: filters.length > 0 ? filters.join(' && ') : undefined,
      sort: '-movement_date,-created',
      expand: 'item_id,company_id,responsible_id,os_id',
    })
    return safeArray<StockMovement>(result)
  } catch (e) {
    console.error('getStockMovements failed:', e)
    return []
  }
}

/**
 * Normalizes category string to one of the valid enum values
 */
export function normalizeCategory(val?: string): InventoryCategory {
  if (!val) return 'Insumo'
  const v = val.toLowerCase().trim()
  if (v.includes('insumo')) return 'Insumo'
  if (v.includes('consumivel') || v.includes('consumível')) return 'Consumível'
  if (v.includes('gas') || v.includes('gás') || v.includes('cilindro')) return 'Gás-Cilindro'
  if (v.includes('ferramenta')) return 'Ferramenta'
  if (v.includes('equipamento')) return 'Equipamento'
  return 'Outro'
}

/**
 * Normalizes boolean flags from variations like "sim", "yes", "1", "s", "true"
 */
export function normalizeBooleanFlag(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  if (!val) return false
  const str = String(val).trim().toLowerCase()
  return ['sim', 's', 'yes', 'y', '1', 'true', 'v', 'verdadeiro'].includes(str)
}

/**
 * Normalizes location
 */
export function normalizeLocation(val?: string): InventoryLocation {
  if (!val) return 'Almoxarifado'
  const v = val.toLowerCase().trim()
  if (v.includes('externa') || v.includes('patio') || v.includes('pátio')) return 'Área Externa'
  if (v.includes('oficina') || v.includes('fabrica') || v.includes('fábrica')) return 'Oficina'
  if (
    v.includes('almoxarifado') ||
    v.includes('estoque') ||
    v.includes('galpão') ||
    v.includes('depósito')
  )
    return 'Almoxarifado'
  return 'Outro'
}

/**
 * Bulk import inventory items with deduplication by Description + Company.
 * - Reimporting updates current record without duplicating.
 * - Generates unique tracking code for new items.
 * - Registers "Saldo Inicial" stock_movement for new or updated quantities.
 */
export async function bulkImportInventory(
  rows: InventoryImportRow[],
  targetCompanyId: string,
  targetCompanyName: string,
  onProgress?: InventoryImportProgressCallback,
): Promise<InventoryImportResult> {
  const result: InventoryImportResult = {
    success: 0,
    created: 0,
    updated: 0,
    errors: [],
  }

  // Pre-fetch all existing items for this company to dedup in-memory
  const existingItems = await getInventoryItems({ companyId: targetCompanyId })
  const existingMap = new Map<string, InventoryItem>()
  for (const item of existingItems) {
    const key = item.description.trim().toLowerCase()
    existingMap.set(key, item)
  }

  let nextSeq = existingItems.length + 1

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row.description || !row.description.trim()) {
      result.errors.push({ row: i + 1, error: 'Descrição é obrigatória' })
      onProgress?.(i + 1, rows.length)
      continue
    }

    const descClean = row.description.trim()
    const descKey = descClean.toLowerCase()
    const category = normalizeCategory(row.category)
    const unit = (row.unit || 'UN').trim().toUpperCase()
    const qty = Number(row.quantity ?? 0)
    const unitPrice = row.unit_price ? Number(row.unit_price) : 0
    const minStock = row.minimum_stock !== undefined ? Number(row.minimum_stock) : 0
    const location = normalizeLocation(row.location)
    const reqCQ = normalizeBooleanFlag(row.requires_cq_inspection)
    const isConsigned = normalizeBooleanFlag(row.is_consigned)
    const isControlled = normalizeBooleanFlag(row.is_controlled)
    const supplier = row.supplier ? row.supplier.trim() : ''
    const notes = row.notes ? row.notes.trim() : ''

    const existing = existingMap.get(descKey)

    if (existing) {
      // UPDATE existing item (no duplicate)
      try {
        const prevStock = Number(existing.current_stock ?? 0)
        const updated = await pb.collection('inventory_items').update<InventoryItem>(existing.id, {
          description: descClean,
          category,
          unit,
          unit_price: unitPrice || existing.unit_price || 0,
          current_stock: qty,
          minimum_stock: minStock || existing.minimum_stock || 0,
          location,
          requires_cq_inspection: reqCQ,
          is_consigned: isConsigned,
          supplier: supplier || existing.supplier || '',
          is_controlled: isControlled,
          notes: notes || existing.notes || '',
        })

        // Record adjustment / initial balance movement if quantity changed
        if (qty !== prevStock) {
          await pb.collection('stock_movements').create<StockMovement>({
            item_id: existing.id,
            company_id: targetCompanyId,
            movement_type: 'Ajuste',
            quantity: qty,
            unit_price: unitPrice || existing.unit_price || 0,
            responsible_name: 'Importador (Atualização)',
            movement_date: new Date().toISOString(),
            notes: `Saldo reimportado: alterado de ${prevStock} para ${qty} ${unit}`,
            balance_after: qty,
          })
        }

        existingMap.set(descKey, updated)
        result.success++
        result.updated++
      } catch (e: any) {
        result.errors.push({
          row: i + 1,
          error: e?.message || 'Falha ao atualizar item existente',
        })
      }
    } else {
      // CREATE new item with tracking code
      try {
        let prefix = 'EST'
        const upper = targetCompanyName.toUpperCase()
        if (upper.includes('PSC')) prefix = 'PSC-EST'
        else if (upper.includes('KOALA') || upper.includes('KS')) prefix = 'KS-EST'
        else if (upper.includes('GENTI')) prefix = 'GENTI-EST'
        const trackingCode = `${prefix}-${String(nextSeq++).padStart(6, '0')}`

        const inspectionStatus: InspectionStatus = reqCQ ? 'Aguardando inspeção' : 'Não aplicável'

        const created = await pb.collection('inventory_items').create<InventoryItem>({
          description: descClean,
          company_id: targetCompanyId,
          category,
          unit,
          unit_price: unitPrice,
          current_stock: qty,
          minimum_stock: minStock,
          location,
          requires_cq_inspection: reqCQ,
          inspection_status: inspectionStatus,
          is_consigned: isConsigned,
          supplier,
          is_controlled: isControlled,
          tracking_code: trackingCode,
          notes,
        })

        // Register initial stock movement
        await pb.collection('stock_movements').create<StockMovement>({
          item_id: created.id,
          company_id: targetCompanyId,
          movement_type: 'Saldo Inicial',
          quantity: qty,
          unit_price: unitPrice,
          responsible_name: 'Importador (Saldo Inicial)',
          movement_date: new Date().toISOString(),
          notes: 'Saldo inicial via importação de planilha',
          balance_after: qty,
        })

        existingMap.set(descKey, created)
        result.success++
        result.created++
      } catch (e: any) {
        result.errors.push({
          row: i + 1,
          error: e?.message || 'Falha ao cadastrar novo item',
        })
      }
    }

    onProgress?.(i + 1, rows.length)
  }

  return result
}
