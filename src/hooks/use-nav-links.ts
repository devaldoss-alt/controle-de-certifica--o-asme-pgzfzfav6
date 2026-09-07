import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useCompany } from '@/hooks/use-company'
import {
  filterGroupsByModules,
  filterLinksByModules,
  getNavGroups,
  getNavLinks,
  type NavGroup,
  type NavLinkItem,
} from '@/lib/nav-config'
import { getAllowedModules, type ModuleName } from '@/services/module-permissions'

/**
 * Returns the nav groups the current user is allowed to see, grouped by section
 * and filtered by module_permissions for the selected company + the user's role.
 * Any group whose links are all hidden will be excluded (no orphan headers).
 */
export function useNavGroups(): NavGroup[] {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const [allowedModules, setAllowedModules] = useState<Set<ModuleName>>(new Set())
  const [ready, setReady] = useState(false)

  const role = user?.role

  useEffect(() => {
    let cancelled = false
    setReady(false)
    getAllowedModules(role, selectedCompanyId)
      .then((set) => {
        if (!cancelled) {
          setAllowedModules(set)
          setReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [role, selectedCompanyId])

  const groups = useMemo(() => getNavGroups(role), [role])

  if (!ready || !role || role === 'Manager' || role === 'Director') {
    return groups
  }
  return filterGroupsByModules(groups, allowedModules, role)
}

/**
 * Returns the flattened nav links the current user is allowed to see, filtered by
 * module_permissions for the selected company + the user's role.
 *
 * - Manager / Director always see every link (their permissions are implicit).
 * - Other roles are filtered against `module_permissions` rows matching their
 *   role + the selected company (or `company_id = ''` global rows).
 * - Links without a `module` (Dashboard, Notifications, Qualifications, …) are
 *   always visible.
 *
 * While permissions are loading, the full role-based list is returned so the
 * sidebar never flashes empty.
 */
export function useNavLinks(): NavLinkItem[] {
  const { user } = useAuth()
  const { selectedCompanyId } = useCompany()
  const [allowedModules, setAllowedModules] = useState<Set<ModuleName>>(new Set())
  const [ready, setReady] = useState(false)

  const role = user?.role

  useEffect(() => {
    let cancelled = false
    setReady(false)
    getAllowedModules(role, selectedCompanyId)
      .then((set) => {
        if (!cancelled) {
          setAllowedModules(set)
          setReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [role, selectedCompanyId])

  const links = useMemo(() => getNavLinks(role), [role])

  // Manager/Director never filter; and until permissions load show the full
  // role-based list so the sidebar isn't empty during the first render.
  if (!ready || !role || role === 'Manager' || role === 'Director') {
    return links
  }
  return filterLinksByModules(links, allowedModules, role)
}
