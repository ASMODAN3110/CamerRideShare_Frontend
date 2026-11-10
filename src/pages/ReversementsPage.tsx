import { useEffect, useState } from 'react'
import { AlertTriangle, HandCoins, Search } from 'lucide-react'
import { toast } from 'sonner'
import AdminLayout from '@/components/admin/AdminLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatShortDate, formatXafLabel } from '@/lib/format'
import { PAYOUT_FREQUENCY_LABEL } from '@/lib/payouts'
import { listPayoutInvestors, listPayouts, payInvestor, setPayoutFrequency } from '../services/payoutsService'
import type { PayoutFrequency, PayoutInvestorItem, PayoutInvestorsResponse, PayoutsResponse } from '../types/api'

const ALL = 'all'

export default function ReversementsPage(props: { theme?: 'light' | 'dark'; onToggleTheme?: () => void }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [frequency, setFrequency] = useState<PayoutFrequency | ''>('')
  const [dueOnly, setDueOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<PayoutInvestorsResponse | null>(null)
  const [history, setHistory] = useState<PayoutsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [paying, setPaying] = useState<PayoutInvestorItem | null>(null)
  const [includeCurrent, setIncludeCurrent] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    listPayoutInvestors({ page, limit: 10, search: debouncedSearch || undefined, frequency: frequency || undefined, dueOnly })
      .then((res) => {
        if (cancelled) return
        setData(res)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger les reversements.')
      })
    return () => {
      cancelled = true
    }
  }, [page, debouncedSearch, frequency, dueOnly, reload])

  useEffect(() => {
    let cancelled = false
    listPayouts({ page: historyPage, limit: 8 })
      .then((res) => {
        if (!cancelled) setHistory(res)
      })
      .catch(() => {
        /* l'historique reste vide si l'API est indisponible */
      })
    return () => {
      cancelled = true
    }
  }, [historyPage, reload])

  const changeFrequency = async (investor: PayoutInvestorItem, next: PayoutFrequency) => {
    try {
      await setPayoutFrequency(investor.id, next)
      toast.success(`${investor.fullName} : versement ${PAYOUT_FREQUENCY_LABEL[next].toLowerCase()}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Modification impossible')
    }
    setReload((n) => n + 1)
  }

  const pay = async () => {
    if (!paying) return
    setBusy(true)
    try {
      const res = await payInvestor({ investorId: paying.id, includeCurrentPeriod: includeCurrent })
      toast.success(`${formatXafLabel(res.amount)} versés à ${paying.fullName}`)
      setPaying(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Versement impossible')
    } finally {
      setBusy(false)
      setReload((n) => n + 1)
    }
  }

  const items = data?.items ?? []
  const loading = data === null && error === null
  const payable = paying ? paying.dueNow + (includeCurrent ? paying.currentPeriod : 0) : 0

  return (
    <AdminLayout
      title="Reversements"
      description="L'admin perçoit les versements des chauffeurs puis reverse leurs gains aux investisseurs, chaque semaine ou chaque mois."
      theme={props.theme}
      onToggleTheme={props.onToggleTheme}
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Investisseurs</CardTitle>
          <CardDescription>
            Total exigible : <span className="font-semibold text-foreground">{formatXafLabel(data?.totalDue ?? 0)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-60">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un investisseur…"
                aria-label="Rechercher un investisseur"
                className="pl-9"
              />
            </div>
            <Select
              value={frequency || ALL}
              onValueChange={(v) => {
                setFrequency((v === ALL ? '' : v) as PayoutFrequency | '')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer par mode de versement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les modes</SelectItem>
                <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                <SelectItem value="MONTHLY">Mensuel</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                id="due-only"
                checked={dueOnly}
                onCheckedChange={(v) => {
                  setDueOnly(v)
                  setPage(1)
                }}
              />
              <Label htmlFor="due-only" className="text-sm">
                À verser uniquement
              </Label>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {['Investisseur', 'Mode de versement', 'À verser', 'Période en cours', 'Prochaine échéance', 'Dernier versement', 'Action'].map((col) => (
                    <TableHead key={col} className="text-xs font-semibold uppercase tracking-wider">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [0, 1, 2].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : items.length > 0 ? (
                  items.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-semibold">{inv.fullName}</TableCell>
                      <TableCell>
                        <Select value={inv.frequency} onValueChange={(v) => void changeFrequency(inv, v as PayoutFrequency)}>
                          <SelectTrigger className="w-36" aria-label={`Mode de versement de ${inv.fullName}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
                            <SelectItem value="MONTHLY">Mensuel</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {inv.dueNow > 0 ? (
                          <div className="space-y-1">
                            <Badge variant="red">{formatXafLabel(inv.dueNow)}</Badge>
                            {inv.lateSince ? (
                              <div className="text-xs font-medium text-destructive">En retard depuis le {formatShortDate(inv.lateSince)}</div>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{formatXafLabel(inv.currentPeriod)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatShortDate(inv.nextDueDate)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.lastPayout ? `${formatXafLabel(inv.lastPayout.amount)} · ${formatShortDate(inv.lastPayout.paidAt)}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          disabled={inv.dueNow === 0 && inv.currentPeriod === 0}
                          onClick={() => {
                            setIncludeCurrent(false)
                            setPaying(inv)
                          }}
                        >
                          <HandCoins />
                          Verser
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      Aucun investisseur ne correspond à ces filtres.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {data?.meta.totalPages ?? 1}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={page >= (data?.meta.totalPages ?? 1)} onClick={() => setPage(page + 1)}>
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des reversements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {['Investisseur', 'Montant', 'Mode', 'Période couverte', 'Versé le'].map((col) => (
                    <TableHead key={col} className="text-xs font-semibold uppercase tracking-wider">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(history?.items ?? []).length > 0 ? (
                  history!.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold">{p.investor.fullName}</TableCell>
                      <TableCell className="tabular-nums">{formatXafLabel(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{PAYOUT_FREQUENCY_LABEL[p.frequency]}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatShortDate(p.periodStart)} → {formatShortDate(p.periodEnd)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatShortDate(p.paidAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      Aucun reversement effectué pour le moment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)}>
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              {historyPage} / {history?.meta.totalPages ?? 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={historyPage >= (history?.meta.totalPages ?? 1)}
              onClick={() => setHistoryPage(historyPage + 1)}
            >
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={paying !== null} onOpenChange={(open) => (!open ? setPaying(null) : undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verser les gains</DialogTitle>
            <DialogDescription>
              {paying ? `${paying.fullName} · versement ${PAYOUT_FREQUENCY_LABEL[paying.frequency].toLowerCase()}` : ''}
            </DialogDescription>
          </DialogHeader>
          {paying ? (
            <div className="grid gap-3">
              <div className="grid gap-2 rounded-md border bg-muted/40 p-3 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Exigible (périodes terminées)</span>
                  <span className="font-semibold tabular-nums">{formatXafLabel(paying.dueNow)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Période en cours</span>
                  <span className="tabular-nums">{formatXafLabel(paying.currentPeriod)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="include-current" className="text-sm">
                  Inclure la période en cours (versement anticipé)
                </Label>
                <Switch id="include-current" checked={includeCurrent} onCheckedChange={setIncludeCurrent} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Montant à verser</span>
                <span className="text-xl font-extrabold tabular-nums">{formatXafLabel(payable)}</span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPaying(null)}>
              Annuler
            </Button>
            <Button type="button" disabled={busy || payable === 0} onClick={() => void pay()}>
              {busy ? 'Versement…' : 'Confirmer le versement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
