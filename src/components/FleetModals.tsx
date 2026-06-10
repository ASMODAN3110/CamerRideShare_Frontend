import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { createMoto, deleteMoto, getMoto, updateMoto } from '../services/fleetService'
import { listDriversFromApi, listInvestorsFromApi, userSelectErrorMessage } from '../services/usersService'
import { DEFAULT_MOTO_IMAGE, STATUS_UI } from '../lib/fleet'
import { formatShortDate, formatXafLabel } from '../lib/format'
import { ApiError } from '../types/auth'
import type {
  CreateMotoPayload,
  Driver,
  Investor,
  MotoDetail,
  MotoFilters,
  MotoStatus,
  UpdateMotoPayload,
} from '../types/api'

// ─── Modal wrapper ──────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}

function Modal({ isOpen, onClose, title, children, wide }: ModalProps) {
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
      aria-labelledby="fleet-modal-title"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={[
          'max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900',
          wide ? 'max-w-2xl' : 'max-w-lg',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="fleet-modal-title" className="text-lg font-semibold text-slate-900 dark:text-slate-50">
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

function inputCls() {
  return [
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900',
    'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
    'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
  ].join(' ')
}

// ─── CreateMotoModal ────────────────────────────────────────────────────────

interface CreateMotoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  filterOptions: MotoFilters | null
}

export function CreateMotoModal({ isOpen, onClose, onSuccess, filterOptions }: CreateMotoModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loadingAux, setLoadingAux] = useState(false)
  const [matricule, setMatricule] = useState('')
  const [model, setModel] = useState('')
  const [city, setCity] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [driverId, setDriverId] = useState(0)
  const [investorId, setInvestorId] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setMatricule('')
    setModel('')
    setCity('')
    setTargetAmount('')
    setDriverId(0)
    setInvestorId(0)
    setImageUrl('')
    setError(null)
    setSubmitting(false)
    setLoadingAux(true)
    Promise.all([listDriversFromApi(), listInvestorsFromApi()])
      .then(([d, i]) => {
        setDrivers(d)
        setInvestors(i)
      })
      .catch((err) => setError(userSelectErrorMessage(err)))
      .finally(() => setLoadingAux(false))
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const amount = parseInt(targetAmount, 10)
    if (!matricule.trim()) {
      setError('Matricule requis')
      return
    }
    if (!model.trim()) {
      setError('Modèle requis')
      return
    }
    if (!city.trim()) {
      setError('Ville requise')
      return
    }
    if (!targetAmount || isNaN(amount) || amount < 1) {
      setError('Montant cible invalide (minimum 1 FCFA)')
      return
    }

    const body: CreateMotoPayload = {
      matricule: matricule.trim(),
      model: model.trim(),
      city: city.trim(),
      targetAmount: amount,
    }
    if (driverId > 0) body.driverId = driverId
    if (investorId > 0) body.investorId = investorId
    if (imageUrl.trim()) body.imageUrl = imageUrl.trim()

    setSubmitting(true)
    try {
      await createMoto(body)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError('Ce matricule existe déjà')
      } else {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la création'
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const modelOptions = filterOptions?.models ?? []
  const cityOptions = filterOptions?.cities ?? []

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une moto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Matricule</label>
          <input
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            placeholder="LT 9999 X"
            className={inputCls()}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Modèle</label>
            {modelOptions.length > 0 ? (
              <select value={model} onChange={(e) => setModel(e.target.value)} className={inputCls()} required>
                <option value="">Sélectionner</option>
                {modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="125cc"
                className={inputCls()}
                required
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ville</label>
            {cityOptions.length > 0 ? (
              <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls()} required>
                <option value="">Sélectionner</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Douala"
                className={inputCls()}
                required
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant cible (XAF)</label>
          <input
            type="number"
            min={1}
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="5000000"
            className={inputCls()}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Chauffeur <span className="text-slate-400">(optionnel)</span>
            </label>
            <select value={driverId} onChange={(e) => setDriverId(Number(e.target.value))} className={inputCls()}>
              <option value={0}>{loadingAux ? 'Chargement…' : 'Aucun'}</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} — {d.phoneNumber}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Investisseur <span className="text-slate-400">(optionnel)</span>
            </label>
            <select value={investorId} onChange={(e) => setInvestorId(Number(e.target.value))} className={inputCls()}>
              <option value={0}>{loadingAux ? 'Chargement…' : 'Aucun'}</option>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            URL image <span className="text-slate-400">(optionnel)</span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className={inputCls()}
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
            {submitting ? 'Création…' : 'Créer la moto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── MotoDetailModal ────────────────────────────────────────────────────────

interface MotoDetailModalProps {
  motoId: number | null
  onClose: () => void
  onSuccess: () => void
  filterOptions: MotoFilters | null
}

export function MotoDetailModal({ motoId, onClose, onSuccess, filterOptions }: MotoDetailModalProps) {
  const isOpen = motoId != null
  const [moto, setMoto] = useState<MotoDetail | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [matricule, setMatricule] = useState('')
  const [model, setModel] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [financedAmount, setFinancedAmount] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState<MotoStatus>('ACTIVE')
  const [driverId, setDriverId] = useState<number | null>(null)
  const [investorId, setInvestorId] = useState<number | null>(null)
  const [city, setCity] = useState('')
  const [lastMaintenanceAt, setLastMaintenanceAt] = useState('')

  const modelOptions = filterOptions?.models ?? []
  const cityOptions = filterOptions?.cities ?? []

  const ownershipPct = useMemo(() => {
    const target = parseInt(targetAmount, 10)
    const financed = parseInt(financedAmount, 10)
    if (!target || isNaN(target)) return 0
    if (isNaN(financed)) return moto?.ownershipPct ?? 0
    return Math.round((financed / target) * 100)
  }, [targetAmount, financedAmount, moto?.ownershipPct])

  const statusUi = STATUS_UI[status]

  useEffect(() => {
    if (!isOpen || motoId == null) return
    setMoto(null)
    setError(null)
    setLoading(true)
    Promise.all([getMoto(motoId), listDriversFromApi(), listInvestorsFromApi()])
      .then(([detail, d, i]) => {
        setMoto(detail)
        setDrivers(d)
        setInvestors(i)
        setMatricule(detail.matricule)
        setModel(detail.model)
        setTargetAmount(String(detail.targetAmount))
        setFinancedAmount(String(detail.financedAmount))
        setImageUrl(detail.imageUrl ?? '')
        setStatus(detail.status)
        setDriverId(detail.driver?.id ?? null)
        setInvestorId(detail.investor?.id ?? null)
        setCity(detail.city)
        setLastMaintenanceAt(detail.lastMaintenanceAt ?? '')
      })
      .catch((err) => setError(userSelectErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [isOpen, motoId])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!moto) return
    setError(null)

    const target = parseInt(targetAmount, 10)
    const financed = parseInt(financedAmount, 10)

    if (!matricule.trim()) {
      setError('Matricule requis')
      return
    }
    if (!model.trim()) {
      setError('Modèle requis')
      return
    }
    if (!city.trim()) {
      setError('Ville requise')
      return
    }
    if (!targetAmount || isNaN(target) || target < 1) {
      setError('Montant cible invalide (minimum 1 FCFA)')
      return
    }
    if (financedAmount === '' || isNaN(financed) || financed < 0) {
      setError('Montant financé invalide')
      return
    }
    if (financed > target) {
      setError('Le montant financé ne peut pas dépasser le montant cible')
      return
    }

    const body: UpdateMotoPayload = {
      matricule: matricule.trim(),
      model: model.trim(),
      city: city.trim(),
      targetAmount: target,
      financedAmount: financed,
      imageUrl: imageUrl.trim() || undefined,
      status,
      driverId,
      investorId,
      lastMaintenanceAt: lastMaintenanceAt || null,
    }

    setSubmitting(true)
    try {
      await updateMoto(moto.id, body)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError('Ce matricule existe déjà')
      } else {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!moto) return
    const confirmed = window.confirm(
      `Retirer la moto # ${matricule} du parc ? Cette action est irréversible.`,
    )
    if (!confirmed) return

    setError(null)
    setDeleting(true)
    try {
      await deleteMoto(moto.id)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(
          err.message ||
            'Impossible de supprimer : incidents ouverts liés à cette moto',
        )
      } else if (err instanceof ApiError && err.statusCode === 404) {
        setError('Moto introuvable')
      } else {
        const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression'
        setError(msg)
      }
    } finally {
      setDeleting(false)
    }
  }

  const previewImage = imageUrl.trim() || DEFAULT_MOTO_IMAGE
  const displayFinanced = parseInt(financedAmount, 10)
  const displayTarget = parseInt(targetAmount, 10)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails de la moto" wide>
      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : error && !moto ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : moto ? (
        <div className="space-y-6">
          <div className="relative h-40 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <img
              src={previewImage}
              alt={`Moto ${matricule}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = DEFAULT_MOTO_IMAGE
              }}
            />
            <div className="absolute right-3 top-3">
              <Badge variant={statusUi.variant} className="shadow-sm">
                {statusUi.label}
              </Badge>
            </div>
            <div className="absolute bottom-3 left-3">
              <span className="inline-flex items-center rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                # {matricule}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">Progression Propriété</span>
              <span className="font-bold text-blue-600 dark:text-blue-300">{ownershipPct}%</span>
            </div>
            <Progress value={ownershipPct} className="h-2" />
            <div className="text-xs text-slate-400">
              {formatXafLabel(isNaN(displayFinanced) ? moto.financedAmount : displayFinanced)} /{' '}
              {formatXafLabel(isNaN(displayTarget) ? moto.targetAmount : displayTarget)}
            </div>
          </div>

          {moto.openIncidents.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Incidents ouverts</h3>
              <ul className="space-y-2">
                {moto.openIncidents.map((inc) => (
                  <li
                    key={inc.id}
                    className="rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 text-sm dark:border-red-900/40 dark:bg-red-950/20"
                  >
                    <div className="font-medium text-red-700 dark:text-red-300">{inc.type}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{inc.description}</div>
                    <div className="mt-1 text-xs text-slate-400">{formatShortDate(inc.createdAt)}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {moto.recentPayments.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Paiements récents (chauffeur)
              </h3>
              <ul className="space-y-1.5">
                {moto.recentPayments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                  >
                    <span className="text-slate-600 dark:text-slate-300">
                      {p.type === 'PAYMENT' ? 'Paiement' : 'Dépense'} — {p.status}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {formatXafLabel(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <form onSubmit={handleSave} className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Modifier</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Matricule</label>
                <input
                  type="text"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  className={inputCls()}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Modèle</label>
                {modelOptions.length > 0 ? (
                  <select value={model} onChange={(e) => setModel(e.target.value)} className={inputCls()} required>
                    <option value="">Sélectionner</option>
                    {modelOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={inputCls()}
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant cible (XAF)</label>
                <input
                  type="number"
                  min={1}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className={inputCls()}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Montant financé (XAF)</label>
                <input
                  type="number"
                  min={0}
                  value={financedAmount}
                  onChange={(e) => setFinancedAmount(e.target.value)}
                  className={inputCls()}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                URL image <span className="text-slate-400">(optionnel)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className={inputCls()}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MotoStatus)}
                  className={inputCls()}
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="BROKEN">En panne</option>
                  <option value="STOLEN">Indisponible</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ville</label>
                {cityOptions.length > 0 ? (
                  <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls()} required>
                    <option value="">Sélectionner</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputCls()}
                    required
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chauffeur</label>
                <select
                  value={driverId ?? 0}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setDriverId(v > 0 ? v : null)
                  }}
                  className={inputCls()}
                >
                  <option value={0}>Aucun</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Investisseur</label>
                <select
                  value={investorId ?? 0}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setInvestorId(v > 0 ? v : null)
                  }}
                  className={inputCls()}
                >
                  <option value={0}>Aucun</option>
                  {investors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dernier entretien</label>
              <input
                type="date"
                value={lastMaintenanceAt}
                onChange={(e) => setLastMaintenanceAt(e.target.value)}
                className={inputCls()}
              />
            </div>

            {error ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Fermer
              </Button>
              <Button
                type="submit"
                disabled={submitting || deleting}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button
              type="button"
              disabled={deleting || submitting || loading}
              onClick={() => void handleDelete()}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              {deleting ? 'Suppression…' : 'Retirer du parc'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
