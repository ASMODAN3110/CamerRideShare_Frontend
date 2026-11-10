import type { VehicleType } from '../types/api'

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  MOTO: 'Moto',
  TAXI: 'Taxi',
}

/** « Haojue DK150 · 2024 » : marque, modèle et année quand ils sont renseignés. */
export function vehicleDescription(v: { brand: string | null; model: string | null; year?: number | null }): string {
  const name = [v.brand, v.model].filter(Boolean).join(' ')
  return [name, v.year].filter(Boolean).join(' · ')
}
