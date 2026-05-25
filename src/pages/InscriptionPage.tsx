import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedContent from '../components/AnimatedContent'
import { Button } from '../components/ui/button'

function IconUser(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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

function IconGoogle(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.2c0-.7-.1-1.4-.3-2H12v4.1h5.1c-.2 1.1-.8 2-1.7 2.6v2.7h2.8c1.6-1.5 2.5-3.7 2.5-6.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c2.3 0 4.2-.8 5.6-2.2l-2.8-2.7c-.7.5-1.7.8-2.8.8-2.1 0-3.9-1.4-4.6-3.3H4.5v2.8C5.9 20.4 8.7 22 12 22Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.4 14.6c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V8H4.5C3.8 9.3 3.4 10.6 3.4 12.7S3.8 16 4.5 17.2l2.9-2.6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.3c1.3 0 2.4.4 3.3 1.2l2.5-2.5C16.2 3.7 14.3 3 12 3 8.7 3 5.9 4.6 4.5 7l2.9 2.3c.7-1.9 2.5-3 4.6-3Z" />
    </svg>
  )
}

function IconFacebook(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v9h3v-9h3l1-3h-4V9c0-.6.4-1 1-1Z" />
    </svg>
  )
}

function IconApple(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={props.className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 13.1c0 3-2.1 5.6-4.8 5.6-1 0-1.8-.3-2.7-.9-.9.6-1.7.9-2.7.9C3.6 18.7 1.5 16.1 1.5 13.1c0-2.8 1.8-4.4 3.5-4.4 1.1 0 2.1.6 2.7 1.2.6-.6 1.6-1.2 2.7-1.2 1.7 0 3.1 1.1 3.6 2.2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.8 2.5c.1 1.4-.5 2.6-1.4 3.5-1 .9-2.2 1.3-3.4 1.2-.1-1.3.5-2.5 1.4-3.4.9-.9 2.1-1.5 3.4-1.3Z" />
    </svg>
  )
}

export default function InscriptionPage() {
  const navigate = useNavigate()
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')

  const canSubmit = useMemo(() => {
    return nom.trim().length > 0 && telephone.trim().length > 0 && motDePasse.trim().length > 0
  }, [nom, telephone, motDePasse])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-slate-900">

        <div className="flex flex-col md:flex-row">
          {/* Colonne gauche : formulaire */}
          <AnimatedContent className="w-full md:w-1/2"><div className="w-full p-8 md:p-12">
            <img src="/logo.png" alt="CamerRideShare" className="mx-auto mb-6 h-48 w-auto" />
            <h2 className="text-center text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Inscription
            </h2>
            <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
              Rejoignez la communauté CamerRideShare dès aujourd’hui !
            </p>

            <form
              className="mt-8 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!canSubmit) return
                // TODO: appeler votre API d'inscription
                console.log({ nom, telephone, motDePasse })
              }}
            >
              <label className="flex flex-col gap-2">
                <span className="sr-only">Nom complet</span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                  <IconUser className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                  <input
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-slate-50 dark:placeholder:text-slate-400"
                  />
                </div>
              </label>

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
                className="mt-2 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-700 disabled:text-white disabled:opacity-100 dark:bg-blue-900 dark:hover:bg-blue-800 dark:disabled:bg-blue-900"
              >
                S&apos;inscrire
              </Button>

              <div className="mt-1 text-center text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-300">
                OU CONTINUER AVEC
              </div>

              <div className="mt-3 flex items-center justify-center gap-4">
                <Button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <IconGoogle className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <IconFacebook className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <IconApple className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div></AnimatedContent>

          {/* Colonne droite : CTA */}
          <div className="relative w-full overflow-hidden bg-blue-700 p-8 text-white shadow-xl shadow-blue-900/25 rounded-2xl md:w-1/2 md:p-12 md:rounded-tl-[4.5rem] md:rounded-bl-[4.5rem] md:rounded-tr-2xl md:rounded-br-2xl dark:bg-blue-900">
            {/* Décor : cercles translucides à l’intérieur du panneau bleu */}
            <div className="pointer-events-none absolute -top-20 -right-24 z-0 h-80 w-80 rounded-full bg-blue-900/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 z-0 h-80 w-80 rounded-full bg-blue-900/15 blur-2xl" />

            <div className="relative z-10 flex h-full flex-col justify-center">
              <h3 className="text-center text-3xl font-bold">Bon retour !</h3>
              <p className="mt-4 text-center text-sm leading-relaxed opacity-90">
                Vous avez déjà un compte ? Connectez-vous pour continuer à partager vos trajets.
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  className="rounded-full border-2 border-white bg-transparent px-10 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => navigate('/connexion')}
                >
                  Connexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

