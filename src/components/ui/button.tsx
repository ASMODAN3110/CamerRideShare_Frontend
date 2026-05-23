import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import GlareHover from '../GlareHover'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  glare?: boolean
}

/**
 * Composant bouton minimal :
 * - wrapper autour de `<button>`
 * - permet de centraliser le style/behaviour plus tard
 * - la prop `glare` ajoute un effet de reflet au survol (GlareHover)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = 'button', glare = false, className, ...props },
  ref,
) {
  const btn = <button ref={ref} type={type} className={className} {...props} />

  if (glare) {
    return (
      <GlareHover
        width="fit-content"
        height="fit-content"
        background="transparent"
        borderColor="transparent"
        borderRadius="inherit"
        glareOpacity={0.3}
        glareSize={200}
        transitionDuration={500}
      >
        {btn}
      </GlareHover>
    )
  }

  return btn
})

export default Button

