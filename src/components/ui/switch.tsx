type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  className?: string
  'aria-label'?: string
}

export function Switch({ checked, onChange, id, className, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        checked
          ? 'bg-blue-600 dark:bg-blue-500'
          : 'bg-slate-200 dark:bg-slate-700',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}
