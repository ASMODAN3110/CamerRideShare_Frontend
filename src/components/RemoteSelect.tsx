import { useEffect, useState, type ReactNode } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface RemoteOption<T = unknown> {
  id: number
  label: string
  disabled?: boolean
  /** Objet d'origine, renvoyé tel quel à `onChange`. */
  data?: T
}

/**
 * Liste déroulante dont les options viennent du serveur : chaque frappe (différée) relance
 * `fetchOptions(search)`, rien n'est filtré côté navigateur.
 */
export default function RemoteSelect<T = unknown>(props: {
  id: string
  /** Identifiant sélectionné ; 0 = aucune sélection. */
  value: number
  /** Libellé de la sélection (connu du parent, car elle peut ne pas figurer dans les résultats). */
  selectedLabel?: string
  onChange: (option: RemoteOption<T> | null) => void
  /** Doit être stable (useCallback) : un changement relance le chargement. */
  fetchOptions: (search: string) => Promise<RemoteOption<T>[]>
  placeholder: string
  /** Si renseigné, propose une entrée pour revenir à « aucune sélection ». */
  noneLabel?: string
  /** Identifiants à ne pas proposer. */
  excludeIds?: number[]
  'aria-label'?: string
}) {
  const { fetchOptions } = props
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<RemoteOption<T>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = window.setTimeout(
      () => {
        setLoading(true)
        fetchOptions(search.trim())
          .then((res) => {
            if (cancelled) return
            setOptions(res)
            setError(null)
          })
          .catch((err: unknown) => {
            if (!cancelled) setError(err instanceof Error ? err.message : 'Chargement impossible.')
          })
          .finally(() => {
            if (!cancelled) setLoading(false)
          })
      },
      search ? 300 : 0,
    )
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, search, fetchOptions])

  const excluded = new Set(props.excludeIds ?? [])
  const visible = options.filter((o) => !excluded.has(o.id) || o.id === props.value)

  const pick = (option: RemoteOption<T> | null) => {
    props.onChange(option)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={props.id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={props['aria-label']}
          className="w-full min-w-0 justify-between font-normal"
        >
          <span className={cn('truncate', !props.value && 'text-muted-foreground')}>
            {props.value ? props.selectedLabel || `#${props.value}` : props.noneLabel || props.placeholder}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-56 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="h-9 pl-8"
            autoFocus
          />
        </div>
        <div className="mt-2 max-h-56 overflow-y-auto" role="listbox">
          {props.noneLabel ? (
            <OptionRow selected={!props.value} onClick={() => pick(null)}>
              {props.noneLabel}
            </OptionRow>
          ) : null}
          {error ? <p className="px-2 py-3 text-sm text-destructive">{error}</p> : null}
          {!error && loading && visible.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Chargement…</p>
          ) : null}
          {!error && !loading && visible.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Aucun résultat.</p>
          ) : null}
          {visible.map((o) => (
            <OptionRow key={o.id} selected={o.id === props.value} disabled={o.disabled} onClick={() => pick(o)}>
              {o.label}
            </OptionRow>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function OptionRow(props: { selected: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={props.selected}
      disabled={props.disabled}
      onClick={props.onClick}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50"
    >
      <Check className={cn('size-4 shrink-0', props.selected ? 'opacity-100' : 'opacity-0')} />
      <span className="min-w-0 flex-1 break-words">{props.children}</span>
    </button>
  )
}
