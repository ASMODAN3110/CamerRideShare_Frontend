import type { ShareRequestStatus } from '../types/api'

export const SHARE_REQUEST_STATUS_UI: Record<
  ShareRequestStatus,
  { label: string; variant: 'green' | 'orange' | 'red' | 'secondary' }
> = {
  PENDING: { label: 'En attente', variant: 'orange' },
  APPROVED: { label: 'Acceptée', variant: 'green' },
  REJECTED: { label: 'Refusée', variant: 'red' },
  CANCELLED: { label: 'Annulée', variant: 'secondary' },
}
