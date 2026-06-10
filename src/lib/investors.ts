import type { AdminInvestorStatus } from '../types/api'

export const INVESTOR_STATUS_UI: Record<
  AdminInvestorStatus,
  { label: string; variant: 'green' | 'orange' | 'red'; dot: string }
> = {
  ACTIVE: { label: 'Actif', variant: 'green', dot: 'bg-emerald-500' },
  LATE: { label: 'En retard', variant: 'orange', dot: 'bg-orange-500' },
  INACTIVE: { label: 'Inactif', variant: 'red', dot: 'bg-red-500' },
}

/** "janv. 2023" from ISO date */
export function formatJoinedAt(iso: string): string {
  const d = new Date(iso)
  const formatted = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
