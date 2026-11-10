import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import RemoteSelect from './RemoteSelect'
import PaymentMethodSelect from './PaymentMethodSelect'
import { listDriversFromApi } from '../services/usersService'
import { createPayment } from '../services/paymentsService'
import { createIncident } from '../services/incidentsService'
import { inviteUser } from '../services/invitationsService'
import { createUser } from '../services/usersService'
import { formatXafLabel } from '../lib/format'
import { ApiError } from '../types/auth'
import type { Driver, PaymentMethod } from '../types/api'

// ─── Wrapper commun ─────────────────────────────────────────────────────────

function FormDialog(props: {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => (!open ? props.onClose() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        {props.children}
      </DialogContent>
    </Dialog>
  )
}

function Field(props: { label: ReactNode; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={props.htmlFor}>{props.label}</Label>
      {props.children}
      {props.hint ? <p className="text-xs text-muted-foreground">{props.hint}</p> : null}
    </div>
  )
}

function FormError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}

function FormActions(props: { onClose: () => void; submitting: boolean; submitLabel: string; destructive?: boolean }) {
  return (
    <DialogFooter className="pt-2">
      <Button type="button" variant="outline" onClick={props.onClose}>
        Annuler
      </Button>
      <Button type="submit" variant={props.destructive ? 'destructive' : 'default'} disabled={props.submitting}>
        {props.submitting ? 'Envoi…' : props.submitLabel}
      </Button>
    </DialogFooter>
  )
}

/** Chauffeurs avec un contrat actif (moto en cours de paiement) : recherche et filtre faits par le serveur. */
function fetchActiveDrivers(search: string) {
  return listDriversFromApi({ search, limit: 20, withActiveMoto: true }).then((drivers) =>
    drivers.map((d) => ({
      id: d.id,
      label: `${d.fullName} — ${d.activeMoto ? d.activeMoto.matricule : 'sans moto'}`,
      data: d,
    })),
  )
}

function DriverSelect(props: { id: string; value: Driver | null; onChange: (driver: Driver | null) => void }) {
  return (
    <RemoteSelect<Driver>
      id={props.id}
      value={props.value?.id ?? 0}
      selectedLabel={props.value ? `${props.value.fullName} — ${props.value.activeMoto?.matricule ?? 'sans moto'}` : undefined}
      onChange={(o) => props.onChange(o?.data ?? null)}
      fetchOptions={fetchActiveDrivers}
      placeholder="Sélectionner un chauffeur"
    />
  )
}

// ─── PaymentModal ───────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PaymentModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [driver, setDriver] = useState<Driver | null>(null)
  const driverId = driver?.id ?? 0
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'PAYMENT' | 'EXPENSE'>('PAYMENT')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Le backend ne renvoie que les chauffeurs avec un contrat actif (moto en cours de paiement).
  const selectedMoto = driver?.activeMoto ?? null
  const remaining = selectedMoto ? Math.max(selectedMoto.targetAmount - selectedMoto.financedAmount, 0) : null
  const ownershipPct = selectedMoto && selectedMoto.targetAmount > 0
    ? Math.round((selectedMoto.financedAmount / selectedMoto.targetAmount) * 100)
    : 0
  const amountNum = parseInt(amount, 10)
  const overLimit = type === 'PAYMENT' && remaining !== null && !isNaN(amountNum) && amountNum > remaining

  useEffect(() => {
    if (!isOpen) return
    setDriver(null)
    setAmount('')
    setType('PAYMENT')
    setMethod('')
    setError(null)
    setSubmitting(false)
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!driverId) {
      setError('Veuillez sélectionner un chauffeur')
      return
    }
    if (!amount || isNaN(amountNum) || amountNum < 1) {
      setError('Montant invalide (minimum 1 FCFA)')
      return
    }
    if (overLimit) {
      setError(`Le montant dépasse le reste à payer (${formatXafLabel(remaining ?? 0)})`)
      return
    }
    if (!method) {
      setError('Choisissez un moyen de paiement')
      return
    }

    setSubmitting(true)
    try {
      await createPayment({
        driverId,
        amount: amountNum,
        type,
        method,
        ...(type === 'PAYMENT' && selectedMoto ? { motoId: selectedMoto.id } : {}),
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du paiement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog isOpen={isOpen} onClose={onClose} title="Saisir un paiement" description="Enregistrez un versement ou une dépense pour un conducteur.">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="Chauffeur" htmlFor="pay-driver">
          <DriverSelect id="pay-driver" value={driver} onChange={setDriver} />
        </Field>

        <div className="grid gap-2">
          <Label>Type</Label>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Type de transaction">
            <Button type="button" variant={type === 'PAYMENT' ? 'default' : 'outline'} aria-pressed={type === 'PAYMENT'} onClick={() => setType('PAYMENT')}>
              Paiement
            </Button>
            <Button type="button" variant={type === 'EXPENSE' ? 'default' : 'outline'} aria-pressed={type === 'EXPENSE'} onClick={() => setType('EXPENSE')}>
              Dépense
            </Button>
          </div>
        </div>

        {type === 'PAYMENT' && selectedMoto && remaining !== null ? (
          <div className="grid gap-2 rounded-md border bg-muted/40 p-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium text-muted-foreground">Moto {selectedMoto.matricule} — reste à payer</span>
              <span className="text-lg font-extrabold tabular-nums">{formatXafLabel(remaining)}</span>
            </div>
            <Progress value={Math.min(ownershipPct, 100)} className="h-1.5" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatXafLabel(selectedMoto.financedAmount)} versés sur {formatXafLabel(selectedMoto.targetAmount)}
            </span>
          </div>
        ) : null}

        <Field
          label="Montant (FCFA)"
          htmlFor="pay-amount"
          hint={type === 'PAYMENT' && remaining !== null ? `Maximum : ${formatXafLabel(remaining)}` : undefined}
        >
          <Input
            id="pay-amount"
            type="number"
            min={1}
            max={type === 'PAYMENT' && remaining !== null ? remaining : undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ex : 15000"
            aria-invalid={overLimit}
            required
          />
        </Field>
        {overLimit ? (
          <p className="-mt-2 text-xs font-semibold text-destructive">
            Le montant dépasse le reste à payer ({formatXafLabel(remaining ?? 0)}).
          </p>
        ) : null}

        <Field label="Moyen de paiement" htmlFor="pay-method">
          <PaymentMethodSelect id="pay-method" value={method} onChange={setMethod} />
        </Field>

        <FormError error={error} />
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting || !selectedMoto || overLimit || remaining === 0}>
            {submitting ? 'Envoi…' : 'Valider le paiement'}
          </Button>
        </DialogFooter>
      </form>
    </FormDialog>
  )
}

// ─── IncidentModal ──────────────────────────────────────────────────────────

const PRESET_TYPES = ['ACCIDENT', 'THEFT_ATTEMPT', 'Vol', 'Panne', 'Agression', 'Perte']

export function IncidentModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [driver, setDriver] = useState<Driver | null>(null)
  const driverId = driver?.id ?? 0
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Un incident concerne la moto du chauffeur : le backend ne propose que les chauffeurs avec un contrat actif.
  const selectedMoto = driver?.activeMoto ?? null

  useEffect(() => {
    if (!isOpen) return
    setDriver(null)
    setType('')
    setDescription('')
    setError(null)
    setSubmitting(false)
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
        motoId: selectedMoto?.id,
        type: type.trim(),
        description: description.trim(),
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du signalement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog isOpen={isOpen} onClose={onClose} title="Signaler un incident" description="Déclarez un accident, une panne, un vol ou tout autre incident.">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="Chauffeur" htmlFor="inc-driver">
          <DriverSelect id="inc-driver" value={driver} onChange={setDriver} />
        </Field>

        {selectedMoto ? (
          <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Véhicule concerné</span>
            <span className="font-semibold">
              {selectedMoto.matricule} — {selectedMoto.city}
            </span>
          </div>
        ) : null}

        <Field label="Type d'incident" htmlFor="inc-type">
          <Input
            id="inc-type"
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Ex : Accident, Vol, Panne…"
            list="incident-types"
            required
          />
          <datalist id="incident-types">
            {PRESET_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Field>

        <Field label="Description" htmlFor="inc-desc">
          <Textarea
            id="inc-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez l'incident en détail…"
            rows={3}
            className="resize-none"
            required
          />
        </Field>

        <FormError error={error} />
        <FormActions onClose={onClose} submitting={submitting} submitLabel="Signaler l'incident" destructive />
      </form>
    </FormDialog>
  )
}

// ─── InvitationModal ────────────────────────────────────────────────────────

type NewUserRole = 'INVESTOR' | 'DRIVER'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** L'admin est le seul à pouvoir ouvrir un accès : invitation par email ou création directe du compte. */
export function InvitationModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [mode, setMode] = useState<'invite' | 'create'>('invite')
  const [role, setRole] = useState<NewUserRole>('INVESTOR')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setMode('invite')
    setRole('INVESTOR')
    setEmail('')
    setFullName('')
    setPhoneNumber('')
    setPassword('')
    setError(null)
    setSubmitting(false)
  }, [isOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const mail = email.trim()
    if (mode === 'invite') {
      if (!mail) return setError('Veuillez saisir une adresse email')
      if (!EMAIL_RE.test(mail)) return setError('Adresse email invalide')
    } else {
      if (!fullName.trim()) return setError('Nom complet requis')
      if (!phoneNumber.trim()) return setError('Numéro de téléphone requis')
      if (password.length < 6) return setError('Mot de passe : 6 caractères minimum')
      if (mail && !EMAIL_RE.test(mail)) return setError('Adresse email invalide')
    }

    setSubmitting(true)
    try {
      if (mode === 'invite') {
        const invitation = await inviteUser({ email: mail, role })
        if (invitation.emailSent) {
          toast.success(`Invitation envoyée à ${invitation.email}`)
        } else {
          toast.warning("Invitation créée, mais l'email n'a pas pu être envoyé (vérifiez la configuration Resend)")
        }
      } else {
        const created = await createUser({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          password,
          role,
          email: mail || undefined,
        })
        if (created.emailSent) {
          toast.success(`Compte créé pour ${fullName.trim()} : identifiants envoyés à ${mail}`)
        } else if (created.emailSent === false) {
          toast.warning(`Compte créé pour ${fullName.trim()}, mais l'email n'a pas pu être envoyé (vérifiez la configuration Resend)`)
        } else {
          toast.success(`Compte créé pour ${fullName.trim()}`)
        }
      }
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Erreur lors de l'opération")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un utilisateur"
      description="Invitez une personne à créer son compte, ou créez le compte vous-même."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as 'invite' | 'create'); setError(null) }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite">Inviter par email</TabsTrigger>
            <TabsTrigger value="create">Créer le compte</TabsTrigger>
          </TabsList>
        </Tabs>

        <Field label="Rôle" htmlFor="usr-role">
          <Select value={role} onValueChange={(v) => setRole(v as NewUserRole)}>
            <SelectTrigger id="usr-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INVESTOR">Investisseur</SelectItem>
              <SelectItem value="DRIVER">Chauffeur</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {mode === 'create' ? (
          <>
            <Field label="Nom complet" htmlFor="usr-name">
              <Input id="usr-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </Field>
            <Field label="Numéro de téléphone" htmlFor="usr-phone">
              <Input id="usr-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="6XX XXX XXX" required />
            </Field>
          </>
        ) : null}

        <Field
          label={mode === 'create' ? <>Email <span className="font-normal text-muted-foreground">(optionnel)</span></> : 'Adresse email'}
          htmlFor="usr-email"
          hint={mode === 'invite' ? 'Un lien pour créer son compte sera envoyé à cette adresse.' : "Si une adresse est renseignée, ses identifiants (téléphone et mot de passe) lui seront envoyés par email."}
        >
          <Input id="usr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nom@example.com" required={mode === 'invite'} />
        </Field>

        {mode === 'create' ? (
          <Field label="Mot de passe provisoire" htmlFor="usr-password" hint="6 caractères minimum, à communiquer à l'utilisateur.">
            <Input id="usr-password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" required />
          </Field>
        ) : null}

        <FormError error={error} />
        <FormActions onClose={onClose} submitting={submitting} submitLabel={mode === 'invite' ? "Envoyer l'invitation" : 'Créer le compte'} />
      </form>
    </FormDialog>
  )
}
