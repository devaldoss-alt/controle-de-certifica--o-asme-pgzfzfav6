export type Plan = 'Free' | 'Pro' | 'Gold'

export const PLAN_FEATURES: Record<Plan, { documentEditor: boolean; maxOS: number }> = {
  Free: { documentEditor: false, maxOS: 5 },
  Pro: { documentEditor: true, maxOS: 50 },
  Gold: { documentEditor: true, maxOS: 9999 },
}

export function getPlan(plan: string | undefined): Plan {
  return (plan as Plan) || 'Pro'
}

export function canUseDocumentEditor(plan: string | undefined): boolean {
  return PLAN_FEATURES[getPlan(plan)].documentEditor
}

export function getMaxOS(plan: string | undefined): number {
  return PLAN_FEATURES[getPlan(plan)].maxOS
}
