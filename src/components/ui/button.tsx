import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

/**
 * Composant bouton minimal :
 * - wrapper autour de `<button>`
 * - permet de centraliser le style/behaviour plus tard
 * - aujourd’hui on conserve strictement les `className` déjà présents
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = 'button', className, ...props },
  ref,
) {
  return <button ref={ref} type={type} className={className} {...props} />
})

export default Button

