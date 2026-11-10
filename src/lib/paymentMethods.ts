import type { PaymentMethod } from '../types/api'

/** Les trois moyens de paiement du système : liste fixe, dans l'ordre d'affichage. */
export const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MTN_MONEY', label: 'MTN Money' },
  { value: 'CASH', label: 'Espèces' },
]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN Money',
  CASH: 'Espèces',
}

/** Libellé d'un moyen de paiement, ou « — » pour un versement enregistré avant son introduction. */
export const methodLabelOf = (method: PaymentMethod | null | undefined) => (method ? PAYMENT_METHOD_LABEL[method] : '—')
