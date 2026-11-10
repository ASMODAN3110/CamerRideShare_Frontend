import { apiRequest } from '../lib/apiClient'
import type {
  ClassifyLossResult,
  DriverTerminationResult,
  DriverReceivables,
  DriverTerminationRow,
  InvestorTerminationOptions,
  InvestorTerminationPreview,
  InvestorTerminationResult,
  Receivable,
  ReceivablesResponse,
  TerminationReason,
} from '../types/api'

interface TerminateBody {
  reason: TerminationReason
  note?: string
}

const post = <T>(path: string, body: object) => apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) })

/** POST /admin/contracts/driver/:motoId/terminate — fin de la tournée du conducteur ; le véhicule peut être réaffecté. */
export function terminateDriverContract(motoId: number, body: TerminateBody): Promise<DriverTerminationResult> {
  return post(`/admin/contracts/driver/${motoId}/terminate`, body)
}

/** GET /admin/contracts/driver/:motoId/terminations — conducteurs dont le contrat a été résilié sur ce véhicule. */
export function getDriverTerminations(motoId: number): Promise<DriverTerminationRow[]> {
  return apiRequest<DriverTerminationRow[]>(`/admin/contracts/driver/${motoId}/terminations`)
}

/** GET /admin/contracts/investor/:id/termination-preview — capital investi, perçu et non récupéré. */
export function getInvestorTerminationPreview(investmentId: number): Promise<InvestorTerminationPreview> {
  return apiRequest<InvestorTerminationPreview>(`/admin/contracts/investor/${investmentId}/termination-preview`)
}

/**
 * POST /admin/contracts/investor/:investmentId/terminate — résiliation du contrat d'une part.
 * L'admin choisit librement de rembourser l'investisseur et/ou de réaffecter son capital à un autre véhicule.
 */
export function terminateInvestorContract(investmentId: number, body: InvestorTerminationOptions): Promise<InvestorTerminationResult> {
  return post(`/admin/contracts/investor/${investmentId}/terminate`, body)
}

/** POST /admin/contracts/vehicle/:motoId/classify-loss — véhicule perdu : tous les contrats prennent fin. */
export function classifyVehicleLoss(
  motoId: number,
  body: { note?: string; vehicleStatus?: 'STOLEN' | 'BROKEN' },
): Promise<ClassifyLossResult> {
  return post(`/admin/contracts/vehicle/${motoId}/classify-loss`, body)
}

// ─── Créances sur les conducteurs résiliés ─────────────────────────────────

export interface ReceivablesParams {
  page?: number
  limit?: number
  status?: 'OPEN' | 'CLOSED'
  search?: string
}

/** GET /admin/receivables — impayés des conducteurs résiliés ; filtres et pagination côté serveur. */
export function getReceivables(params: ReceivablesParams): Promise<ReceivablesResponse> {
  const qs = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 10) })
  if (params.status) qs.set('status', params.status)
  if (params.search) qs.set('search', params.search)
  return apiRequest<ReceivablesResponse>(`/admin/receivables?${qs.toString()}`)
}

/** GET /admin/receivables/driver/:id — ce qu'un conducteur doit encore d'une tournée précédente. */
export function getDriverReceivables(driverId: number): Promise<DriverReceivables> {
  return apiRequest<DriverReceivables>(`/admin/receivables/driver/${driverId}`)
}

/** POST /admin/receivables/:id/repay — remboursement reçu du conducteur. */
export function repayReceivable(id: number, body: { amount: number; note?: string }): Promise<Receivable> {
  return post(`/admin/receivables/${id}/repay`, body)
}

/** POST /admin/receivables/:id/write-off — abandon du solde (passage en perte). */
export function writeOffReceivable(id: number, body: { note?: string }): Promise<Receivable> {
  return post(`/admin/receivables/${id}/write-off`, body)
}
