import type { ImgHTMLAttributes, ReactNode } from 'react'

type AvatarProps = {
  className?: string
  children?: ReactNode
}

export function Avatar(props: AvatarProps) {
  return (
    <div
      className={['relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full', props.className]
        .filter(Boolean)
        .join(' ')}
    >
      {props.children}
    </div>
  )
}

type AvatarImageProps = ImgHTMLAttributes<HTMLImageElement>

export function AvatarImage(props: AvatarImageProps) {
  return <img {...props} />
}

type AvatarFallbackProps = {
  children: ReactNode
}

export function AvatarFallback(props: AvatarFallbackProps) {
  return <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">{props.children}</div>
}

