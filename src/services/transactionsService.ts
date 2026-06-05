import { apiRequest } from '../lib/apiClient'
import type { Transaction, CreatePaymentBody, Payment } from '../types/api'

/**
 * GET /transactions?limit=10&sort=desc
 * Returns an array of Transaction objects (from Payment table).
 */
export function listTransactions(
  params: { limit?: number; sort?: 'asc' | 'desc' } = {},
): Promise<Transaction[]> {
  const limit = params.limit ?? 10
  const sort = params.sort ?? 'desc'
  return apiRequest<Transaction[]>(`/transactions?limit=${limit}&sort=${sort}`)
}

/**
 * POST /payments
 * Creates a payment directly in VERIFIED status (admin action).
 * driverId must reference a user with role DRIVER.
 * amount must be >= 1 (XAF integer).
 */
export function createPayment(body: CreatePaymentBody): Promise<Payment> {
  return apiRequest<Payment>('/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
