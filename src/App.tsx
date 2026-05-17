import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
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
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-white text-gray-900 dark:bg-slate-900 dark:text-slate-50 p-6">
        <button
          type="button"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          className="absolute right-4 top-4 rounded border border-current/20 px-3 py-2 hover:border-current/40"
        >
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>

        <div className="mb-4 flex gap-6">
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>

        <h1 className="text-3xl font-bold underline">Vite + React</h1>

        <div className="card mt-6 w-full max-w-5xl">
          <button onClick={() => setCount((count) => count + 1)} className="hover:border-current">
            count is {count}
          </button>
          <p className="mt-4">
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>

        <p className="read-the-docs mt-6">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </>
  )
}

export default App
