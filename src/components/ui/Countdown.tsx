/**
 * Countdown - Timer com estilo cyberpunk e tech corners
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { theme } from '../../styles/theme'

// Confetti component
function Confetti() {
  const confettiCount = 50
  const confettiColors = ['#22D3EE', '#A855F7', '#F59E0B', '#EF4444', '#10B981']

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', pointerEvents: 'none', zIndex: 1000 }}>
      {Array.from({ length: confettiCount }).map((_, i) => {
        const randomX = Math.random() * 100
        const randomDelay = Math.random() * 2
        const randomDuration = 3 + Math.random() * 2
        const randomRotation = Math.random() * 360
        const randomColor = confettiColors[Math.floor(Math.random() * confettiColors.length)]

        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${randomX}vw`, rotate: 0, opacity: 1 }}
            animate={{
              y: '110vh',
              rotate: randomRotation + 720,
              opacity: 0,
            }}
            transition={{
              duration: randomDuration,
              delay: randomDelay,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              backgroundColor: randomColor,
              borderRadius: '2px',
            }}
          />
        )
      })}
    </div>
  )
}

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

  // Check if countdown reached zero
  const isZero = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(10, 12, 18, 0.95) 0%, rgba(5, 8, 15, 0.98) 100%)',
        border: `1px solid ${isZero ? 'rgba(34, 211, 238, 0.6)' : 'rgba(34, 211, 238, 0.25)'}`,
        borderRadius: '4px',
        padding: '16px 24px',
        textAlign: 'center',
        boxShadow: isZero
          ? '0 0 60px rgba(34, 211, 238, 0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
          : '0 0 40px rgba(34, 211, 238, 0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {/* Confetti quando zerar */}
      {isZero && <Confetti />}

      {/* Tech Corners */}
      <TechCorner position="top-left" />
      <TechCorner position="top-right" />
      <TechCorner position="bottom-left" />
      <TechCorner position="bottom-right" />

      {/* Label ou Mensagem */}
      {isZero ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            minHeight: '72px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              color: '#FF4444',
              letterSpacing: '0.15em',
              marginBottom: '8px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
            }}
          >
            🔴 EVENTO NO AR
          </div>
          <div
            style={{
              fontSize: '13px',
              color: theme.colors.text.secondary,
              lineHeight: '1.4',
            }}
          >
            Clique na aba <strong style={{ color: theme.colors.accent.purple.light }}>AO VIVO</strong> abaixo
          </div>
        </motion.div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
