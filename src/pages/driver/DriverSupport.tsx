import { useEffect, useState } from 'react'
import { AlertTriangle, Camera, CheckCircle2, Clock, Copy, Headphones, ImagePlus, Lock, MessageCircle, Paperclip, Phone, RefreshCw, Search, Send, X } from 'lucide-react'

import { toast } from 'sonner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import CameraCapture from '../../components/CameraCapture'
import PortalLayout from '../../components/admin/AdminLayout'
import { Button } from '../../components/ui/button'
import { useAuth } from '../../auth/useAuth'
import { getDriverFaq, getDriverReports, getSupportConfig, submitReportWithPhoto } from '../../services/driverService'
import type { DriverReport, FaqItem, ReportCategorie, SupportConfig } from '../../types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

// ─── Constantes ──────────────────────────────────────────────────────────

const CATEGORIES: ReportCategorie[] = ['Panne mécanique', 'Accident', 'Retard de paiement', 'Autre']
const MIN_DESCRIPTION = 10
const MAX_DESCRIPTION = 1000
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const dateTime = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

/** Erreur de la photo choisie, ou null si elle convient (JPEG, PNG ou WebP, 5 Mo au plus). */
function photoError(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'Seules les images JPEG, PNG ou WebP sont acceptées.'
  if (file.size > MAX_PHOTO_BYTES) return 'Cette image dépasse 5 Mo.'
  return null
}

// ─── DriverSupport ─────────────────────────────────────────────────────────

export default function DriverSupport() {
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

  // « Réessayer » et l'envoi d'un signalement relancent les chargements concernés
  const [reloadFaq, setReloadFaq] = useState(0)
  const [reloadReports, setReloadReports] = useState(0)

  // ── Coordonnées du support (définies par l'administrateur) ───────────────

  const [config, setConfig] = useState<{ data: SupportConfig | null; error: boolean } | null>(null)
  useEffect(() => {
    let cancelled = false
    getSupportConfig()
      .then((data) => {
        if (!cancelled) setConfig({ data, error: false })
      })
      .catch(() => {
        if (!cancelled) setConfig({ data: null, error: true })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ── FAQ : réponses calculées par le serveur avec vos vraies données ──────

  const [faqResult, setFaqResult] = useState<{ key: number; items: FaqItem[]; error: boolean } | null>(null)
  useEffect(() => {
    let cancelled = false
    getDriverFaq()
      .then((items) => {
        if (!cancelled) setFaqResult({ key: reloadFaq, items, error: false })
      })
      .catch(() => {
        if (!cancelled) setFaqResult({ key: reloadFaq, items: [], error: true })
      })
    return () => {
      cancelled = true
    }
  }, [reloadFaq])
  const faq = faqResult && faqResult.key === reloadFaq ? faqResult : null
  const [faqSearch, setFaqSearch] = useState('')
  const term = faqSearch.trim().toLowerCase()
  const faqShown = (faq?.items ?? []).filter((q) => !term || `${q.question} ${q.answer}`.toLowerCase().includes(term))

  // ── Mes signalements ─────────────────────────────────────────────────────

  const [reportsResult, setReportsResult] = useState<{ key: number; items: DriverReport[]; error: boolean } | null>(null)
  useEffect(() => {
    let cancelled = false
    getDriverReports()
      .then((items) => {
        if (!cancelled) setReportsResult({ key: reloadReports, items, error: false })
      })
      .catch(() => {
        if (!cancelled) setReportsResult({ key: reloadReports, items: [], error: true })
      })
    return () => {
      cancelled = true
    }
  }, [reloadReports])
  const reports = reportsResult && reportsResult.key === reloadReports ? reportsResult : null

  // ── Formulaire de signalement ────────────────────────────────────────────

  const [categorie, setCategorie] = useState<ReportCategorie | ''>('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const pickPhoto = (file: File | undefined) => {
    if (!file) return
    const problem = photoError(file)
    if (problem) return void toast.error(problem)
    setPhoto(file)
  }

  const descLength = description.trim().length
  const tooShort = descLength > 0 && descLength < MIN_DESCRIPTION
  const canSubmit = categorie !== '' && descLength >= MIN_DESCRIPTION && descLength <= MAX_DESCRIPTION

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const result = await submitReportWithPhoto(description.trim(), categorie as ReportCategorie, photo ?? undefined)
      if (result.photoSaved === false) toast.warning(`Signalement N°${result.id} envoyé, mais la photo n'a pas pu être enregistrée (stockage indisponible). Vous pouvez la décrire dans un nouveau message.`)
      else toast.success(`Signalement envoyé (N°${result.id})`)
      setCategorie('')
      setDescription('')
      setPhoto(null)
      setReloadReports((n) => n + 1)
    } catch (err) {
      toast.error(errorText(err, "Erreur lors de l'envoi du signalement. Veuillez réessayer."))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Contact ──────────────────────────────────────────────────────────────

  const contact = config?.data
  const phoneHref = contact?.phone ? `tel:${contact.phone.replace(/[^\d+]/g, '')}` : null
  const whatsappHref = contact?.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Bonjour, je suis ${user?.fullName ?? 'conducteur'} (conducteur CamerRideShare). `)}`
    : null
  const copyPhone = async () => {
    if (!contact?.phone) return
    try {
      await navigator.clipboard.writeText(contact.phone)
      toast.success('Numéro copié')
    } catch {
      toast.error('Copie impossible : sélectionnez le numéro à la main.')
    }
  }

  return (
    <PortalLayout portal="driver" title="Support" hideHeading theme={theme} onToggleTheme={onToggleTheme}>
      <div className="flex-1 p-4 sm:p-6">
        <div className="w-full space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground ">Support & Aide</h1>
            <p className="mt-1 text-sm text-muted-foreground ">Besoin d'aide ? Nous sommes là pour vous accompagner au quotidien.</p>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            {/* Colonne gauche : FAQ, contact */}
            <div className="flex min-w-0 flex-col gap-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Foire Aux Questions</CardTitle>
                  <CardDescription>Les réponses reprennent vos vraies données : versement, montant cible, moyens de paiement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      placeholder="Rechercher une question…"
                      aria-label="Rechercher dans la foire aux questions"
                      className="pl-9"
                    />
                  </div>
                  {faq === null ? (
                    <div className="space-y-2" data-testid="faq-loading">
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : faq.error ? (
                    <Alert variant="destructive">
                      <AlertTriangle />
                      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                        <span>Impossible de charger les questions fréquentes.</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => setReloadFaq((n) => n + 1)}>
                          <RefreshCw />
                          Réessayer
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : faqShown.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground" data-testid="faq-empty">
                      Aucune question ne correspond à « {faqSearch.trim()} ». Utilisez le formulaire pour nous écrire.
                    </p>
                  ) : (
                    <Accordion type="single" collapsible className="w-full" data-testid="faq-list">
                      {faqShown.map((item) => (
                        <AccordionItem key={item.id} value={String(item.id)} data-testid="faq-item">
                          <AccordionTrigger className="text-left text-sm font-semibold">{item.question}</AccordionTrigger>
                          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {/* Contact direct */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Headphones className="h-4 w-4 text-muted-foreground" />
                    Contact Direct
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {config === null ? (
                    <Skeleton className="h-20 w-full" />
                  ) : config.error ? (
                    <p className="text-sm text-destructive">Impossible de charger les coordonnées du support.</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground" data-testid="support-hours">
                        Nos conseillers sont disponibles : {contact?.hours}.
                      </p>
                      {phoneHref || whatsappHref ? (
                        <div className="flex flex-col gap-3 sm:flex-row">
                          {whatsappHref ? (
                            <Button asChild className="flex-1">
                              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" data-testid="support-whatsapp">
                                <MessageCircle className="h-4 w-4" />
                                WhatsApp Support
                              </a>
                            </Button>
                          ) : null}
                          {phoneHref ? (
                            <Button asChild variant="outline" className="flex-1">
                              <a href={phoneHref} data-testid="support-phone">
                                <Phone className="h-4 w-4" />
                                Appeler {contact?.phone}
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      ) : (
                        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground" data-testid="support-unset">
                          Les coordonnées du support n'ont pas encore été renseignées par l'administrateur. En attendant, envoyez-lui un message avec le formulaire « Signaler un problème ».
                        </p>
                      )}
                      {contact?.phone ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => void copyPhone()}>
                          <Copy />
                          Copier le numéro
                        </Button>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Espace sécurisé */}
              <Card>
                <CardContent className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Lock className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground ">Espace sécurisé</div>
                    <p className="mt-1 text-sm text-muted-foreground ">Vos données et signalements sont traités en toute confidentialité par nos équipes agréées.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne droite : signalement et suivi */}
            <div className="flex min-w-0 flex-col gap-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Signaler un problème</CardTitle>
                  <CardDescription>L'administrateur est prévenu tout de suite. Le signalement est rattaché à votre véhicule.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Catégorie */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catégorie</Label>
                    <Select value={categorie || undefined} onValueChange={(v) => setCategorie(v as ReportCategorie)}>
                      <SelectTrigger className="w-full" aria-label="Catégorie">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="report-description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </Label>
                    <Textarea
                      id="report-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez votre problème en détail..."
                      rows={4}
                      maxLength={MAX_DESCRIPTION}
                      aria-invalid={tooShort}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={tooShort ? 'text-destructive' : 'text-muted-foreground'} data-testid="description-hint">
                        {tooShort ? `Encore ${MIN_DESCRIPTION - descLength} caractère${MIN_DESCRIPTION - descLength > 1 ? 's' : ''} minimum` : `${MIN_DESCRIPTION} caractères minimum`}
                      </span>
                      <span className="tabular-nums text-muted-foreground" data-testid="description-count">
                        {description.length} / {MAX_DESCRIPTION}
                      </span>
                    </div>
                  </div>

                  {/* Photo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photo (optionnel)</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" type="button" size="sm" onClick={() => setCameraOpen(true)}>
                        <Camera className="h-4 w-4" />
                        Prendre une photo
                      </Button>
                      <Button variant="outline" type="button" size="sm" onClick={() => document.getElementById('photo-input')?.click()}>
                        <ImagePlus className="h-4 w-4" />
                        Importer une image
                      </Button>
                      <input
                        id="photo-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        aria-label="Choisir une photo du problème"
                        onChange={(e) => {
                          pickPhoto(e.target.files?.[0])
                          e.target.value = ''
                        }}
                      />
                    </div>
                    {photo && photoPreview ? (
                      <div className="flex items-center gap-3 rounded-md border p-2" data-testid="photo-preview">
                        <img src={photoPreview} alt="Aperçu de la photo jointe" className="size-14 shrink-0 rounded object-cover" />
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{photo.name}</span>
                        <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Retirer la photo" onClick={() => setPhoto(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">JPEG, PNG ou WebP, 5 Mo au plus.</p>
                    )}
                    <CameraCapture
                      open={cameraOpen}
                      onClose={() => setCameraOpen(false)}
                      title="Photo du problème"
                      description="Choisissez la caméra avant ou arrière, cadrez le problème puis déclenchez la prise de vue."
                      initialFacing="environment"
                      filePrefix="signalement"
                      onCapture={(file) => {
                        setCameraOpen(false)
                        pickPhoto(file)
                      }}
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting} className="w-full">
                      <Send className="h-4 w-4" />
                      {submitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mes signalements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Mes signalements</CardTitle>
                  <CardDescription>Suivez le traitement de vos signalements par l'administrateur.</CardDescription>
                </CardHeader>
                <CardContent>
                  {reports === null ? (
                    <Skeleton className="h-24 w-full" />
                  ) : reports.error ? (
                    <Alert variant="destructive">
                      <AlertTriangle />
                      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                        <span>Impossible de charger vos signalements.</span>
                        <Button type="button" variant="outline" size="sm" onClick={() => setReloadReports((n) => n + 1)}>
                          <RefreshCw />
                          Réessayer
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : reports.items.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground" data-testid="reports-empty">
                      Vous n'avez encore envoyé aucun signalement.
                    </p>
                  ) : (
                    <ul className="divide-y" data-testid="reports-list">
                      {reports.items.map((r) => (
                        <li key={r.id} className="space-y-1.5 py-3 first:pt-0 last:pb-0" data-testid="report-item">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">N°{r.id} · {r.categorie}</span>
                              {r.vehicle ? <Badge variant="secondary">{r.vehicle}</Badge> : null}
                            </div>
                            {r.status === 'RESOLVED' ? (
                              <Badge variant="green" className="gap-1.5">
                                <CheckCircle2 className="size-3" />
                                Résolu
                              </Badge>
                            ) : (
                              <Badge variant="orange" className="gap-1.5">
                                <Clock className="size-3" />
                                En cours de traitement
                              </Badge>
                            )}
                          </div>
                          <p className="line-clamp-3 text-sm text-muted-foreground">{r.description}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>Envoyé le {dateTime(r.createdAt)}</span>
                            {r.resolvedAt ? <span>· Résolu le {dateTime(r.resolvedAt)}</span> : null}
                            {r.photoUrl ? (
                              <a href={r.photoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                                <Paperclip className="size-3" />
                                Photo jointe
                              </a>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="text-sm font-semibold text-muted-foreground ">{user?.fullName ?? 'Conducteur'} – Conducteur Véritable</div>
            <div className="text-xs text-muted-foreground ">CamerRideShare</div>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
