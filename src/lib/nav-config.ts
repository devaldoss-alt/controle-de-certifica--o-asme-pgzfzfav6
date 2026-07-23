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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavLinkItem {
  name: string
  path: string
  icon: LucideIcon
}

export function getNavLinks(role?: string): NavLinkItem[] {
  const links: NavLinkItem[] = [
    { name: 'nav.dashboard', path: '/', icon: LayoutDashboard },
    { name: 'nav.checklists', path: '/checklists', icon: CheckSquare },
    { name: 'nav.serviceOrders', path: '/service-orders', icon: Briefcase },
    { name: 'nav.documents', path: '/documents', icon: FileText },
    { name: 'nav.qualifications', path: '/qualifications', icon: Award },
    { name: 'nav.indicators', path: '/indicators', icon: BarChart3 },
  ]

  if (role === 'Manager' || role === 'QCC') {
    links.push({ name: 'nav.approvals', path: '/approvals', icon: ClipboardCheck })
  }
  if (role === 'Manager') {
    links.push({ name: 'nav.companies', path: '/companies', icon: Building2 })
    links.push({ name: 'nav.team', path: '/team', icon: Users })
  }

  return links
}
