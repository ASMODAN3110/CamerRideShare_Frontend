import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { getPayment, updatePaymentStatus } from '../services/paymentsService'
import { formatShortDate, formatXaf, initials } from '../lib/format'
import { PAYMENT_STATUS_UI, PAYMENT_TYPE_UI, amountColorClass, amountSign } from '../lib/payments'
import { ApiError } from '../types/auth'
import type { PaymentDetail, PaymentStatus } from '../types/api'

// ─── Modal wrapper ──────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="payment-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

// ─── PaymentDetailModal ─────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!isOpen || paymentId == null) return
    setPayment(null)
    setError(null)
    setLoading(true)
    getPayment(paymentId)
      .then(setPayment)
      .catch((err: unknown) => {
        const msg = err instanceof ApiError ? err.message : 'Erreur chargement du paiement'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [isOpen, paymentId])

  const handleStatusChange = async (status: PaymentStatus) => {
    if (paymentId == null) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await updatePaymentStatus(paymentId, status)
      setPayment(updated)
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const typeUi = payment ? PAYMENT_TYPE_UI[payment.type] : null
  const statusUi = payment ? PAYMENT_STATUS_UI[payment.status] : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détail du paiement">
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
      ) : payment ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              {payment.driver.avatarUrl ? (
                <AvatarImage
                  src={payment.driver.avatarUrl}
                  alt={payment.driver.fullName}
                  className="h-full w-full object-cover"
                />
              ) : null}
              <AvatarFallback>{initials(payment.driver.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 dark:text-slate-50">{payment.driver.fullName}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{payment.driver.phoneNumber}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Montant</div>
              <div className={`mt-1 text-lg font-bold ${amountColorClass(payment.type)}`}>
                {amountSign(payment.type)} {formatXaf(payment.amount)} XAF
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Date</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                {formatShortDate(payment.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Type</div>
              <div className="mt-1.5">
                {typeUi ? (
                  <Badge variant={typeUi.variant === 'red' ? 'red' : 'default'} className="px-2.5 py-1">
                    {typeUi.label}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Statut</div>
              <div className="mt-1.5">
                {statusUi ? (
                  <Badge variant={statusUi.variant} className="gap-1.5 px-2.5 py-1">
                    <span className={['h-2 w-2 rounded-full', statusUi.dot].join(' ')} />
                    {statusUi.label}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Fermer
            </Button>
            {payment.status === 'PENDING' ? (
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void handleStatusChange('VERIFIED')}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Validation…' : 'Valider'}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={submitting}
                onClick={() => void handleStatusChange('PENDING')}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Mise à jour…' : 'Remettre en attente'}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {error ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">Paiement introuvable.</p>
          )}
          <Button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Fermer
          </Button>
        </div>
      )}
    </Modal>
  )
}
