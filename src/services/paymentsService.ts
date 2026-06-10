import { apiRequest } from '../lib/apiClient'
import type {
  CreatePaymentBody,
  PaymentDetail,
  PaymentStatus,
  PaymentsSummary,
} from '../types/api'

/** GET /admin/payments/summary — KPIs page paiements (JWT + ADMIN). */
export function getPaymentsSummary(): Promise<PaymentsSummary> {
  return apiRequest<PaymentsSummary>('/admin/payments/summary')
}

/** GET /payments/:id — détail transaction (JWT + ADMIN). */
export function getPayment(id: number): Promise<PaymentDetail> {
  return apiRequest<PaymentDetail>(`/payments/${id}`)
}

/** PATCH /payments/:id — valider ou remettre en attente (JWT + ADMIN). */
export function updatePaymentStatus(id: number, status: PaymentStatus): Promise<PaymentDetail> {
  return apiRequest<PaymentDetail>(`/payments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/**
 * POST /payments — création directe en VERIFIED (JWT + ADMIN).
 * driverId must reference a user with role DRIVER; amount >= 1 XAF.
 */
export function createPayment(body: CreatePaymentBody): Promise<PaymentDetail> {
  return apiRequest<PaymentDetail>('/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
