/**
 * PresenceConfirmCard - Card de confirmação de presença no bloco
 *
 * Aparece quando um novo bloco começa
 * Timer regressivo de 10 minutos para confirmar presença
 * Garante que usuário estava presente para ganhar XP
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Clock, CheckCircle, XCircle } from 'lucide-react'
import { theme } from '../../styles/theme'

interface PresenceConfirmCardProps {
  /** Número do bloco atual */
  blockNumber: number
  /** Nome do bloco */
  blockName: string
  /** XP a ser ganho */
  xpReward: number
  /** Tempo em segundos para confirmar (default: 600 = 10 min) */
  timeLimit?: number
  /** Callback quando confirma presença */
  onConfirm: () => void
  /** Callback quando tempo expira */
  onExpire: () => void
  /** Se já confirmou */
  isConfirmed?: boolean
  /** Se expirou */
  isExpired?: boolean
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function PresenceConfirmCard({
  blockNumber,
  blockName,
  xpReward,
  timeLimit = 600,
  onConfirm,
  onExpire,
  isConfirmed = false,
  isExpired = false,
}: PresenceConfirmCardProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [confirmed, setConfirmed] = useState(isConfirmed)
  const [expired, setExpired] = useState(isExpired)

  useEffect(() => {
    if (confirmed || expired) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setExpired(true)
          onExpire()
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [confirmed, expired, onExpire])

  const handleConfirm = () => {
    if (!confirmed && !expired) {
      setConfirmed(true)
      onConfirm()
    }
  }

  // Cores baseadas no estado
  const getColors = () => {
    if (confirmed) {
      return {
        bg: 'rgba(34, 211, 238, 0.1)',
        border: 'rgba(34, 211, 238, 0.4)',
        color: theme.colors.accent.cyan.DEFAULT,
        glow: '0 0 30px rgba(34, 211, 238, 0.3)',
      }
    }
    if (expired) {
      return {
        bg: 'rgba(100, 116, 139, 0.1)',
        border: 'rgba(100, 116, 139, 0.3)',
        color: theme.colors.text.muted,
        glow: 'none',
      }
    }
    // Urgência baseada no tempo restante
    const urgencyPercent = timeLeft / timeLimit
    if (urgencyPercent < 0.2) {
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.5)',
        color: '#EF4444',
        glow: '0 0 30px rgba(239, 68, 68, 0.3)',
      }
    }
    if (urgencyPercent < 0.5) {
      return {
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.4)',
        color: '#F59E0B',
        glow: '0 0 30px rgba(245, 158, 11, 0.3)',
      }
    }
    return {
      bg: 'rgba(168, 85, 247, 0.15)',
      border: 'rgba(168, 85, 247, 0.4)',
      color: theme.colors.accent.purple.light,
      glow: '0 0 30px rgba(168, 85, 247, 0.3)',
    }
  }

  const colors = getColors()

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(10, 12, 18, 0.95) 0%, rgba(15, 20, 30, 0.9) 100%)',
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '16px',
        boxShadow: colors.glow,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.div
            animate={!confirmed && !expired ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} color={colors.color} />
          </motion.div>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: colors.color,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                BLOCO {blockNumber}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  background: colors.bg,
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: colors.color,
                }}
              >
                +{xpReward} XP
              </span>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
                margin: '2px 0 0 0',
              }}
            >
              {blockName}
            </p>
          </div>
        </div>

        {/* Timer */}
        {!confirmed && !expired && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
            }}
          >
            <Clock size={14} color={colors.color} />
            <span
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '14px',
                fontWeight: theme.typography.fontWeight.bold,
                color: colors.color,
              }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {confirmed ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(34, 211, 238, 0.1)',
              borderRadius: '10px',
            }}
          >
            <CheckCircle size={24} color={theme.colors.accent.cyan.DEFAULT} />
            <div>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.accent.cyan.DEFAULT,
                  margin: 0,
                }}
              >
                Presença confirmada!
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: theme.colors.text.secondary,
                  margin: '2px 0 0 0',
                }}
              >
                +{xpReward} XP adicionados ao seu perfil
              </p>
            </div>
          </motion.div>
        ) : expired ? (
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(100, 116, 139, 0.1)',
              borderRadius: '10px',
            }}
          >
            <XCircle size={24} color={theme.colors.text.muted} />
            <div>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.muted,
                  margin: 0,
                }}
              >
                Tempo expirado
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: theme.colors.text.muted,
                  margin: '2px 0 0 0',
                }}
              >
                Você perdeu os {xpReward} XP deste bloco
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            style={{
              width: '100%',
              padding: '14px',
              background: `linear-gradient(135deg, ${colors.color}20 0%, ${colors.color}10 100%)`,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              color: colors.color,
              fontSize: '13px',
              fontWeight: theme.typography.fontWeight.bold,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <CheckCircle size={18} />
            Confirmar Presença
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
