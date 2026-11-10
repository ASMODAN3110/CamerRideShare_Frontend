import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, MapPin } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatXafLabel, initials } from '../lib/format'
import { VEHICLE_TYPE_LABEL, vehicleDescription } from '../lib/vehicles'
import { getInvestorFleetDetail } from '../services/investorService'
import type { InvestorFleetDetail } from '../types/api'
import InvestorPartContract from './InvestorPartContract'

const STATUS_BADGE: Record<InvestorFleetDetail['status'], { label: string; variant: 'green' | 'orange' | 'default' }> = {
  actif: { label: 'Actif', variant: 'green' },
  panne: { label: 'En panne', variant: 'orange' },
  indisponible: { label: 'Indisponible', variant: 'default' },
}

const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function Stat(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-md border p-3">
      <div className="text-xs font-medium text-muted-foreground">{props.label}</div>
      <div className="mt-1 whitespace-nowrap text-base font-bold tabular-nums">{props.value}</div>
      {props.hint ? <div className="text-xs text-muted-foreground">{props.hint}</div> : null}
    </div>
  )
}

/** État des versements du conducteur : ce qui conditionne les reversements de l'investisseur. */
function DriverPaymentsBanner({ detail }: { detail: InvestorFleetDetail }) {
  const { state, lateWeeks, lateAmount } = detail.driverPayments
  const tone = {
    UP_TO_DATE: { variant: 'green' as const, label: 'Conducteur à jour', text: 'Ses versements hebdomadaires sont réglés à temps.' },
    LATE: {
      variant: 'red' as const,
      label: `${lateWeeks} semaine${lateWeeks > 1 ? 's' : ''} de retard`,
      text: `Il reste ${formatXafLabel(lateAmount)} à verser par le conducteur : vos reversements peuvent être retardés. Le retard est signalé à l'administrateur.`,
    },
    NO_DRIVER: { variant: 'orange' as const, label: 'Sans conducteur', text: "Aucun conducteur n'est affecté : le véhicule ne génère plus de revenus tant qu'il n'est pas réaffecté." },
    COMPLETED: { variant: 'secondary' as const, label: 'Contrat du conducteur terminé', text: 'Le conducteur a fini de payer ; la Société continue de vous verser votre part jusqu’au solde.' },
  }[state]
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border p-3 sm:flex-row sm:gap-3" data-testid="driver-payments">
      <Badge variant={tone.variant} className="shrink-0">
        {tone.label}
      </Badge>
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">{tone.text}</p>
    </div>
  )
}

/**
 * Fiche d'un véhicule de l'investisseur : avancement du remboursement, état des versements du conducteur, ses parts
 * (perçu, attendu, contrat) et les dernières sommes perçues sur ce véhicule.
 */
export default function InvestorMotoDetailModal(props: { motoId: string | null; onClose: () => void }) {
  const { motoId, onClose } = props
  // résultat rattaché au véhicule demandé : ouvrir une autre fiche n'affiche jamais l'ancienne
  const [result, setResult] = useState<{ id: string; detail: InvestorFleetDetail | null; error: string | null } | null>(null)

  useEffect(() => {
    if (motoId === null) return
    let cancelled = false
    getInvestorFleetDetail(motoId)
      .then((detail) => {
        if (!cancelled) setResult({ id: motoId, detail, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ id: motoId, detail: null, error: err instanceof Error ? err.message : 'Impossible de charger ce véhicule.' })
      })
    return () => {
      cancelled = true
    }
  }, [motoId])

  const current = result && result.id === motoId ? result : null
  const detail = current?.detail ?? null
  const status = detail ? STATUS_BADGE[detail.status] : null

  return (
    <Dialog open={motoId !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{detail ? `${VEHICLE_TYPE_LABEL[detail.vehicleType]} ${detail.plaque}` : 'Détail du véhicule'}</DialogTitle>
          <DialogDescription>
            {detail ? vehicleDescription(detail) || 'Suivi de votre investissement sur ce véhicule.' : 'Suivi de votre investissement sur ce véhicule.'}
          </DialogDescription>
        </DialogHeader>

        {current?.error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{current.error}</AlertDescription>
          </Alert>
        ) : !detail ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="min-w-0 space-y-5" data-testid="fleet-detail">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar className="size-12 shrink-0">
                {detail.chauffeur?.avatarUrl ? <AvatarImage src={detail.chauffeur.avatarUrl} alt={detail.chauffeur.name} /> : null}
                <AvatarFallback>{detail.chauffeur ? initials(detail.chauffeur.name) : '?'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{detail.chauffeur?.name ?? 'Sans conducteur'}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {detail.zone}
                  </span>
                </div>
              </div>
              {status ? <Badge variant={status.variant}>{status.label}</Badge> : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-muted-foreground">
                  Remboursement par le conducteur · semaine {detail.progress.semaineAcquise} / {detail.progress.semaineTotal}
                </span>
                <span className="font-bold text-success-foreground">{detail.progress.pct}%</span>
              </div>
              <Progress value={detail.progress.pct} className="h-2" aria-label="Avancement du remboursement" />
              <div className="text-xs text-muted-foreground tabular-nums">
                {formatXafLabel(detail.progress.financedAmount)} / {formatXafLabel(detail.progress.targetAmount)}
                {detail.progress.extraWeeks > 0 ? ` · +${detail.progress.extraWeeks} semaine(s) ajoutée(s) au calendrier` : ''}
              </div>
            </div>

            <DriverPaymentsBanner detail={detail} />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Investi ici" value={formatXafLabel(detail.totals.invested, true)} hint={`${detail.parts.length} part${detail.parts.length > 1 ? 's' : ''}`} />
              <Stat label="Perçu" value={formatXafLabel(detail.totals.received, true)} hint={`sur ${formatXafLabel(detail.totals.expected, true)} attendus`} />
              <Stat label="Ce mois-ci" value={formatXafLabel(detail.totals.receivedMonth, true)} />
              <Stat label="Par semaine" value={formatXafLabel(detail.totals.weeklyShare, true)} hint="estimé, si le conducteur verse tout" />
            </div>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold">Vos parts</h4>
              <ul className="space-y-3">
                {detail.parts.map((p) => (
                  <li key={p.id} className="min-w-0 space-y-2 rounded-md border p-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Apport du {day(p.createdAt)}</div>
                        <div className="font-semibold tabular-nums">{formatXafLabel(p.amount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Part du prix d&apos;achat</div>
                        <div className="font-semibold tabular-nums">{p.sharePct} %</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Perçu / attendu</div>
                        <div className="font-semibold tabular-nums">
                          {formatXafLabel(p.received, true)} / {formatXafLabel(p.expected, true)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Recouvrement</div>
                        <div className="font-semibold tabular-nums">{p.recoveryPct} %</div>
                      </div>
                    </div>
                    <Progress value={p.recoveryPct} className="h-1.5" aria-label="Recouvrement de la part" />
                    {p.catchUpTotal > 0 ? (
                      <p className="text-xs text-muted-foreground">Apport en cours de contrat : rattrapage de {formatXafLabel(p.catchUpTotal)} étalé sur 32 semaines.</p>
                    ) : null}
                    <InvestorPartContract part={p} />
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold">Dernières sommes perçues</h4>
              {detail.recent.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Aucune somme perçue sur ce véhicule pour le moment.</p>
              ) : (
                <ul className="divide-y rounded-md border" aria-label="Dernières sommes perçues sur ce véhicule">
                  {detail.recent.map((r) => (
                    <li key={r.id} className="space-y-1.5 px-3 py-2 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium">{day(r.date)}</div>
                          <div className="truncate text-xs text-muted-foreground">{r.settlement ? 'Échéance de la Société' : `Versement de ${r.source}`}</div>
                        </div>
                        <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums" data-testid="recent-amount">
                          {formatXafLabel(r.amount)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {r.catchUp > 0 ? <Badge variant="blue" className="text-[10px]">dont rattrapage {formatXafLabel(r.catchUp, true)}</Badge> : null}
                        {r.rahimApplied ? <Badge variant="orange" className="text-[10px]">Priorité investisseurs</Badge> : null}
                        <Badge variant={r.paidOutAt ? 'green' : 'secondary'} className="text-[10px]">
                          {r.paidOutAt ? `Reversé le ${day(r.paidOutAt)}` : 'À reverser'}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {detail.recentCount > detail.recent.length ? (
                <p className="text-xs text-muted-foreground">
                  {detail.recentCount} sommes au total ; les {detail.recent.length} plus récentes sont affichées.{' '}
                  <Link to="/investor-revenues" className="font-semibold text-primary hover:underline">
                    Voir tout l&apos;historique
                  </Link>
                </p>
              ) : null}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
