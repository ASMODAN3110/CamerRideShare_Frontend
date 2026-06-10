import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, Search, TrendingUp, Wallet } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { ParticleHover, SpotlightSection } from '../components/MagicBento'
import { PaymentModal } from '../components/ActionModals'
import { PaymentDetailModal } from '../components/PaymentModals'
import { Button } from '../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { useAdminPayments } from '../hooks/useAdminPayments'
import {
  PAYMENT_STATUS_UI,
  PAYMENT_TYPE_UI,
  amountColorClass,
  amountSign,
} from '../lib/payments'
import { formatPeriod, formatShortDate, formatXaf, formatXafLabel, initials } from '../lib/format'
import type { PaymentStatus, PaymentType } from '../types/api'

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard(props: {
  label: string
  value: string
  sub?: string
  hint?: string
  iconBg: string
  iconColor: string
  Icon: LucideIcon
}) {
  const { label, value, sub, hint, Icon, iconBg, iconColor } = props
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg].join(' ')}>
        <Icon className={['h-5 w-5', iconColor].join(' ')} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{value}</span>
          {sub ? <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{sub}</span> : null}
        </div>
        {hint ? <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</div> : null}
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i} className="px-5 py-3.5">
          <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── PaiementsPage ────────────────────────────────────────────────────────────

type PaiementsPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function PaiementsPage({ theme, onToggleTheme }: PaiementsPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailPaymentId, setDetailPaymentId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const {
    summary,
    transactions,
    meta,
    filters,
    loading,
    listLoading,
    error,
    refresh,
    setPage,
    setSearch,
    setStatusFilter,
    setTypeFilter,
  } = useAdminPayments()

  const handleMutationSuccess = () => {
    void refresh()
  }

  const openDetail = (id: number) => {
    setDetailPaymentId(id)
    setDetailOpen(true)
  }

  const currentPage = meta?.page ?? filters.page
  const totalPages = meta?.totalPages ?? 1
  const totalCount = meta?.total ?? 0
  const limit = meta?.limit ?? 20
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1
  const rangeEnd = Math.min(currentPage * limit, totalCount)

  const periodLabel =
    summary != null ? formatPeriod(summary.periodStart, summary.periodEnd) : null

  return (
    <SpotlightSection>
      <div className="flex">
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Gestion des Paiements</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Suivi et administration des flux financiers.
              </p>
            </div>
            <Button
              glare
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
            >
              <Wallet className="h-4 w-4" />
              Saisir un Paiement
            </Button>
          </div>

          {error ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-200">
              <span>{error}</span>
              <Button
                type="button"
                onClick={() => void refresh()}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200"
              >
                Réessayer
              </Button>
            </div>
          ) : null}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Total Collecté (Mois)"
                    value={summary ? formatXafLabel(summary.monthlyCollected, true) : '—'}
                    hint={periodLabel ?? undefined}
                    Icon={TrendingUp}
                    iconBg="bg-blue-50 dark:bg-blue-950/40"
                    iconColor="text-blue-600 dark:text-blue-300"
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Paiements en Attente"
                    value={summary != null ? String(summary.pendingCount) : '—'}
                    Icon={Wallet}
                    iconBg="bg-orange-50 dark:bg-orange-950/40"
                    iconColor="text-orange-600 dark:text-orange-300"
                  />
                </ParticleHover>
                <ParticleHover className="rounded-2xl">
                  <StatCard
                    label="Taux de Recouvrement"
                    value={summary != null ? `${summary.recoveryRatePct}%` : '—'}
                    Icon={TrendingUp}
                    iconBg="bg-blue-50 dark:bg-blue-950/40"
                    iconColor="text-blue-600 dark:text-blue-300"
                  />
                </ParticleHover>
              </>
            )}
          </div>

          <ParticleHover className="rounded-2xl">
            <Card>
              <CardHeader className="p-5 pb-4">
                <CardTitle className="text-base">Historique des Transactions</CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={filters.search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher un chauffeur ou un montant..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <select
                    value={filters.status}
                    onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="VERIFIED">Validé</option>
                    <option value="PENDING">En attente</option>
                  </select>

                  <select
                    value={filters.type}
                    onChange={(e) => setTypeFilter(e.target.value as PaymentType | '')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                  >
                    <option value="">Tous les types</option>
                    <option value="PAYMENT">Paiement</option>
                    <option value="EXPENSE">Dépense</option>
                  </select>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800/60 dark:bg-slate-800/20">
                        {['Chauffeur', 'Date / Heure', 'Type', 'Montant', 'Statut', 'Action'].map((col) => (
                          <TableHead
                            key={col}
                            className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                          >
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-slate-100 bg-white dark:divide-slate-800/60 dark:bg-transparent">
                      {listLoading && transactions.length === 0 ? (
                        <>
                          <TableRowSkeleton />
                          <TableRowSkeleton />
                          <TableRowSkeleton />
                        </>
                      ) : transactions.length > 0 ? (
                        transactions.map((tx) => {
                          const statusUi = PAYMENT_STATUS_UI[tx.status]
                          const typeUi = PAYMENT_TYPE_UI[tx.type]
                          return (
                            <TableRow
                              key={tx.id}
                              className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/20"
                            >
                              <TableCell className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9 shrink-0">
                                    {tx.driver.avatarUrl ? (
                                      <AvatarImage
                                        src={tx.driver.avatarUrl}
                                        alt={tx.driver.fullName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : null}
                                    <AvatarFallback>{initials(tx.driver.fullName)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                                    {tx.driver.fullName}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                                {formatShortDate(tx.createdAt)}
                              </TableCell>

                              <TableCell className="px-5 py-3.5">
                                <Badge
                                  variant={typeUi.variant === 'red' ? 'red' : 'default'}
                                  className="px-2.5 py-1"
                                >
                                  {typeUi.label}
                                </Badge>
                              </TableCell>

                              <TableCell className="px-5 py-3.5">
                                <span className={['font-bold', amountColorClass(tx.type)].join(' ')}>
                                  {amountSign(tx.type)} {formatXaf(tx.amount)} XAF
                                </span>
                              </TableCell>

                              <TableCell className="px-5 py-3.5">
                                <Badge variant={statusUi.variant} className="gap-1.5 px-2.5 py-1">
                                  <span className={['h-2 w-2 rounded-full', statusUi.dot].join(' ')} />
                                  {statusUi.label}
                                </Badge>
                              </TableCell>

                              <TableCell className="px-5 py-3.5">
                                <Button
                                  type="button"
                                  onClick={() => openDetail(tx.id)}
                                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-300"
                                >
                                  Détails
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <Search className="h-7 w-7" />
                              <p className="text-sm font-semibold">Aucune transaction trouvée</p>
                              <p className="text-xs">Modifiez vos critères de recherche.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 pt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Affichage de{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{rangeStart}</span> à{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{rangeEnd}</span> sur{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span>{' '}
                    transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      disabled={currentPage <= 1 || listLoading}
                      onClick={() => setPage(currentPage - 1)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Précédent
                    </Button>
                    <span className="text-sm text-slate-500">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      disabled={currentPage >= totalPages || listLoading}
                      onClick={() => setPage(currentPage + 1)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ParticleHover>
        </main>
      </div>

      <PaymentModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleMutationSuccess}
      />

      <PaymentDetailModal
        paymentId={detailPaymentId}
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setDetailPaymentId(null)
        }}
        onSuccess={handleMutationSuccess}
      />
    </SpotlightSection>
  )
}
