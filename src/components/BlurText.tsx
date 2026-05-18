import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

type KeyframeValue = number | string
type PartialKeyframes = Record<string, KeyframeValue | undefined>
type NormalizedKeyframes = Record<string, KeyframeValue>

const buildKeyframes = (from: PartialKeyframes, steps: Array<PartialKeyframes>): Record<string, KeyframeValue[]> => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((s) => Object.keys(s))])
  const keyframes: Record<string, KeyframeValue[]> = {}

  keys.forEach((k) => {
    const fromValue = from[k]
    keyframes[k] = [
      fromValue ?? 0,
      ...steps.map((s) => (s[k] ?? fromValue ?? 0)),
    ]
  })

  return keyframes
}

type BlurTextProps = {
  text: string
  animateBy?: 'words' | 'letters' | string
  direction?: 'top' | 'bottom' | string
  delay?: number
  stepDuration?: number
  threshold?: number
  rootMargin?: string
  className?: string
  animationFrom?: PartialKeyframes
  animationTo?: Array<PartialKeyframes>
  easing?: (t: number) => number
  onAnimationComplete?: () => void
}

const BlurText = ({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t) => t,
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) => {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLParagraphElement | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(ref.current!)
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  const defaultFrom = useMemo(
    () =>
      direction === 'top'
        ? { filter: 'blur(10px)', opacity: 0, y: -50 }
        : { filter: 'blur(10px)', opacity: 0, y: 50 },
    [direction],
  )

  const defaultTo = useMemo(
    () => [
      { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction],
  )

  const fromSnapshot = animationFrom ?? defaultFrom
  const toSnapshots = animationTo ?? defaultTo

  const normalizedFrom: NormalizedKeyframes = useMemo(() => {
    const entries = Object.entries(fromSnapshot).map(([k, v]) => [k, v ?? 0] as const)
    return Object.fromEntries(entries) as NormalizedKeyframes
  }, [fromSnapshot])

  const normalizedTo: Array<NormalizedKeyframes> = useMemo(() => {
    return toSnapshots.map((snap) => {
      const entries = Object.entries(snap).map(([k, v]) => [k, v ?? 0] as const)
      return Object.fromEntries(entries) as NormalizedKeyframes
    })
  }, [toSnapshots])

  const stepCount = toSnapshots.length + 1
  const totalDuration = stepDuration * (stepCount - 1)
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)))

  return (
    <p
      ref={ref}
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap' }}
      aria-label={text}
    >
      {elements.map((segment, index) => {
        const animateKeyframes = buildKeyframes(normalizedFrom, normalizedTo)

        const spanTransition = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: easing,
        }

        return (
          <motion.span
            className="inline-block will-change-[transform,filter,opacity]"
            key={index}
            initial={normalizedFrom}
            animate={inView ? animateKeyframes : normalizedFrom}
            transition={spanTransition}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
          >
            {segment === ' ' ? '\u00A0' : segment}
            {animateBy === 'words' && index < elements.length - 1 ? '\u00A0' : null}
          </motion.span>
        )
      })}
    </p>
  )
}

export default BlurText

