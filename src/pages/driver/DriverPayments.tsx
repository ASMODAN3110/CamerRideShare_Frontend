import { useEffect, useState } from 'react'
import { Calendar, CheckCircle, CreditCard, Smartphone, Wallet } from 'lucide-react'

import { ParticleHover, SpotlightSection } from '../../components/MagicBento'
import DriverSidebar from '../../components/DriverSidebar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../types/auth'
import { getPaymentSummary, getDriverPayments } from '../../services/driverService'
import type { PaymentSummary, DriverPaymentRow } from '../../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatXaf(amount: number) {
  return amount.toLocaleString('fr-FR')
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === 'Orange Money')
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
        <Smartphone className="h-4 w-4" />
      </span>
    )
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
      <CreditCard className="h-4 w-4" />
    </span>
  )
}

// ─── DriverPayments ─────────────────────────────────────────────────────────

export default function DriverPayments() {
  const { user } = useAuth()
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

  // ── États de données ────────────────────────────────────────────────────────

  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [payments, setPayments] = useState<DriverPaymentRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Chargement des données ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [summaryData, paymentsData] = await Promise.all([
          getPaymentSummary(),
          getDriverPayments(page, 5),
        ])
        if (cancelled) return
        setSummary(summaryData)
        setPayments(paymentsData.data)
        setTotalCount(paymentsData.meta.total)
        setTotalPages(paymentsData.meta.totalPages)
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
  }, [page])

  // ── États d'affichage ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex">
          <DriverSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} onToggleTheme={onToggleTheme} />
          <main className="flex flex-1 items-center justify-center p-6">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
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

  if (!summary) return null

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
                Mes Paiements
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Historique complet de vos versements et solde restant
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Wallet className="h-4 w-4" />
                    Total Payé
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    {formatXaf(summary?.totalPaye ?? 0)} FCFA
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-400">
                    Cumulé depuis le début
                  </div>
                </CardContent>
              </Card></ParticleHover>

              <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Wallet className="h-4 w-4" />
                    Reste à payer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    {formatXaf(summary?.resteAPayer ?? 0)} FCFA
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-400">
                    Sur un total de {formatXaf(summary?.totalDu ?? 0)} FCFA
                  </div>
                </CardContent>
              </Card></ParticleHover>

              <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Calendar className="h-4 w-4" />
                    Dernier Versement
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    {formatXaf(summary?.dernierVersement?.montant ?? 0)} FCFA
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-400">
                    Le {summary?.dernierVersement?.date
                      ? new Date(summary.dernierVersement.date).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </CardContent>
              </Card></ParticleHover>
            </div>

            {/* Table */}
            <ParticleHover className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base">Versements</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-800/20">
                        <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          DATE
                        </TableHead>
                        <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          TYPE DE VERSEMENT
                        </TableHead>
                        <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          MONTANT
                        </TableHead>
                        <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          MODE DE PAIEMENT
                        </TableHead>
                        <TableHead className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          STATUT
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-transparent">
                      {payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                            Aucun versement pour le moment.
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((p) => (
                          <TableRow key={p.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                            <TableCell className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                              {new Date(p.date).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-50">
                              {p.libelle}
                            </TableCell>
                            <TableCell className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-50">
                              {formatXaf(p.montant)} FCFA
                            </TableCell>
                            <TableCell className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <ModeIcon mode={p.mode} />
                                <span className="text-sm text-slate-600 dark:text-slate-300">{p.mode}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-3.5">
                              <Badge variant={p.status === 'Validé' ? 'green' : 'orange'} className="gap-1.5 px-2.5 py-1">
                                <CheckCircle className="h-3 w-3" />
                                {p.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between gap-4 pt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Affichage de{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {totalCount}
                    </span>{' '}
                    versements récents
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card></ParticleHover>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {user?.fullName ?? 'Conducteur'} – Conducteur Véritable
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">CamerRideShare</div>
            </div>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}
