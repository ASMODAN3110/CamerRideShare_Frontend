import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlarmClock, Banknote, Download, BarChart3, CalendarDays, ClipboardCheck, CreditCard, Headphones, LayoutDashboard, LogOut, MapPin, Moon, Settings, Store, Sun, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import NotificationBell from '@/components/NotificationBell'
import InstallAppButton from '@/components/pwa/InstallAppButton'
import { useAuth } from '@/auth/useAuth'
import { useLogout } from '@/auth/useLogout'
import { initials } from '@/lib/format'

export type Portal = 'admin' | 'driver' | 'investor'

const PORTALS = {
  admin: {
    label: 'PORTAIL ADMIN',
    role: 'Administrateur',
    home: '/dashboard',
    nav: [
      { label: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Parc', icon: MapPin, href: '/parc' },
      { label: 'Paiements', icon: CreditCard, href: '/paiements' },
      { label: 'Investisseurs', icon: Users, href: '/investisseurs' },
      { label: 'Demandes de parts', icon: ClipboardCheck, href: '/demandes-parts' },
      { label: 'Reversements', icon: Banknote, href: '/reversements' },
      { label: 'Calendrier', icon: CalendarDays, href: '/calendrier' },
      { label: 'Retards', icon: AlarmClock, href: '/retards' },
      { label: 'Paramètres', icon: Settings, href: '/parametres' },
    ],
  },
  driver: {
    label: 'ESPACE CONDUCTEUR',
    role: 'Conducteur',
    home: '/driver-dashboard',
    nav: [
      { label: 'Tableau de bord', icon: LayoutDashboard, href: '/driver-dashboard' },
      { label: 'Mes paiements', icon: CreditCard, href: '/driver-payments' },
      { label: 'Support', icon: Headphones, href: '/driver-support' },
      { label: 'Paramètres', icon: Settings, href: '/driver-settings' },
    ],
  },
  investor: {
    label: 'ESPACE INVESTISSEUR',
    role: 'Investisseur',
    home: '/investor-dashboard',
    nav: [
      { label: 'Tableau de bord', icon: LayoutDashboard, href: '/investor-dashboard' },
      { label: 'Mon parc', icon: MapPin, href: '/investor-fleet' },
      { label: 'Marché des parts', icon: Store, href: '/investor-market' },
      { label: 'Historique des revenus', icon: Users, href: '/investor-revenues' },
      { label: 'Rapports', icon: BarChart3, href: '/investor-reports' },
      { label: 'Paramètres', icon: Settings, href: '/investor-settings' },
    ],
  },
} as const

/** Thème clair/sombre persistant, partagé avec App via la classe `dark` sur <html>. */
function useLocalTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      /* stockage indisponible */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))] as const
}

function PortalSidebar({ portal }: { portal: Portal }) {
  const cfg = PORTALS[portal]
  const { pathname } = useLocation()
  const { user } = useAuth()
  const handleLogout = useLogout()
  const name = user?.fullName ?? cfg.role

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="CamerRideShare" className="group-data-[collapsible=icon]:justify-center">
              <Link to="/dashboard">
                <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-white group-data-[collapsible=icon]:size-8">
                  <img
                    src="/CamerRideShare_Logo.png"
                    alt="CamerRideShare"
                    className="size-full max-w-none scale-[1.8] object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-extrabold text-sidebar-foreground">CamerRideShare</span>
                  <span className="truncate text-[11px] font-semibold tracking-wider text-sidebar-primary">
                    {cfg.label}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {cfg.nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="font-semibold group-data-[collapsible=icon]:justify-center"
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={name} className="cursor-default hover:bg-transparent group-data-[collapsible=icon]:justify-center">
              <Avatar className="size-8">
                {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={name} /> : null}
                <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold text-sidebar-foreground">{name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">{cfg.role}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <InstallAppButton>
            {({ onClick }) => (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onClick}
                  tooltip="Installer l'application"
                  data-testid="install-app"
                  className="font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
                >
                  <Download />
                  <span className="group-data-[collapsible=icon]:hidden">Installer l&apos;application</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </InstallAppButton>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Déconnexion"
              className="font-semibold text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
            >
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

type AdminLayoutProps = {
  title: string
  description?: string
  portal?: Portal
  /** Masque le titre H1 quand la page affiche déjà le sien. */
  hideHeading?: boolean
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
  actions?: ReactNode
  children: ReactNode
}

/** Gabarit commun des pages admin : sidebar shadcn + en-tête + zone de contenu. */
export default function AdminLayout(props: AdminLayoutProps) {
  const portal = props.portal ?? 'admin'
  const [localTheme, toggleLocal] = useLocalTheme()
  const theme = props.theme ?? localTheme
  const onToggleTheme = props.onToggleTheme ?? toggleLocal
  return (
    <SidebarProvider>
      <PortalSidebar portal={portal} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/90 px-3 backdrop-blur sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to={PORTALS[portal].home}>{PORTALS[portal].role}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">{props.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto shrink-0">
            <NotificationBell />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onToggleTheme}
            aria-label="Changer de thème"
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-4 md:p-6">
          {props.hideHeading ? null : (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{props.title}</h1>
              {props.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
              ) : null}
            </div>
            {props.actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{props.actions}</div> : null}
          </div>
          )}
          {props.children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
