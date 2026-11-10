import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import RemoteSelect from './RemoteSelect'
import { formatXafLabel } from '../lib/format'
import { MIN_INVESTMENT_XAF } from '../lib/investmentRules'
import { INVESTOR_REASONS, REASON_LABEL } from '../lib/termination'
import { listMotos } from '../services/fleetService'
import { getInvestorTerminationPreview, terminateInvestorContract } from '../services/terminationService'
import type { InvestorTerminationPreview, InvestorTerminationResult, TerminationReason } from '../types/api'

/** Véhicules actifs pouvant accueillir une nouvelle part : recherche faite par le serveur. */
function fetchTargets(excludeMotoLabel: string) {
  return (search: string) =>
    listMotos({ search, status: 'ACTIVE', limit: 20 }).then((page) =>
      page.data
        .filter((m) => m.matricule !== excludeMotoLabel)
        .map((m) => ({
          id: m.id,
          label: `${m.matricule} — ${m.availableAmount >= MIN_INVESTMENT_XAF ? `${formatXafLabel(m.availableAmount)} à financer` : 'complet'}`,
          disabled: m.availableAmount < MIN_INVESTMENT_XAF,
        })),
    )
}

/**
 * Résiliation du contrat d'une part. L'admin décide librement : rembourser l'investisseur (montant libre, y compris
 * zéro) et/ou réaffecter son capital à un autre véhicule. Le capital rendu ou réaffecté libère la place d'autant.
 */
export function InvestorTerminationDialog(props: {
  /** Part à résilier ; null : fenêtre fermée. */
  investmentId: number | null
  onClose: () => void
  onDone: (result: InvestorTerminationResult) => void
}) {
  return (
    <Dialog open={props.investmentId !== null} onOpenChange={(open) => (!open ? props.onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {props.investmentId !== null ? <Form key={props.investmentId} {...props} investmentId={props.investmentId} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function Form(props: { investmentId: number; onClose: () => void; onDone: (result: InvestorTerminationResult) => void }) {
  const [preview, setPreview] = useState<InvestorTerminationPreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reason, setReason] = useState<TerminationReason>(INVESTOR_REASONS[0])
  const [note, setNote] = useState('')
  const [refund, setRefund] = useState('')
  const [transferOn, setTransferOn] = useState(false)
  const [targetId, setTargetId] = useState(0)
  const [targetLabel, setTargetLabel] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getInvestorTerminationPreview(props.investmentId)
      .then((p) => {
        if (cancelled) return
        setPreview(p)
        setTransferAmount(String(Math.max(Math.min(p.unrecovered, p.amount), MIN_INVESTMENT_XAF)))
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Impossible de charger la part.')
      })
    return () => {
      cancelled = true
    }
  }, [props.investmentId])

  const fetchOptions = useMemo(() => fetchTargets(preview?.matricule ?? ''), [preview?.matricule])
  const refundValue = parseInt(refund, 10) || 0
  const transferValue = transferOn ? parseInt(transferAmount, 10) || 0 : 0
  const overflow = preview ? refundValue + transferValue - preview.amount : 0

  const submit = async () => {
    if (!preview) return
    if (transferOn && targetId < 1) return setError('Choisissez le véhicule vers lequel réaffecter le capital')
    if (transferOn && transferValue < MIN_INVESTMENT_XAF) return setError(`La nouvelle part doit être d'au moins ${formatXafLabel(MIN_INVESTMENT_XAF)}`)
    if (overflow > 0) return setError(`Le total remboursé et réaffecté dépasse l'apport de ${formatXafLabel(preview.amount)}`)
    setSubmitting(true)
    setError(null)
    try {
      const result = await terminateInvestorContract(props.investmentId, {
        reason,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(refundValue > 0 ? { refundAmount: refundValue } : {}),
        ...(transferOn ? { transfer: { motoId: targetId, amount: transferValue } } : {}),
      })
      props.onDone(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La résiliation a échoué.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Résilier le contrat de cette part ?</DialogTitle>
        <DialogDescription>
          La part ne recevra plus de versements ; les sommes déjà perçues restent acquises. Vous décidez librement de rembourser
          l&apos;investisseur et/ou de réaffecter son capital à un autre véhicule.
        </DialogDescription>
      </DialogHeader>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : !preview ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-2 rounded-md border p-3 text-sm" data-testid="termination-preview">
            <div>
              <div className="text-xs text-muted-foreground">Apport</div>
              <div className="font-semibold tabular-nums">{formatXafLabel(preview.amount)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Déjà perçu</div>
              <div className="font-semibold tabular-nums">{formatXafLabel(preview.received)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Non récupéré</div>
              <div className="font-semibold tabular-nums">{formatXafLabel(preview.unrecovered)}</div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="inv-termination-reason">Motif</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as TerminationReason)}>
              <SelectTrigger id="inv-termination-reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVESTOR_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {REASON_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="inv-termination-refund">Capital remboursé à l&apos;investisseur (XAF)</Label>
            <div className="flex gap-2">
              <Input
                id="inv-termination-refund"
                type="number"
                min={0}
                max={preview.amount}
                value={refund}
                placeholder="0 : aucun remboursement"
                onChange={(e) => setRefund(e.target.value)}
              />
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setRefund(String(preview.unrecovered))} disabled={preview.unrecovered === 0}>
                Non récupéré
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Montant libre. Il libère la place d&apos;autant sur ce véhicule.</p>
          </div>

          <div className="grid gap-3 rounded-md border p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={transferOn}
                onChange={(e) => setTransferOn(e.target.checked)}
              />
              Affecter l&apos;investisseur à un autre véhicule
            </label>
            {transferOn ? (
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="inv-termination-target">Véhicule de destination</Label>
                  <RemoteSelect
                    id="inv-termination-target"
                    value={targetId}
                    selectedLabel={targetLabel}
                    placeholder="Choisir un véhicule"
                    fetchOptions={fetchOptions}
                    onChange={(o) => {
                      setTargetId(o?.id ?? 0)
                      setTargetLabel(o?.label ?? '')
                    }}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="inv-termination-transfer">Montant de la nouvelle part (XAF)</Label>
                  <Input
                    id="inv-termination-transfer"
                    type="number"
                    min={MIN_INVESTMENT_XAF}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum {formatXafLabel(MIN_INVESTMENT_XAF)}, dans la limite du capital restant à financer sur le véhicule choisi.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {overflow > 0 ? (
            <p className="text-xs font-semibold text-destructive">
              {formatXafLabel(overflow)} de trop : le remboursement et la réaffectation ne peuvent dépasser l&apos;apport.
            </p>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="inv-termination-note">Précision (facultatif)</Label>
            <Textarea id="inv-termination-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={props.onClose} disabled={submitting}>
          Annuler
        </Button>
        <Button type="button" variant="destructive" onClick={() => void submit()} disabled={submitting || !preview}>
          {submitting ? 'Résiliation…' : 'Résilier le contrat'}
        </Button>
      </DialogFooter>
    </>
  )
}
