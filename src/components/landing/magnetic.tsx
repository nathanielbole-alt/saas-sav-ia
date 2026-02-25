'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * Magnetic wrapper — element pulls toward cursor on hover.
 * taste-skill Section 4: uses useMotionValue (NEVER useState).
 */
export function Magnetic({
  children,
  className,
  intensity = 0.15,
}: {
  children: ReactNode
  className?: string
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })

  function handleMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left - rect.width / 2) * intensity)
    y.set((e.clientY - rect.top - rect.height / 2) * intensity)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Spotlight card — radial glow follows cursor.
 * Pure DOM manipulation (zero re-renders).
 */
export function SpotlightCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  function handleLeave(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.removeProperty('--spot-x')
    e.currentTarget.style.removeProperty('--spot-y')
  }

  return (
    <div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative overflow-hidden ${className}`}
      style={{
        background:
          'radial-gradient(600px circle at var(--spot-x, -999px) var(--spot-y, -999px), rgba(232,133,108,0.06), transparent 40%)',
      }}
    >
      {children}
    </div>
  )
}
