/**
 * SystemAlert - Barra de Alerta Global do Sistema
 *
 * Componente de alto contraste para comunicações críticas:
 * - Ofertas disponíveis
 * - NPS / Feedback
 * - Avisos do sistema
 */

import { motion } from 'framer-motion'
import { AlertTriangle, Zap, MessageSquare, Bell, X, ChevronRight } from 'lucide-react'
import { theme } from '../../styles/theme'

export type AlertType = 'offer' | 'nps' | 'warning' | 'info'

interface SystemAlertProps {
  /** Tipo do alerta */
  type: AlertType
  /** Título do alerta */
  title: string
  /** Mensagem/descrição */
  message?: string
  /** Texto do botão de ação */
  actionLabel?: string
  /** Callback do botão */
  onAction?: () => void
  /** Callback ao fechar */
  onClose?: () => void
  /** Se pode ser fechado */
  dismissible?: boolean
}

const alertConfig = {
  offer: {
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(234, 179, 8, 0.9) 100%)',
    border: 'rgba(251, 191, 36, 0.8)',
    textColor: '#000000',
    icon: Zap,
    glow: '0 0 30px rgba(245, 158, 11, 0.5)',
  },
  nps: {
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.95) 0%, rgba(124, 58, 237, 0.9) 100%)',
    border: 'rgba(168, 85, 247, 0.8)',
    textColor: '#FFFFFF',
    icon: MessageSquare,
    glow: '0 0 30px rgba(168, 85, 247, 0.5)',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.9) 100%)',
    border: 'rgba(239, 68, 68, 0.8)',
    textColor: '#FFFFFF',
    icon: AlertTriangle,
    glow: '0 0 30px rgba(239, 68, 68, 0.5)',
  },
  info: {
    bg: 'linear-gradient(135deg, rgba(34, 211, 238, 0.95) 0%, rgba(6, 182, 212, 0.9) 100%)',
    border: 'rgba(34, 211, 238, 0.8)',
    textColor: '#000000',
    icon: Bell,
    glow: '0 0 30px rgba(34, 211, 238, 0.5)',
  },
}

export function SystemAlert({
  type,
  title,
  message,
  actionLabel,
  onAction,
  onClose,
  dismissible = true,
}: SystemAlertProps) {
  const config = alertConfig[type]
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ y: -20, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -20, opacity: 0, scale: 0.95 }}
      style={{
        background: config.bg,
        border: `2px solid ${config.border}`,
        borderRadius: '12px',
        padding: '14px 16px',
        position: 'relative',
        boxShadow: config.glow,
        overflow: 'hidden',
      }}
    >
      {/* Animated shine effect */}
      <motion.div
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Icon */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComponent size={22} color={config.textColor} />
        </motion.div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '11px',
              fontWeight: theme.typography.fontWeight.bold,
              color: config.textColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {title}
          </h4>
          {message && (
            <p
              style={{
                fontSize: '11px',
                color: config.textColor,
                opacity: 0.9,
                margin: '4px 0 0 0',
                lineHeight: 1.4,
              }}
            >
              {message}
            </p>
          )}
        </div>

        {/* Action Button */}
        {actionLabel && onAction && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onAction}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 14px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: theme.typography.fontWeight.bold,
                color: config.textColor,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              {actionLabel}
            </span>
            <ChevronRight size={14} color={config.textColor} />
          </motion.button>
        )}

        {/* Close Button */}
        {dismissible && onClose && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={14} color={config.textColor} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
