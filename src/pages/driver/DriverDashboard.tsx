import { useEffect, useState } from 'react'
import { CheckCircle, Flag, Loader2, Trash2, Wallet } from 'lucide-react'

import { ParticleHover, SpotlightSection } from '../../components/MagicBento'
import DriverSidebar from '../../components/DriverSidebar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../types/auth'
import type { DriverPaymentRow, DriverProgress } from '../../types/api'
import {
  getDriverProgress,
  getDriverPayments,
  createReport,
  deleteDriverPayment,
} from '../../services/driverService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
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
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // États de données
  const [progress, setProgress] = useState<DriverProgress | null>(null)
  const [payments, setPayments] = useState<DriverPaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // États signalement
  const [signalerOpen, setSignalerOpen] = useState(false)
  const [signalementTexte, setSignalementTexte] = useState('')
  const [sendingReport, setSendingReport] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const onToggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  // ── Chargement des données ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [progressData, paymentsData] = await Promise.all([
          getDriverProgress(),
          getDriverPayments(),
        ])
        if (cancelled) return
        setProgress(progressData)
        setPayments(paymentsData.data)
      } catch (err) {
        if (cancelled) return
        const msg =
          err instanceof ApiError
            ? typeof err.body.message === 'string'
              ? err.body.message
              : err.body.message.join(', ')
            : 'Impossible de charger les données. Veuillez réessayer.'
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Actions ────────────────────────────────────────────────────────────

  const handleSignaler = async () => {
    if (!signalementTexte.trim()) return
    setSendingReport(true)
    try {
      const report = await createReport({ description: signalementTexte.trim() })
      window.alert(`Signalement envoyé (N°${report.id})`)
      setSignalementTexte('')
      setSignalerOpen(false)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.body.message === 'string'
            ? err.body.message
            : err.body.message.join(', ')
          : "Erreur lors de l'envoi du signalement."
      window.alert(msg)
    } finally {
      setSendingReport(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Voulez-vous vraiment effacer ce paiement ? Cette action est irréversible.')) return
    setDeleting(paymentId)
    try {
      await deleteDriverPayment(paymentId)
      setPayments((prev) => prev.filter((p) => p.id !== paymentId))
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.body.message === 'string'
            ? err.body.message
            : err.body.message.join(', ')
          : 'Erreur lors de la suppression du paiement.'
      window.alert(msg)
    } finally {
      setDeleting(null)
    }
  }

  // ── États d'affichage ──────────────────────────────────────────────────

  if (loading) {
    return (
      <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex">
          <DriverSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} onToggleTheme={onToggleTheme} />
          <main className="flex flex-1 items-center justify-center p-6">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </main>
        </div>
      </SpotlightSection>
    )
  }

  if (error) {
    return (
      <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex">
          <DriverSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} onToggleTheme={onToggleTheme} />
          <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
              Réessayer
            </Button>
          </main>
        </div>
      </SpotlightSection>
    )
  }

  if (!progress) return null

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
                <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-base">Progression</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pb-6 pt-2">
                    <CircularGauge pct={progress.proprietePct} />
                  </CardContent>
                </Card></ParticleHover>

                {/* Reste à payer + Statut */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
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
                  </Card></ParticleHover>

                  <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                    <CardHeader className="p-5 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle className="h-4 w-4 text-slate-500" />
                        Statut
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-5 pt-0">
                      {progress.estAJour ? (
                        <Badge variant="green" className="gap-1.5 px-3 py-1 text-xs">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          À jour
                        </Badge>
                      ) : (
                        <Badge variant="red" className="gap-1.5 px-3 py-1 text-xs">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          En retard
                        </Badge>
                      )}
                      <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Prochain paiement dans {progress.prochainPaiementJours} jours
                      </div>

                      <div className="flex flex-row flex-wrap gap-2 pt-2">
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
                  </Card></ParticleHover>
                </div>
              </div>

              {/* Colonne droite : historique */}
              <div className="lg:col-span-1">
                <ParticleHover className="rounded-2xl h-full"><Card className="flex h-full flex-col rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base">Paiements Récents</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-5 pt-0">
                    {payments.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-400">Aucun paiement pour le moment.</p>
                    ) : (
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
                            <div className="flex shrink-0 items-center gap-2">
                              <div className="text-right">
                                <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                                  FCFA {formatXaf(p.montant)}
                                </div>
                                {p.status === 'Validé' ? (
                                  <Badge variant="green" className="mt-1 gap-1 px-2 py-0.5 text-[10px]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Payé
                                  </Badge>
                                ) : (
                                  <Badge variant="orange" className="mt-1 gap-1 px-2 py-0.5 text-[10px]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                    En attente
                                  </Badge>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(p.id)}
                                disabled={deleting === p.id}
                                className="ml-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                                aria-label={`Effacer le paiement ${p.libelle}`}
                              >
                                {deleting === p.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card></ParticleHover>
              </div>
            </div>

            {/* Footer identité */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {user?.fullName ?? 'Conducteur'} – Conducteur Vérité
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
                    disabled={!signalementTexte.trim() || sendingReport}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingReport ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      'Envoyer'
                    )}
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
