import { apiRequest } from '../lib/apiClient'
import type { CreateIncidentBody, Incident } from '../types/api'

/**
 * POST /incidents
 * Reports a new incident. motoId is optional; if provided the moto must
 * already be assigned to the given driver.
 * Response: incident with status OPEN.
 */
export function createIncident(body: CreateIncidentBody): Promise<Incident> {
  return apiRequest<Incident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
