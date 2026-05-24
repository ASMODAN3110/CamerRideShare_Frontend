import { useEffect, useState } from 'react'
import {
  Bell,
  ChevronDown,
  Eye,
  Globe,
  Lock,
  LogOut,
  MessageCircle,
  Pencil,
  Shield,
  Smartphone,
  User,
} from 'lucide-react'

import { EffectCard, SpotlightSection } from '../../components/MagicBento'
import DriverSidebar from '../../components/DriverSidebar'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Switch } from '../../components/ui/switch'

// ─── Types ────────────────────────────────────────────────────────────────────

type Language = 'fr' | 'en'

type DriverSettings = {
  smsAlerts: boolean
  pushNotifications: boolean
  paymentReminders: boolean
  language: Language
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const DRIVER = {
  name: 'Jean Dupont',
  email: 'jean.dupont@gmail.com',
  phone: '+237 6 00 00 00 00',
  memberSince: 2021,
}

// ─── DriverSettings ─────────────────────────────────────────────────────────

export default function DriverSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const onToggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  // Form state
  const [settings, setSettings] = useState<DriverSettings>({
    smsAlerts: true,
    pushNotifications: true,
    paymentReminders: false,
    language: 'fr',
  })

  const updateSetting = <K extends keyof DriverSettings>(key: K, value: DriverSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleEditProfile = () => {
    window.alert('Modification du profil (mock) — formulaire à implémenter.')
  }

  const handleChangePassword = () => {
    window.alert('Changement de mot de passe (mock) — page à implémenter.')
  }

  const handleConfigure2FA = () => {
    window.alert('Configuration 2FA (mock) — page à implémenter.')
  }

  const handleLogout = () => {
    window.alert('Déconnexion (mock) — redirection vers la page de connexion.')
  }

  return (
    <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex">
        <DriverSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 p-6">
          <div className="w-full space-y-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Paramètres du compte
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Gérez vos informations personnelles et vos préférences de l'application.
              </p>
            </div>

            {/* Informations personnelles */}
            <EffectCard className="rounded-2xl">
              <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4 text-slate-500" />
                    Informations personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-0">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="rounded-full bg-blue-600 text-lg font-bold text-white">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                          {DRIVER.name}
                        </span>
                        <Badge variant="green">Conducteur Vérifié</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        Membre depuis {DRIVER.memberSince}
                      </p>
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800/60" />

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Smartphone className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">{DRIVER.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MessageCircle className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">{DRIVER.email}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleEditProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier le profil
                  </Button>
                </CardContent>
              </Card>
            </EffectCard>

            {/* Sécurité */}
            <EffectCard className="rounded-2xl">
              <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-slate-500" />
                    Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 p-5 pt-0">
                  {/* Mot de passe */}
                  <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          Mot de passe
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Dernière modif. il y a 3 mois
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleChangePassword}
                      className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Changer
                    </Button>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800/60" />

                  {/* 2FA */}
                  <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <div className="flex items-start gap-3">
                      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          Authentification 2FA
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Sécurisez votre compte avec un code SMS.
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleConfigure2FA}
                      className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Configurer
                    </Button>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800/60" />

                  {/* Alertes SMS */}
                  <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <div className="flex items-start gap-3">
                      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          Alertes SMS
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Notifications critiques : pannes signalées, urgences.
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.smsAlerts}
                      onChange={(v) => updateSetting('smsAlerts', v)}
                      aria-label="Alertes SMS"
                    />
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800/60" />

                  {/* Notifications Push */}
                  <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <div className="flex items-start gap-3">
                      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          Notifications Push
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Demandes de nouveaux trajets en temps réel.
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={(v) => updateSetting('pushNotifications', v)}
                      aria-label="Notifications Push"
                    />
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800/60" />

                  {/* Rappels de paiement */}
                  <div className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <div className="flex items-start gap-3">
                      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          Rappels de paiement
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Résumé hebdomadaire et versements imminents.
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={settings.paymentReminders}
                      onChange={(v) => updateSetting('paymentReminders', v)}
                      aria-label="Rappels de paiement"
                    />
                  </div>
                </CardContent>
              </Card>
            </EffectCard>

            {/* Langue & Affichage */}
            <EffectCard className="rounded-2xl">
              <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4 text-slate-500" />
                    Langue & Affichage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-0">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choisissez la langue principale de l'interface de l'application.
                  </p>
                  <div className="relative">
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value as Language)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            </EffectCard>

            {/* Déconnexion */}
            <EffectCard className="rounded-2xl">
              <Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardContent className="p-5">
                  <Button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900/40 dark:bg-slate-900/40 dark:text-red-400 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </Button>
                </CardContent>
              </Card>
            </EffectCard>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {DRIVER.name} – Conducteur Vérifié
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">CamerRideShare</div>
            </div>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}
