import { useEffect, useState } from 'react'
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Headphones,
  Lock,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react'

import { EffectCard, SpotlightSection } from '../../components/MagicBento'
import DriverSidebar from '../../components/DriverSidebar'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

type FaqItem = {
  question: string
  answer: string
}

type CategorieSignalement = 'Panne mécanique' | 'Accident' | 'Retard de paiement' | 'Autre'

// ─── Mock data ────────────────────────────────────────────────────────────────

const faqItems: FaqItem[] = [
  {
    question: 'Comment payer par MoMo / OM ?',
    answer:
      'Vous pouvez payer via MTN Mobile Money ou Orange Money en sélectionnant le mode de paiement dans l\'application. Le versement est immédiatement crédité sur votre compte.',
  },
  {
    question: 'Que faire en cas de panne mécanique ?',
    answer:
      'Contactez immédiatement votre responsable de flotte ou utilisez le formulaire de signalement ci-contre. Un mécanicien agréé vous contactera sous 24h.',
  },
  {
    question: 'Comment fonctionne la pleine propriété ?',
    answer:
      'Chaque versement hebdomadaire augmente votre part de propriété. Une fois 100% atteint, la moto vous appartient entièrement sans aucun frais supplémentaire.',
  },
  {
    question: 'Délai de traitement des réclamations ?',
    answer:
      'Les réclamations sont traitées sous 48 à 72 heures ouvrées. Les signalements urgents (accident, panne) sont prioritaires.',
  },
]

const categories: CategorieSignalement[] = [
  'Panne mécanique',
  'Accident',
  'Retard de paiement',
  'Autre',
]

// ─── DriverSupport ─────────────────────────────────────────────────────────

export default function DriverSupport() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  // FAQ accordéon
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Formulaire
  const [categorie, setCategorie] = useState<CategorieSignalement | ''>('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = categorie !== '' && description.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmitting(true)
    console.log('[DriverSupport] signalement:', { categorie, description, photo: photo?.name })
    setTimeout(() => {
      window.alert('Signalement envoyé avec succès (mock).')
      setCategorie('')
      setDescription('')
      setPhoto(null)
      setSubmitting(false)
    }, 500)
  }

  return (
    <SpotlightSection className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex">
        <DriverSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <main className="flex-1 p-6">
          <div className="w-full space-y-5">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Support & Aide
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Besoin d'aide ? Nous sommes là pour vous accompagner au quotidien.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Colonne gauche : FAQ */}
              <div className="space-y-5">
                <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base">Foire Aux Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {faqItems.map((item, i) => {
                        const isOpen = openFaq === i
                        return (
                          <div key={i} className="py-3 first:pt-0 last:pb-0">
                            <button
                              type="button"
                              onClick={() => setOpenFaq(isOpen ? null : i)}
                              className="flex w-full items-start justify-between gap-3 text-left"
                            >
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                {item.question}
                              </span>
                              {isOpen ? (
                                <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              ) : (
                                <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                              )}
                            </button>
                            {isOpen && (
                              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                {item.answer}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card></EffectCard>

                {/* Contact Direct */}
                <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Headphones className="h-4 w-4 text-slate-500" />
                      Contact Direct
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-5 pt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Nos conseillers sont disponibles du Lundi au Samedi, de 08h à 18h.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        onClick={() => window.open('https://wa.me/237000000000', '_blank')}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp Support
                      </Button>
                      <Button
                        type="button"
                        onClick={() => window.alert('Appel téléphonique (mock) — +237 000 000 000')}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Phone className="h-4 w-4" />
                        Appel Téléphonique
                      </Button>
                    </div>
                  </CardContent>
                </Card></EffectCard>

                {/* Espace sécurisé */}
                <EffectCard className="rounded-2xl"><Card className="rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardContent className="flex items-start gap-4 p-5">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Lock className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        Espace sécurisé
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Vos données et signalements sont traités en toute confidentialité par nos équipes
                        agréées.
                      </p>
                    </div>
                  </CardContent>
                </Card></EffectCard>
              </div>

              {/* Colonne droite : Formulaire de signalement */}
              <div>
                <EffectCard className="rounded-2xl h-full"><Card className="flex h-full flex-col rounded-2xl border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40">
                  <CardHeader className="p-5 pb-3">
                    <CardTitle className="text-base">Signaler un problème</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4 p-5 pt-0">
                    {/* Catégorie */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Catégorie
                      </label>
                      <select
                        value={categorie}
                        onChange={(e) => setCategorie(e.target.value as CategorieSignalement | '')}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50"
                      >
                        <option value="" disabled>
                          Sélectionnez une catégorie
                        </option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez votre problème en détail..."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-50 dark:placeholder:text-slate-500"
                      />
                    </div>

                    {/* Photo */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Photo (optionnel)
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => document.getElementById('photo-input')?.click()}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Camera className="h-4 w-4" />
                          Ajouter une photo
                        </Button>
                        <input
                          id="photo-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                        />
                        {photo && (
                          <span className="truncate text-sm text-slate-500 dark:text-slate-400">
                            {photo.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        {submitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
                      </Button>
                    </div>
                  </CardContent>
                </Card></EffectCard>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Jean Dupont – Conducteur Véritable
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500">CamerRideShare</div>
            </div>
          </div>
        </main>
      </div>
    </SpotlightSection>
  )
}
