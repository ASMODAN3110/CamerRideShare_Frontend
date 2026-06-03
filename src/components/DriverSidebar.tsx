import type { LucideIcon } from 'lucide-react'
import { CreditCard, Headphones, LayoutDashboard, Settings, X } from 'lucide-react'
import { Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from './ui/button'
import { useMemo } from 'react'
import { useLogout } from '../auth/useLogout'

type DriverSidebarProps = {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function DriverSidebar(props: DriverSidebarProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const handleLogout = useLogout()

  const items = useMemo(() => {
    return [
      { label: 'Tableau de bord', icon: LayoutDashboard, href: '/driver-dashboard' },
      { label: 'Mes Paiements', icon: CreditCard, href: '/driver-payments' },
{ label: 'Support', icon: Headphones, href: '/driver-support' },
      { label: 'Paramètres', icon: Settings, href: '/driver-settings' },
    ] as Array<{ label: string; icon: LucideIcon; href: string }>
  }, [])

  return (
    <>
      {/* Hamburger (mobile) */}
      {!props.sidebarOpen ? (
        <Button
          type="button"
          onClick={() => props.setSidebarOpen(true)}
          className="fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      ) : null}

      {/* Mobile drawer */}
      {props.sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => props.setSidebarOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute left-0 top-0 h-full w-72 border-r border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <img
                    src="/CamerRideShare_Logo.png"
                    alt="CamerRideShare"
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">CamerRideShare</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Espace Conducteur</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={props.onToggleTheme}
                  className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white/70 text-slate-900 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-50"
                  aria-label="Toggle dark mode"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 0 1 11.2 3a6.9 6.9 0 1 0 9.8 9.8Z" />
                  </svg>
                </Button>

                <Button
                  type="button"
                  onClick={() => props.setSidebarOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  aria-label="Fermer le menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <nav className="mt-6 flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href
                return (
                  <Button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      navigate(item.href)
                      props.setSidebarOpen(false)
                    }}
                    className={[
                      'group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition',
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5 flex-none" />
                    <span className="truncate">{item.label}</span>
                  </Button>
                )
              })}
            </nav>

            <div className="mt-auto pt-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <span className="text-sm font-bold">JD</span>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">Jean Dupont</div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">Conducteur</div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 w-full text-left text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                >
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden shrink-0 lg:flex lg:w-72 lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-r lg:border-slate-200 lg:bg-white lg:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <img src="/CamerRideShare_Logo.png" alt="CamerRideShare" className="h-10 w-10 rounded-lg object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">CamerRideShare</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Espace Conducteur</div>
          </div>
          <Button
            type="button"
            onClick={props.onToggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 bg-white/70 text-slate-900 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-50"
            aria-label="Toggle dark mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 0 1 11.2 3a6.9 6.9 0 1 0 9.8 9.8Z" />
            </svg>
          </Button>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Button
                key={item.label}
                type="button"
                onClick={() => navigate(item.href)}
                className={[
                  'group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition',
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 flex-none" />
                <span className="truncate">{item.label}</span>
              </Button>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <span className="text-sm font-bold">JD</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">Jean Dupont</div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">Conducteur</div>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full text-left text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
