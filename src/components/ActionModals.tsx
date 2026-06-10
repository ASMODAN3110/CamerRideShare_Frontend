import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from './ui/button'
import { listDriversFromApi, userSelectErrorMessage } from '../services/usersService'
import { listAllMotos } from '../services/fleetService'
import { createPayment } from '../services/transactionsService'
import { createIncident } from '../services/incidentsService'
import { inviteInvestor } from '../services/invitationsService'
import { ApiError } from '../types/auth'
import type { Driver, MotoListItem } from '../types/api'

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
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
    </div>
  )
}

// ─── Form field helpers ─────────────────────────────────────────────────────

function inputCls() {
  return [
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900',
    'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
    'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
  ].join(' ')
}

// ─── PaymentModal ───────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [driverId, setDriverId] = useState(0)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'PAYMENT' | 'EXPENSE'>('PAYMENT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setDriverId(0)
    setAmount('')
    setType('PAYMENT')
    setError(null)
    setSubmitting(false)
    setLoadingDrivers(true)
    listDriversFromApi()
      .then(setDrivers)
      .catch((err) => setError(userSelectErrorMessage(err)))
      .finally(() => setLoadingDrivers(false))
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const amountNum = parseInt(amount, 10)
    if (!driverId) {
      setError('Veuillez sélectionner un chauffeur')
      return
    }
    if (!amount || isNaN(amountNum) || amountNum < 1) {
      setError('Montant invalide (minimum 1 FCFA)')
      return
    }

    setSubmitting(true)
    try {
      await createPayment({ driverId, amount: amountNum, type })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du paiement'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saisir un Paiement">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chauffeur */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chauffeur</label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(Number(e.target.value))}
            className={inputCls()}
            required
          >
            <option value={0}>
              {loadingDrivers ? 'Chargement…' : 'Sélectionner un chauffeur'}
            </option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} — {d.phoneNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Type toggle */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('PAYMENT')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                type === 'PAYMENT'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Paiement
            </button>
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                type === 'EXPENSE'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Dépense
            </button>
          </div>
        </div>

        {/* Montant */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant (FCFA)</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ex: 15000"
            className={inputCls()}
            required
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : 'Valider le paiement'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── IncidentModal ──────────────────────────────────────────────────────────

interface IncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function IncidentModal({ isOpen, onClose, onSuccess }: IncidentModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [motos, setMotos] = useState<MotoListItem[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [loadingMotos, setLoadingMotos] = useState(false)
  const [driverId, setDriverId] = useState(0)
  const [motoId, setMotoId] = useState(0)
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PRESET_TYPES = ['ACCIDENT', 'THEFT_ATTEMPT', 'Vol', 'Panne', 'Agression', 'Perte']

  const motosForDriver = useMemo(
    () => motos.filter((m) => !driverId || m.driver?.id === driverId),
    [motos, driverId],
  )

  useEffect(() => {
    if (motoId > 0 && !motosForDriver.some((m) => m.id === motoId)) {
      setMotoId(0)
    }
  }, [driverId, motoId, motosForDriver])

  useEffect(() => {
    if (!isOpen) return
    setDriverId(0)
    setMotoId(0)
    setType('')
    setDescription('')
    setError(null)
    setSubmitting(false)

    setLoadingDrivers(true)
    setLoadingMotos(true)
    listDriversFromApi()
      .then(setDrivers)
      .catch((err) => setError(userSelectErrorMessage(err)))
      .finally(() => setLoadingDrivers(false))
    listAllMotos()
      .then(setMotos)
      .catch(() => {
        /* motos are optional */
      })
      .finally(() => setLoadingMotos(false))
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!driverId) {
      setError('Veuillez sélectionner un chauffeur')
      return
    }
    if (!type.trim()) {
      setError("Veuillez préciser le type d'incident")
      return
    }
    if (!description.trim()) {
      setError("Veuillez décrire l'incident")
      return
    }

    setSubmitting(true)
    try {
      await createIncident({
        driverId,
        motoId: motoId > 0 ? motoId : undefined,
        type: type.trim(),
        description: description.trim(),
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du signalement'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Signaler un Incident">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Chauffeur */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chauffeur</label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(Number(e.target.value))}
            className={inputCls()}
            required
          >
            <option value={0}>
              {loadingDrivers ? 'Chargement…' : 'Sélectionner un chauffeur'}
            </option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} — {d.phoneNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Moto (optionnel) */}
        {motosForDriver.length > 0 ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Moto concernée <span className="text-slate-400">(optionnel)</span>
            </label>
            <select
              value={motoId}
              onChange={(e) => setMotoId(Number(e.target.value))}
              className={inputCls()}
            >
              <option value={0}>
                {loadingMotos ? 'Chargement…' : 'Aucune moto sélectionnée'}
              </option>
              {motosForDriver.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.matricule} — {m.model} — {m.city}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Type d'incident */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Type d&apos;incident
          </label>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Ex: Accident, Vol, Panne…"
            list="incident-types"
            className={inputCls()}
            required
          />
          <datalist id="incident-types">
            {PRESET_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez l'incident en détail…"
            rows={3}
            className={`${inputCls()} resize-none`}
            required
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : "Signaler l'incident"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── InvitationModal ────────────────────────────────────────────────────────

interface InvitationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InvitationModal({ isOpen, onClose, onSuccess }: InvitationModalProps) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setEmail('')
    setError(null)
    setSubmitting(false)
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Veuillez saisir une adresse email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Adresse email invalide')
      return
    }

    setSubmitting(true)
    try {
      await inviteInvestor({ email: email.trim(), role: 'INVESTOR' })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erreur lors de l'envoi de l'invitation"
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inviter un Investisseur">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="investisseur@example.com"
            className={inputCls()}
            required
          />
          <p className="text-xs text-slate-400">
            Une invitation sera envoyée par email à cette adresse.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Envoi…' : "Envoyer l'invitation"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
