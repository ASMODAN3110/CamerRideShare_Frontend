import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Search, X } from 'lucide-react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatShortDate, formatXafLabel } from '@/lib/format'
import { SHARE_REQUEST_STATUS_UI } from '@/lib/shareRequests'
import { listShareRequests, resolveShareRequest } from '../services/shareRequestsService'
import type { ShareRequestItem, ShareRequestStatus, ShareRequestsResponse } from '../types/api'

const ALL = 'all'
const PAGE_LIMIT = 10

export default function DemandesPartsPage(props: { theme?: 'light' | 'dark'; onToggleTheme?: () => void }) {
  const [status, setStatus] = useState<ShareRequestStatus | ''>('PENDING')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<ShareRequestsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [rejecting, setRejecting] = useState<ShareRequestItem | null>(null)
  const [note, setNote] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [approving, setApproving] = useState<ShareRequestItem | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    listShareRequests({ page, limit: PAGE_LIMIT, status: status || undefined, search: debouncedSearch || undefined })
      .then((res) => {
        if (cancelled) return
        setData(res)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Impossible de charger les demandes.')
      })
    return () => {
      cancelled = true
    }
  }, [page, status, debouncedSearch, reload])

  const resolve = async (request: ShareRequestItem, decision: 'APPROVED' | 'REJECTED', text?: string) => {
    setBusyId(request.id)
    try {
      const res = await resolveShareRequest(request.id, { status: decision, note: text?.trim() || undefined })
      if (res.autoRejected) {
        // l'apport n'est plus valable (règle des 50 %, capital restant) : l'investisseur a été prévenu du motif
        toast.warning(`Demande refusée automatiquement : ${res.reason ?? 'elle ne respecte plus les règles'}`)
      } else {
        toast.success(decision === 'APPROVED' ? 'Demande acceptée : la part est créée' : 'Demande refusée')
      }
      setRejecting(null)
      setApproving(null)
      setNote('')
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action impossible')
      setReload((n) => n + 1)
    } finally {
      setBusyId(null)
    }
  }

  const items = data?.items ?? []
  const meta = data?.meta
  const totalPages = meta?.totalPages ?? 1
  const loading = data === null && error === null

  return (
    <AdminLayout
      title="Demandes de parts"
      description="Validez ou refusez les apports proposés par les investisseurs : chaque apport accepté devient une part."
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
          <CardTitle>Demandes</CardTitle>
          <CardDescription>
            {data?.pendingCount ?? 0} en attente · {meta?.total ?? 0} résultat{(meta?.total ?? 0) > 1 ? 's' : ''}
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
                placeholder="Rechercher un investisseur ou une moto…"
                aria-label="Rechercher une demande"
                className="pl-9"
              />
            </div>
            <Select
              value={status || ALL}
              onValueChange={(v) => {
                setStatus((v === ALL ? '' : v) as ShareRequestStatus | '')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer par statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="APPROVED">Acceptées</SelectItem>
                <SelectItem value="REJECTED">Refusées</SelectItem>
                <SelectItem value="CANCELLED">Annulées</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {['Investisseur', 'Véhicule', 'Apport demandé', 'Date', 'Statut', 'Action'].map((col) => (
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
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : items.length > 0 ? (
                  items.map((r) => {
                    const ui = SHARE_REQUEST_STATUS_UI[r.status]
                    const pending = r.status === 'PENDING'
                    const tooMany = pending && r.moto.availableAmount !== null && r.amount > r.moto.availableAmount
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-semibold">{r.investor.fullName}</TableCell>
                        <TableCell>
                          <div className="font-medium">{r.moto.matricule}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.moto.city}
                            {pending && r.moto.availableAmount !== null
                              ? ` · ${formatXafLabel(r.moto.availableAmount)} restent à financer`
                              : ''}
                          </div>
                          {pending && r.lateEntry ? (
                            <Badge variant={r.lateEntry.allowed ? 'orange' : 'red'} className="mt-1 h-auto whitespace-normal">
                              Entrée tardive · semaine {r.lateEntry.weeksElapsed + 1}
                              {r.lateEntry.allowed ? ` · rattrapage ${formatXafLabel(r.lateEntry.arrears)}` : ' · plafond dépassé'}
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums">{formatXafLabel(r.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatShortDate(r.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant={ui.variant}>{ui.label}</Badge>
                          {r.note ? <div className="mt-1 max-w-48 truncate text-xs text-muted-foreground" title={r.note}>{r.note}</div> : null}
                        </TableCell>
                        <TableCell>
                          {pending ? (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={busyId === r.id || tooMany || (r.lateEntry !== null && !r.lateEntry.allowed)}
                                title={
                                  tooMany
                                    ? 'Plus assez de capital à financer'
                                    : r.lateEntry && !r.lateEntry.allowed
                                      ? `Retour de l'entrant supérieur à 50 % du reste à produire (mise max ${formatXafLabel(r.lateEntry.maxInvestment)})`
                                      : undefined
                                }
                                onClick={() => (r.lateEntry ? setApproving(r) : void resolve(r, 'APPROVED'))}
                              >
                                <Check />
                                Accepter
                              </Button>
                              <Button type="button" size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setRejecting(r)}>
                                <X />
                                Refuser
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{r.resolvedAt ? formatShortDate(r.resolvedAt) : '—'}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                      Aucune demande ne correspond à ces filtres.
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
              {page} / {totalPages}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={approving !== null} onOpenChange={(open) => (!open ? setApproving(null) : undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Entrée en cours de contrat</DialogTitle>
            <DialogDescription>
              {approving
                ? `${approving.investor.fullName} — apport de ${formatXafLabel(approving.amount)} sur la moto ${approving.moto.matricule}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {approving?.lateEntry ? (
            <div className="space-y-3 text-sm">
              <Alert>
                <AlertTriangle />
                <AlertDescription>
                  La moto a déjà {approving.lateEntry.weeksElapsed} semaine(s) de versements. Vous devez à cet investisseur
                  un rattrapage de{' '}
                  <strong>{formatXafLabel(approving.lateEntry.arrears)}</strong> pour les semaines passées.
                </AlertDescription>
              </Alert>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-md border p-3">
                <dt className="text-muted-foreground">Apport</dt>
                <dd className="text-right font-semibold tabular-nums">{formatXafLabel(approving.amount)}</dd>
                <dt className="text-muted-foreground">Retour contractuel (160 %)</dt>
                <dd className="text-right font-semibold tabular-nums">{formatXafLabel(approving.lateEntry.returnAmount)}</dd>
                <dt className="text-muted-foreground">Reste à produire par le véhicule</dt>
                <dd className="text-right font-semibold tabular-nums">{formatXafLabel(approving.lateEntry.remaining)}</dd>
                <dt className="text-muted-foreground">Plafond d&apos;entrée (50 % du reste)</dt>
                <dd className="text-right font-semibold tabular-nums">{formatXafLabel(approving.lateEntry.cap)}</dd>
                <dt className="text-muted-foreground">Rattrapage dû (semaines passées)</dt>
                <dd className="text-right font-semibold tabular-nums">{formatXafLabel(approving.lateEntry.arrears)}</dd>
                <dt className="text-muted-foreground">Ajouté à chaque versement</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {formatXafLabel(approving.lateEntry.perWeek)} × {approving.lateEntry.spreadWeeks} sem.
                </dd>
              </dl>
              <p className="text-xs text-muted-foreground">
                Le rattrapage est étalé sur 32 semaines à compter de l&apos;apport et prélevé sur la part de l&apos;admin (capital non
                financé, excédent). Chaque part est un contrat à part entière, avec son propre retour de 160 %.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApproving(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={approving !== null && busyId === approving.id}
              onClick={() => approving && void resolve(approving, 'APPROVED')}
            >
              <Check />
              Accepter l&apos;entrée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejecting !== null} onOpenChange={(open) => (!open ? setRejecting(null) : undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la demande</DialogTitle>
            <DialogDescription>
              {rejecting
                ? `${rejecting.investor.fullName} — apport de ${formatXafLabel(rejecting.amount)} sur la moto ${rejecting.moto.matricule}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="reject-note">Motif (optionnel, communiqué à l&apos;investisseur)</Label>
            <Textarea id="reject-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejecting(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejecting !== null && busyId === rejecting.id}
              onClick={() => rejecting && void resolve(rejecting, 'REJECTED', note)}
            >
              Refuser la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
