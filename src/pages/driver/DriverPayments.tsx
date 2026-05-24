import { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle, CreditCard, Smartphone, Wallet } from 'lucide-react'

import { EffectCard, SpotlightSection } from '../../components/MagicBento'
import DriverSidebar from '../../components/DriverSidebar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMode = 'Orange Money' | 'MTN MoMo'

type Payment = {
  id: string
  date: string
  type: 'Hebdomadaire' | 'Exceptionnel'
  montant: number
  mode: PaymentMode
  status: 'Validé' | 'En attente'
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockPayments: Payment[] = [
  { id: 'p1', date: '24 oct. 2023, 10:30', type: 'Hebdomadaire', montant: 15_000, mode: 'Orange Money', status: 'Validé' },
  { id: 'p2', date: '17 oct. 2023, 09:15', type: 'Hebdomadaire', montant: 15_000, mode: 'MTN MoMo', status: 'Validé' },
  { id: 'p3', date: '10 oct. 2023, 11:45', type: 'Hebdomadaire', montant: 15_000, mode: 'Orange Money', status: 'Validé' },
  { id: 'p4', date: '03 oct. 2023, 08:20', type: 'Hebdomadaire', montant: 15_000, mode: 'MTN MoMo', status: 'Validé' },
  { id: 'p5', date: '26 sept. 2023, 14:10', type: 'Exceptionnel', montant: 50_000, mode: 'Orange Money', status: 'Validé' },
  { id: 'p6', date: '19 sept. 2023, 10:00', type: 'Hebdomadaire', montant: 15_000, mode: 'Orange Money', status: 'Validé' },
  { id: 'p7', date: '12 sept. 2023, 16:30', type: 'Hebdomadaire', montant: 15_000, mode: 'MTN MoMo', status: 'Validé' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatXaf(amount: number) {
  return amount.toLocaleString('fr-FR')
}

function ModeIcon({ mode }: { mode: PaymentMode }) {
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

  const allPayments = mockPayments
  const [page, setPage] = useState(1)
  const pageSize = 5

  const totalPages = Math.max(1, Math.ceil(allPayments.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return allPayments.slice(start, start + pageSize)
  }, [currentPage, allPayments])

  const totalPaye = useMemo(() => allPayments.reduce((s, p) => s + p.montant, 0), [allPayments])
  const totalDu = 1_000_000
  const resteAPayer = totalDu - totalPaye
  const dernierVersement = allPayments[0]

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
              <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Wallet className="h-4 w-4" />
                    Total Payé
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    {formatXaf(totalPaye)} FCFA
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-400">
                    Cumulé depuis le début
                  </div>
                </CardContent>
              </Card></EffectCard>

              <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Wallet className="h-4 w-4" />
                    Reste à payer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    {formatXaf(resteAPayer)} FCFA
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-400">
                    Sur un total de {formatXaf(totalDu)} FCFA
                  </div>
                </CardContent>
              </Card></EffectCard>

              <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Calendar className="h-4 w-4" />
                    Dernier Versement
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    {formatXaf(dernierVersement.montant)} FCFA
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-400">
                    Le {dernierVersement.date}
                  </div>
                </CardContent>
              </Card></EffectCard>
            </div>

            {/* Table */}
            <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
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
                      {pageRows.map((p) => (
                        <TableRow key={p.id} className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/20">
                          <TableCell className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                            {p.date}
                          </TableCell>
                          <TableCell className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-50">
                            {p.type}
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
                            <Badge variant="green" className="gap-1.5 px-2.5 py-1">
                              <CheckCircle className="h-3 w-3" />
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between gap-4 pt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Affichage de{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {allPayments.length}
                    </span>{' '}
                    versements récents
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Précédent
                    </Button>
                    <Button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card></EffectCard>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Jean Dupont – Conducteur Véritable
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">CamerRideShare</div>
            </div>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}
