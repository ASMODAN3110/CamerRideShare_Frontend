import { useEffect, useState } from 'react'
import InscriptionPage from './pages/InscriptionPage'
import ConnexionPage from './pages/ConnexionPage'

function IconSun(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={props.className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"
      />
    </svg>
  )
}

function IconMoon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={props.className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.8A8.5 8.5 0 0 1 11.2 3a6.9 6.9 0 1 0 9.8 9.8Z"
      />
    </svg>
  )
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [mode, setMode] = useState<'inscription' | 'connexion'>('inscription')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <>
      <div className="relative min-h-screen">
        <button
          type="button"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          className="absolute right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white/70 text-slate-900 backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-50 hover:border-slate-300"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? (
            <IconSun className="h-5 w-5" />
          ) : (
            <IconMoon className="h-5 w-5" />
          )}
        </button>

        {mode === 'inscription' ? (
          <InscriptionPage onSwitchMode={setMode} />
        ) : (
          <ConnexionPage onSwitchMode={setMode} />
        )}
      </div>
    </>
  )
}

export default App
