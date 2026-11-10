import { PaymentMethodBadge } from './PaymentMethodSelect'
import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { getPayment, updatePaymentStatus } from '../services/paymentsService'
import { formatShortDate, formatXaf, initials } from '../lib/format'
import { PAYMENT_STATUS_UI, PAYMENT_TYPE_UI, amountColorClass, amountSign } from '../lib/payments'
import { ApiError } from '../types/auth'
import type { PaymentDetail, PaymentStatus } from '../types/api'

interface PaymentDetailModalProps {
  paymentId: number | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PaymentDetailModal({ paymentId, isOpen, onClose, onSuccess }: PaymentDetailModalProps) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!isOpen || paymentId == null) return
    setPayment(null)
    setError(null)
    setRejecting(false)
    setNote('')
    setLoading(true)
    getPayment(paymentId)
      .then(setPayment)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Erreur chargement du paiement')
      })
      .finally(() => setLoading(false))
  }, [isOpen, paymentId])

  const handleStatusChange = async (status: PaymentStatus, reason?: string) => {
    if (paymentId == null) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await updatePaymentStatus(paymentId, status, reason)
      setPayment(updated)
      setRejecting(false)
      setNote('')
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setSubmitting(false)
    }
  }

  const typeUi = payment ? PAYMENT_TYPE_UI[payment.type] : null
  const statusUi = payment ? PAYMENT_STATUS_UI[payment.status] : null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Détail du paiement</DialogTitle>
          <DialogDescription>Consultez la transaction et modifiez son statut.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : payment ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                {payment.driver.avatarUrl ? <AvatarImage src={payment.driver.avatarUrl} alt={payment.driver.fullName} /> : null}
                <AvatarFallback>{initials(payment.driver.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold">{payment.driver.fullName}</div>
                <div className="text-sm text-muted-foreground">{payment.driver.phoneNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-md border bg-muted/40 p-3 min-[400px]:grid-cols-2 sm:gap-4 sm:p-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Montant</div>
                <div className={`mt-1 text-lg font-bold tabular-nums ${amountColorClass(payment.type)}`}>
                  {amountSign(payment.type)} {formatXaf(payment.amount)} XAF
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Date</div>
                <div className="mt-1 text-sm font-semibold">{formatShortDate(payment.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Type</div>
                <div className="mt-1.5">
                  {typeUi ? <Badge variant={typeUi.variant === 'red' ? 'red' : 'secondary'}>{typeUi.label}</Badge> : null}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Moyen de paiement</div>
                <div className="mt-1.5" data-testid="detail-method">
                  <PaymentMethodBadge method={payment.method} />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground">Statut</div>
                <div className="mt-1.5">{statusUi ? <Badge variant={statusUi.variant}>{statusUi.label}</Badge> : null}</div>
              </div>
            </div>

            {payment.proofUrl ? (
              <div className="rounded-md border p-3 text-sm" data-testid="detail-proof">
                <div className="text-xs font-medium text-muted-foreground">Preuve de paiement jointe par le chauffeur</div>
                <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block overflow-hidden rounded-md border">
                  <img src={payment.proofUrl} alt="Preuve de paiement" className="max-h-64 w-full object-contain bg-muted/40" />
                </a>
              </div>
            ) : null}

            {payment.status === 'REJECTED' && payment.note ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <div className="text-xs font-medium text-muted-foreground">Motif du refus</div>
                <div className="mt-1">{payment.note}</div>
              </div>
            ) : null}

            {rejecting ? (
              <div className="grid gap-2">
                <label htmlFor="reject-payment-note" className="text-sm font-medium">
                  Motif du refus <span className="font-normal text-muted-foreground">(optionnel, communiqué au chauffeur)</span>
                </label>
                <Textarea id="reject-payment-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300} />
              </div>
            ) : null}

            {payment.distribution ? (
              <div className="grid gap-2 rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Répartition du versement</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {payment.distribution.weekStatus === 'PARTIAL' ? <Badge variant="orange">Partiel · +1 semaine</Badge> : null}
                    {payment.distribution.rahimApplied ? <Badge variant="red">Clause Rahim</Badge> : null}
                  </div>
                </div>
                <ul className="divide-y text-sm">
                  {payment.distribution.investors.map((i) => (
                    <li key={i.investorId ?? i.fullName} className="flex items-center justify-between py-1.5">
                      <span>{i.fullName || 'Investisseur'}</span>
                      <span className="font-semibold tabular-nums">{formatXaf(i.amount)} XAF</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between py-1.5 text-muted-foreground">
                    <span>Commission admin (parts invendues, excédent)</span>
                    <span className="font-semibold tabular-nums">{formatXaf(payment.distribution.commission)} XAF</span>
                  </li>
                </ul>
                {payment.distribution.rahimApplied ? (
                  <p className="text-xs text-muted-foreground">
                    Le versement ne couvrait pas le dû des investisseurs : ils reçoivent 100 % du montant, l&apos;admin 0.
                  </p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Fermer
              </Button>
              {payment.status === 'PENDING' ? (
                <>
                  {rejecting ? (
                    <Button type="button" variant="destructive" disabled={submitting} onClick={() => void handleStatusChange('REJECTED', note)}>
                      {submitting ? 'Refus…' : 'Confirmer le refus'}
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" disabled={submitting} onClick={() => setRejecting(true)}>
                      Refuser
                    </Button>
                  )}
                  <Button type="button" disabled={submitting} onClick={() => void handleStatusChange('VERIFIED')}>
                    {submitting ? 'Validation…' : 'Valider'}
                  </Button>
                </>
              ) : (
                <Button type="button" variant="secondary" disabled={submitting} onClick={() => void handleStatusChange('PENDING')}>
                  {submitting ? 'Mise à jour…' : 'Remettre en attente'}
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Paiement introuvable.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
