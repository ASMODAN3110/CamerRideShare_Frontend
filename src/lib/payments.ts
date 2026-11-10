import type { PaymentStatus, PaymentType } from '../types/api'

export const PAYMENT_STATUS_UI: Record<
  PaymentStatus,
  { label: string; variant: 'green' | 'orange' | 'red'; dot: string }
> = {
  VERIFIED: { label: 'Validé', variant: 'green', dot: 'bg-primary' },
  PENDING: { label: 'En attente', variant: 'orange', dot: 'bg-warning' },
  REJECTED: { label: 'Refusé', variant: 'red', dot: 'bg-destructive' },
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
    ? 'text-danger-foreground'
    : 'text-foreground'
}
