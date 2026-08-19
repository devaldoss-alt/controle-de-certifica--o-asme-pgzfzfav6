import pb from '@/lib/pocketbase/client'
import { safeArray } from '@/lib/safe-data'
import { getServiceOrders, type ServiceOrder } from '@/services/service-orders'
import { getTeamMembers, type TeamMember } from '@/services/team'

export interface SectorCapacity {
  sector: string
  teamCount: number
  availableHoursMonth: number // Base: 160h per team member per month
  occupiedHours: number
  occupationPercentage: number
  activeOrdersCount: number
  orders: ServiceOrder[]
}

export interface PCPDashboardData {
  sectorCapacities: SectorCapacity[]
  totalAvailableHours: number
  totalOccupiedHours: number
  overallOccupationPercentage: number
  serviceOrders: ServiceOrder[]
}

export async function getPCPCapacityData(companyId?: string): Promise<PCPDashboardData> {
  try {
    const [orders, teamMembers] = await Promise.all([
      getServiceOrders('all', companyId),
      getTeamMembers({ companyId }),
    ])

    // Group team members by department/sector
    const teamBySector: Record<string, number> = {}
    for (const member of teamMembers) {
      const sector = (member.department || 'Outros').trim()
      if (sector) {
        teamBySector[sector] = (teamBySector[sector] || 0) + 1
      }
    }

    // Default sectors to ensure Solda, Usinagem, Caldeiraria exist even if empty
    const defaultSectors = ['Solda', 'Caldeiraria', 'Usinagem', 'CQ', 'Pintura', 'Montagem']
    for (const s of defaultSectors) {
      if (teamBySector[s] === undefined) {
        teamBySector[s] = 2 // Default benchmark capacity
      }
    }

    // Group active/paused service orders by sector
    const ordersBySector: Record<string, ServiceOrder[]> = {}
    for (const order of orders) {
      const sec = (order.sector || 'Caldeiraria').trim()
      if (!ordersBySector[sec]) ordersBySector[sec] = []
      ordersBySector[sec].push(order)
    }

    let grandTotalAvailable = 0
    let grandTotalOccupied = 0

    const sectorCapacities: SectorCapacity[] = Object.entries(teamBySector).map(
      ([sector, count]) => {
        const availableHoursMonth = count * 160 // 160h standard work hours/month
        const sectorOrders = ordersBySector[sector] || []
        const activeOrders = sectorOrders.filter(
          (o) => o.status === 'Active' || o.status === 'Paused',
        )

        const occupiedHours = activeOrders.reduce(
          (acc, curr) => acc + (curr.estimated_hours || 80),
          0,
        )

        const occupationPercentage =
          availableHoursMonth > 0 ? Math.round((occupiedHours / availableHoursMonth) * 100) : 0

        grandTotalAvailable += availableHoursMonth
        grandTotalOccupied += occupiedHours

        return {
          sector,
          teamCount: count,
          availableHoursMonth,
          occupiedHours,
          occupationPercentage,
          activeOrdersCount: activeOrders.length,
          orders: sectorOrders,
        }
      },
    )

    const overallOccupationPercentage =
      grandTotalAvailable > 0 ? Math.round((grandTotalOccupied / grandTotalAvailable) * 100) : 0

    return {
      sectorCapacities,
      totalAvailableHours: grandTotalAvailable,
      totalOccupiedHours: grandTotalOccupied,
      overallOccupationPercentage,
      serviceOrders: orders,
    }
  } catch (e) {
    console.error('getPCPCapacityData failed:', e)
    return {
      sectorCapacities: [],
      totalAvailableHours: 0,
      totalOccupiedHours: 0,
      overallOccupationPercentage: 0,
      serviceOrders: [],
    }
  }
}
