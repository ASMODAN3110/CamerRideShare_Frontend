import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import ConnexionPage from './pages/ConnexionPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import InscriptionPage from './pages/InscriptionPage.tsx'
import ParcPage from './pages/ParcPage.tsx'
import PaiementsPage from './pages/PaiementsPage.tsx'
import InvestisseursPage from './pages/InvestisseursPage.tsx'
import ParametresPage from './pages/ParametresPage.tsx'

function App() {
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

  return (
    <BrowserRouter>
      <div className="relative min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/inscription" replace />} />
          <Route path="/inscription" element={<InscriptionPage />} />
          <Route path="/connexion" element={<ConnexionPage />} />
          <Route
            path="/dashboard"
            element={<DashboardPage theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />}
          />
          <Route
            path="/parc"
            element={<ParcPage theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />}
          />
          <Route
            path="/paiements"
            element={<PaiementsPage theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />}
          />
          <Route
            path="/investisseurs"
            element={<InvestisseursPage theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />}
          />
          <Route
            path="/parametres"
            element={<ParametresPage theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />}
          />
          <Route path="*" element={<Navigate to="/connexion" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
