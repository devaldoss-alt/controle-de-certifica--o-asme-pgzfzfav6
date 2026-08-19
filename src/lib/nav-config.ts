import {
  LayoutDashboard,
  CheckSquare,
  Users,
  ClipboardCheck,
  Award,
  FileText,
  Briefcase,
  Building2,
  BarChart3,
  ListChecks,
  Bell,
  Truck,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Factory,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ModuleName } from '@/services/module-permissions'

export interface NavLinkItem {
  name: string
  path: string
  icon: LucideIcon
  /** The module_permissions.module this nav link maps to (undefined = always visible). */
  module?: ModuleName
}

/**
 * Maps a module_permissions.module value to the primary nav path(s) it gates.
 * Multiple paths can map to the same module (e.g. /documents and /master-list
 * both belong to "Documentos"), so a single module permission covers both.
 */
const MODULE_PATHS: Record<ModuleName, string[]> = {
  Documentos: ['/documents', '/master-list'],
  Checklists: ['/checklists'],
  Indicadores: ['/indicators'],
  Romaneios: ['/packing-slips'],
  'Ordens de Serviço': ['/service-orders'],
  Agenda: ['/calendar'],
  RNC: ['/rnc'],
  PCP: ['/pcp'],
}

/** Reverse lookup: path → module (first match wins). */
const PATH_TO_MODULE: Record<string, ModuleName> = (() => {
  const m: Record<string, ModuleName> = {}
  ;(Object.keys(MODULE_PATHS) as ModuleName[]).forEach((mod) => {
    MODULE_PATHS[mod].forEach((p) => {
      m[p] = mod
    })
  })
  return m
})()

export function getNavLinks(role?: string): NavLinkItem[] {
  const links: NavLinkItem[] = [
    { name: 'nav.dashboard', path: '/', icon: LayoutDashboard },
    { name: 'nav.checklists', path: '/checklists', icon: CheckSquare, module: 'Checklists' },
    {
      name: 'nav.serviceOrders',
      path: '/service-orders',
      icon: Briefcase,
      module: 'Ordens de Serviço',
    },
    { name: 'nav.packingSlips', path: '/packing-slips', icon: Truck, module: 'Romaneios' },
    { name: 'nav.calendar', path: '/calendar', icon: Calendar, module: 'Agenda' },
    { name: 'nav.documents', path: '/documents', icon: FileText, module: 'Documentos' },
    { name: 'nav.masterList', path: '/master-list', icon: ListChecks, module: 'Documentos' },
    { name: 'nav.rnc', path: '/rnc', icon: AlertTriangle, module: 'RNC' },
    { name: 'nav.pcp', path: '/pcp', icon: Factory, module: 'PCP' },
    { name: 'nav.notifications', path: '/notifications', icon: Bell },
    { name: 'nav.qualifications', path: '/qualifications', icon: Award },
    { name: 'nav.indicators', path: '/indicators', icon: BarChart3, module: 'Indicadores' },
  ]

  if (role === 'Manager' || role === 'QCC' || role === 'Consultor') {
    links.push({ name: 'nav.approvals', path: '/approvals', icon: ClipboardCheck })
    links.push({ name: 'nav.accessControl', path: '/access-control', icon: ShieldCheck })
  }
  if (role === 'Manager') {
    links.push({ name: 'nav.companies', path: '/companies', icon: Building2 })
    links.push({ name: 'nav.team', path: '/team', icon: Users })
  }

  return links
}

/**
 * Filters nav links by the module_permissions the user is allowed to view.
 * Links without a module are always kept (Dashboard, Notifications, etc.).
 * Manager/Director see everything (role check short-circuits to all links).
 */
export function filterLinksByModules(
  links: NavLinkItem[],
  allowedModules: Set<ModuleName>,
  role?: string,
): NavLinkItem[] {
  if (!role || role === 'Manager' || role === 'Director') return links
  return links.filter((link) => {
    if (!link.module) return true
    return allowedModules.has(link.module)
  })
}

export { MODULE_PATHS, PATH_TO_MODULE }
