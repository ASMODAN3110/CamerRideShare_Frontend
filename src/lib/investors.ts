import type { AdminInvestorStatus } from '../types/api'

export const INVESTOR_STATUS_UI: Record<
  AdminInvestorStatus,
  { label: string; variant: 'green' | 'orange' | 'red'; dot: string }
> = {
  ACTIVE: { label: 'Actif', variant: 'green', dot: 'bg-primary' },
  INACTIVE: { label: 'Inactif', variant: 'red', dot: 'bg-muted-foreground' },
}

/** "janv. 2023" from ISO date */
export function formatJoinedAt(iso: string): string {
  const d = new Date(iso)
  const formatted = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
