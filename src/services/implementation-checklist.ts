import pb from '@/lib/pocketbase/client'

export interface ImplementationItem {
  id: string
  item_key: string
  phase_id: number
  phase_title: string
  title: string
  how_to: string
  expected_result: string
  attention_alert?: string
  is_highlight?: boolean
  order_index: number
  done: boolean
  done_by?: string
  done_at?: string
  notes?: string
  failure_registered?: boolean
  failure_description?: string
  failure_date?: string
  created?: string
  updated?: string
}

export interface PhaseGroup {
  phase_id: number
  phase_title: string
  items: ImplementationItem[]
  completedCount: number
  totalCount: number
  progressPercent: number
}

export const getImplementationChecklist = async (): Promise<ImplementationItem[]> => {
  try {
    const records = await pb
      .collection('implementation_checklist')
      .getFullList<ImplementationItem>({
        sort: 'order_index,item_key',
      })
    return records
  } catch (error) {
    console.error('[implementation-checklist] Error fetching items:', error)
    return []
  }
}

export const toggleItemDone = async (
  item: ImplementationItem,
  userName: string,
): Promise<ImplementationItem> => {
  const newDone = !item.done
  const updateData: Record<string, any> = {
    done: newDone,
    done_by: newDone ? userName : '',
    done_at: newDone ? new Date().toISOString() : null,
  }

  const updated = await pb
    .collection('implementation_checklist')
    .update<ImplementationItem>(item.id, updateData)
  return updated
}

export const updateItemNotes = async (id: string, notes: string): Promise<ImplementationItem> => {
  const updated = await pb.collection('implementation_checklist').update<ImplementationItem>(id, {
    notes,
  })
  return updated
}

export const registerItemFailure = async (
  id: string,
  failureRegistered: boolean,
  failureDescription?: string,
): Promise<ImplementationItem> => {
  const updated = await pb.collection('implementation_checklist').update<ImplementationItem>(id, {
    failure_registered: failureRegistered,
    failure_description: failureRegistered ? failureDescription : '',
    failure_date: failureRegistered ? new Date().toISOString() : null,
  })
  return updated
}

export const GOLDEN_RULES = [
  '1. Testar com dado de teste, não de produção — exceto a importação (4.x), que é o próprio dado real.',
  '2. Um bloco por vez — não avançar com falha em aberto sem registrar.',
  '3. Registrar toda falha assim: data, módulo, o que fez, o que esperava, o que aconteceu, print — e mandar pelo chat no modo Agente (o Skip corrige e a versão nova entra no ar).',
  '4. Nada é apagado à mão — correção de dados é sempre pedido ao Skip, com migração controlada.',
]
