import { useState } from 'react'
import {
  Bell,
  Camera,
  Lock,
  Mail,
  MoreVertical,
  Plus,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import AnimatedContent from '../components/AnimatedContent'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Switch } from '../components/ui/switch'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'profil' | 'plateforme' | 'acces' | 'notifications'

// ─── Tab nav ──────────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string; Icon: React.ElementType }> = [
  { id: 'profil',        label: 'Profil Admin',               Icon: User         },
  { id: 'plateforme',    label: 'Configuration Plateforme',    Icon: Settings     },
  { id: 'acces',         label: 'Gestion des Accès',           Icon: ShieldCheck  },
  { id: 'notifications', label: 'Notifications & Alertes',     Icon: Bell         },
]

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50 dark:placeholder:text-slate-500',
        props.className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200',
        props.className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

// ─── Section: Profil Admin ────────────────────────────────────────────────────

function SectionProfilAdmin() {
  const [nom, setNom] = useState('Grand Patron')
  const [email, setEmail] = useState('grandpatron@camerrideshare.cm')
  const [password, setPassword] = useState('')

  return (
    <Card>
      <CardHeader className="p-5 pb-4">
        <CardTitle className="text-base">Profil Admin</CardTitle>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Vos informations personnelles visibles sur la plateforme.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar col */}
          <div className="flex shrink-0 flex-col items-center gap-3">
            <Avatar className="h-20 w-20 ring-4 ring-blue-50 dark:ring-blue-950/40">
              <AvatarImage
                src="https://i.pravatar.cc/200?img=12"
                alt="Grand Patron"
                className="h-full w-full object-cover"
              />
              <AvatarFallback>GP</AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
            >
              <Camera className="h-3.5 w-3.5" />
              Changer l'avatar
            </button>
          </div>

          {/* Fields col */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom Complet">
                <TextInput
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom complet"
                />
              </Field>
              <Field label="Adresse Email">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <TextInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemple.cm"
                    className="pl-10"
                  />
                </div>
              </Field>
            </div>

            <Field label="Mot de Passe">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-10"
                  />
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Modifier
                </button>
              </div>
            </Field>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Section: Configuration Plateforme ───────────────────────────────────────

function SectionPlateforme() {
  const [commission, setCommission] = useState('15')
  const [versement, setVersement] = useState('15000')
  const [devise, setDevise] = useState('xaf')

  return (
    <Card>
      <CardHeader className="p-5 pb-4">
        <CardTitle className="text-base">Configuration de la Plateforme</CardTitle>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Paramètres globaux appliqués à l'ensemble de la flotte.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Taux de Commission (%)" hint="Prélevé sur chaque versement conducteur.">
            <TextInput
              type="number"
              min="0"
              max="100"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              placeholder="15"
            />
          </Field>

          <Field label="Versement Hebdo. Défaut (XAF)" hint="Montant attendu chaque semaine par moto.">
            <TextInput
              type="number"
              min="0"
              value={versement}
              onChange={(e) => setVersement(e.target.value)}
              placeholder="15,000"
            />
          </Field>

          <Field label="Devise Locale" hint="Monnaie utilisée sur la plateforme.">
            <SelectInput value={devise} onChange={(e) => setDevise(e.target.value)}>
              <option value="xaf">Franc CFA (XAF)</option>
              <option value="usd">Dollar américain (USD)</option>
              <option value="eur">Euro (EUR)</option>
            </SelectInput>
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Section: Gestion des Accès ───────────────────────────────────────────────

const mockAdmins = [
  {
    id: 'a1',
    nom: 'Moussa Kamga',
    email: 'moussa.k@camerrideshare.cm',
    role: 'MODÉRATEUR',
    roleVariant: 'blue' as const,
    lastSeen: 'Il y a 2 heures',
    avatarUrl: 'https://i.pravatar.cc/100?img=14',
    avatarFallback: 'MK',
  },
  {
    id: 'a2',
    nom: 'Linda Sone',
    email: 'linda.s@camerrideshare.cm',
    role: 'ADMIN SECONDAIRE',
    roleVariant: 'orange' as const,
    lastSeen: 'Hier, 18:45',
    avatarFallback: 'LS',
  },
]

function SectionAcces() {
  return (
    <Card>
      <CardHeader className="p-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Gestion des Accès</CardTitle>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Administrateurs ayant accès au portail.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un Admin
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 dark:divide-slate-800/60 dark:border-slate-800/60">
          {mockAdmins.map((admin) => (
            <div key={admin.id} className="flex items-center gap-4 p-4 transition hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
              <Avatar className="h-10 w-10 shrink-0">
                {admin.avatarUrl ? (
                  <AvatarImage src={admin.avatarUrl} alt={admin.nom} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback>{admin.avatarFallback}</AvatarFallback>
                )}
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{admin.nom}</span>
                  <Badge variant={admin.roleVariant} className="text-[10px]">
                    {admin.role}
                  </Badge>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {admin.email}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xs text-slate-400 dark:text-slate-500">{admin.lastSeen}</div>
              </div>

              <button
                type="button"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label={`Options pour ${admin.nom}`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Section: Notifications ───────────────────────────────────────────────────

type NotifOption = {
  id: string
  label: string
  description: string
  defaultOn: boolean
}

const notifOptions: NotifOption[] = [
  {
    id: 'sms',
    label: 'Notifications SMS',
    description: 'Recevez des alertes critiques par SMS sur votre téléphone.',
    defaultOn: true,
  },
  {
    id: 'email',
    label: 'Rapports Hebdomadaires par Email',
    description: 'Rapport automatique chaque lundi matin à 08h00.',
    defaultOn: true,
  },
  {
    id: 'maintenance',
    label: 'Alertes de Maintenance',
    description: "Notification lors d'une panne ou d'un entretien planifié.",
    defaultOn: false,
  },
  {
    id: 'investisseurs',
    label: 'Notifications Investisseurs',
    description: "Alertes en cas de retard de recouvrement pour un investisseur.",
    defaultOn: true,
  },
]

function SectionNotifications() {
  const [seuilRetard, setSeuilRetard] = useState('7')
  const [seuilCritique, setSeuilCritique] = useState('21')
  const [notifState, setNotifState] = useState<Record<string, boolean>>(
    Object.fromEntries(notifOptions.map((o) => [o.id, o.defaultOn])),
  )

  return (
    <Card>
      <CardHeader className="p-5 pb-4">
        <CardTitle className="text-base">Notifications & Alertes</CardTitle>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Configurez les seuils et canaux de notification.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Seuils */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Seuil Alerte de Retard (jours)"
            hint="Déclenche une alerte orange si dépassé."
          >
            <TextInput
              type="number"
              min="1"
              value={seuilRetard}
              onChange={(e) => setSeuilRetard(e.target.value)}
              placeholder="7"
            />
          </Field>
          <Field
            label="Seuil Alerte Critique (jours)"
            hint="Déclenche une alerte rouge si dépassé."
          >
            <TextInput
              type="number"
              min="1"
              value={seuilCritique}
              onChange={(e) => setSeuilCritique(e.target.value)}
              placeholder="21"
            />
          </Field>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800/60" />

        {/* Toggles grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {notifOptions.map((opt) => (
            <div
              key={opt.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-800/20"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{opt.label}</div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{opt.description}</div>
              </div>
              <Switch
                checked={notifState[opt.id]}
                onChange={(v) => setNotifState((prev) => ({ ...prev, [opt.id]: v }))}
                aria-label={opt.label}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── ParametresPage ───────────────────────────────────────────────────────────

type ParametresPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function ParametresPage({ theme, onToggleTheme }: ParametresPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('profil')

  // Which sections to show per tab
  const showAll = activeTab === 'profil'   // Show all stacked on "Profil" for demo
  const showPlateforme    = activeTab === 'plateforme'    || showAll
  const showAcces         = activeTab === 'acces'         || showAll
  const showNotifications = activeTab === 'notifications' || showAll
  const showProfil        = activeTab === 'profil'        || showAll

  return (
    <AnimatedContent className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950" direction="vertical" distance={80} duration={0.9}>
      <div className="flex">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 p-6">
          {/* ── Header ── */}
          <div className="mb-6">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Paramètres du Système</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Gérez les configurations de la plateforme et vos informations personnelles.
            </p>
          </div>

          {/* ── Tab bar ── */}
          <div className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
            {TABS.map((tab) => {
              const Icon = tab.Icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── Sections ── */}
          <div className="space-y-6">
            {showProfil        && <SectionProfilAdmin />}
            {showPlateforme    && <SectionPlateforme />}
            {showAcces         && <SectionAcces />}
            {showNotifications && <SectionNotifications />}
          </div>
        </main>
      </div>

      {/* ── Sticky footer ── */}
      <div className="fixed bottom-0 right-0 z-40 flex items-center gap-3 border-t border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/90"
           style={{ left: '288px' }}
      >
        <div className="flex-1" />
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
        >
          <Save className="h-4 w-4" />
          Enregistrer les modifications
        </button>
      </div>
    </AnimatedContent>
  )
}
