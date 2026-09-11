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
  Boxes,
  GraduationCap,
  HelpCircle,
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

export interface NavGroup {
  id: string
  titleKey: string
  links: NavLinkItem[]
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
  Almoxarifado: ['/inventory'],
  Treinamentos: ['/trainings'],
  Suprimentos: ['/suppliers'],
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

/**
 * Returns navigation items organized in visual groups according to the user's role.
 *
 * Groups:
 * 1. Início: Dashboard
 * 2. Qualidade: Documentos, Lista Mestra, Checklists, Qualificações, Aprovações
 * 3. Operação: Ordens de Serviço, PCP, Agenda, Romaneios
 * 4. Suprimentos: Almoxarifado, Fornecedores
 * 5. Pessoas: Treinamentos, Equipe
 * 6. Gestão: Indicadores, RNC, Notificações
 * 7. Administração: Empresas, Controle de Acesso
 */
export function getNavGroups(role?: string): NavGroup[] {
  const isManagerOrQccOrConsultor = role === 'Manager' || role === 'QCC' || role === 'Consultor'
  const isManager = role === 'Manager'

  const groups: NavGroup[] = [
    {
      id: 'home',
      titleKey: 'nav.group.home',
      links: [{ name: 'nav.dashboard', path: '/', icon: LayoutDashboard }],
    },
    {
      id: 'quality',
      titleKey: 'nav.group.quality',
      links: [
        { name: 'nav.documents', path: '/documents', icon: FileText, module: 'Documentos' },
        { name: 'nav.masterList', path: '/master-list', icon: ListChecks, module: 'Documentos' },
        { name: 'nav.checklists', path: '/checklists', icon: CheckSquare, module: 'Checklists' },
        { name: 'nav.qualifications', path: '/qualifications', icon: Award },
        ...(isManagerOrQccOrConsultor
          ? [{ name: 'nav.approvals', path: '/approvals', icon: ClipboardCheck }]
          : []),
      ],
    },
    {
      id: 'operation',
      titleKey: 'nav.group.operation',
      links: [
        {
          name: 'nav.serviceOrders',
          path: '/service-orders',
          icon: Briefcase,
          module: 'Ordens de Serviço',
        },
        { name: 'nav.pcp', path: '/pcp', icon: Factory, module: 'PCP' },
        { name: 'nav.calendar', path: '/calendar', icon: Calendar, module: 'Agenda' },
        { name: 'nav.packingSlips', path: '/packing-slips', icon: Truck, module: 'Romaneios' },
      ],
    },
    {
      id: 'materials',
      titleKey: 'nav.group.materials',
      links: [
        { name: 'nav.inventory', path: '/inventory', icon: Boxes, module: 'Almoxarifado' },
        { name: 'nav.suppliers', path: '/suppliers', icon: Truck, module: 'Suprimentos' },
      ],
    },
    {
      id: 'people',
      titleKey: 'nav.group.people',
      links: [
        { name: 'nav.trainings', path: '/trainings', icon: GraduationCap, module: 'Treinamentos' },
        ...(isManager ? [{ name: 'nav.team', path: '/team', icon: Users }] : []),
      ],
    },
    {
      id: 'management',
      titleKey: 'nav.group.management',
      links: [
        { name: 'nav.indicators', path: '/indicators', icon: BarChart3, module: 'Indicadores' },
        { name: 'nav.rnc', path: '/rnc', icon: AlertTriangle, module: 'RNC' },
        { name: 'nav.notifications', path: '/notifications', icon: Bell },
      ],
    },
    {
      id: 'administration',
      titleKey: 'nav.group.administration',
      links: [
        ...(isManager ? [{ name: 'nav.companies', path: '/companies', icon: Building2 }] : []),
        ...(isManagerOrQccOrConsultor
          ? [{ name: 'nav.accessControl', path: '/access-control', icon: ShieldCheck }]
          : []),
        { name: 'nav.help', path: '/help', icon: HelpCircle },
      ],
    },
  ]

  // Filter out any groups that have no links configured for this role
  return groups.filter((g) => g.links.length > 0)
}

/** Flattened nav links preserving group order (backward compatibility) */
export function getNavLinks(role?: string): NavLinkItem[] {
  return getNavGroups(role).flatMap((group) => group.links)
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

/**
 * Filters navigation groups by permissions:
 * - Each link is checked via module_permissions (or role requirements)
 * - Empty groups (where all items were filtered out) are removed to prevent orphan headers
 */
export function filterGroupsByModules(
  groups: NavGroup[],
  allowedModules: Set<ModuleName>,
  role?: string,
): NavGroup[] {
  if (!role || role === 'Manager' || role === 'Director') {
    return groups.filter((g) => g.links.length > 0)
  }

  return groups
    .map((group) => ({
      ...group,
      links: filterLinksByModules(group.links, allowedModules, role),
    }))
    .filter((group) => group.links.length > 0)
}

export { MODULE_PATHS, PATH_TO_MODULE }
