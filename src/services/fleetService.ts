import { apiRequest } from '../lib/apiClient'
import type {
  CreateMotoPayload,
  DeleteMotoResponse,
  FleetSummary,
  ListMotosParams,
  MotoAvailable,
  MotoDetail,
  MotoFilters,
  MotoListItem,
  PaginatedMotos,
  UpdateMotoPayload,
} from '../types/api'

function buildMotosQuery(params: ListMotosParams = {}): string {
  const qs = new URLSearchParams()
  if (params.page != null) qs.set('page', String(params.page))
  if (params.limit != null) qs.set('limit', String(params.limit))
  if (params.search?.trim()) qs.set('search', params.search.trim())
  if (params.status) qs.set('status', params.status)
  if (params.city) qs.set('city', params.city)
  if (params.model) qs.set('model', params.model)
  const query = qs.toString()
  return query ? `?${query}` : ''
}

export function getFleetSummary(): Promise<FleetSummary> {
  return apiRequest<FleetSummary>('/admin/fleet/summary')
}

export function getMotoFilters(): Promise<MotoFilters> {
  return apiRequest<MotoFilters>('/motos/filters')
}

export function listMotos(params: ListMotosParams = {}): Promise<PaginatedMotos> {
  return apiRequest<PaginatedMotos>(`/motos${buildMotosQuery(params)}`)
}

export function getMoto(id: number): Promise<MotoDetail> {
  return apiRequest<MotoDetail>(`/motos/${id}`)
}

export function createMoto(body: CreateMotoPayload): Promise<MotoListItem> {
  return apiRequest<MotoListItem>('/motos', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateMoto(id: number, body: UpdateMotoPayload): Promise<MotoListItem> {
  return apiRequest<MotoListItem>(`/motos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteMoto(id: number): Promise<DeleteMotoResponse | void> {
  return apiRequest<DeleteMotoResponse>(`/motos/${id}`, { method: 'DELETE' })
}

export function listAvailableMotos(): Promise<MotoAvailable[]> {
  return apiRequest<MotoAvailable[]>('/motos/available')
}

/** Aggregates all pages (limit max 50) for dashboard selects. */
export async function listAllMotos(): Promise<MotoListItem[]> {
  const limit = 50
  const first = await listMotos({ page: 1, limit })
  const all = [...first.data]
  for (let page = 2; page <= first.meta.totalPages; page++) {
    const next = await listMotos({ page, limit })
    all.push(...next.data)
  }
  return all
}
