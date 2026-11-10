import { useEffect, useState } from 'react'
import { AlertTriangle, Calendar, CheckCircle, Clock, Loader2, Paperclip, Plus, Search, Trash2, Wallet, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import PortalLayout from '../../components/admin/AdminLayout'
import PaymentMethodSelect, { PaymentMethodBadge } from '../../components/PaymentMethodSelect'
import PhotoField from '../../components/PhotoField'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

import { PAYMENT_METHODS } from '../../lib/paymentMethods'
import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../types/auth'
import { declareDriverPayment, deleteDriverPayment, getPaymentSummary, getDriverPayments } from '../../services/driverService'
import type { DriverPaymentFilter, DriverPaymentRow, PaginatedDriverPayments, PaymentMethod, PaymentSummary } from '../../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10
const ALL = 'all'

const STATUS_OPTIONS: Array<{ value: DriverPaymentFilter | typeof ALL; label: string }> = [
  { value: ALL, label: 'Tous les statuts' },
  { value: 'VERIFIED', label: 'Validés' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'REJECTED', label: 'Refusés' },
]

function formatXaf(amount: number) {
  return amount.toLocaleString('fr-FR')
}

const dateTime = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError ? (typeof err.body.message === 'string' ? err.body.message : err.body.message.join(', ')) : fallback

// ─── DriverPayments ─────────────────────────────────────────────────────────

export default function DriverPayments() {
  const { user } = useAuth()
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

  // ── Filtres (appliqués par le serveur) ──────────────────────────────────────

  const [status, setStatus] = useState<DriverPaymentFilter | ''>('')
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | ''>('')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  // « Réessayer », une déclaration ou un retrait relancent les chargements
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebounced(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [search])

  // ── Données : chaque résultat est rattaché à sa requête, un changement de filtre n'affiche jamais l'ancienne liste ──

  const summaryKey = String(reload)
  const [summaryResult, setSummaryResult] = useState<{ key: string; data: PaymentSummary | null; error: string | null } | null>(null)
  useEffect(() => {
    let cancelled = false
    getPaymentSummary()
      .then((data) => {
        if (!cancelled) setSummaryResult({ key: summaryKey, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setSummaryResult({ key: summaryKey, data: null, error: errorMessage(err, 'Impossible de charger vos paiements. Veuillez réessayer.') })
      })
    return () => {
      cancelled = true
    }
  }, [summaryKey])

  const listKey = `${status}|${methodFilter}|${debounced}|${page}|${reload}`
  const [listResult, setListResult] = useState<{ key: string; data: PaginatedDriverPayments | null; error: string | null } | null>(null)
  useEffect(() => {
    let cancelled = false
    getDriverPayments(page, PAGE_SIZE, { status: status || undefined, method: methodFilter || undefined, search: debounced || undefined })
      .then((data) => {
        if (!cancelled) setListResult({ key: listKey, data, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setListResult({ key: listKey, data: null, error: errorMessage(err, "Impossible de charger l'historique des versements.") })
      })
    return () => {
      cancelled = true
    }
  }, [listKey, page, status, methodFilter, debounced])

  const summary = summaryResult && summaryResult.key === summaryKey ? summaryResult.data : null
  const summaryError = summaryResult && summaryResult.key === summaryKey ? summaryResult.error : null
  const current = listResult && listResult.key === listKey ? listResult : null
  const payments: DriverPaymentRow[] = current?.data?.data ?? []
  const totalCount = current?.data?.meta.total ?? 0
  const totalPages = current?.data?.meta.totalPages ?? 1
  const filtered = Boolean(status || methodFilter || debounced)

  const resetFilters = () => {
    setStatus('')
    setMethodFilter('')
    setSearch('')
    setDebounced('')
    setPage(1)
  }

  // ── Déclaration d'un paiement (validé ensuite par l'admin) ───────────────────

  const [declareOpen, setDeclareOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [declaring, setDeclaring] = useState(false)
  const [declareError, setDeclareError] = useState<string | null>(null)

  const openDeclare = () => {
    setAmount('')
    setProof(null)
    setMethod('')
    setDeclareError(null)
    setDeclareOpen(true)
  }

  const submitDeclare = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseInt(amount, 10)
    if (!value || value < 1) return setDeclareError('Indiquez un montant valide.')
    if (summary && value > summary.resteAPayer) return setDeclareError(`Le montant dépasse le reste à payer (${formatXaf(summary.resteAPayer)} FCFA).`)
    if (!method) return setDeclareError('Choisissez un moyen de paiement.')
    setDeclaring(true)
    setDeclareError(null)
    try {
      const res = await declareDriverPayment({ amount: value, method, proof: proof ?? undefined })
      if (res.proofSaved === false) toast.warning("Paiement déclaré, mais la preuve n'a pas pu être enregistrée (stockage indisponible). L'administrateur pourra vous la redemander.")
      else toast.success("Paiement déclaré : il comptera dès que l'administrateur l'aura confirmé.")
      setDeclareOpen(false)
      resetFilters()
      setReload((n) => n + 1)
    } catch (err) {
      setDeclareError(errorMessage(err, "Impossible d'envoyer la déclaration."))
    } finally {
      setDeclaring(false)
    }
  }

  // ── Retrait d'un versement déclaré par erreur (seulement tant qu'il est en attente) ──

  const [toRemove, setToRemove] = useState<DriverPaymentRow | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const remove = async (row: DriverPaymentRow) => {
    setRemoving(row.id)
    try {
      await deleteDriverPayment(row.id)
      toast.success('Paiement retiré.')
      setReload((n) => n + 1)
    } catch (err) {
      toast.error(errorMessage(err, 'Impossible de retirer ce paiement.'))
      setReload((n) => n + 1)
    } finally {
      setRemoving(null)
    }
  }

  // ── États d'affichage ──────────────────────────────────────────────────────

  if (summaryError) {
    return (
      <PortalLayout portal="driver" title="Mes paiements" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <p className="text-sm font-semibold text-destructive">{summaryError}</p>
          <Button onClick={() => setReload((n) => n + 1)}>Réessayer</Button>
        </div>
      </PortalLayout>
    )
  }

  const pendingInfo = summary && summary.enAttente.count > 0
  const lastDate = summary?.dernierVersement?.date

  return (
    <PortalLayout portal="driver" title="Mes paiements" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
      <div className="flex-1 p-4 sm:p-6">
        <div className="w-full space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground ">Mes Paiements</h1>
              <p className="mt-1 text-sm text-muted-foreground ">Historique complet de vos versements et solde restant</p>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <Button type="button" onClick={openDeclare} disabled={!summary?.canDeclare}>
                <Plus />
                Déclarer un paiement
              </Button>
              {summary && !summary.canDeclare ? (
                <span className="text-xs text-muted-foreground" data-testid="declare-disabled">
                  {summary.totalDu === 0 ? 'Aucun véhicule ne vous est affecté.' : 'Votre contrat est soldé : rien à déclarer.'}
                </span>
              ) : null}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Total Payé
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <>
                    <div className="text-2xl font-extrabold tracking-tight text-foreground" data-testid="total-paye">
                      {formatXaf(summary.totalPaye)} FCFA
                    </div>
                    <div className="mt-1 text-xs font-semibold text-muted-foreground">Versements validés depuis le début</div>
                    {pendingInfo ? (
                      <div className="mt-1 text-xs font-semibold text-warning-foreground" data-testid="pending-info">
                        + {formatXaf(summary.enAttente.amount)} FCFA en attente de validation ({summary.enAttente.count})
                      </div>
                    ) : null}
                  </>
                ) : (
                  <Skeleton className="h-12 w-full" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Reste à payer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <>
                    <div className="text-2xl font-extrabold tracking-tight text-foreground" data-testid="reste-a-payer">
                      {formatXaf(summary.resteAPayer)} FCFA
                    </div>
                    <div className="mt-1 text-xs font-semibold text-muted-foreground">Sur un total de {formatXaf(summary.totalDu)} FCFA</div>
                  </>
                ) : (
                  <Skeleton className="h-12 w-full" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Dernier Versement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <>
                    <div className="text-2xl font-extrabold tracking-tight text-foreground" data-testid="dernier-versement">
                      {summary.dernierVersement ? `${formatXaf(summary.dernierVersement.montant)} FCFA` : '—'}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-muted-foreground">
                      {lastDate ? `Le ${dateTime(lastDate)}` : 'Aucun versement validé pour le moment'}
                    </div>
                  </>
                ) : (
                  <Skeleton className="h-12 w-full" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Versements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full min-w-0 flex-1 sm:w-auto sm:min-w-52">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Montant exact…"
                    aria-label="Rechercher un versement par montant"
                    className="pl-9"
                  />
                </div>
                <Select
                  value={status || ALL}
                  onValueChange={(v) => {
                    setStatus(v === ALL ? '' : (v as DriverPaymentFilter))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer les versements par statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={methodFilter || ALL}
                  onValueChange={(v) => {
                    setMethodFilter(v === ALL ? '' : (v as PaymentMethod))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer les versements par moyen de paiement">
                    <SelectValue />
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
                {filtered ? (
                  <Button type="button" variant="ghost" onClick={resetFilters}>
                    Réinitialiser
                  </Button>
                ) : null}
              </div>

              {current?.error ? (
                <Alert variant="destructive">
                  <AlertTriangle />
                  <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                    <span>{current.error}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => setReload((n) => n + 1)}>
                      Réessayer
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="overflow-x-auto rounded-md border border-border ">
                <Table className="min-w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted ">
                      {['DATE', 'TYPE DE VERSEMENT', 'MONTANT', 'MOYEN DE PAIEMENT', 'PREUVE', 'STATUT'].map((h) => (
                        <TableHead key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ">
                          {h}
                        </TableHead>
                      ))}
                      <TableHead className="w-12 px-3 py-3">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {current === null ? (
                      [0, 1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={7} className="px-5 py-3">
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground" data-testid="payments-empty">
                          {filtered ? 'Aucun versement ne correspond à ces filtres.' : 'Aucun versement pour le moment.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((p) => (
                        <TableRow key={p.id} className="transition hover:bg-muted/60 " data-testid="payment-row">
                          <TableCell className="whitespace-nowrap px-5 py-3.5 text-muted-foreground ">{dateTime(p.date)}</TableCell>
                          <TableCell className="px-5 py-3.5 font-semibold text-foreground ">{p.libelle}</TableCell>
                          <TableCell className="whitespace-nowrap px-5 py-3.5 font-bold text-foreground ">{formatXaf(p.montant)} FCFA</TableCell>
                          <TableCell className="px-5 py-3.5" data-testid="payment-method">
                            <PaymentMethodBadge method={p.method} />
                          </TableCell>
                          <TableCell className="px-5 py-3.5 text-muted-foreground">
                            {p.proofUrl ? (
                              <a
                                href={p.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                data-testid="payment-proof-link"
                              >
                                <Paperclip className="size-3" />
                                Voir
                              </a>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-3.5">
                            <Badge variant={p.status === 'Validé' ? 'green' : p.status === 'Refusé' ? 'red' : 'orange'} className="gap-1.5 px-2.5 py-1">
                              {p.status === 'Validé' ? <CheckCircle className="h-3 w-3" /> : p.status === 'Refusé' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {p.status}
                            </Badge>
                            {p.status === 'Refusé' && p.note ? <div className="mt-1 max-w-56 text-xs text-muted-foreground">{p.note}</div> : null}
                          </TableCell>
                          <TableCell className="px-3 py-3.5 text-right">
                            {/* seul un versement encore en attente peut être retiré (erreur de saisie) */}
                            {p.status === 'En attente' ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setToRemove(p)}
                                disabled={removing === p.id}
                                aria-label={`Retirer le paiement ${p.libelle} de ${formatXaf(p.montant)} FCFA`}
                              >
                                {removing === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-xs text-muted-foreground " data-testid="payments-count">
                  {current === null
                    ? 'Chargement…'
                    : `Page ${page} sur ${totalPages} · ${totalCount} versement${totalCount > 1 ? 's' : ''}${filtered ? ' trouvé' + (totalCount > 1 ? 's' : '') : ''}`}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Précédent
                  </Button>
                  <Button variant="outline" type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Suivant
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-sm font-semibold text-muted-foreground ">{user?.fullName ?? 'Conducteur'} – Conducteur Véritable</div>
            <div className="text-xs text-muted-foreground ">CamerRideShare</div>
          </div>
        </div>
      </div>

      <Dialog open={declareOpen} onOpenChange={setDeclareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Déclarer un paiement</DialogTitle>
            <DialogDescription>
              Indiquez le montant que vous avez versé. Il sera pris en compte quand l&apos;administrateur l&apos;aura confirmé.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitDeclare} noValidate className="grid min-w-0 grid-cols-1 gap-4">
            {declareError ? (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertDescription>{declareError}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="declare-amount">Montant (FCFA)</Label>
              <Input
                id="declare-amount"
                type="number"
                min={1}
                max={summary?.resteAPayer}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={String(summary?.weeklyAmount ?? 25000)}
                required
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Reste à payer : {formatXaf(summary?.resteAPayer ?? 0)} FCFA</span>
                {summary?.weeklyAmount ? (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => setAmount(String(Math.min(summary.weeklyAmount ?? 0, summary.resteAPayer)))}
                  >
                    Versement de la semaine ({formatXaf(Math.min(summary.weeklyAmount, summary.resteAPayer))} FCFA)
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="declare-method">Moyen de paiement</Label>
              <PaymentMethodSelect id="declare-method" value={method} onChange={setMethod} />
            </div>
            <PhotoField
              label="Preuve de paiement"
              hint="(optionnel)"
              file={proof}
              onChange={setProof}
              cameraTitle="Photo de la preuve de paiement"
              cameraDescription="Cadrez le reçu ou la capture du paiement, puis déclenchez la prise de vue."
              filePrefix="preuve-paiement"
              testId="declare-proof"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeclareOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={declaring}>
                {declaring ? 'Envoi…' : 'Envoyer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={toRemove !== null} onOpenChange={(open) => (!open ? setToRemove(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce paiement en attente ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toRemove ? `Le versement de ${formatXaf(toRemove.montant)} FCFA n'a pas encore été traité par l'administrateur : vous le retirez de vos déclarations. ` : ''}
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const row = toRemove
                setToRemove(null)
                if (row) void remove(row)
              }}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  )
}
