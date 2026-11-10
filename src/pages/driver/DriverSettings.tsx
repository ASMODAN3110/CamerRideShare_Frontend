import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, LogOut, Moon, RotateCcw, Save, Sun, User, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import AdminLayout from '@/components/admin/AdminLayout'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/auth/useAuth'
import { useLogout } from '@/auth/useLogout'
import { EMAIL_RE, errorText } from '@/lib/formErrors'
import { VEHICLE_TYPE_LABEL } from '@/lib/vehicles'
import {
  changeDriverPassword,
  getDriverSettings,
  updateDriverProfile,
  updateDriverSettings,
  uploadDriverAvatar,
} from '@/services/driverService'
import type { DriverNotificationPrefs, DriverSettingsResponse } from '@/types/api'

type Theme = 'light' | 'dark'

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const NOTIFICATION_OPTIONS: Array<{ id: keyof DriverNotificationPrefs; label: string; description: string }> = [
  {
    id: 'paymentAlerts',
    label: 'Suivi de mes paiements',
    description: 'Une notification quand un versement est enregistré, validé, refusé ou remis en attente par l’administrateur.',
  },
  {
    id: 'paymentReminders',
    label: 'Rappel de versement',
    description: 'Chaque vendredi matin, un rappel dans l’application tant que le versement de la semaine n’est pas réglé, avec le montant restant à verser.',
  },
]

function NotificationsCard(props: { prefs: DriverNotificationPrefs; onPref: (key: keyof DriverNotificationPrefs, value: boolean) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choisissez ce dont vous voulez être prévenu dans l’application.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 @3xl/page:grid-cols-2">
          {NOTIFICATION_OPTIONS.map((opt) => (
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
        <p className="text-xs text-muted-foreground">
          Les notifications qui engagent votre contrat (véhicule affecté ou retiré, résiliation, signalement traité) vous sont toujours envoyées.
        </p>
      </CardContent>
    </Card>
  )
}

function AccountCard(props: { data: DriverSettingsResponse; theme: Theme; onToggleTheme: () => void; onLogout: () => void }) {
  const { data } = props
  const vehicle = data.vehicle
  return (
    <div className="grid grid-cols-1 gap-4 @3xl/page:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mon compte conducteur</CardTitle>
          <CardDescription>Informations de votre compte, en lecture seule.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <dt className="text-muted-foreground">Membre depuis</dt>
            <dd className="text-right font-semibold" data-testid="member-since">
              {dateLabel(data.profile.memberSince)}
            </dd>
            <dt className="text-muted-foreground">Véhicule</dt>
            <dd className="text-right font-semibold" data-testid="vehicle">
              {vehicle ? `${VEHICLE_TYPE_LABEL[vehicle.vehicleType]} · ${vehicle.matricule}` : 'Aucun véhicule affecté'}
            </dd>
            {vehicle?.assignedAt ? (
              <>
                <dt className="text-muted-foreground">Affecté le</dt>
                <dd className="text-right font-semibold" data-testid="assigned-at">
                  {dateLabel(vehicle.assignedAt)}
                </dd>
              </>
            ) : null}
          </dl>
          <p className="text-xs text-muted-foreground">
            Votre contrat et vos échéances sont sur le{' '}
            <Link to="/driver-dashboard" className="font-medium text-primary hover:underline">
              tableau de bord
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Affichage et session</CardTitle>
          <CardDescription>Réglages de cet appareil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/40 p-4">
            <div className="min-w-0">
              <Label htmlFor="theme-switch" className="flex items-center gap-2 text-sm font-semibold">
                {props.theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
                Thème sombre
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">Mémorisé sur cet appareil. L’application est disponible en français.</p>
            </div>
            <Switch id="theme-switch" checked={props.theme === 'dark'} onCheckedChange={props.onToggleTheme} />
          </div>
          <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={props.onLogout}>
            <LogOut />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsForm(props: {
  data: DriverSettingsResponse
  theme: Theme
  onToggleTheme: () => void
  onSaved: (data: DriverSettingsResponse) => void
  onReset: () => void
  onAvatar: (url: string) => void
  onPasswordChanged: () => void
}) {
  const { data } = props
  const { updateUser } = useAuth()
  const handleLogout = useLogout()
  const [fullName, setFullName] = useState(data.profile.fullName)
  const [email, setEmail] = useState(data.profile.email ?? '')
  const [phone, setPhone] = useState(data.profile.phoneNumber)
  const [prefs, setPrefs] = useState(data.notifications)
  const [saving, setSaving] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const profileDirty =
    fullName.trim() !== data.profile.fullName || email.trim() !== (data.profile.email ?? '') || phone.trim() !== data.profile.phoneNumber
  const prefsDirty = (Object.keys(prefs) as Array<keyof DriverNotificationPrefs>).some((k) => prefs[k] !== data.notifications[k])
  const dirty = profileDirty || prefsDirty

  const save = async () => {
    if (!fullName.trim()) return toast.error('Le nom complet est requis')
    if (!phone.trim()) return toast.error('Le numéro de téléphone est requis')
    if (email.trim() && !EMAIL_RE.test(email.trim())) return toast.error('Adresse e-mail invalide')
    if (!email.trim() && data.profile.email) return toast.error("L'adresse e-mail ne peut pas être supprimée")

    setSaving(true)
    try {
      let next = data
      if (profileDirty) {
        const profile = await updateDriverProfile({ fullName: fullName.trim(), phoneNumber: phone.trim(), email: email.trim() || undefined })
        next = { ...next, profile: { ...next.profile, ...profile } }
        updateUser({ fullName: profile.fullName, email: profile.email, phoneNumber: profile.phoneNumber })
      }
      if (prefsDirty) next = await updateDriverSettings(prefs)
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
            <span className="sr-only sm:not-sr-only">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 gap-2 py-2">
            <Bell />
            <span className="sr-only sm:not-sr-only">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="compte" className="flex-1 gap-2 py-2">
            <UserCog />
            <span className="sr-only sm:not-sr-only">Compte</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <ProfileCard
            idPrefix="driver"
            title="Mon profil"
            description="Vos informations personnelles, utilisées pour votre contrat et vos paiements."
            avatarUrl={data.profile.avatarUrl}
            savedName={data.profile.fullName}
            fullName={fullName}
            email={email}
            phone={phone}
            emailHint="Reçoit les messages de la plateforme, par exemple vos identifiants si l'administrateur les réinitialise."
            passwordHint={data.profile.passwordChangedAt ? `Dernière modification le ${dateLabel(data.profile.passwordChangedAt)}.` : 'Jamais modifié depuis la création du compte.'}
            onChange={(patch) => {
              if (patch.fullName !== undefined) setFullName(patch.fullName)
              if (patch.email !== undefined) setEmail(patch.email)
              if (patch.phone !== undefined) setPhone(patch.phone)
            }}
            uploadAvatar={uploadDriverAvatar}
            onAvatar={props.onAvatar}
            changePassword={changeDriverPassword}
            onPasswordChanged={props.onPasswordChanged}
          />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsCard prefs={prefs} onPref={(key, value) => setPrefs((prev) => ({ ...prev, [key]: value }))} />
        </TabsContent>
        <TabsContent value="compte">
          <AccountCard data={data} theme={props.theme} onToggleTheme={props.onToggleTheme} onLogout={() => setConfirmLogout(true)} />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 -mx-3 mt-auto flex items-center justify-end gap-2 border-t bg-background/90 px-3 py-3 backdrop-blur sm:-mx-4 sm:gap-3 sm:px-4 sm:py-4 md:-mx-6 md:px-6">
        {dirty ? <span className="mr-auto hidden whitespace-nowrap text-xs font-medium text-muted-foreground sm:inline md:hidden lg:inline">Modifications non enregistrées</span> : null}
        <Button type="button" variant="outline" className="min-w-0 flex-1 sm:flex-none" disabled={!dirty || saving} onClick={props.onReset}>
          <RotateCcw />
          Réinitialiser
        </Button>
        <Button type="button" className="min-w-0 flex-1 sm:flex-none" aria-label="Enregistrer les modifications" disabled={!dirty || saving} onClick={() => void save()}>
          <Save />
          <span className="sm:hidden">{saving ? 'Envoi…' : 'Enregistrer'}</span>
          <span className="hidden sm:inline">{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</span>
        </Button>
      </div>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
            <AlertDialogDescription>Vous devrez vous reconnecter pour accéder à votre espace.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Se déconnecter</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function DriverSettings() {
  const { updateUser } = useAuth()
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [data, setData] = useState<DriverSettingsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  // changer la clé recrée le formulaire avec les valeurs enregistrées (« Réinitialiser » et après un enregistrement)
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    getDriverSettings()
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

  const onSaved = useCallback((next: DriverSettingsResponse) => {
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

  const onPasswordChanged = useCallback(() => {
    setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, passwordChangedAt: new Date().toISOString() } } : prev))
  }, [])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <AdminLayout portal="driver" title="Paramètres" description="Gérez vos informations personnelles et vos préférences de l'application." theme={theme} onToggleTheme={toggleTheme}>
      <div className="@container/page flex min-w-0 flex-1 flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : data === null ? (
          <div className="space-y-4" data-testid="settings-skeleton">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <SettingsForm
            key={formKey}
            data={data}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSaved={onSaved}
            onReset={() => setFormKey((k) => k + 1)}
            onAvatar={onAvatar}
            onPasswordChanged={onPasswordChanged}
          />
        )}
      </div>
    </AdminLayout>
  )
}
