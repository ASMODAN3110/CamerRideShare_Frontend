import { useEffect, useState, type ReactNode } from 'react'
import { Bike, CreditCard, Moon, Sun, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AuthShellProps = {
  title: string
  subtitle: string
  panelTitle: string
  panelText: string
  panelAction?: ReactNode
  children: ReactNode
}

const FEATURES = [
  { Icon: Bike, title: 'Suivez votre flotte', text: 'État du parc, chauffeurs et incidents' },
  { Icon: CreditCard, title: 'Encaissez et reversez', text: 'Paiements hebdomadaires et reversements' },
  { Icon: TrendingUp, title: 'Suivez vos investissements', text: 'Parts, revenus et progression vers 160 %' },
]

/** Cadre commun des pages de connexion et d'inscription : formulaire à gauche, panneau de marque à droite. */
export default function AuthShell(props: AuthShellProps) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') return saved === 'dark'
    } catch {
      /* stockage indisponible */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])

  return (
    <div className="grid min-h-screen w-full bg-background lg:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="absolute right-4 top-4 z-20 bg-background/80 backdrop-blur lg:bg-background"
        onClick={() => setDark((d) => !d)}
        aria-label="Changer de thème"
      >
        {dark ? <Sun /> : <Moon />}
      </Button>

      <div className="order-2 flex items-center justify-center px-6 py-10 sm:px-10 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-white">
              <img src="/CamerRideShare_Logo.png" alt="" className="size-full max-w-none scale-[1.8] object-contain" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">CamerRideShare</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight">{props.title}</h1>
          <p className="mt-3 text-base text-muted-foreground">{props.subtitle}</p>
          <div className="mt-10">{props.children}</div>
        </div>
      </div>

      <div className="relative order-1 flex flex-col justify-center overflow-hidden bg-[#11785a] px-6 py-10 text-white sm:px-10 lg:order-2 lg:py-16">
        <svg
          aria-hidden="true"
          viewBox="0 0 600 800"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <path
            d="M-40 700 C 120 560, 80 420, 260 360 S 520 260, 660 80"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeDasharray="2 14"
            strokeLinecap="round"
            opacity="0.35"
          />
          <circle cx="260" cy="360" r="7" fill="#ffffff" opacity="0.6" />
          <circle cx="260" cy="360" r="18" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
          <circle cx="500" cy="720" r="190" fill="#fff" opacity="0.06" />
          <circle cx="80" cy="90" r="130" fill="#fff" opacity="0.06" />
        </svg>

        <div className="relative mx-auto w-full max-w-lg space-y-6 lg:space-y-10">
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">
              Motos-taxis · Cameroun
            </span>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight lg:text-5xl">{props.panelTitle}</h2>
            <p className="text-lg leading-relaxed">{props.panelText}</p>
          </div>

          <ul className="hidden gap-3 lg:grid">
            {FEATURES.map(({ Icon, title, text }) => (
              <li key={title} className="flex items-center gap-5 rounded-xl bg-white/12 px-5 py-4.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white text-[#11785a]">
                  <Icon className="size-6" />
                </span>
                <span>
                  <span className="block text-base font-bold">{title}</span>
                  <span className="block text-sm leading-snug">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          {props.panelAction ? <div className="flex">{props.panelAction}</div> : null}
        </div>
      </div>
    </div>
  )
}
