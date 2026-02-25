'use client'

import { memo } from 'react'

const spheres = [
  {
    size: 180,
    top: '8%',
    left: '85%',
    animation: 'animate-float-1',
    delay: '0s',
    blur: 'blur-[1px]',
    opacity: 0.35,
    gradient: 'radial-gradient(circle at 30% 30%, rgba(232,133,108,0.4), rgba(232,133,108,0.08) 50%, rgba(11,11,15,0.6) 100%)',
    shadow: 'inset 0 -20px 40px rgba(0,0,0,0.5), inset 0 10px 30px rgba(232,133,108,0.15)',
  },
  {
    size: 120,
    top: '25%',
    left: '5%',
    animation: 'animate-float-2',
    delay: '-3s',
    blur: 'blur-[2px]',
    opacity: 0.25,
    gradient: 'radial-gradient(circle at 35% 25%, rgba(232,133,108,0.3), rgba(200,160,140,0.05) 55%, rgba(11,11,15,0.7) 100%)',
    shadow: 'inset 0 -15px 30px rgba(0,0,0,0.6), inset 0 8px 20px rgba(232,133,108,0.1)',
  },
  {
    size: 90,
    top: '60%',
    left: '92%',
    animation: 'animate-float-3',
    delay: '-5s',
    blur: 'blur-[0.5px]',
    opacity: 0.3,
    gradient: 'radial-gradient(circle at 28% 28%, rgba(255,255,255,0.15), rgba(232,133,108,0.1) 45%, rgba(11,11,15,0.8) 100%)',
    shadow: 'inset 0 -12px 25px rgba(0,0,0,0.5), inset 0 6px 15px rgba(255,255,255,0.08)',
  },
  {
    size: 60,
    top: '45%',
    left: '12%',
    animation: 'animate-float-4',
    delay: '-7s',
    blur: '',
    opacity: 0.2,
    gradient: 'radial-gradient(circle at 32% 30%, rgba(232,133,108,0.35), rgba(11,11,15,0.4) 60%, rgba(11,11,15,0.9) 100%)',
    shadow: 'inset 0 -8px 16px rgba(0,0,0,0.6), inset 0 4px 12px rgba(232,133,108,0.12)',
  },
  {
    size: 45,
    top: '75%',
    left: '50%',
    animation: 'animate-float-1',
    delay: '-2s',
    blur: 'blur-[3px]',
    opacity: 0.18,
    gradient: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.12), rgba(232,133,108,0.08) 50%, rgba(11,11,15,0.9) 100%)',
    shadow: 'inset 0 -6px 12px rgba(0,0,0,0.5), inset 0 3px 8px rgba(255,255,255,0.06)',
  },
  {
    size: 140,
    top: '85%',
    left: '75%',
    animation: 'animate-float-2',
    delay: '-4s',
    blur: 'blur-[1.5px]',
    opacity: 0.22,
    gradient: 'radial-gradient(circle at 35% 30%, rgba(232,133,108,0.25), rgba(180,140,120,0.06) 50%, rgba(11,11,15,0.7) 100%)',
    shadow: 'inset 0 -18px 35px rgba(0,0,0,0.5), inset 0 9px 25px rgba(232,133,108,0.1)',
  },
  // NOUVELLES BULLES :
  {
    size: 200,
    top: '15%',
    left: '15%',
    animation: 'animate-float-3',
    delay: '-1s',
    blur: 'blur-[4px]',
    opacity: 0.15,
    gradient: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1), rgba(232,133,108,0.05) 50%, rgba(11,11,15,0.8) 100%)',
    shadow: 'inset 0 -25px 50px rgba(0,0,0,0.6), inset 0 12px 30px rgba(232,133,108,0.08)',
  },
  {
    size: 70,
    top: '80%',
    left: '20%',
    animation: 'animate-float-1',
    delay: '-6s',
    blur: 'blur-[0.5px]',
    opacity: 0.28,
    gradient: 'radial-gradient(circle at 30% 30%, rgba(232,133,108,0.4), rgba(11,11,15,0.5) 60%, rgba(11,11,15,0.9) 100%)',
    shadow: 'inset 0 -10px 20px rgba(0,0,0,0.6), inset 0 5px 15px rgba(232,133,108,0.15)',
  },
  {
    size: 160,
    top: '35%',
    left: '80%',
    animation: 'animate-float-4',
    delay: '-2s',
    blur: 'blur-[2.5px]',
    opacity: 0.2,
    gradient: 'radial-gradient(circle at 35% 25%, rgba(232,133,108,0.3), rgba(200,160,140,0.05) 55%, rgba(11,11,15,0.7) 100%)',
    shadow: 'inset 0 -15px 30px rgba(0,0,0,0.6), inset 0 8px 20px rgba(232,133,108,0.1)',
  },
  {
    size: 110,
    top: '65%',
    left: '40%',
    animation: 'animate-float-2',
    delay: '-8s',
    blur: 'blur-[1px]',
    opacity: 0.25,
    gradient: 'radial-gradient(circle at 28% 28%, rgba(255,255,255,0.15), rgba(232,133,108,0.1) 45%, rgba(11,11,15,0.8) 100%)',
    shadow: 'inset 0 -12px 25px rgba(0,0,0,0.5), inset 0 6px 15px rgba(255,255,255,0.08)',
  },
]

function FloatingSpheresInner() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {spheres.map((sphere, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${sphere.animation} ${sphere.blur}`}
          style={{
            width: sphere.size,
            height: sphere.size,
            top: sphere.top,
            left: sphere.left,
            opacity: sphere.opacity,
            background: sphere.gradient,
            boxShadow: sphere.shadow,
            animationDelay: sphere.delay,
            willChange: 'transform',
          }}
        >
          {/* Glass highlight arc */}
          <div
            className="absolute rounded-full"
            style={{
              top: '12%',
              left: '18%',
              width: '40%',
              height: '25%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
              borderRadius: '50%',
              transform: 'rotate(-20deg)',
            }}
          />
        </div>
      ))}
    </div>
  )
}

export const FloatingSpheres = memo(FloatingSpheresInner)
