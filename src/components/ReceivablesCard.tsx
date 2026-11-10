import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, HandCoins, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatShortDate, formatXafLabel, initials } from '@/lib/format'
import { getReceivables, repayReceivable, writeOffReceivable } from '../services/terminationService'
import type { Receivable, ReceivablesResponse } from '../types/api'

const ALL = 'all'
const PAGE_SIZE = 5

type Action = { kind: 'repay' | 'writeoff'; receivable: Receivable }

function ActionDialog(props: { action: Action | null; onClose: () => void; onDone: () => void }) {
  return (
    <Dialog open={props.action !== null} onOpenChange={(open) => (!open ? props.onClose() : undefined)}>
      <DialogContent className="sm:max-w-md">
        {props.action ? <ActionForm key={`${props.action.kind}-${props.action.receivable.id}`} action={props.action} onClose={props.onClose} onDone={props.onDone} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function ActionForm({ action, onClose, onDone }: { action: Action; onClose: () => void; onDone: () => void }) {
  const r = action.receivable
  const repay = action.kind === 'repay'
  const [amount, setAmount] = useState(String(r.outstandingAmount))
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    const value = parseInt(amount, 10)
    if (repay && !(value >= 1)) return setError('Montant invalide')
    if (repay && value > r.outstandingAmount) return setError(`Le conducteur ne doit plus que ${formatXafLabel(r.outstandingAmount)}`)
    setSubmitting(true)
    setError(null)
    try {
      if (repay) {
        await repayReceivable(r.id, { amount: value, ...(note.trim() ? { note: note.trim() } : {}) })
        toast.success(`Remboursement de ${formatXafLabel(value)} enregistré.`)
      } else {
        await writeOffReceivable(r.id, note.trim() ? { note: note.trim() } : {})
        toast.success(`${formatXafLabel(r.outstandingAmount)} passés en perte.`)
      }
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'opération a échoué.")
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{repay ? 'Enregistrer un remboursement' : 'Passer le solde en perte ?'}</DialogTitle>
        <DialogDescription>
          {r.driver.fullName} · véhicule {r.moto.matricule} · reste dû {formatXafLabel(r.outstandingAmount)}.
          {repay ? '' : ' Vous renoncez à recouvrer ce solde : l’opération est définitive.'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        {repay ? (
          <div className="grid gap-1.5">
            <Label htmlFor="receivable-amount">Montant reçu (XAF)</Label>
            <Input id="receivable-amount" type="number" min={1} max={r.outstandingAmount} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        ) : null}
        <div className="grid gap-1.5">
          <Label htmlFor="receivable-note">Précision (facultatif)</Label>
          <Input id="receivable-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button type="button" variant={repay ? 'default' : 'destructive'} onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'Enregistrement…' : repay ? 'Enregistrer' : 'Passer en perte'}
        </Button>
      </DialogFooter>
    </>
  )
}

/**
 * Créances sur les conducteurs dont le contrat a été résilié : ce qu'ils devaient encore. L'admin enregistre les
 * remboursements reçus, ou abandonne le solde (passage en perte).
 */
export default function ReceivablesCard() {
  const [status, setStatus] = useState('OPEN')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [action, setAction] = useState<Action | null>(null)
  // résultat rattaché à sa requête : changer de filtre n'affiche jamais l'ancienne liste
  const [result, setResult] = useState<{ key: string; data: ReceivablesResponse | null; error: string | null } | null>(null)
  const requestKey = `${status}|${debounced}|${page}|${reloadKey}`

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  useEffect(() => {
    let cancelled = false
    getReceivables({ page, limit: PAGE_SIZE, status: (status || undefined) as 'OPEN' | 'CLOSED' | undefined, search: debounced || undefined })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ key: requestKey, data: null, error: err instanceof Error ? err.message : 'Impossible de charger les créances.' })
      })
    return () => {
      cancelled = true
    }
  }, [page, status, debounced, requestKey])

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])
  const current = result && result.key === requestKey ? result : null
  const data = current?.data
  const pages = data ? Math.max(Math.ceil(data.total / PAGE_SIZE), 1) : 1

  return (
    <Card data-testid="receivables-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HandCoins className="size-5 text-muted-foreground" />
          Créances sur les conducteurs résiliés
        </CardTitle>
        <CardDescription>
          Ce que les conducteurs devaient encore à la résiliation de leur contrat.
          {data ? ` À recouvrer : ${formatXafLabel(data.summary.outstandingAmount)} · remboursé : ${formatXafLabel(data.summary.repaidAmount)} · en perte : ${formatXafLabel(data.summary.writtenOffAmount)}.` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou matricule…" aria-label="Rechercher une créance" className="pl-9" />
          </div>
          <Select
            value={status || ALL}
            onValueChange={(v) => {
              setStatus(v === ALL ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer les créances par statut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">À recouvrer</SelectItem>
              <SelectItem value="CLOSED">Soldées</SelectItem>
              <SelectItem value={ALL}>Toutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {current?.error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{current.error}</AlertDescription>
          </Alert>
        ) : null}

        {current === null ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <ul className="divide-y" aria-label="Créances sur les conducteurs résiliés">
            {data.data.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar className="size-10 shrink-0">
                    {r.driver.avatarUrl ? <AvatarImage src={r.driver.avatarUrl} alt={r.driver.fullName} /> : null}
                    <AvatarFallback className="text-xs">{initials(r.driver.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-sm font-semibold">{r.driver.fullName}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {r.moto.matricule}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Résilié le {formatShortDate(r.terminatedAt)} · {r.lateWeeks} semaine{r.lateWeeks > 1 ? 's' : ''} impayée{r.lateWeeks > 1 ? 's' : ''} ({formatXafLabel(r.arrearsAmount)})
                    </div>
                    {r.repaidAmount > 0 || r.writtenOffAmount > 0 ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {r.repaidAmount > 0 ? `Remboursé : ${formatXafLabel(r.repaidAmount)}` : ''}
                        {r.repaidAmount > 0 && r.writtenOffAmount > 0 ? ' · ' : ''}
                        {r.writtenOffAmount > 0 ? `Passé en perte : ${formatXafLabel(r.writtenOffAmount)}` : ''}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <span className="text-sm font-bold tabular-nums">{formatXafLabel(r.outstandingAmount)}</span>
                  {r.status === 'OPEN' ? (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setAction({ kind: 'repay', receivable: r })}>
                        Remboursement
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setAction({ kind: 'writeoff', receivable: r })}
                      >
                        Passer en perte
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="green">Soldée</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : !current.error ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune créance.</p>
        ) : null}

        {data && data.total > PAGE_SIZE ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Page {page} sur {pages} · {data.total} créance{data.total > 1 ? 's' : ''}
            </span>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="icon" aria-label="Page précédente des créances" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft />
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label="Page suivante des créances" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>

      <ActionDialog
        action={action}
        onClose={() => setAction(null)}
        onDone={() => {
          setAction(null)
          refresh()
        }}
      />
    </Card>
  )
}
