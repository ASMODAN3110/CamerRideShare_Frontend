import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, ChevronRight, Search, TrendingUp, Wallet } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { PaymentModal } from '@/components/ActionModals'
import { PaymentDetailModal } from '@/components/PaymentModals'
import { PaymentMethodBadge } from '@/components/PaymentMethodSelect'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminPayments } from '@/hooks/useAdminPayments'
import { PAYMENT_METHODS } from '@/lib/paymentMethods'
import { PAYMENT_STATUS_UI, PAYMENT_TYPE_UI, amountColorClass, amountSign } from '@/lib/payments'
import { formatPeriod, formatShortDate, formatXaf, formatXafLabel, initials } from '@/lib/format'
import type { PaymentMethod, PaymentStatus, PaymentType } from '@/types/api'

const ALL = 'all'

function StatCard(props: { label: string; value: string; hint?: string; tone: string; Icon: LucideIcon }) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col items-start gap-3 xl:flex-row xl:items-center xl:gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-md ${props.tone}`}>
          <props.Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <CardDescription>{props.label}</CardDescription>
          <CardTitle className="text-2xl font-extrabold tabular-nums">{props.value}</CardTitle>
          {props.hint ? <div className="mt-0.5 text-xs text-muted-foreground">{props.hint}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  )
}

type PaiementsPageProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function PaiementsPage({ theme, onToggleTheme }: PaiementsPageProps) {
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
    setMethodFilter,
  } = useAdminPayments()

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
  const periodLabel = summary != null ? formatPeriod(summary.periodStart, summary.periodEnd) : undefined

  return (
    <AdminLayout
      title="Gestion des paiements"
      description="Suivi et administration des flux financiers."
      theme={theme}
      onToggleTheme={onToggleTheme}
      actions={
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Wallet />
          Saisir un paiement
        </Button>
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {error}
            <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)
        ) : (
          <>
            <StatCard
              label="Total collecté (mois)"
              value={summary ? formatXafLabel(summary.monthlyCollected, true) : '—'}
              hint={periodLabel}
              Icon={TrendingUp}
              tone="bg-success/12 text-success-foreground"
            />
            <StatCard
              label="Paiements en attente"
              value={summary != null ? String(summary.pendingCount) : '—'}
              Icon={Wallet}
              tone="bg-warning/25 text-warning-foreground"
            />
            <StatCard
              label="Taux de recouvrement"
              value={summary != null ? `${summary.recoveryRatePct}%` : '—'}
              Icon={TrendingUp}
              tone="bg-secondary text-secondary-foreground"
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Conducteur ou montant…"
                aria-label="Rechercher une transaction"
                className="pl-9"
              />
            </div>

            <Select
              value={filters.status || ALL}
              onValueChange={(v) => setStatusFilter((v === ALL ? '' : v) as PaymentStatus | '')}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par statut">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les statuts</SelectItem>
                <SelectItem value="VERIFIED">Validé</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="REJECTED">Refusé</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type || ALL}
              onValueChange={(v) => setTypeFilter((v === ALL ? '' : v) as PaymentType | '')}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les types</SelectItem>
                <SelectItem value="PAYMENT">Paiement</SelectItem>
                <SelectItem value="EXPENSE">Dépense</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.method || ALL}
              onValueChange={(v) => setMethodFilter((v === ALL ? '' : v) as PaymentMethod | '')}
            >
              <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer par moyen de paiement">
                <SelectValue placeholder="Moyen de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les moyens</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {[
                    { label: 'Conducteur', hide: '' },
                    { label: 'Date / heure', hide: 'hidden lg:table-cell' },
                    { label: 'Type', hide: 'hidden lg:table-cell' },
                    { label: 'Montant', hide: '' },
                    { label: 'Moyen', hide: 'hidden md:table-cell' },
                    { label: 'Statut', hide: '' },
                    { label: 'Action', hide: '' },
                  ].map((col) => (
                    <TableHead key={col.label} className={`text-xs font-semibold uppercase tracking-wider ${col.hide}`}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
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
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="hidden size-9 shrink-0 lg:flex">
                              {tx.driver.avatarUrl ? <AvatarImage src={tx.driver.avatarUrl} alt={tx.driver.fullName} /> : null}
                              <AvatarFallback className="text-xs">{initials(tx.driver.fullName)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate font-semibold">{tx.driver.fullName}</div>
                              <div className="text-xs text-muted-foreground lg:hidden">{formatShortDate(tx.createdAt)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">{formatShortDate(tx.createdAt)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={typeUi.variant === 'red' ? 'red' : 'secondary'}>{typeUi.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`whitespace-nowrap font-bold tabular-nums ${amountColorClass(tx.type)}`}>
                            {amountSign(tx.type)} {formatXaf(tx.amount)} XAF
                          </span>
                          {tx.type === 'EXPENSE' ? <div className="text-xs text-muted-foreground lg:hidden">Dépense</div> : null}
                        </TableCell>
                        <TableCell className="hidden md:table-cell" data-testid="tx-method">
                          <PaymentMethodBadge method={tx.method} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusUi.variant}>{statusUi.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" aria-label={`Détails du paiement de ${tx.driver.fullName}`} onClick={() => openDetail(tx.id)}>
                            <span className="hidden lg:inline">Détails</span>
                            <ChevronRight />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="size-7" />
                        <p className="text-sm font-semibold">Aucune transaction trouvée</p>
                        <p className="text-xs">Modifiez vos critères de recherche.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Affichage de <span className="font-semibold text-foreground">{rangeStart}</span> à{' '}
              <span className="font-semibold text-foreground">{rangeEnd}</span> sur{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> transactions
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1 || listLoading} onClick={() => setPage(currentPage - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button type="button" variant="outline" size="sm" disabled={currentPage >= totalPages || listLoading} onClick={() => setPage(currentPage + 1)}>
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => void refresh()} />
      <PaymentDetailModal
        paymentId={detailPaymentId}
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setDetailPaymentId(null)
        }}
        onSuccess={() => void refresh()}
      />
    </AdminLayout>
  )
}
