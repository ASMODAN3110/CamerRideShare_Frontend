import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EffectCard, SpotlightSection } from '../components/MagicBento'
import { Button } from '../components/ui/button'

function IconPhone(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 16.92v.1a2.01 2.01 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.09 4.18 2.01 2.01 0 0 1 4.11 2h.1a2 2 0 0 1 2 1.72c.13.92.38 1.82.74 2.68a2 2 0 0 1-.45 2.11L6.1 9.9a16 16 0 0 0 8 8l1.39-1.39a2 2 0 0 1 2.11-.45c.86.36 1.76.61 2.68.74a2 2 0 0 1 1.72 2Z"
      />
    </svg>
  )
}

function IconLock(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <rect x="4.5" y="11" width="15" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
    </svg>
  )
}

export default function ConnexionPage() {
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  const canSubmit = useMemo(() => {
    return telephone.trim().length > 0 && motDePasse.trim().length > 0
  }, [telephone, motDePasse])

  return (
    <SpotlightSection className="flex w-full items-center justify-center bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex flex-col md:flex-row">
          {/* Colonne gauche : formulaire */}
          <EffectCard className="w-full md:w-1/2"><div className="w-full p-8 md:p-12">
            <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Connexion
            </h2>
            <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
              Entrez vos informations pour continuer.
            </p>

            <form
              className="mt-8 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!canSubmit) return
                // TODO: appeler votre API de connexion
                console.log({ telephone, motDePasse })
                navigate('/dashboard')
              }}
            >
              <label className="flex flex-col gap-2">
                <span className="sr-only">Numéro de téléphone</span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                  <IconPhone className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                  <input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="Numéro de téléphone"
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-slate-50 dark:placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="sr-only">Mot de passe</span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                  <IconLock className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                  <input
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="Mot de passe"
                    type="password"
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-slate-50 dark:placeholder:text-slate-400"
                  />
                </div>
              </label>

              <Button
                type="submit"
                disabled={!canSubmit}
                className="mt-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-600 disabled:text-white disabled:opacity-100"
              >
                Se connecter
              </Button>

              <div className="mt-6 text-center text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-300">
                PAS ENCORE INSCRIT ?
              </div>
              <Button
                type="button"
                onClick={() => navigate('/inscription')}
                className="mt-3 text-center text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
              >
                S&apos;inscrire
              </Button>
            </form>
          </div></EffectCard>

          {/* Colonne droite : CTA */}
          <div className="relative w-full overflow-hidden bg-blue-700 p-8 text-white shadow-xl shadow-blue-900/25 rounded-2xl md:w-1/2 md:p-12 md:rounded-tl-[4.5rem] md:rounded-bl-[4.5rem] md:rounded-tr-2xl md:rounded-br-2xl dark:bg-blue-900">
            <div className="pointer-events-none absolute -top-20 -right-24 z-0 h-80 w-80 rounded-full bg-blue-900/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 z-0 h-80 w-80 rounded-full bg-blue-900/15 blur-2xl" />

            <div className="relative z-10 flex h-full flex-col justify-center">
              <h3 className="text-center text-3xl font-bold">Bon retour !</h3>
              <p className="mt-4 text-center text-sm leading-relaxed opacity-90">
                Connectez-vous pour continuer à partager vos trajets.
              </p>

              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  onClick={() => navigate('/inscription')}
                  className="rounded-full border-2 border-white bg-transparent px-10 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Créer un compte
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SpotlightSection>
  )
}

