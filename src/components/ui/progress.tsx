import type { HTMLAttributes } from 'react'

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number
}

export function Progress(props: ProgressProps) {
  const { value, className, ...rest } = props
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      className={['h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/60', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <div className="h-full bg-blue-600" style={{ width: `${clamped}%` }} />
    </div>
  )
}

