import { apiRequest } from '../lib/apiClient'
import type { PayoutFrequency, PayoutInvestorsResponse, PayoutItem, PayoutsResponse } from '../types/api'

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== false) qs.set(key, String(value))
  }
  const text = qs.toString()
  return text ? `?${text}` : ''
}

/** GET /payouts/investors — investisseurs, mode de versement et sommes exigibles (filtres côté serveur). */
export function listPayoutInvestors(params: {
  page: number
  limit: number
  search?: string
  frequency?: PayoutFrequency
  dueOnly?: boolean
}) {
  return apiRequest<PayoutInvestorsResponse>(`/payouts/investors${toQuery(params)}`)
}

export function listPayouts(params: { page: number; limit: number }) {
  return apiRequest<PayoutsResponse>(`/payouts${toQuery(params)}`)
}

/** PATCH /payouts/investors/:id/frequency — l'admin choisit un versement hebdomadaire ou mensuel. */
export function setPayoutFrequency(investorId: number, frequency: PayoutFrequency) {
  return apiRequest<{ id: number; frequency: PayoutFrequency }>(`/payouts/investors/${investorId}/frequency`, {
    method: 'PATCH',
    body: JSON.stringify({ frequency }),
  })
}

/** POST /payouts — reverse à l'investisseur ses gains exigibles. */
export function payInvestor(body: { investorId: number; includeCurrentPeriod?: boolean }) {
  return apiRequest<PayoutItem>('/payouts', { method: 'POST', body: JSON.stringify(body) })
}
