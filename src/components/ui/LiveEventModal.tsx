/**
 * LiveEventModal - Modal com confetti quando usuário carrega app durante evento ao vivo
 *
 * Aparece apenas 1x por sessão quando evento está live
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio } from 'lucide-react'
import { theme } from '../../styles/theme'

// Confetti component (mesmo do Countdown)
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

interface LiveEventModalProps {
  isLive: boolean
}

export function LiveEventModal({ isLive }: LiveEventModalProps) {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isLive) return

    // Verifica se já mostrou o modal nesta sessão
    const hasSeenModal = sessionStorage.getItem('live_event_modal_shown')

    if (!hasSeenModal) {
      // Pequeno delay para dar tempo do app carregar
      const timer = setTimeout(() => {
        setShowModal(true)
        sessionStorage.setItem('live_event_modal_shown', 'true')
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isLive])

  const handleClose = () => {
    setShowModal(false)
  }

  return (
    <AnimatePresence>
      {showModal && (
        <>
          {/* Confetti */}
          <Confetti />

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: 'linear-gradient(180deg, rgba(10, 12, 18, 0.98) 0%, rgba(5, 8, 15, 0.99) 100%)',
                border: '2px solid rgba(34, 211, 238, 0.4)',
                borderRadius: '16px',
                padding: '32px 24px',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 0 60px rgba(34, 211, 238, 0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.2, type: 'spring', duration: 0.8 }}
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)',
                  border: '2px solid rgba(168, 85, 247, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)',
                }}
              >
                <Radio
                  size={40}
                  color={theme.colors.accent.purple.light}
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.8))',
                  }}
                />
              </motion.div>

              {/* Status Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#FF4444',
                  letterSpacing: '0.15em',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                🔴 EVENTO AO VIVO
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  fontSize: '24px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.accent.cyan.DEFAULT,
                  marginBottom: '12px',
                  textShadow: `0 0 20px rgba(34, 211, 238, 0.5)`,
                }}
              >
                Evento em Andamento!
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  lineHeight: 1.6,
                  marginBottom: '24px',
                }}
              >
                Bem-vindo de volta! O evento está acontecendo agora.
                <br />
                Acesse a aba <strong style={{ color: theme.colors.accent.purple.light }}>AO VIVO</strong> para participar.
              </motion.p>

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.8) 0%, rgba(124, 58, 237, 0.8) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.6)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: theme.typography.fontWeight.bold,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
                  transition: 'all 0.2s ease',
                }}
              >
                Entendido
              </motion.button>

              {/* Tech corners */}
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((position) => {
                const isTop = position.includes('top')
                const isLeft = position.includes('left')

                return (
                  <div
                    key={position}
                    style={{
                      position: 'absolute',
                      [isTop ? 'top' : 'bottom']: '-1px',
                      [isLeft ? 'left' : 'right']: '-1px',
                      width: '20px',
                      height: '20px',
                      pointerEvents: 'none',
                    }}
                  >
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
              })}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
