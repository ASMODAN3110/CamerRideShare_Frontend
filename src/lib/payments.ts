import type { PaymentStatus, PaymentType } from '../types/api'

export const PAYMENT_STATUS_UI: Record<
  PaymentStatus,
  { label: string; variant: 'green' | 'orange'; dot: string }
> = {
  VERIFIED: { label: 'Validé', variant: 'green', dot: 'bg-emerald-500' },
  PENDING: { label: 'En attente', variant: 'orange', dot: 'bg-orange-500' },
}

export const PAYMENT_TYPE_UI: Record<PaymentType, { label: string; variant: 'default' | 'red' }> = {
  PAYMENT: { label: 'Paiement', variant: 'default' },
  EXPENSE: { label: 'Dépense', variant: 'red' },
}

export function amountSign(type: PaymentType): '+' | '-' {
  return type === 'EXPENSE' ? '-' : '+'
}

export function amountColorClass(type: PaymentType): string {
  return type === 'EXPENSE'
    ? 'text-red-600 dark:text-red-400'
    : 'text-slate-900 dark:text-slate-50'
}
