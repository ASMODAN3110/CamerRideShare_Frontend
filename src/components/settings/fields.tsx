import type { ComponentProps, ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Champ de formulaire : libellé, contrôle et indication facultative. */
export function Field(props: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Label htmlFor={props.htmlFor}>{props.label}</Label>
      {props.children}
      {props.hint ? <p className="text-xs text-muted-foreground">{props.hint}</p> : null}
    </div>
  )
}

export function IconInput(props: { icon: ReactNode } & ComponentProps<typeof Input>) {
  const { icon, className, ...rest } = props
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">
        {icon}
      </span>
      <Input {...rest} className={`pl-9 ${className ?? ''}`} />
    </div>
  )
}
