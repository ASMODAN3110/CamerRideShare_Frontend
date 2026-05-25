import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, LogOut, Mail, Shield, User as UserIcon } from 'lucide-react'

import InvestorSidebar from '../../components/InvestorSidebar'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { ParticleHover, SpotlightSection } from '../../components/MagicBento'

type Theme = 'light' | 'dark'

type Profile = {
  name: string
  role: string
  email: string
  avatarFallback: string
  avatarUrl?: string
}

function Breadcrumb() {
  return (
    <div className="text-xs text-slate-500 dark:text-slate-400">
      <span className="font-semibold text-slate-700 dark:text-slate-200">Accueil</span>
      <span className="mx-2">›</span>
      <span className="font-semibold">Paramètres</span>
    </div>
  )
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg">
        <Card className="rounded-2xl p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</div>
            </div>
            <Button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Fermer"
            >
              ✕
            </Button>
          </div>

          <div className="mt-4">{children}</div>
        </Card>
      </div>
    </div>
  )
}

export default function InvestorSettings() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [theme, setTheme] = useState<Theme>(() => {
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

  const userProfile = useMemo<Profile>(
    () => ({
      name: 'Patron Invest',
      role: 'Investisseur Principal',
      email: 'patron.invest@example.com',
      avatarFallback: 'PI',
      avatarUrl: undefined,
    }),
    [],
  )

  const [profileDraft, setProfileDraft] = useState(userProfile)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [isTwoFaEnabled, setIsTwoFaEnabled] = useState(true)

  const onLogout = () => {
    const ok = window.confirm('Confirmer la déconnexion ?')
    if (!ok) return
    console.log('[InvestorSettings] logout (mock)')
    navigate('/connexion')
  }

  const onSaveProfile = () => {
    console.log('[InvestorSettings] save profile (mock)', profileDraft)
    window.alert("Profil mis à jour (mock).")
    setIsEditingProfile(false)
  }

  const onSavePassword = () => {
    console.log('[InvestorSettings] change password (mock)', { currentPassword: '***', newPassword: '***' })
    window.alert('Mot de passe changé (mock).')
    setCurrentPassword('')
    setNewPassword('')
    setIsChangingPassword(false)
  }

  return (
    <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex">
        <div className="no-print">
          <InvestorSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        </div>

        <main className="flex-1 p-6">
          <div className="w-full space-y-5">
            <Breadcrumb />

            <header>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Paramètres</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Gérez votre compte et vos préférences d'investissement.
              </p>
            </header>

            <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
              {/* Informations du profil */}
              <div className="space-y-4">
                <div className="text-base font-bold text-slate-900 dark:text-slate-50">Informations du profil</div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar className="h-16 w-16 ring-4 ring-blue-50 dark:ring-blue-950/40">
                      {profileDraft.avatarUrl ? (
                        <AvatarImage src={profileDraft.avatarUrl} alt={profileDraft.name} className="h-full w-full object-cover" />
                      ) : (
                        <AvatarFallback>{profileDraft.avatarFallback}</AvatarFallback>
                      )}
                    </Avatar>

                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-slate-900 dark:text-slate-50">{profileDraft.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary">{profileDraft.role}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{profileDraft.email}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Modifier le profil
                  </Button>
                </div>
              </div>

              <div className="mt-7 border-t border-slate-100 dark:border-slate-800/60" />

              {/* Sécurité */}
              <div className="mt-7 space-y-4">
                <div className="text-base font-bold text-slate-900 dark:text-slate-50">Sécurité</div>

                {/* Mot de passe */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      <Lock className="h-4 w-4 text-slate-500" />
                      Mot de passe
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Dernière modification il y a 3 mois</div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsChangingPassword(true)}
                    className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Changer
                  </Button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/60" />

                {/* 2FA */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                      <Shield className="h-4 w-4 text-slate-500" />
                      Authentification à deux facteurs (2FA)
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Ajoute une couche de sécurité supplémentaire
                    </div>
                  </div>

                  <Switch
                    checked={isTwoFaEnabled}
                    onChange={(v) => {
                      setIsTwoFaEnabled(v)
                      console.log('[InvestorSettings] toggle 2FA (mock)', v)
                      window.alert(v ? '2FA activé (mock).' : '2FA désactivé (mock).')
                    }}
                    aria-label="Authentification à deux facteurs"
                  />
                </div>
              </div>

              {/* Déconnexion */}
              <div className="mt-7">
                <div className="border-t border-slate-100 dark:border-slate-800/60" />
                <div className="pt-5">
                  <Button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 rounded-xl bg-transparent px-0 text-red-600 hover:underline dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </Card></ParticleHover>

            {/* Modale édition profil */}
            <Modal
              open={isEditingProfile}
              title="Modifier le profil"
              onClose={() => setIsEditingProfile(false)}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nom</label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50"
                      value={profileDraft.name}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50"
                      type="email"
                      value={profileDraft.email}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={onSaveProfile}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Modale changement mot de passe */}
            <Modal
              open={isChangingPassword}
              title="Changer le mot de passe"
              onClose={() => setIsChangingPassword(false)}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mot de passe actuel</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={onSavePassword}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}

