import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bike, CheckCheck, CreditCard, UserPlus, type LucideIcon } from 'lucide-react'
import BellToggle from '@/components/ui/bell-toggle'
import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationsService'
import type { AppNotification, NotificationType } from '../types/api'

const POLL_MS = 30_000

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  INCIDENT: AlertTriangle,
  PAYMENT: CreditCard,
  MOTO: Bike,
  ACCOUNT: UserPlus,
}

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Hier' : `Il y a ${days} j`
}

/** Cloche de notifications commune aux espaces admin, chauffeur et investisseur. */
export default function NotificationBell() {
  const navigate = useNavigate()
  const anchorRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const data = await listNotifications()
      setItems(data.items)
      setUnread(data.unreadCount)
    } catch {
      /* la cloche reste silencieuse si l'API est indisponible */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = () => {
      listNotifications()
        .then((data) => {
          if (cancelled) return
          setItems(data.items)
          setUnread(data.unreadCount)
        })
        .catch(() => {
          /* la cloche reste silencieuse si l'API est indisponible */
        })
    }
    load()
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) void refresh()
  }

  const handleOpenItem = async (n: AppNotification) => {
    if (!n.read) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
      setUnread((c) => Math.max(c - 1, 0))
      void markNotificationRead(n.id).catch(() => void refresh())
    }
    if (n.link) {
      setOpen(false)
      navigate(n.link)
    }
  }

  const handleReadAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    setUnread(0)
    try {
      await markAllNotificationsRead()
    } catch {
      void refresh()
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="flex items-center">
          {/* Toujours « pressée » : le composant affiche ainsi le badge de messages non lus. */}
          <BellToggle
            offLabel=""
            onLabel=""
            label="Notifications"
            size="sm"
            className="bell-toggle--icon"
            radius={8}
            color="var(--foreground)"
            background="var(--muted)"
            onColor="var(--foreground)"
            onBackground="var(--muted)"
            badgeColor="var(--warning)"
            badgeTextColor="var(--foreground)"
            pressed
            count={unread}
            onChange={() => handleOpenChange(!open)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="end"
        className="w-[22rem] max-w-[calc(100vw-2rem)] p-0"
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" disabled={unread === 0} onClick={() => void handleReadAll()}>
            <CheckCheck />
            Tout lire
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune notification pour le moment.</p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {items.map((n) => {
              const Icon = TYPE_ICON[n.type]
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void handleOpenItem(n)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                      !n.read && 'bg-primary/5',
                    )}
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn('truncate text-sm', n.read ? 'font-medium' : 'font-semibold')}>{n.title}</span>
                        {!n.read ? <span className="size-2 shrink-0 rounded-full bg-warning" aria-label="Non lue" /> : null}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
