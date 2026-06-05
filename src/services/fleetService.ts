import { apiRequest } from '../lib/apiClient'
import type { Moto } from '../types/api'

/**
 * GET /motos
 * Returns all motos with assigned driver & investor info.
 * Used to populate the moto select in the incident form.
 */
export function listMotos(): Promise<Moto[]> {
  return apiRequest<Moto[]>('/motos')
}
