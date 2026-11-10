import { useEffect, useState } from 'react'
import { AlarmClock, CheckCircle, FileText, Flag, Loader2, Trash2, Wallet } from 'lucide-react'
import { downloadContract } from '../../lib/contracts'
import LatePaymentsList from '../../components/LatePaymentsList'
import { getDriverLatePayments } from '../../services/latePaymentsService'

import { toast } from 'sonner'
import { Label as ChartLabel, PolarAngleAxis, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import PortalLayout from '../../components/admin/AdminLayout'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

import { useAuth } from '../../auth/useAuth'
import { ApiError } from '../../types/auth'
import type { DriverPaymentRow, DriverProgress } from '../../types/api'
import {
  getDriverProgress,
  getDriverPayments,
  createReport,
  deleteDriverPayment,
} from '../../services/driverService'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  const hh = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${hh}`
}

function formatXaf(amount: number) {
  return amount.toLocaleString('fr-FR')
}

// ─── Jauge de propriété (graphique radial shadcn) ────────────────────────────

const gaugeConfig = { part: { label: 'Part chauffeur', color: 'var(--primary)' } } satisfies ChartConfig

function CircularGauge({ pct }: { pct: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <ChartContainer config={gaugeConfig} className="mx-auto aspect-square size-48" role="img" aria-label={`${pct} % du véhicule vous appartient`}>
        <RadialBarChart data={[{ name: 'part', value: pct, fill: 'var(--color-part)' }]} startAngle={90} endAngle={-270} innerRadius={74} outerRadius={96}>
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" angleAxisId={0} background={{ fill: 'var(--muted)' }} cornerRadius={8} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <ChartLabel
              content={({ viewBox }) => {
                if (!viewBox || !('cx' in viewBox)) return null
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-4xl font-extrabold">
                      {pct}%
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 22} className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                      VOUS APPARTIENT
                    </tspan>
                  </text>
                )
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>

      {/* Légendes */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-primary" />
          <span className="font-semibold text-foreground ">Part Chauffeur</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-muted" />
          <span className="font-semibold text-foreground ">Part Investisseur</span>
        </div>
      </div>
    </div>
  )
}

// ─── DriverDashboard ─────────────────────────────────────────────────────────

/** Contrat du chauffeur : téléchargement du PDF rempli avec son véhicule, ses montants et son calendrier. */
function ContractCard() {
  const [busy, setBusy] = useState(false)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Mon contrat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Votre contrat avec la société : véhicule, montant à verser, versement hebdomadaire et calendrier des échéances.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void downloadContract('/driver/contract').finally(() => setBusy(false))
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {busy ? 'Génération du PDF…' : 'Télécharger mon contrat (PDF)'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function DriverDashboard() {
  const { user } = useAuth()
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // États de données
  const [progress, setProgress] = useState<DriverProgress | null>(null)
  const [payments, setPayments] = useState<DriverPaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null)

  // États signalement
  const [signalerOpen, setSignalerOpen] = useState(false)
  const [signalementTexte, setSignalementTexte] = useState('')
  const [sendingReport, setSendingReport] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const onToggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  // ── Chargement des données ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [progressData, paymentsData] = await Promise.all([
          getDriverProgress(),
          getDriverPayments(),
        ])
        if (cancelled) return
        setProgress(progressData)
        setPayments(paymentsData.data)
      } catch (err) {
        if (cancelled) return
        const msg =
          err instanceof ApiError
            ? typeof err.body.message === 'string'
              ? err.body.message
              : err.body.message.join(', ')
            : 'Impossible de charger les données. Veuillez réessayer.'
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Actions ────────────────────────────────────────────────────────────

  const handleSignaler = async () => {
    if (!signalementTexte.trim()) return
    setSendingReport(true)
    try {
      const report = await createReport({ description: signalementTexte.trim() })
      toast.success(`Signalement envoyé (N°${report.id})`)
      setSignalementTexte('')
      setSignalerOpen(false)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.body.message === 'string'
            ? err.body.message
            : err.body.message.join(', ')
          : "Erreur lors de l'envoi du signalement."
      toast.error(msg)
    } finally {
      setSendingReport(false)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    setDeleting(paymentId)
    try {
      await deleteDriverPayment(paymentId)
      setPayments((prev) => prev.filter((p) => p.id !== paymentId))
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? typeof err.body.message === 'string'
            ? err.body.message
            : err.body.message.join(', ')
          : 'Erreur lors de la suppression du paiement.'
      toast.error(msg)
    } finally {
      setDeleting(null)
    }
  }

  // ── États d'affichage ──────────────────────────────────────────────────

  if (loading) {
    return (
      <PortalLayout portal="driver" title="Tableau de bord" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
          
          <div className="flex flex-1 items-center justify-center p-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
      </PortalLayout>
    )
  }

  if (error) {
    return (
      <PortalLayout portal="driver" title="Tableau de bord" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
          
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
      </PortalLayout>
    )
  }

  if (!progress) return null

  return (
    <PortalLayout portal="driver" title="Tableau de bord" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
        

        <div className="flex-1 p-6">
          <div className="@container w-full space-y-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground ">
                Ma Propriété Moto
              </h1>
              <p className="mt-1 text-sm text-muted-foreground ">
                Suivez votre progression vers la pleine propriété
              </p>
            </div>

            {/*
              Un rectangle : la colonne de résumé donne la hauteur, et les listes de retards et de paiements (longues) la remplissent
              exactement en défilant à l'intérieur de leur carte, au lieu d'allonger la page ou de laisser des blocs vides.
              Une colonne en dessous de 768 px (listes à leur hauteur naturelle) ; deux au milieu (résumé à gauche, retards à
              droite, paiements sur toute la largeur dessous) ; trois sur grand écran.
            */}
            <div className="grid grid-cols-1 items-stretch gap-5 @3xl:grid-cols-2 @6xl:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Progression</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pt-2">
                    <CircularGauge pct={progress.proprietePct} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      Reste à payer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold tracking-tight text-foreground ">
                      FCFA {formatXaf(progress.resteAPayer)}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-muted-foreground">
                      {100 - progress.proprietePct}% restant à payer
                    </div>
                  </CardContent>
                </Card>

                  <ContractCard />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      Statut
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {progress.estAJour ? (
                      <Badge variant="green" className="gap-1.5 px-3 py-1 text-xs">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        À jour
                      </Badge>
                    ) : (
                      <Badge variant="red" className="gap-1.5 px-3 py-1 text-xs">
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                        En retard
                      </Badge>
                    )}
                    {progress.retardSemaines > 0 ? (
                      <div className="text-sm font-semibold text-destructive">
                        {progress.retardSemaines} semaine{progress.retardSemaines > 1 ? 's' : ''} de retard ·{' '}
                        {progress.retardMontant.toLocaleString('fr-FR')} XAF à régulariser
                      </div>
                    ) : null}
                    <div className="text-sm font-semibold text-muted-foreground ">
                      Versement de la semaine à effectuer avant dimanche soir ({progress.prochainPaiementJours} jour
                      {progress.prochainPaiementJours > 1 ? 's' : ''})
                    </div>

                    <div className="flex flex-row flex-wrap gap-2 pt-2">
                      <Button variant="outline" type="button"
                        onClick={() => setSignalerOpen(true)}
                        className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Flag className="h-4 w-4" />
                        Signaler un problème
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>
              <div className="@3xl:relative @3xl:min-h-[24rem]">
              <Card className="@3xl:absolute @3xl:inset-0 @3xl:flex @3xl:flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlarmClock className="h-4 w-4 text-muted-foreground" />
                    Mes retards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 @3xl:min-h-0 @3xl:flex-1 @3xl:overflow-y-auto">
                  {progress.semainesAjoutees > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {progress.semainesAjoutees} semaine{progress.semainesAjoutees > 1 ? 's' : ''} ajoutée
                      {progress.semainesAjoutees > 1 ? 's' : ''} à la fin de votre calendrier à cause de vos retards.
                    </p>
                  ) : null}
                  <LatePaymentsList fetcher={getDriverLatePayments} />
                </CardContent>
              </Card>
              </div>

              <div className="@3xl:col-span-2 @6xl:relative @6xl:col-span-1 @6xl:min-h-[24rem]">
              <Card className="@6xl:absolute @6xl:inset-0 @6xl:flex @6xl:flex-col">
                <CardHeader>
                  <CardTitle className="text-base">Paiements Récents</CardTitle>
                </CardHeader>
                <CardContent className="@6xl:min-h-0 @6xl:flex-1 @6xl:overflow-y-auto">
                  {payments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
                  ) : (
                    <div className="divide-y divide-border ">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground ">
                              {p.libelle}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground ">
                              {formatDate(p.date)}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-bold text-foreground ">
                                FCFA {formatXaf(p.montant)}
                              </div>
                              {p.status === 'Validé' ? (
                                <Badge variant="green" className="mt-1 gap-1 px-2 py-0.5 text-[10px]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  Payé
                                </Badge>
                              ) : p.status === 'Refusé' ? (
                                <Badge variant="red" className="mt-1 gap-1 px-2 py-0.5 text-[10px]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                                  Refusé
                                </Badge>
                              ) : (
                                <Badge variant="orange" className="mt-1 gap-1 px-2 py-0.5 text-[10px]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                                  En attente
                                </Badge>
                              )}
                            </div>
                            {/* seul un versement encore en attente peut être retiré (erreur de saisie) ; validé ou refusé, il reste dans l'historique */}
                            {p.status === 'En attente' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPaymentToDelete(p.id)}
                              disabled={deleting === p.id}
                              className="ml-1 size-8 text-muted-foreground hover:text-destructive"
                              aria-label={`Effacer le paiement ${p.libelle}`}
                            >
                              {deleting === p.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                            ) : (
                              <span className="ml-1 size-8 shrink-0" aria-hidden />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>

            </div>

            {/* Footer identité */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-sm font-semibold text-muted-foreground ">
                {user?.fullName ?? 'Conducteur'} – Conducteur Vérité
              </div>
              <div className="text-xs text-muted-foreground ">CamerRideShare</div>
            </div>
          </div>
        </div>

      {/* Signalement */}
      <Dialog open={signalerOpen} onOpenChange={setSignalerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Signaler un problème</DialogTitle>
            <DialogDescription>Décrivez le problème rencontré, l'équipe vous répondra rapidement.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={signalementTexte}
            onChange={(e) => setSignalementTexte(e.target.value)}
            placeholder="Décrivez votre problème..."
            rows={4}
            className="resize-none"
            aria-label="Description du problème"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSignalerOpen(false)}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={handleSignaler} disabled={!signalementTexte.trim() || sendingReport}>
              {sendingReport ? (
                <>
                  <Loader2 className="animate-spin" />
                  Envoi...
                </>
              ) : (
                'Envoyer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={paymentToDelete !== null} onOpenChange={(open) => (!open ? setPaymentToDelete(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce paiement en attente ?</AlertDialogTitle>
            <AlertDialogDescription>
              Il n'a pas encore été traité par l'administrateur : vous le retirez de vos déclarations. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = paymentToDelete
                setPaymentToDelete(null)
                if (id) void handleDeletePayment(id)
              }}
            >
              Effacer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  )
}
