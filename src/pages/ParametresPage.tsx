import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  KeyRound,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  ShieldOff,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import AdminLayout from '@/components/admin/AdminLayout'
import { Field } from '@/components/settings/fields'
import { EMAIL_RE, errorText } from '@/lib/formErrors'
import ProfileCard from '@/components/settings/ProfileCard'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatXafLabel, initials } from '@/lib/format'
import { useAuth } from '../auth/useAuth'
import {
  changeAdminPassword,
  createAdminAccess,
  getAdminSettings,
  listAdminAccess,
  resetAdminPassword,
  sendWeeklyReportNow,
  setAdminActive,
  updateAdminProfile,
  updateAdminSettings,
  uploadAdminAvatar,
} from '../services/adminSettingsService'
import type { AdminAccessItem, AdminSettings, CompanyInfo, UpdateAdminSettingsBody } from '../types/api'

// ─── Configuration de la plateforme ────────────────────────────────────────

const COMPANY_FIELDS: Array<{ key: keyof CompanyInfo; label: string; hint?: string }> = [
  { key: 'companyName', label: 'Nom de la société' },
  { key: 'companyAddress', label: 'Adresse', hint: 'Siège de la société.' },
  { key: 'companyRegistration', label: 'Immatriculation (RCCM)', hint: "Numéro du registre du commerce." },
  { key: 'companyRepresentative', label: 'Représentant légal' },
  { key: 'companyRepresentativeTitle', label: 'Qualité du représentant', hint: 'Par exemple : Gérant.' },
  { key: 'signatureCity', label: 'Ville de signature', hint: 'Lieu indiqué à la signature et tribunal compétent.' },
]

function SectionPlateforme(props: {
  support: AdminSettings['support']
  onSupport: (patch: Partial<AdminSettings['support']>) => void
  commission: AdminSettings['commission']
  weekly: string
  onWeekly: (v: string) => void
  company: CompanyInfo
  onCompany: (patch: Partial<CompanyInfo>) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuration de la plateforme</CardTitle>
          <CardDescription>Paramètres globaux appliqués à l&apos;ensemble de la flotte.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Versement hebdo. par défaut (XAF)"
              htmlFor="versement"
              hint="Proposé pour chaque nouveau véhicule (plafonné à son montant cible). Laissez vide pour répartir la cible sur 32 semaines."
            >
              <Input id="versement" type="number" min="0" value={props.weekly} onChange={(e) => props.onWeekly(e.target.value)} placeholder="Cible ÷ 32" />
            </Field>
            <Field label="Devise locale" htmlFor="devise" hint="Tous les montants de la plateforme sont en Franc CFA.">
              <Select value="xaf">
                <SelectTrigger id="devise" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xaf">Franc CFA (XAF)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Société et contrats</CardTitle>
          <CardDescription>
            Ces informations figurent dans les contrats des chauffeurs et des investisseurs, téléchargeables en PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {COMPANY_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={`company-${f.key}`} hint={f.hint}>
                <Input id={`company-${f.key}`} value={props.company[f.key]} maxLength={250} onChange={(e) => props.onCompany({ [f.key]: e.target.value })} />
              </Field>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support des conducteurs</CardTitle>
          <CardDescription>
            Ces coordonnées s&apos;affichent dans la page « Support » des conducteurs, avec des boutons pour appeler ou écrire sur WhatsApp. Laissez un numéro vide
            pour ne pas l&apos;afficher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Téléphone du support" htmlFor="support-phone" hint="Par exemple : +237 6 90 00 00 01.">
              <Input id="support-phone" type="tel" inputMode="tel" maxLength={20} value={props.support.phone} onChange={(e) => props.onSupport({ phone: e.target.value })} placeholder="+237 6XX XXX XXX" />
            </Field>
            <Field label="Numéro WhatsApp" htmlFor="support-whatsapp" hint="Au format international, avec l'indicatif du pays.">
              <Input id="support-whatsapp" type="tel" inputMode="tel" maxLength={20} value={props.support.whatsapp} onChange={(e) => props.onSupport({ whatsapp: e.target.value })} placeholder="+237 6XX XXX XXX" />
            </Field>
            <Field label="Horaires" htmlFor="support-hours" hint="Affichés sous la forme « Nos conseillers sont disponibles : … ».">
              <Input id="support-hours" maxLength={120} value={props.support.hours} onChange={(e) => props.onSupport({ hours: e.target.value })} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission de l&apos;admin</CardTitle>
          <CardDescription>
            Ce qui reste à l&apos;admin de chaque versement validé une fois les parts des investisseurs reversées : capital non financé et
            excédents. Aucun taux n&apos;est saisi, la commission découle des parts de chaque moto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium text-muted-foreground">Commission totale</div>
              <div className="mt-1 text-lg font-bold tabular-nums">{formatXafLabel(props.commission.total)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium text-muted-foreground">Ce mois-ci</div>
              <div className="mt-1 text-lg font-bold tabular-nums">{formatXafLabel(props.commission.thisMonth)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs font-medium text-muted-foreground">Part des versements encaissés</div>
              <div className="mt-1 text-lg font-bold tabular-nums">{props.commission.ratePct} %</div>
              <div className="text-xs text-muted-foreground">sur {formatXafLabel(props.commission.collected, true)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Gestion des accès ─────────────────────────────────────────────────────

function formatLastLogin(iso: string | null): string {
  if (!iso) return 'Jamais connecté'
  const d = new Date(iso)
  const now = new Date()
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (sameDay(d, now)) return `Aujourd'hui, ${time}`
  const yesterday = new Date(now.getTime() - 86_400_000)
  if (sameDay(d, yesterday)) return `Hier, ${time}`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AddAdminDialog(props: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setFullName('')
    setPhone('')
    setEmail('')
    setPassword('')
    setError(null)
    props.onClose()
  }

  const submit = async () => {
    if (!fullName.trim()) return setError('Nom complet requis')
    if (!phone.trim()) return setError('Numéro de téléphone requis')
    if (email.trim() && !EMAIL_RE.test(email.trim())) return setError('Adresse e-mail invalide')
    if (password.length < 6) return setError('Mot de passe : 6 caractères minimum')
    setBusy(true)
    setError(null)
    try {
      const res = await createAdminAccess({
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        email: email.trim() || undefined,
        password,
      })
      if (res.emailSent) toast.success(`Administrateur ajouté : identifiants envoyés à ${email.trim()}`)
      else if (res.emailSent === false) toast.warning("Administrateur ajouté, mais l'e-mail n'a pas pu être envoyé (vérifiez la configuration Resend)")
      else toast.success('Administrateur ajouté')
      close()
      props.onCreated()
    } catch (err) {
      setError(errorText(err, "Ajout impossible"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => (!open ? close() : undefined)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un administrateur</DialogTitle>
          <DialogDescription>Il aura accès à tout le portail admin. Ses identifiants lui sont envoyés par e-mail s&apos;il a une adresse.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Field label="Nom complet" htmlFor="new-admin-name">
            <Input id="new-admin-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Field>
          <Field label="Numéro de téléphone" htmlFor="new-admin-phone" hint="Identifiant de connexion.">
            <Input id="new-admin-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6XX XXX XXX" required />
          </Field>
          <Field label="Adresse e-mail (optionnel)" htmlFor="new-admin-email">
            <Input id="new-admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Mot de passe" htmlFor="new-admin-password" hint="6 caractères minimum.">
            <Input id="new-admin-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Ajout…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type AccessAction = { kind: 'toggle'; admin: AdminAccessItem } | { kind: 'reset'; admin: AdminAccessItem }

function SectionAcces() {
  const [admins, setAdmins] = useState<AdminAccessItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [adding, setAdding] = useState(false)
  const [action, setAction] = useState<AccessAction | null>(null)
  const [busy, setBusy] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<{ name: string; value: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    listAdminAccess()
      .then((res) => {
        if (cancelled) return
        setAdmins(res)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorText(err, 'Impossible de charger les administrateurs.'))
      })
    return () => {
      cancelled = true
    }
  }, [reload])

  const confirm = async () => {
    if (!action) return
    setBusy(true)
    try {
      if (action.kind === 'toggle') {
        await setAdminActive(action.admin.id, !action.admin.isActive)
        toast.success(action.admin.isActive ? `Accès de ${action.admin.fullName} désactivé` : `Accès de ${action.admin.fullName} réactivé`)
      } else {
        const res = await resetAdminPassword(action.admin.id)
        if (res.emailSent) toast.success(`Nouveau mot de passe envoyé à ${action.admin.email}`)
        else if (res.temporaryPassword) setTemporaryPassword({ name: action.admin.fullName, value: res.temporaryPassword })
        if (res.emailSent === false && res.temporaryPassword) toast.warning("L'e-mail n'a pas pu être envoyé : transmettez le mot de passe temporaire à la personne")
      }
      setAction(null)
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(errorText(err, 'Action impossible'))
      setAction(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des accès</CardTitle>
        <CardDescription>Administrateurs ayant accès au portail.</CardDescription>
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Button type="button" size="sm" onClick={() => setAdding(true)}>
            <Plus />
            Ajouter un admin
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : admins === null ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center gap-3 p-4 sm:gap-4">
                <Avatar className="size-10 shrink-0">
                  {admin.avatarUrl ? <AvatarImage src={admin.avatarUrl} alt={admin.fullName} /> : null}
                  <AvatarFallback>{initials(admin.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">{admin.fullName}</span>
                    {admin.isMe ? <Badge variant="blue" className="text-[10px]">VOUS</Badge> : null}
                    <Badge variant={admin.isActive ? 'green' : 'red'} className="text-[10px]">
                      {admin.isActive ? 'ACTIF' : 'DÉSACTIVÉ'}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {admin.email ? (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{admin.email}</span>
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3 shrink-0" />
                      {admin.phoneNumber}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground sm:hidden">{formatLastLogin(admin.lastLoginAt)}</div>
                </div>
                <div className="hidden shrink-0 text-xs text-muted-foreground sm:block">{formatLastLogin(admin.lastLoginAt)}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="icon" aria-label={`Options pour ${admin.fullName}`}>
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={admin.isMe && admin.isActive} onSelect={() => setAction({ kind: 'toggle', admin })}>
                      <ShieldOff />
                      {admin.isActive ? "Désactiver l'accès" : "Réactiver l'accès"}
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={admin.isMe} onSelect={() => setAction({ kind: 'reset', admin })}>
                      <KeyRound />
                      Réinitialiser le mot de passe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AddAdminDialog open={adding} onClose={() => setAdding(false)} onCreated={() => setReload((n) => n + 1)} />

      <AlertDialog open={action !== null} onOpenChange={(open) => (!open && !busy ? setAction(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action?.kind === 'reset'
                ? 'Réinitialiser le mot de passe ?'
                : action?.admin.isActive
                  ? "Désactiver cet accès ?"
                  : "Réactiver cet accès ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action?.kind === 'reset'
                ? `Un mot de passe temporaire remplacera celui de ${action.admin.fullName}${action.admin.email ? ' et lui sera envoyé par e-mail' : ' (aucune adresse e-mail : il vous sera affiché une seule fois)'}.`
                : action?.admin.isActive
                  ? `${action.admin.fullName} ne pourra plus se connecter au portail tant que son accès n'est pas réactivé.`
                  : `${action?.admin.fullName} pourra de nouveau se connecter au portail.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault()
                void confirm()
              }}
            >
              {busy ? 'En cours…' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={temporaryPassword !== null} onOpenChange={(open) => (!open ? setTemporaryPassword(null) : undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mot de passe temporaire</DialogTitle>
            <DialogDescription>
              Transmettez-le à {temporaryPassword?.name} : il ne sera plus affiché. La personne pourra le modifier dans son profil.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/40 p-4 text-center font-mono text-lg font-bold tracking-wider select-all">
            {temporaryPassword?.value}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setTemporaryPassword(null)}>
              J&apos;ai noté le mot de passe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ─── Notifications & alertes ───────────────────────────────────────────────

type NotificationKey = keyof AdminSettings['notifications']

const notifOptions: Array<{ id: NotificationKey; label: string; description: string }> = [
  {
    id: 'weeklyReportEmail',
    label: 'Rapport hebdomadaire par e-mail',
    description: "Résumé de la semaine écoulée envoyé chaque lundi à 08h00 à votre adresse e-mail.",
  },
  {
    id: 'maintenanceAlerts',
    label: 'Alertes de maintenance',
    description: "Notification dans l'application lors d'une panne, d'un vol ou d'un incident signalé.",
  },
  {
    id: 'investorAlerts',
    label: 'Notifications investisseurs',
    description: "Alerte chaque lundi quand des reversements sont échus envers des investisseurs.",
  },
]

function SectionNotifications(props: {
  warning: string
  critical: string
  prefs: AdminSettings['notifications']
  hasEmail: boolean
  onThresholds: (patch: { warning?: string; critical?: string }) => void
  onPref: (key: NotificationKey, value: boolean) => void
}) {
  const [sending, setSending] = useState(false)

  const sendNow = async () => {
    setSending(true)
    try {
      const res = await sendWeeklyReportNow()
      if (res.emailSent) toast.success('Rapport envoyé à votre adresse e-mail')
      else toast.warning("Le rapport est prêt mais l'e-mail n'a pas pu être envoyé (vérifiez la configuration Resend)")
    } catch (err) {
      toast.error(errorText(err, "Envoi impossible"))
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications &amp; alertes</CardTitle>
        <CardDescription>Configurez les seuils et canaux de notification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Seuil d'alerte de retard (jours)"
            htmlFor="seuil-retard"
            hint="Un chauffeur apparaît dans les alertes (en orange) dès ce nombre de jours de retard, le lundi du retard comptant pour le jour 1."
          >
            <Input id="seuil-retard" type="number" min="1" value={props.warning} onChange={(e) => props.onThresholds({ warning: e.target.value })} />
          </Field>
          <Field label="Seuil d'alerte critique (jours)" htmlFor="seuil-critique" hint="L'alerte passe en rouge une fois ce nombre de jours dépassé.">
            <Input id="seuil-critique" type="number" min="1" value={props.critical} onChange={(e) => props.onThresholds({ critical: e.target.value })} />
          </Field>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {notifOptions.map((opt) => (
            <div key={opt.id} className="flex items-start justify-between gap-4 rounded-lg border bg-muted/40 p-4">
              <div className="min-w-0">
                <Label htmlFor={`notif-${opt.id}`} className="text-sm font-semibold">
                  {opt.label}
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
              </div>
              <Switch id={`notif-${opt.id}`} checked={props.prefs[opt.id]} onCheckedChange={(v) => props.onPref(opt.id, v)} />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" disabled={sending || !props.hasEmail} onClick={() => void sendNow()}>
            <Send />
            {sending ? 'Envoi…' : 'Envoyer le rapport maintenant'}
          </Button>
          <span className="text-xs text-muted-foreground">
            {props.hasEmail ? 'Reçu à votre adresse e-mail, comme chaque lundi.' : "Renseignez d'abord votre adresse e-mail dans le profil."}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Formulaire (profil + réglages) ────────────────────────────────────────

function SettingsForm(props: {
  data: AdminSettings
  onSaved: (data: AdminSettings) => void
  onReset: () => void
  onAvatar: (url: string) => void
}) {
  const { data } = props
  const { updateUser } = useAuth()
  const [fullName, setFullName] = useState(data.profile.fullName)
  const [email, setEmail] = useState(data.profile.email ?? '')
  const [phone, setPhone] = useState(data.profile.phoneNumber)
  const [weekly, setWeekly] = useState(data.platform.defaultWeeklyAmount > 0 ? String(data.platform.defaultWeeklyAmount) : '')
  const [warning, setWarning] = useState(String(data.alerts.lateWarningDays))
  const [critical, setCritical] = useState(String(data.alerts.lateCriticalDays))
  const [prefs, setPrefs] = useState(data.notifications)
  const [company, setCompany] = useState<CompanyInfo>(data.company)
  const [support, setSupport] = useState(data.support)
  const [saving, setSaving] = useState(false)

  const weeklyValue = weekly.trim() === '' ? 0 : parseInt(weekly, 10)
  const profileDirty =
    fullName.trim() !== data.profile.fullName ||
    email.trim() !== (data.profile.email ?? '') ||
    phone.trim() !== data.profile.phoneNumber
  const settingsDirty =
    weeklyValue !== data.platform.defaultWeeklyAmount ||
    parseInt(warning, 10) !== data.alerts.lateWarningDays ||
    parseInt(critical, 10) !== data.alerts.lateCriticalDays ||
    JSON.stringify(company) !== JSON.stringify(data.company) ||
    JSON.stringify(support) !== JSON.stringify(data.support) ||
    (Object.keys(prefs) as NotificationKey[]).some((k) => prefs[k] !== data.notifications[k])
  const dirty = profileDirty || settingsDirty

  const save = async () => {
    if (!fullName.trim()) return toast.error('Le nom complet est requis')
    if (!phone.trim()) return toast.error('Le numéro de téléphone est requis')
    if (email.trim() && !EMAIL_RE.test(email.trim())) return toast.error('Adresse e-mail invalide')
    if (!email.trim() && data.profile.email) return toast.error("L'adresse e-mail ne peut pas être supprimée")
    if ((Object.keys(company) as Array<keyof CompanyInfo>).some((k) => !company[k].trim())) return toast.error('Toutes les informations de la société doivent être renseignées')
    const phoneRe = /^(\+?[0-9 ]{6,20})?$/
    if (!phoneRe.test(support.phone.trim())) return toast.error('Téléphone du support invalide (chiffres, espaces et « + » uniquement)')
    if (!phoneRe.test(support.whatsapp.trim())) return toast.error('Numéro WhatsApp invalide (chiffres, espaces et « + » uniquement)')
    if (!support.hours.trim()) return toast.error('Indiquez les horaires du support')
    if (!Number.isInteger(weeklyValue) || weeklyValue < 0) return toast.error('Versement hebdomadaire par défaut invalide')
    const warningDays = parseInt(warning, 10)
    const criticalDays = parseInt(critical, 10)
    if (!(warningDays >= 1) || !(criticalDays >= 1)) return toast.error("Les seuils d'alerte doivent être d'au moins 1 jour")
    if (criticalDays < warningDays) return toast.error("Le seuil critique ne peut pas être inférieur au seuil d'alerte")

    setSaving(true)
    try {
      let next = data
      if (profileDirty) {
        const profile = await updateAdminProfile({
          fullName: fullName.trim(),
          phoneNumber: phone.trim(),
          email: email.trim() || undefined,
        })
        next = { ...next, profile }
        updateUser({ fullName: profile.fullName, email: profile.email, phoneNumber: profile.phoneNumber })
      }
      if (settingsDirty) {
        const body: UpdateAdminSettingsBody = {
          platform: { defaultWeeklyAmount: weeklyValue },
          company,
          support,
          alerts: { lateWarningDays: warningDays, lateCriticalDays: criticalDays },
          notifications: prefs,
        }
        next = await updateAdminSettings(body)
      }
      toast.success('Modifications enregistrées')
      props.onSaved(next)
    } catch (err) {
      toast.error(errorText(err, 'Enregistrement impossible'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="profil" className="gap-6">
        <TabsList className="h-auto w-full flex-wrap">
          <TabsTrigger value="profil" className="flex-1 gap-2 py-2">
            <User />
            <span className="hidden sm:inline">Profil admin</span>
          </TabsTrigger>
          <TabsTrigger value="plateforme" className="flex-1 gap-2 py-2">
            <Settings />
            <span className="hidden sm:inline">Configuration plateforme</span>
          </TabsTrigger>
          <TabsTrigger value="acces" className="flex-1 gap-2 py-2">
            <ShieldCheck />
            <span className="hidden sm:inline">Gestion des accès</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 gap-2 py-2">
            <Bell />
            <span className="hidden sm:inline">Notifications &amp; alertes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <ProfileCard
            idPrefix="admin"
            title="Profil admin"
            description="Vos informations personnelles visibles sur la plateforme."
            avatarUrl={data.profile.avatarUrl}
            savedName={data.profile.fullName}
            fullName={fullName}
            email={email}
            phone={phone}
            emailHint="Reçoit le rapport hebdomadaire et les messages de la plateforme."
            onChange={(patch) => {
              if (patch.fullName !== undefined) setFullName(patch.fullName)
              if (patch.email !== undefined) setEmail(patch.email)
              if (patch.phone !== undefined) setPhone(patch.phone)
            }}
            uploadAvatar={uploadAdminAvatar}
            onAvatar={props.onAvatar}
            changePassword={changeAdminPassword}
          />
        </TabsContent>
        <TabsContent value="plateforme">
          <SectionPlateforme
            support={support}
            onSupport={(patch) => setSupport((prev) => ({ ...prev, ...patch }))}
            commission={data.commission}
            weekly={weekly}
            onWeekly={setWeekly}
            company={company}
            onCompany={(patch) => setCompany((prev) => ({ ...prev, ...patch }))}
          />
        </TabsContent>
        <TabsContent value="acces">
          <SectionAcces />
        </TabsContent>
        <TabsContent value="notifications">
          <SectionNotifications
            warning={warning}
            critical={critical}
            prefs={prefs}
            hasEmail={Boolean(data.profile.email)}
            onThresholds={(patch) => {
              if (patch.warning !== undefined) setWarning(patch.warning)
              if (patch.critical !== undefined) setCritical(patch.critical)
            }}
            onPref={(key, value) => setPrefs((prev) => ({ ...prev, [key]: value }))}
          />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 -mx-3 mt-auto flex items-center justify-end gap-2 border-t bg-background/90 px-3 py-3 backdrop-blur sm:-mx-4 sm:gap-3 sm:px-4 sm:py-4 md:-mx-6 md:px-6">
        {dirty ? <span className="mr-auto hidden whitespace-nowrap text-xs font-medium text-muted-foreground sm:inline md:hidden lg:inline">Modifications non enregistrées</span> : null}
        <Button type="button" variant="outline" className="min-w-0 flex-1 sm:flex-none" disabled={!dirty || saving} onClick={props.onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
        <Button
          type="button"
          className="min-w-0 flex-1 sm:flex-none"
          aria-label="Enregistrer les modifications"
          disabled={!dirty || saving}
          onClick={() => void save()}
        >
          <Save />
          <span className="sm:hidden">{saving ? 'Envoi…' : 'Enregistrer'}</span>
          <span className="hidden sm:inline">{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</span>
        </Button>
      </div>
    </>
  )
}

type ParametresPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function ParametresPage({ theme, onToggleTheme }: ParametresPageProps) {
  const { updateUser } = useAuth()
  const [data, setData] = useState<AdminSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  // changer la clé recrée le formulaire avec les valeurs enregistrées (« Réinitialiser » et après un enregistrement)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    getAdminSettings()
      .then((res) => {
        if (cancelled) return
        setData(res)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorText(err, 'Impossible de charger les paramètres.'))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const onSaved = useCallback((next: AdminSettings) => {
    setData(next)
    setFormKey((k) => k + 1)
  }, [])

  const onAvatar = useCallback(
    (avatarUrl: string) => {
      setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, avatarUrl } } : prev))
      updateUser({ avatarUrl })
    },
    [updateUser],
  )

  return (
    <AdminLayout
      title="Paramètres du système"
      description="Gérez les configurations de la plateforme et vos informations personnelles."
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data === null ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <SettingsForm
          key={formKey}
          data={data}
          onSaved={onSaved}
          onReset={() => setFormKey((k) => k + 1)}
          onAvatar={onAvatar}
        />
      )}
    </AdminLayout>
  )
}
