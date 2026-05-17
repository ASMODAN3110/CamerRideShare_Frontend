import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card(props: CardProps) {
  const { className, ...rest } = props
  return <div className={['rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/40', className].filter(Boolean).join(' ')} {...rest} />
}

export function CardHeader(props: CardProps) {
  const { className, ...rest } = props
  return <div className={['p-5 pb-2', className].filter(Boolean).join(' ')} {...rest} />
}

export function CardContent(props: CardProps) {
  const { className, ...rest } = props
  return <div className={['p-5 pt-3', className].filter(Boolean).join(' ')} {...rest} />
}

export function CardTitle(props: CardProps) {
  const { className, ...rest } = props
  return <div className={['text-sm font-semibold text-slate-900 dark:text-slate-50', className].filter(Boolean).join(' ')} {...rest} />
}

