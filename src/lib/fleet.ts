import type { MotoStatus } from '../types/api'

export const DEFAULT_MOTO_IMAGE =
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'

export const STATUS_UI: Record<
  MotoStatus,
  { label: string; variant: 'green' | 'orange' | 'red' }
> = {
  ACTIVE: { label: 'Actif', variant: 'green' },
  BROKEN: { label: 'En panne', variant: 'orange' },
  STOLEN: { label: 'Indisponible', variant: 'red' },
}
