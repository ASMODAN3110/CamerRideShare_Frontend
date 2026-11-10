import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from '@/lib/paymentMethods'
import type { PaymentMethod } from '@/types/api'
import PaymentMethodIcon from './PaymentMethodIcon'

/** Pastille d'un moyen de paiement : son icône aux couleurs de la marque et son libellé. */
export function PaymentMethodBadge({ method }: { method: PaymentMethod | null | undefined }) {
  if (!method) return <span className="text-muted-foreground">—</span>
  return (
    <span className="inline-flex items-center gap-2">
      <PaymentMethodIcon method={method} height={24} />
      <span className="whitespace-nowrap text-sm">{PAYMENT_METHOD_LABEL[method]}</span>
    </span>
  )
}

/** Choix du moyen de paiement à la saisie d'un paiement : les trois moyens fixes du système. */
export default function PaymentMethodSelect(props: {
  id?: string
  value: PaymentMethod | ''
  onChange: (value: PaymentMethod) => void
  invalid?: boolean
}) {
  return (
    <Select value={props.value} onValueChange={(v) => props.onChange(v as PaymentMethod)}>
      <SelectTrigger id={props.id} className="w-full" aria-label="Moyen de paiement" aria-invalid={props.invalid}>
        <SelectValue placeholder="Choisir un moyen de paiement" />
      </SelectTrigger>
      <SelectContent>
        {PAYMENT_METHODS.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            <PaymentMethodBadge method={m.value} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
