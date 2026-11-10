import { useEffect, useState } from 'react'
import { AlertTriangle, Ban, Calendar, FileText, Mail, MapPin, Phone, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadContract, printContract } from '@/lib/contracts'
import { STATUS_UI } from '@/lib/fleet'
import { formatShortDate, formatXafLabel, initials } from '@/lib/format'
import { INVESTOR_STATUS_UI } from '@/lib/investors'
import { PAYOUT_FREQUENCY_LABEL } from '@/lib/payouts'
import { getAdminInvestorProfile } from '@/services/investorsService'
import { investorResultMessage, REASON_LABEL } from '@/lib/termination'
import { InvestorTerminationDialog } from './InvestorTerminationDialog'
import type { AdminInvestorProfile } from '@/types/api'

function Stat(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-md border p-3">
      <div className="text-xs font-medium text-muted-foreground">{props.label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums">{props.value}</div>
      {props.hint ? <div className="text-xs text-muted-foreground">{props.hint}</div> : null}
    </div>
  )
}

function ContractButton(props: { path: string; label: string }) {
  const [busy, setBusy] = useState(false)
  const run = (action: (path: string) => Promise<boolean>) => {
    setBusy(true)
    void action(props.path).finally(() => setBusy(false))
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => run(downloadContract)}>
        <FileText />
        {busy ? 'Génération…' : props.label}
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => run(printContract)}>
        <Printer />
        Imprimer
      </Button>
    </div>
  )
}

/** Profil d'un investisseur : coordonnées, sommes, motos détenues et derniers reversements. */
export function InvestorProfileModal(props: { investorId: number | null; onClose: () => void }) {
  const { investorId, onClose } = props
  // Résultat rattaché à l'identifiant demandé : ouvrir un autre profil n'affiche jamais l'ancien.
  const [result, setResult] = useState<{ id: number; profile: AdminInvestorProfile | null; error: string | null } | null>(null)
  // part dont on résilie le contrat, et compteur pour recharger le profil après une résiliation
  const [terminating, setTerminating] = useState<AdminInvestorProfile['parts'][number] | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (investorId == null) return
    let cancelled = false
    getAdminInvestorProfile(investorId)
      .then((profile) => {
        if (!cancelled) setResult({ id: investorId, profile, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ id: investorId, profile: null, error: err instanceof Error ? err.message : 'Impossible de charger le profil.' })
      })
    return () => {
      cancelled = true
    }
  }, [investorId, reloadKey])

  const current = result && result.id === investorId ? result : null
  const profile = current?.profile ?? null
  const error = current?.error ?? null

  const status = profile ? INVESTOR_STATUS_UI[profile.status] : null

  return (
    <Dialog open={investorId != null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Profil de l&apos;investisseur</DialogTitle>
          <DialogDescription>Coordonnées, sommes perçues et parts détenues.</DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !profile ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar className="size-14 shrink-0">
                {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.fullName} /> : null}
                <AvatarFallback>{initials(profile.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-bold">{profile.fullName}</h3>
                  {status ? <Badge variant={status.variant}>{status.label}</Badge> : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <a href={`tel:${profile.phoneNumber}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <Phone className="size-3.5" />
                    {profile.phoneNumber}
                  </a>
                  {profile.email ? (
                    <a href={`mailto:${profile.email}`} className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground">
                      <Mail className="size-3.5 shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </a>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    Inscrit le {new Date(profile.joinedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Capital investi" value={formatXafLabel(profile.summary.amountInvested, true)} hint={`${profile.summary.partsCount} part${profile.summary.partsCount !== 1 ? 's' : ''} · ${profile.summary.motosCount} véhicule${profile.summary.motosCount !== 1 ? 's' : ''}`} />
              <Stat label="Retour attendu" value={formatXafLabel(profile.summary.expectedReturn, true)} hint="160 % de la mise" />
              <Stat label="Perçu" value={formatXafLabel(profile.summary.amountReceived, true)} hint={`${profile.summary.recoveryRatePct} % du retour`} />
              <Stat label="Reste à reverser" value={formatXafLabel(profile.summary.amountToPayOut, true)} hint={`Déjà reversé : ${formatXafLabel(profile.summary.amountPaidOut, true)}`} />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Recouvrement du retour attendu</span>
                <span className="font-bold text-success-foreground">{profile.summary.recoveryRatePct}%</span>
              </div>
              <Progress value={profile.summary.recoveryRatePct} className="h-2" />
            </div>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold">Parts détenues</h4>
              {profile.parts.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Aucune part dans un véhicule pour le moment.</p>
              ) : (
                <ul className="space-y-3">
                  {profile.parts.map((m) => (
                    <li key={m.id} className="min-w-0 space-y-2 rounded-md border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="font-semibold">#{m.matricule}</span>
                          <Badge variant={STATUS_UI[m.status].variant}>{STATUS_UI[m.status].label}</Badge>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" />
                          {m.city}
                          {m.driverName ? ` · ${m.driverName}` : ' · sans chauffeur'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Apport du {formatShortDate(m.enteredAt)}</div>
                          <div className="font-semibold tabular-nums">{formatXafLabel(m.invested)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Part du prix d&apos;achat</div>
                          <div className="font-semibold tabular-nums">{m.sharePct} %</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Perçu / attendu</div>
                          <div className="font-semibold tabular-nums">
                            {formatXafLabel(m.received, true)} / {formatXafLabel(m.expectedReturn, true)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Contrat chauffeur</div>
                          <div className="font-semibold tabular-nums">
                            {m.motoProgressPct} % · {m.contractWeeks} sem.
                          </div>
                        </div>
                      </div>
                      <Progress value={m.recoveryRatePct} className="h-1.5" />
                      {m.catchUpTotal > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Apport en cours de contrat : rattrapage de {formatXafLabel(m.catchUpTotal)} étalé sur 32 semaines.
                        </p>
                      ) : null}
                      {m.closedAt ? (
                        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                          <Badge variant={m.closeReason === 'LOSS' ? 'red' : 'secondary'} className="mr-2">
                            {m.closeReason === 'LOSS' ? 'Perte' : 'Contrat résilié'}
                          </Badge>
                          Résilié le {formatShortDate(m.closedAt)}
                          {m.closeReason ? ` (${REASON_LABEL[m.closeReason].toLowerCase()})` : ''} : cette part ne reçoit plus de versements.
                          {m.refundedAmount > 0 ? ` Capital remboursé : ${formatXafLabel(m.refundedAmount)}.` : ''}
                          {m.transferredAmount > 0 ? ` Capital réaffecté au véhicule ${m.transferredToMatricule ?? ''} : ${formatXafLabel(m.transferredAmount)}.` : ''}
                          {m.closeReason === 'LOSS' ? ` Capital non récupéré, classé en perte : ${formatXafLabel(m.loss)}.` : ''}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <ContractButton path={`/admin/contracts/investor/${m.id}`} label="Contrat de cette part (PDF)" />
                        {m.closedAt ? null : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setTerminating(m)}
                          >
                            <Ban />
                            Résilier ce contrat
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">Derniers reversements</h4>
                <span className="text-xs text-muted-foreground">Mode : {PAYOUT_FREQUENCY_LABEL[profile.payoutFrequency].toLowerCase()}</span>
              </div>
              {profile.recentPayouts.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">Aucun reversement effectué pour le moment.</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {profile.recentPayouts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">{formatShortDate(p.paidAt)}</span>
                      <span className="font-semibold tabular-nums">{formatXafLabel(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {profile.payoutsCount > profile.recentPayouts.length ? (
                <p className="text-xs text-muted-foreground">
                  {profile.payoutsCount} reversements au total, les {profile.recentPayouts.length} derniers sont affichés.
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

      <InvestorTerminationDialog
        investmentId={terminating?.id ?? null}
        onClose={() => setTerminating(null)}
        onDone={(res) => {
          toast.success(investorResultMessage(res))
          setTerminating(null)
          setReloadKey((k) => k + 1)
        }}
      />
    </Dialog>
  )
}
