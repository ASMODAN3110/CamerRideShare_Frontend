import { useEffect, useRef } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export type AnimatedContentProps = {
  children: ReactNode
  /**
   * Container de scroll ScrollTrigger : sélecteur CSS ou HTMLElement.
   * Si absent => auto: `#snap-main-container` puis fenêtre.
   */
  container?: string | HTMLElement | null
  distance?: number
  direction?: 'vertical' | 'horizontal'
  reverse?: boolean
  duration?: number
  ease?: string
  initialOpacity?: number
  animateOpacity?: boolean
  scale?: number
  threshold?: number
  delay?: number
  disappearAfter?: number
  disappearDuration?: number
  disappearEase?: string
  onComplete?: () => void
  onDisappearanceComplete?: () => void
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

export default function AnimatedContent({
  children,
  container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power3.in',
  onComplete,
  onDisappearanceComplete,
  className = '',
  ...props
}: AnimatedContentProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    let scrollerTarget: HTMLElement | Element | string | null = (container ?? document.getElementById('snap-main-container')) ?? null

    if (typeof scrollerTarget === 'string') {
      scrollerTarget = document.querySelector(scrollerTarget)
    }

    const scrollRoot = scrollerTarget instanceof Element ? scrollerTarget : undefined

    const axis = direction === 'horizontal' ? 'x' : 'y'
    const offset = reverse ? -distance : distance
    const startPct = (1 - threshold) * 100

    gsap.set(el, {
      [axis]: offset,
      scale,
      opacity: animateOpacity ? initialOpacity : 1,
      visibility: 'visible',
    })

    const tl = gsap.timeline({
      paused: true,
      delay,
      onComplete: () => {
        onComplete?.()
        if (disappearAfter > 0) {
          gsap.to(el, {
            [axis]: reverse ? distance : -distance,
            scale: 0.8,
            opacity: animateOpacity ? initialOpacity : 0,
            delay: disappearAfter,
            duration: disappearDuration,
            ease: disappearEase,
            onComplete: () => onDisappearanceComplete?.(),
          })
        }
      },
    })

    tl.to(el, {
      [axis]: 0,
      scale: 1,
      opacity: 1,
      duration,
      ease,
    })

    const st = ScrollTrigger.create({
      trigger: el,
      start: `top ${startPct}%`,
      once: true,
      onEnter: () => tl.play(),
      ...(scrollRoot ? { scroller: scrollRoot } : {}),
    })

    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      const vpHeight = typeof window !== 'undefined' ? window.innerHeight : 0
      const bounds = el.getBoundingClientRect()
      if (tl.paused() && vpHeight > 0 && bounds.top < vpHeight && bounds.bottom > 0) {
        tl.play()
      }
    })

    return () => {
      st.kill()
      tl.kill()
    }
    // Déclenché au montage selon ces paramètres
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    container,
    delay,
    direction,
    distance,
    disappearAfter,
    disappearDuration,
    disappearEase,
    duration,
    ease,
    initialOpacity,
    animateOpacity,
    reverse,
    scale,
    threshold,
  ])

  return (
    <div ref={ref} className={className} style={{ visibility: 'hidden' }} {...props}>
      {children}
    </div>
  )
}

