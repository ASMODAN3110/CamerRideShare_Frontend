import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle, Ban, FileText, Plus, Printer, UserMinus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ImageUpload from './ImageUpload'
import RemoteSelect from './RemoteSelect'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadContract, printContract } from '../lib/contracts'
import { VEHICLE_TYPE_LABEL } from '../lib/vehicles'
import { getAdminSettings } from '../services/adminSettingsService'
import { createMoto, deleteMoto, getMoto, updateMoto } from '../services/fleetService'
import { listDriversFromApi, listInvestorsFromApi } from '../services/usersService'
import { classifyVehicleLoss, getDriverTerminations, terminateDriverContract } from '../services/terminationService'
import { DRIVER_REASONS, investorResultMessage, REASON_LABEL } from '../lib/termination'
import { TerminationDialog } from './TerminationDialog'
import { InvestorTerminationDialog } from './InvestorTerminationDialog'
import DriverArrearsWarning from './DriverArrearsWarning'
import { DEFAULT_MOTO_IMAGE, STATUS_UI } from '../lib/fleet'
import { formatShortDate, formatXafLabel } from '../lib/format'
import { defaultWeeklyAmount, MAX_PLAN_WEEKS, MIN_INVESTMENT_XAF, planWeeks, purchasePrice } from '../lib/investmentRules'
import { ApiError } from '../types/auth'
import type {
  CreateMotoPayload,
  DriverTerminationRow,
  MotoDetail,
  MotoFilters,
  MotoStatus,
  TerminationReason,
  UpdateMotoPayload,
  VehicleType,
} from '../types/api'

// ─── Helpers de formulaire ──────────────────────────────────────────────────

function Field(props: { label: ReactNode; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={props.htmlFor}>{props.label}</Label>
      {props.children}
      {props.hint ? <p className="text-xs text-muted-foreground">{props.hint}</p> : null}
    </div>
  )
}

const Optional = () => <span className="font-normal text-muted-foreground">(optionnel)</span>

function FormError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}

/** Liste de valeurs texte (ville) ; retombe sur un champ libre si aucune option n'est connue. */
function OptionField(props: {
  id: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
}) {
  if (props.options.length === 0) {
    return (
      <Input id={props.id} type="text" value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} required />
    )
  }
  return (
    <Select value={props.value || undefined} onValueChange={props.onChange} required>
      <SelectTrigger id={props.id} className="w-full">
        <SelectValue placeholder="Sélectionner" />
      </SelectTrigger>
      <SelectContent>
        {props.options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Rappel de la règle des 160 % : prix d'achat financé par les investisseurs et versement hebdomadaire du chauffeur. */
function targetHint(targetAmount: string) {
  const target = parseInt(targetAmount, 10)
  if (!target || target < 1) return "Total remboursé par le chauffeur : 160 % du prix d'achat de la moto."
  return `Prix d'achat financé par les investisseurs : ${formatXafLabel(purchasePrice(target))} (la cible en représente 160 %).`
}

/** Versement par défaut : celui des paramètres de la plateforme (plafonné à la cible), sinon la cible répartie sur 32 semaines. */
function proposedWeekly(target: number, platformWeekly: number) {
  return platformWeekly > 0 ? Math.min(platformWeekly, target) : defaultWeeklyAmount(target)
}

/** Versement hebdomadaire retenu : celui saisi, sinon le versement par défaut. */
function effectiveWeekly(targetAmount: string, weeklyAmount: string, platformWeekly = 0) {
  const target = parseInt(targetAmount, 10)
  const weekly = parseInt(weeklyAmount, 10)
  if (weekly > 0) return weekly
  return target > 0 ? proposedWeekly(target, platformWeekly) : 0
}

/** Durée du contrat déduite de la cible et du versement hebdomadaire. */
function weeklyHint(targetAmount: string, weeklyAmount: string, platformWeekly = 0) {
  const target = parseInt(targetAmount, 10)
  const weekly = effectiveWeekly(targetAmount, weeklyAmount, platformWeekly)
  if (!target || target < 1 || weekly < 1) return 'La durée du contrat est déduite : montant cible ÷ versement par semaine.'
  if (weekly > target) return 'Le versement hebdomadaire ne peut pas dépasser le montant cible.'
  const weeks = planWeeks(target, weekly)
  if (weeks > MAX_PLAN_WEEKS) return `Contrat de ${weeks} semaines : trop long (maximum ${MAX_PLAN_WEEKS}). Augmentez le versement.`
  const last = target - (weeks - 1) * weekly
  return `Contrat de ${weeks} semaine${weeks > 1 ? 's' : ''} (${formatXafLabel(target)} ÷ ${formatXafLabel(weekly)})${last < weekly ? ` · dernier versement : ${formatXafLabel(last)}` : ''}.`
}

/** Erreur de validation du versement hebdomadaire, ou null. */
function weeklyError(targetAmount: string, weeklyAmount: string, platformWeekly = 0): string | null {
  const target = parseInt(targetAmount, 10)
  const weekly = effectiveWeekly(targetAmount, weeklyAmount, platformWeekly)
  if (weeklyAmount !== '' && !(parseInt(weeklyAmount, 10) >= 1)) return 'Versement hebdomadaire invalide (minimum 1 FCFA)'
  if (target > 0 && weekly > target) return 'Le versement hebdomadaire ne peut pas dépasser le montant cible'
  if (target > 0 && weekly > 0 && planWeeks(target, weekly) > MAX_PLAN_WEEKS) {
    return `Avec ce versement, le contrat durerait plus de ${MAX_PLAN_WEEKS} semaines`
  }
  return null
}

/** Chauffeurs : recherche faite par le serveur. Un chauffeur déjà rattaché à une autre moto n'est pas sélectionnable. */
function makeFetchDrivers(currentMotoId?: number) {
  return (search: string) =>
    listDriversFromApi({ search, limit: 20 }).then((drivers) =>
      drivers.map((d) => ({
        id: d.id,
        label: `${d.fullName} — ${d.activeMoto ? `moto ${d.activeMoto.matricule}` : 'libre'}`,
        disabled: d.activeMoto != null && d.activeMoto.id !== currentMotoId,
      })),
    )
}

const fetchDrivers = makeFetchDrivers()

function fetchInvestors(search: string) {
  return listInvestorsFromApi({ search, limit: 20 }).then((investors) =>
    investors.map((i) => ({ id: i.id, label: i.fullName })),
  )
}

// ─── Parts des investisseurs ────────────────────────────────────────────────

export interface PartRow {
  /** Identifiant de la part existante ; absent pour une nouvelle part. */
  id?: number
  /** 0 tant que l'investisseur n'est pas choisi. */
  investorId: number
  investorName?: string
  /** Montant de l'apport, saisi librement à partir de 50 000 XAF. */
  amount: string
  /** Date de l'apport d'une part existante. */
  createdAt?: string
  /** Part résiliée : lecture seule, elle ne reçoit plus de versements. */
  closedAt?: string | null
  closeReason?: TerminationReason | null
  /** Capital libéré par la résiliation (remboursé ou réaffecté) : il ne compte plus comme financé. */
  released?: number
}

const partAmount = (row: PartRow) => parseInt(row.amount, 10) || 0

/** Capital que la part retient encore sur le véhicule : l'apport, moins ce que la résiliation a libéré. */
const heldAmount = (row: PartRow) => Math.max(partAmount(row) - (row.released ?? 0), 0)

/** Erreur de validation des parts (investisseur choisi, minimum de 50 000 par nouvel apport, total ≤ prix d'achat), ou null. */
function partsError(rows: PartRow[], targetAmount: number): string | null {
  if (rows.some((r) => r.investorId < 1)) return 'Choisissez un investisseur pour chaque ligne'
  if (rows.some((r) => r.id === undefined && partAmount(r) < MIN_INVESTMENT_XAF)) {
    return `Chaque part doit être d'au moins ${formatXafLabel(MIN_INVESTMENT_XAF)}`
  }
  const funded = rows.reduce((sum, r) => sum + heldAmount(r), 0)
  if (funded > purchasePrice(targetAmount)) {
    return `${formatXafLabel(funded)} investis pour ${formatXafLabel(purchasePrice(targetAmount))} à financer`
  }
  return null
}

/**
 * Parts d'une moto : chaque ligne est l'apport d'un investisseur (minimum 50 000 XAF, montant libre).
 * Un investisseur peut avoir plusieurs parts sur la même moto.
 */
function PartsEditor(props: {
  idPrefix: string
  targetAmount: number
  value: PartRow[]
  onChange: (rows: PartRow[]) => void
  /** Demande de résiliation du contrat d'une part existante. */
  onTerminate?: (row: PartRow) => void
}) {
  const price = purchasePrice(props.targetAmount)
  const funded = props.value.reduce((sum, r) => sum + heldAmount(r), 0)
  const remaining = price - funded
  const canAdd = price > 0 && remaining >= MIN_INVESTMENT_XAF && props.value.every((r) => r.investorId > 0)

  const update = (index: number, patch: Partial<PartRow>) =>
    props.onChange(props.value.map((row, i) => (i === index ? { ...row, ...patch } : row)))

  return (
    <div className="grid min-w-0 gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Parts des investisseurs</Label>
        <Badge variant={remaining < 0 ? 'red' : remaining === 0 && price > 0 ? 'green' : 'secondary'}>
          {formatXafLabel(funded)} / {formatXafLabel(price)} financés
        </Badge>
      </div>

      {props.value.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucune part : les {formatXafLabel(price)} du prix d&apos;achat restent à financer.
        </p>
      ) : null}

      {props.value.map((row, index) =>
        row.closedAt ? (
          <div key={row.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2 text-sm">
            <span className="min-w-0 truncate">
              {row.investorName} · <span className="tabular-nums">{formatXafLabel(partAmount(row))}</span>
            </span>
            <Badge variant={row.closeReason === 'LOSS' ? 'red' : 'secondary'}>
              {row.closeReason === 'LOSS' ? 'Perte' : 'Résilié'} le {formatShortDate(row.closedAt)}
            </Badge>
            {row.released ? <span className="w-full text-xs text-muted-foreground">Capital libéré : {formatXafLabel(row.released)} (remboursé ou réaffecté)</span> : null}
          </div>
        ) : (
        <div key={row.id ?? `new-${index}`} className="grid min-w-0 gap-1">
          <div className="grid grid-cols-[minmax(0,1fr)_6.5rem_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
            <RemoteSelect
              id={`${props.idPrefix}-investor-${index}`}
              aria-label="Investisseur"
              value={row.investorId}
              selectedLabel={row.investorName}
              placeholder="Choisir un investisseur"
              fetchOptions={fetchInvestors}
              onChange={(o) => update(index, { investorId: o?.id ?? 0, investorName: o?.label })}
            />
            <Input
              type="number"
              min={MIN_INVESTMENT_XAF}
              value={row.amount}
              onChange={(e) => update(index, { amount: e.target.value })}
              aria-label="Montant de la part"
              placeholder="Montant"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Retirer cette part"
              onClick={() => props.onChange(props.value.filter((_, i) => i !== index))}
            >
              <X />
            </Button>
          </div>
          {row.createdAt ? (
            <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              <span>Apport du {formatShortDate(row.createdAt)}</span>
              {row.id !== undefined && props.onTerminate ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-destructive"
                  onClick={() => props.onTerminate?.(row)}
                >
                  Résilier ce contrat
                </Button>
              ) : null}
            </p>
          ) : null}
        </div>
        ),
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canAdd}
          onClick={() => props.onChange([...props.value, { investorId: 0, amount: String(Math.min(MIN_INVESTMENT_XAF, remaining)) }])}
        >
          <Plus />
          Ajouter une part
        </Button>
        <span className={remaining < 0 ? 'text-xs font-semibold text-destructive' : 'text-xs text-muted-foreground'}>
          {remaining < 0 ? `${formatXafLabel(-remaining)} en trop` : `Reste à financer : ${formatXafLabel(remaining)}`}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Chaque part est un apport d&apos;au moins {formatXafLabel(MIN_INVESTMENT_XAF)}. Un investisseur peut avoir plusieurs parts sur la même moto.
      </p>
    </div>
  )
}

// ─── CreateMotoModal ────────────────────────────────────────────────────────

interface CreateMotoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  filterOptions: MotoFilters | null
}

export function CreateMotoModal({ isOpen, onClose, onSuccess, filterOptions }: CreateMotoModalProps) {
  const [matricule, setMatricule] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTO')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [city, setCity] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [weeklyAmount, setWeeklyAmount] = useState('')
  // versement par défaut des paramètres de la plateforme (0 = cible ÷ 32)
  const [platformWeekly, setPlatformWeekly] = useState(0)
  const [driverId, setDriverId] = useState(0)
  const [driverName, setDriverName] = useState('')
  const [partRows, setPartRows] = useState<PartRow[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setMatricule('')
    setVehicleType('MOTO')
    setBrand('')
    setModel('')
    setYear('')
    setCity('')
    setTargetAmount('')
    setWeeklyAmount('')
    setDriverId(0)
    setDriverName('')
    setPartRows([])
    setImageUrl('')
    setError(null)
    setSubmitting(false)
    getAdminSettings()
      .then((s) => setPlatformWeekly(s.platform.defaultWeeklyAmount))
      .catch(() => setPlatformWeekly(0))
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const amount = parseInt(targetAmount, 10)
    if (!matricule.trim()) return setError('Immatriculation requise')
    if (year && !(parseInt(year, 10) >= 1980 && parseInt(year, 10) <= 2100)) return setError('Année invalide')
    if (!city.trim()) return setError('Ville requise')
    if (!targetAmount || isNaN(amount) || amount < 1) return setError('Montant cible invalide (minimum 1 FCFA)')
    const weeklyProblem = weeklyError(targetAmount, weeklyAmount, platformWeekly)
    if (weeklyProblem) return setError(weeklyProblem)

    const body: CreateMotoPayload = {
      matricule: matricule.trim(),
      city: city.trim(),
      vehicleType,
      targetAmount: amount,
    }
    if (brand.trim()) body.brand = brand.trim()
    if (model.trim()) body.model = model.trim()
    if (year) body.year = parseInt(year, 10)
    if (weeklyAmount !== '') body.weeklyAmount = parseInt(weeklyAmount, 10)
    if (driverId > 0) body.driverId = driverId
    const partsProblem = partsError(partRows, amount)
    if (partsProblem) return setError(partsProblem)
    if (partRows.length > 0) body.investors = partRows.map((r) => ({ investorId: r.investorId, amount: partAmount(r) }))
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
        setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un véhicule</DialogTitle>
          <DialogDescription>Enregistrez une nouvelle moto ou un nouveau taxi dans le parc.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid grid-cols-[minmax(0,1fr)] gap-4">
          <Field label="Immatriculation" htmlFor="new-matricule">
            <Input id="new-matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} placeholder="LT 9999 X" required />
          </Field>

          <Field label="Type de véhicule" htmlFor="new-type">
            <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
              <SelectTrigger id="new-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MOTO">Moto</SelectItem>
                <SelectItem value="TAXI">Taxi</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-3">
            <Field label={<>Marque <Optional /></>} htmlFor="new-brand">
              <Input id="new-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Toyota" maxLength={60} />
            </Field>
            <Field label={<>Modèle <Optional /></>} htmlFor="new-model">
              <Input id="new-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Corolla" maxLength={60} />
            </Field>
            <Field label={<>Année <Optional /></>} htmlFor="new-year">
              <Input id="new-year" type="number" min={1980} max={2100} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
            </Field>
          </div>


          <Field label="Ville" htmlFor="new-city">
            <OptionField id="new-city" value={city} onChange={setCity} options={filterOptions?.cities ?? []} placeholder="Douala" />
          </Field>

          <Field label="Montant cible (XAF)" htmlFor="new-target" hint={targetHint(targetAmount)}>
            <Input id="new-target" type="number" min={1} value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="800000" required />
          </Field>

          <Field label={<>Versement par semaine (XAF) <Optional /></>} htmlFor="new-weekly" hint={weeklyHint(targetAmount, weeklyAmount, platformWeekly)}>
            <Input
              id="new-weekly"
              type="number"
              min={1}
              value={weeklyAmount}
              onChange={(e) => setWeeklyAmount(e.target.value)}
              placeholder={parseInt(targetAmount, 10) > 0 ? String(proposedWeekly(parseInt(targetAmount, 10), platformWeekly)) : '25000'}
            />
          </Field>

          <Field label={<>Chauffeur <Optional /></>} htmlFor="new-driver">
            <RemoteSelect
              id="new-driver"
              value={driverId}
              selectedLabel={driverName}
              placeholder="Aucun"
              noneLabel="Aucun"
              fetchOptions={fetchDrivers}
              onChange={(o) => {
                setDriverId(o?.id ?? 0)
                setDriverName(o?.label ?? '')
              }}
            />
          </Field>
          {driverId > 0 ? <DriverArrearsWarning driverId={driverId} /> : null}

          <PartsEditor
            idPrefix="new"
            targetAmount={parseInt(targetAmount, 10) || 0}
            value={partRows}
            onChange={setPartRows}
          />

          <Field label={<>Photo du véhicule <Optional /></>} htmlFor="new-image">
            <ImageUpload id="new-image" value={imageUrl} onChange={setImageUrl} disabled={submitting} />
          </Field>

          <FormError error={error} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Création…' : 'Créer le véhicule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [contractBusy, setContractBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // résiliations : conducteur du véhicule, véhicule perdu, ou part d'un investisseur
  const [terminateDriverOpen, setTerminateDriverOpen] = useState(false)
  const [lossOpen, setLossOpen] = useState(false)
  const [terminatePart, setTerminatePart] = useState<PartRow | null>(null)
  const [terminations, setTerminations] = useState<DriverTerminationRow[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const [matricule, setMatricule] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('MOTO')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [weeklyAmount, setWeeklyAmount] = useState('')
  const [financedAmount, setFinancedAmount] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState<MotoStatus>('ACTIVE')
  const [driverId, setDriverId] = useState(0)
  const [driverName, setDriverName] = useState('')
  const [partRows, setPartRows] = useState<PartRow[]>([])
  const [city, setCity] = useState('')
  const [lastMaintenanceAt, setLastMaintenanceAt] = useState('')

  const ownershipPct = useMemo(() => {
    const target = parseInt(targetAmount, 10)
    const financed = parseInt(financedAmount, 10)
    if (!target || isNaN(target)) return 0
    if (isNaN(financed)) return moto?.ownershipPct ?? 0
    return Math.round((financed / target) * 100)
  }, [targetAmount, financedAmount, moto?.ownershipPct])

  const statusUi = STATUS_UI[status]
  // Le chauffeur déjà affecté à cette moto reste sélectionnable.
  const fetchEditDrivers = useMemo(() => makeFetchDrivers(motoId ?? undefined), [motoId])

  useEffect(() => {
    if (!isOpen || motoId == null) return
    setMoto(null)
    setError(null)
    setLoading(true)
    getMoto(motoId)
      .then((detail) => {
        setMoto(detail)
        setMatricule(detail.matricule)
        setVehicleType(detail.vehicleType)
        setBrand(detail.brand ?? '')
        setModel(detail.model ?? '')
        setYear(detail.year ? String(detail.year) : '')
        setTargetAmount(String(detail.targetAmount))
        setWeeklyAmount(String(detail.weeklyAmount))
        setFinancedAmount(String(detail.financedAmount))
        setImageUrl(detail.imageUrl ?? '')
        setStatus(detail.status)
        setDriverId(detail.driver?.id ?? 0)
        setDriverName(detail.driver?.fullName ?? '')
        setPartRows(
          detail.investors.map((i) => ({ id: i.id, investorId: i.investorId, investorName: i.fullName, amount: String(i.amount), createdAt: i.createdAt, closedAt: i.closedAt, closeReason: i.closeReason, released: i.releasedAmount })),
        )
        setCity(detail.city)
        setLastMaintenanceAt(detail.lastMaintenanceAt ?? '')
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Impossible de charger la moto.'))
      .finally(() => setLoading(false))
    getDriverTerminations(motoId)
      .then(setTerminations)
      .catch(() => setTerminations([]))
  }, [isOpen, motoId, refreshKey])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!moto) return
    setError(null)

    const target = parseInt(targetAmount, 10)
    const financed = parseInt(financedAmount, 10)

    if (!matricule.trim()) return setError('Immatriculation requise')
    if (year && !(parseInt(year, 10) >= 1980 && parseInt(year, 10) <= 2100)) return setError('Année invalide')
    if (!city.trim()) return setError('Ville requise')
    if (!targetAmount || isNaN(target) || target < 1) return setError('Montant cible invalide (minimum 1 FCFA)')
    const weeklyProblem = weeklyError(targetAmount, weeklyAmount)
    if (weeklyProblem) return setError(weeklyProblem)
    if (financedAmount === '' || isNaN(financed) || financed < 0) return setError('Montant financé invalide')
    if (financed > target) return setError('Le montant financé ne peut pas dépasser le montant cible')

    const partsProblem = partsError(partRows, target)
    if (partsProblem) return setError(partsProblem)

    const body: UpdateMotoPayload = {
      matricule: matricule.trim(),
      city: city.trim(),
      vehicleType,
      brand: brand.trim(),
      model: model.trim(),
      ...(year ? { year: parseInt(year, 10) } : {}),
      targetAmount: target,
      weeklyAmount: effectiveWeekly(targetAmount, weeklyAmount),
      financedAmount: financed,
      imageUrl: imageUrl.trim() || null,
      status,
      driverId: driverId > 0 ? driverId : null,
      investors: partRows.map((r) => ({ id: r.id, investorId: r.investorId, amount: partAmount(r) })),
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
        setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!moto) return
    setError(null)
    setDeleting(true)
    try {
      await deleteMoto(moto.id)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(err.message || 'Impossible de supprimer : incidents ouverts liés à ce véhicule')
      } else if (err instanceof ApiError && err.statusCode === 404) {
        setError('Véhicule introuvable')
      } else {
        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression')
      }
    } finally {
      setDeleting(false)
    }
  }

  const previewImage = imageUrl.trim() || DEFAULT_MOTO_IMAGE
  const displayFinanced = parseInt(financedAmount, 10)
  const displayTarget = parseInt(targetAmount, 10)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du véhicule</DialogTitle>
            <DialogDescription>Consultez l&apos;état du véhicule et modifiez ses informations.</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error && !moto ? (
            <FormError error={error} />
          ) : moto ? (
            <div className="space-y-6">
              <div className="relative h-40 overflow-hidden rounded-md bg-muted">
                <img
                  src={previewImage}
                  alt={`${VEHICLE_TYPE_LABEL[vehicleType]} ${matricule}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = DEFAULT_MOTO_IMAGE
                  }}
                />
                <Badge variant={`solid-${statusUi.variant}`} className="absolute right-3 top-3">
                  {statusUi.label}
                </Badge>
                <Badge className="absolute bottom-3 left-3 bg-foreground text-background">#{matricule}</Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Progression propriété</span>
                  <span className="font-bold text-success-foreground">{ownershipPct}%</span>
                </div>
                <Progress value={Math.min(ownershipPct, 100)} className="h-2" />
                <div className="text-xs text-muted-foreground tabular-nums">
                  {formatXafLabel(isNaN(displayFinanced) ? moto.financedAmount : displayFinanced)} /{' '}
                  {formatXafLabel(isNaN(displayTarget) ? moto.targetAmount : displayTarget)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                <span className="text-muted-foreground">Calendrier</span>
                <span className="text-right font-medium">
                  {moto.plannedWeeks} semaines
                  {moto.extraWeeks > 0 ? ` (dont +${moto.extraWeeks} suite à des versements partiels)` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                <span className="text-muted-foreground">Chauffeur</span>
                <span className="text-right font-medium">
                  {moto.driver ? `${moto.driver.fullName} — ${moto.driver.phoneNumber}` : 'Aucun chauffeur affecté'}
                </span>
              </div>

              {(moto.openIncidents?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Incidents ouverts</h3>
                  <ul className="space-y-2">
                    {moto.openIncidents.map((inc) => (
                      <li key={inc.id} className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                        <div className="font-medium text-danger-foreground">{inc.type}</div>
                        <div className="text-xs text-muted-foreground">{inc.description}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{formatShortDate(inc.createdAt)}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(moto.recentPayments?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Paiements récents (conducteur)</h3>
                  <ul className="space-y-1.5">
                    {moto.recentPayments.map((p) => (
                      <li key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span className="text-muted-foreground">
                          {p.type === 'PAYMENT' ? 'Paiement' : 'Dépense'} — {p.status}
                        </span>
                        <span className="font-semibold tabular-nums">{formatXafLabel(p.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Separator />

              <form onSubmit={handleSave} className="grid grid-cols-[minmax(0,1fr)] gap-4">
                <h3 className="text-sm font-semibold">Modifier</h3>

                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 min-[400px]:grid-cols-2">
                  <Field label="Immatriculation" htmlFor="edit-matricule">
                    <Input id="edit-matricule" value={matricule} onChange={(e) => setMatricule(e.target.value)} required />
                  </Field>
                  <Field label="Ville" htmlFor="edit-city">
                    <OptionField id="edit-city" value={city} onChange={setCity} options={filterOptions?.cities ?? []} placeholder="Douala" />
                  </Field>
                </div>

          <Field label="Type de véhicule" htmlFor="edit-type">
            <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
              <SelectTrigger id="edit-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MOTO">Moto</SelectItem>
                <SelectItem value="TAXI">Taxi</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-3">
            <Field label={<>Marque <Optional /></>} htmlFor="edit-brand">
              <Input id="edit-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Toyota" maxLength={60} />
            </Field>
            <Field label={<>Modèle <Optional /></>} htmlFor="edit-model">
              <Input id="edit-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Corolla" maxLength={60} />
            </Field>
            <Field label={<>Année <Optional /></>} htmlFor="edit-year">
              <Input id="edit-year" type="number" min={1980} max={2100} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
            </Field>
          </div>


                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 min-[400px]:grid-cols-2">
                  <Field label="Montant cible (XAF)" htmlFor="edit-target" hint={targetHint(targetAmount)}>
                    <Input id="edit-target" type="number" min={1} value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
                  </Field>

                  <Field label="Versement par semaine (XAF)" htmlFor="edit-weekly" hint={weeklyHint(targetAmount, weeklyAmount)}>
                    <Input id="edit-weekly" type="number" min={1} value={weeklyAmount} onChange={(e) => setWeeklyAmount(e.target.value)} required />
                  </Field>
                  <Field label="Montant financé (XAF)" htmlFor="edit-financed">
                    <Input id="edit-financed" type="number" min={0} value={financedAmount} onChange={(e) => setFinancedAmount(e.target.value)} required />
                  </Field>
                </div>

                <Field label={<>Photo du véhicule <Optional /></>} htmlFor="edit-image">
                  <ImageUpload id="edit-image" value={imageUrl} onChange={setImageUrl} />
                </Field>

                <div className="grid grid-cols-[minmax(0,1fr)] gap-3 min-[400px]:grid-cols-2">
                  <Field label="Statut" htmlFor="edit-status">
                    <Select value={status} onValueChange={(v) => setStatus(v as MotoStatus)}>
                      <SelectTrigger id="edit-status" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Actif</SelectItem>
                        <SelectItem value="BROKEN">En panne</SelectItem>
                        <SelectItem value="STOLEN">Indisponible</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {moto.driver ? null : (
                  <Field
                    label="Affecter un chauffeur"
                    htmlFor="edit-driver"
                    hint={`Nouvelle tournée : le chauffeur reprend le reste à financer (${formatXafLabel(Math.max(moto.targetAmount - moto.financedAmount, 0))}).`}
                  >
                    <RemoteSelect
                      id="edit-driver"
                      value={driverId}
                      selectedLabel={driverName}
                      placeholder="Aucun"
                      noneLabel="Aucun"
                      fetchOptions={fetchEditDrivers}
                      onChange={(o) => {
                        setDriverId(o?.id ?? 0)
                        setDriverName(o?.label ?? '')
                      }}
                    />
                  </Field>
                )}
                {moto.driver || driverId < 1 ? null : <DriverArrearsWarning driverId={driverId} />}

                {moto.driver ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={contractBusy}
                      onClick={() => {
                        setContractBusy(true)
                        void downloadContract(`/admin/contracts/driver/${moto.id}`).finally(() => setContractBusy(false))
                      }}
                    >
                      <FileText />
                      {contractBusy ? 'Génération du contrat…' : 'Contrat du chauffeur (PDF)'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={contractBusy}
                      onClick={() => {
                        setContractBusy(true)
                        void printContract(`/admin/contracts/driver/${moto.id}`).finally(() => setContractBusy(false))
                      }}
                    >
                      <Printer />
                      Imprimer
                    </Button>
                  </div>
                ) : null}

                <div className="grid min-w-0 gap-3 rounded-md border p-3" data-testid="contract-actions">
                  <Label>Contrats et tournée</Label>
                  <p className="text-xs text-muted-foreground">
                    {moto.driver
                      ? `Si le conducteur ne peut plus rouler, résiliez son contrat : sa tournée s'arrête et le véhicule peut être affecté à un autre conducteur.`
                      : 'Aucun conducteur : le véhicule ne génère plus de revenus. Affectez-le à un nouveau conducteur pour démarrer une nouvelle tournée.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {moto.driver ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setTerminateDriverOpen(true)}
                      >
                        <UserMinus />
                        Résilier le contrat du conducteur
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setLossOpen(true)}
                    >
                      <Ban />
                      Classer le véhicule en perte
                    </Button>
                  </div>
                  {terminations.length > 0 ? (
                    <div className="grid gap-1.5">
                      <h4 className="text-xs font-semibold">Conducteurs précédents</h4>
                      <ul className="space-y-1.5" aria-label="Conducteurs dont le contrat a été résilié">
                        {terminations.map((t) => (
                          <li key={t.id} className="rounded-md border px-3 py-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold">{t.driver.fullName}</span>
                              <span className="text-muted-foreground">Résilié le {formatShortDate(t.terminatedAt)} · {REASON_LABEL[t.reason].toLowerCase()}</span>
                            </div>
                            <div className="mt-0.5 text-muted-foreground">
                              Versé {formatXafLabel(t.paidAmount)}
                              {t.arrearsAmount > 0 ? ` · impayé à la résiliation ${formatXafLabel(t.arrearsAmount)} (${t.lateWeeks} sem.)` : ''}
                              {` · reste à financer ${formatXafLabel(t.remainingAmount)}`}
                            </div>
                            {t.note ? <div className="mt-0.5 italic text-muted-foreground">{t.note}</div> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <PartsEditor
                  idPrefix="edit"
                  targetAmount={parseInt(targetAmount, 10) || 0}
                  value={partRows}
                  onChange={setPartRows}
                  onTerminate={setTerminatePart}
                />

                <Field label="Dernier entretien" htmlFor="edit-maintenance">
                  <Input id="edit-maintenance" type="date" value={lastMaintenanceAt} onChange={(e) => setLastMaintenanceAt(e.target.value)} />
                </Field>

                <FormError error={error} />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Fermer
                  </Button>
                  <Button type="submit" disabled={submitting || deleting}>
                    {submitting ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </DialogFooter>
              </form>

              <Separator />

              <Button
                type="button"
                variant="outline"
                className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={deleting || submitting || loading}
                onClick={() => setConfirmDelete(true)}
              >
                {deleting ? 'Suppression…' : 'Retirer du parc'}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <TerminationDialog
        open={terminateDriverOpen}
        title="Résilier le contrat du conducteur ?"
        description={`La tournée de ${moto?.driver?.fullName ?? 'ce conducteur'} s'arrête : le véhicule n'a plus de conducteur et peut être affecté à un autre. Les versements déjà faits restent acquis ; les impayés sont conservés dans l'historique.`}
        reasons={DRIVER_REASONS}
        confirmLabel="Résilier le contrat"
        onClose={() => setTerminateDriverOpen(false)}
        onConfirm={async ({ reason, note }) => {
          if (!moto) return
          const res = await terminateDriverContract(moto.id, { reason, ...(note ? { note } : {}) })
          toast.success(`Contrat de ${res.driver.fullName} résilié. Reste à financer : ${formatXafLabel(res.remainingAmount)}.`)
          setTerminateDriverOpen(false)
          setRefreshKey((k) => k + 1)
          onSuccess()
        }}
      />

      <TerminationDialog
        open={lossOpen}
        title="Classer le véhicule en perte ?"
        description="Le véhicule ne peut plus tourner : le contrat du conducteur et ceux de tous les investisseurs prennent fin, et le capital qu'ils n'ont pas récupéré est classé en perte. Cette action est définitive."
        reasons={[]}
        confirmLabel="Classer en perte"
        onClose={() => setLossOpen(false)}
        onConfirm={async ({ note }) => {
          if (!moto) return
          const res = await classifyVehicleLoss(moto.id, { ...(note ? { note } : {}), vehicleStatus: 'STOLEN' })
          toast.success(`Véhicule classé en perte : ${res.partsClosed} part(s) résiliée(s), ${formatXafLabel(res.lossTotal)} de capital non récupéré.`)
          setLossOpen(false)
          setRefreshKey((k) => k + 1)
          onSuccess()
        }}
      />

      <InvestorTerminationDialog
        investmentId={terminatePart?.id ?? null}
        onClose={() => setTerminatePart(null)}
        onDone={(res) => {
          toast.success(investorResultMessage(res))
          setTerminatePart(null)
          setRefreshKey((k) => k + 1)
          onSuccess()
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le véhicule #{matricule} du parc ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDelete(false)
                void handleDelete()
              }}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
