import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, CreditCard, Flag, Wallet } from 'lucide-react'

import { EffectCard, SpotlightSection } from '../../components/MagicBento'
import DriverSidebar from '../../components/DriverSidebar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

type Payment = {
  id: string
  libelle: string
  date: Date
  montant: number
  paye: boolean
}

type DriverProgress = {
  proprietePct: number
  resteAPayer: number
  prochainPaiementJours: number
  estAJour: boolean
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockProgress: DriverProgress = {
  proprietePct: 45,
  resteAPayer: 450_000,
  prochainPaiementJours: 5,
  estAJour: true,
}

function mockPayments(): Payment[] {
  return [
    {
      id: 'p1',
      libelle: 'Versement Hebdomadaire',
      date: new Date(2026, 4, 22, 10, 30),
      montant: 25_000,
      paye: true,
    },
    {
      id: 'p2',
      libelle: 'Versement Hebdomadaire',
      date: new Date(2026, 4, 15, 14, 15),
      montant: 25_000,
      paye: true,
    },
    {
      id: 'p3',
      libelle: 'Versement Hebdomadaire',
      date: new Date(2026, 4, 8, 8, 45),
      montant: 25_000,
      paye: true,
    },
    {
      id: 'p4',
      libelle: 'Versement Hebdomadaire',
      date: new Date(2026, 4, 1, 11, 0),
      montant: 25_000,
      paye: true,
    },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date) {
  const day = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  const hh = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${hh}`
}

function formatXaf(amount: number) {
  return amount.toLocaleString('fr-FR')
}

// ─── DonutChart (SVG circulaire, sans dépendance) ────────────────────────────

function CircularGauge({ pct }: { pct: number }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          {/* Bague de fond */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            className="text-slate-100 dark:text-slate-800"
          />
          {/* Bague de progression (part conducteur) */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-blue-600 dark:text-blue-400"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
          {/* Bague part investisseur */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeDasharray={`${circumference - offset} ${circumference}`}
            strokeDashoffset={0}
            className="text-slate-300 dark:text-slate-600"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>

        {/* Texte centré dans le SVG via position absolute */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-slate-900 dark:text-slate-50">{pct}%</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">VOUS APPARTIENT</span>
        </div>
      </div>

      {/* Légendes */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Part Chauffeur</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">Part Investisseur</span>
        </div>
      </div>
    </div>
  )
}

// ─── DriverDashboard ─────────────────────────────────────────────────────────

export default function DriverDashboard() {
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

  const payments = useMemo(() => mockPayments(), [])
  const progress = mockProgress

  const [signalerOpen, setSignalerOpen] = useState(false)
  const [signalementTexte, setSignalementTexte] = useState('')

  const handleSignaler = () => {
    if (!signalementTexte.trim()) return
    console.log('[DriverDashboard] signalement:', signalementTexte)
    window.alert('Signalement envoyé (mock).')
    setSignalementTexte('')
    setSignalerOpen(false)
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
                Ma Propriété Moto
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Suivez votre progression vers la pleine propriété
              </p>
            </div>

            {/* Grille responsive : jauge + infos à gauche, historique à droite */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Colonne gauche : jauge + infos */}
              <div className="space-y-5">
                {/* Jauge de progression */}
                <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-base">Progression</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pb-6 pt-2">
                    <CircularGauge pct={progress.proprietePct} />
                  </CardContent>
                </Card></EffectCard>

                {/* Reste à payer + Statut */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                    <CardHeader className="p-5 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Wallet className="h-4 w-4 text-slate-500" />
                        Reste à payer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                        FCFA {formatXaf(progress.resteAPayer)}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-500">
                        {100 - progress.proprietePct}% restant à payer
                      </div>
                    </CardContent>
                  </Card></EffectCard>

                  <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                    <CardHeader className="p-5 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle className="h-4 w-4 text-slate-500" />
                        Statut
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5 pt-0">
                      <Badge variant="green" className="gap-1.5 px-3 py-1 text-xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        À jour
                      </Badge>
                      <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Prochain paiement dans {progress.prochainPaiementJours} jours
                      </div>

                      <div className="flex flex-row flex-wrap gap-2 pt-2">
                        <Button
                          type="button"
                          onClick={() => window.alert('Contactez l\'administrateur')}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <CreditCard className="h-4 w-4" />
                          Effacer un paiement
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setSignalerOpen(true)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900/40 dark:bg-slate-900/40 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          <Flag className="h-4 w-4" />
                          Signaler un problème
                        </Button>
                      </div>
                    </CardContent>
                  </Card></EffectCard>
                </div>
              </div>

              {/* Colonne droite : historique */}
              <div className="lg:col-span-1">
                <EffectCard className="rounded-2xl h-full"><Card className="flex h-full flex-col rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base">Paiements Récents</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-5 pt-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {p.libelle}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(p.date)}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                              FCFA {formatXaf(p.montant)}
                            </div>
                            {p.paye && (
                              <Badge variant="green" className="mt-1 gap-1 px-2 py-0.5 text-[10px]">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Payé
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card></EffectCard>
              </div>
            </div>

            {/* Footer identité */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Jean Dupont – Conducteur Vérité
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">CamerRideShare</div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de signalement */}
      {signalerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur" onClick={() => setSignalerOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-md">
            <Card className="rounded-2xl border-slate-200/70 bg-white p-6 shadow-lg dark:border-slate-800/60 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="text-base font-bold text-slate-900 dark:text-slate-50">Signaler un problème</div>
                <Button
                  type="button"
                  onClick={() => setSignalerOpen(false)}
                  className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Fermer"
                >
                  ✕
                </Button>
              </div>

              <div className="mt-4 space-y-4">
                <textarea
                  value={signalementTexte}
                  onChange={(e) => setSignalementTexte(e.target.value)}
                  placeholder="Décrivez votre problème..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50 dark:placeholder:text-slate-500"
                />

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    onClick={() => setSignalerOpen(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSignaler}
                    disabled={!signalementTexte.trim()}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Envoyer
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </SpotlightSection>
  )
}
