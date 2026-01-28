/**
 * Countdown - Timer com estilo cyberpunk e tech corners
 */

import { useState, useEffect } from 'react'
import { theme } from '../../styles/theme'

interface CountdownProps {
  /** Data/hora alvo */
  targetDate: Date
  /** Label acima do timer */
  label?: string
}

// Componente para os cantos decorativos tech
function TechCorner({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const isTop = position.includes('top')
  const isLeft = position.includes('left')

  return (
    <div
      style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: '-1px',
        [isLeft ? 'left' : 'right']: '-1px',
        width: '20px',
        height: '20px',
        pointerEvents: 'none',
      }}
    >
      {/* Linha horizontal */}
      <div
        style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: '20px',
          height: '2px',
          background: theme.colors.accent.cyan.DEFAULT,
          boxShadow: `0 0 10px ${theme.colors.accent.cyan.DEFAULT}`,
        }}
      />
      {/* Linha vertical */}
      <div
        style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: '2px',
          height: '20px',
          background: theme.colors.accent.cyan.DEFAULT,
          boxShadow: `0 0 10px ${theme.colors.accent.cyan.DEFAULT}`,
        }}
      />
    </div>
  )
}

export function Countdown({ targetDate, label = 'INÍCIO DA OPERAÇÃO' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  const formatNumber = (num: number) => num.toString().padStart(2, '0')

  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(10, 12, 18, 0.95) 0%, rgba(5, 8, 15, 0.98) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.25)',
        borderRadius: '4px',
        padding: '16px 24px',
        textAlign: 'center',
        boxShadow: '0 0 40px rgba(34, 211, 238, 0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Tech Corners */}
      <TechCorner position="top-left" />
      <TechCorner position="top-right" />
      <TechCorner position="bottom-left" />
      <TechCorner position="bottom-right" />

      {/* Label */}
      <div
        style={{
          fontSize: '10px',
          color: theme.colors.text.secondary,
          letterSpacing: '0.15em',
          marginBottom: '10px',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>

      {/* Timer */}
      <div
        style={{
          fontFamily: theme.typography.fontFamily.bankGothic,
          fontSize: timeLeft.days > 0 ? '42px' : '52px',
          fontWeight: theme.typography.fontWeight.normal,
          color: theme.colors.accent.cyan.DEFAULT,
          letterSpacing: '0.05em',
          textShadow: `
            0 0 20px rgba(34, 211, 238, 0.7),
            0 0 40px rgba(34, 211, 238, 0.5),
            0 0 60px rgba(34, 211, 238, 0.3)
          `,
          lineHeight: 1,
        }}
      >
        {timeLeft.days > 0 && `${formatNumber(timeLeft.days)}d `}
        {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
      </div>
    </div>
  )
}
