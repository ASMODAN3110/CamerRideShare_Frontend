import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Bell, Banknote, LogOut, Moon, RotateCcw, Save, Send, Sun, User, UserCog } from 'lucide-react'
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
import { PAYOUT_FREQUENCY_LABEL } from '@/lib/payouts'
import {
  changeInvestorPassword,
  getInvestorSettings,
  sendInvestorWeeklyReportNow,
  updateInvestorProfile,
  updateInvestorSettings,
  uploadInvestorAvatar,
} from '@/services/investorService'
import type { InvestorNotificationPrefs, InvestorSettings as InvestorSettingsData } from '@/types/api'

type Theme = 'light' | 'dark'

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const NOTIFICATION_OPTIONS: Array<{ id: keyof InvestorNotificationPrefs; label: string; description: string }> = [
  {
    id: 'weeklyReportEmail',
    label: 'Rapport hebdomadaire par e-mail',
    description: 'Chaque lundi matin : vos revenus de la semaine écoulée, le capital récupéré et les véhicules à surveiller.',
  },
  {
    id: 'revenueAlerts',
    label: 'Revenus et reversements',
    description: 'Une notification à chaque versement du conducteur qui vous est reversé, à chaque reversement de l’administrateur et à chaque changement de mode de versement.',
  },
  {
    id: 'vehicleAlerts',
    label: 'État des véhicules',
    description: 'Une notification quand l’un de vos véhicules tombe en panne, devient indisponible, reprend la route ou est entièrement payé.',
  },
]

function NotificationsCard(props: {
  prefs: InvestorNotificationPrefs
  hasEmail: boolean
  onPref: (key: keyof InvestorNotificationPrefs, value: boolean) => void
}) {
  const [sending, setSending] = useState(false)

  const sendNow = async () => {
    setSending(true)
    try {
      const res = await sendInvestorWeeklyReportNow()
      if (res.emailSent) toast.success('Rapport envoyé à votre adresse e-mail')
      else toast.warning("Le rapport est prêt mais l'e-mail n'a pas pu être envoyé (vérifiez la configuration d'envoi)")
    } catch (err) {
      toast.error(errorText(err, 'Envoi impossible'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choisissez ce dont vous voulez être prévenu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 @4xl/page:grid-cols-3">
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
          Les décisions sur vos demandes de parts, les nouvelles parts et les résiliations de contrat vous sont toujours notifiées : elles engagent votre capital.
        </p>

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

function AccountCard(props: { data: InvestorSettingsData; theme: Theme; onToggleTheme: () => void; onLogout: () => void }) {
  const { data } = props
  return (
    <div className="grid grid-cols-1 gap-4 @4xl/page:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mon compte investisseur</CardTitle>
          <CardDescription>Informations de votre compte, en lecture seule.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <dt className="text-muted-foreground">Membre depuis</dt>
            <dd className="text-right font-semibold" data-testid="member-since">
              {dateLabel(data.profile.memberSince)}
            </dd>
            <dt className="text-muted-foreground">Parts ouvertes</dt>
            <dd className="text-right font-semibold" data-testid="parts-count">
              {data.portfolio.partsCount} part{data.portfolio.partsCount > 1 ? 's' : ''} · {data.portfolio.vehiclesCount} véhicule{data.portfolio.vehiclesCount > 1 ? 's' : ''}
            </dd>
            <dt className="text-muted-foreground">Mode de versement</dt>
            <dd className="text-right font-semibold" data-testid="payout-frequency">
              {PAYOUT_FREQUENCY_LABEL[data.payout.frequency]}
            </dd>
          </dl>
          <p className="text-xs text-muted-foreground">
            Le mode de versement est fixé par l’administrateur, qui vous reverse vos gains à cette fréquence.{' '}
            <Link to="/investor-revenues" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <Banknote className="size-3.5" />
              Voir l’historique des revenus
            </Link>
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
              <p className="mt-0.5 text-xs text-muted-foreground">Mémorisé sur cet appareil.</p>
            </div>
            <Switch id="theme-switch" checked={props.theme === 'dark'} onCheckedChange={props.onToggleTheme} />
          </div>
          <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={props.onLogout}>
            <LogOut />
            Déconnexion
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsForm(props: {
  data: InvestorSettingsData
  theme: Theme
  onToggleTheme: () => void
  onSaved: (data: InvestorSettingsData) => void
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
  const prefsDirty = (Object.keys(prefs) as Array<keyof InvestorNotificationPrefs>).some((k) => prefs[k] !== data.notifications[k])
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
        const profile = await updateInvestorProfile({
          fullName: fullName.trim(),
          phoneNumber: phone.trim(),
          email: email.trim() || undefined,
        })
        next = { ...next, profile: { ...next.profile, ...profile } }
        updateUser({ fullName: profile.fullName, email: profile.email, phoneNumber: profile.phoneNumber })
      }
      if (prefsDirty) next = await updateInvestorSettings(prefs)
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
            idPrefix="investor"
            title="Mon profil"
            description="Vos informations personnelles, utilisées pour vos contrats et relevés."
            avatarUrl={data.profile.avatarUrl}
            savedName={data.profile.fullName}
            fullName={fullName}
            email={email}
            phone={phone}
            emailHint="Reçoit votre rapport hebdomadaire et les messages de la plateforme."
            passwordHint={data.profile.passwordChangedAt ? `Dernière modification le ${dateLabel(data.profile.passwordChangedAt)}.` : 'Jamais modifié depuis la création du compte.'}
            onChange={(patch) => {
              if (patch.fullName !== undefined) setFullName(patch.fullName)
              if (patch.email !== undefined) setEmail(patch.email)
              if (patch.phone !== undefined) setPhone(patch.phone)
            }}
            uploadAvatar={uploadInvestorAvatar}
            onAvatar={props.onAvatar}
            changePassword={changeInvestorPassword}
            onPasswordChanged={props.onPasswordChanged}
          />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsCard prefs={prefs} hasEmail={Boolean(data.profile.email)} onPref={(key, value) => setPrefs((prev) => ({ ...prev, [key]: value }))} />
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

export default function InvestorSettings() {
  const { updateUser } = useAuth()
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [data, setData] = useState<InvestorSettingsData | null>(null)
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
    getInvestorSettings()
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

  const onSaved = useCallback((next: InvestorSettingsData) => {
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

  return (
    <AdminLayout
      portal="investor"
      title="Paramètres"
      description="Gérez votre compte et vos préférences d'investissement."
      theme={theme}
      onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    >
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
            onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
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
