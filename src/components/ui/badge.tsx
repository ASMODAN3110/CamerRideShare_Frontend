import type { HTMLAttributes } from 'react'

type BadgeVariant = 'default' | 'secondary' | 'blue' | 'red' | 'orange' | 'green'

type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-900 dark:bg-slate-800/60 dark:text-slate-50',
  secondary: 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
  red: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200',
  orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
}

export function Badge(props: BadgeProps) {
  const { className, variant = 'default', ...rest } = props
  return (
    <div
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  )
}

