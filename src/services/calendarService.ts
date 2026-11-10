import { apiRequest } from '../lib/apiClient'
import type { CalendarParams, CalendarResponse } from '../types/api'

/** GET /admin/calendar — échéances des chauffeurs et reversements aux investisseurs ; filtres appliqués par le serveur. */
export function getCalendar(params: CalendarParams): Promise<CalendarResponse> {
  const qs = new URLSearchParams({ from: params.from, to: params.to })
  if (params.type) qs.set('type', params.type)
  if (params.status) qs.set('status', params.status)
  if (params.search) qs.set('search', params.search)
  return apiRequest<CalendarResponse>(`/admin/calendar?${qs.toString()}`)
}
