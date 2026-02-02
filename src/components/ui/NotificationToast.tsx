/**
 * NotificationToast - Toast de notificação que desliza do topo
 *
 * Tipos: info (cyan), alert (vermelho), offer (dourado), nps (roxo)
 * Auto-fecha após 5 segundos ou fecha manual
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, AlertTriangle, Gift, Star, ExternalLink } from 'lucide-react'
import { theme } from '../../styles/theme'

export type ToastNotificationType = 'info' | 'alert' | 'offer' | 'nps'

export interface ToastNotification {
  id: string
  type: ToastNotificationType
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
  timestamp: Date
  read?: boolean
}

interface NotificationToastProps {
  notification: ToastNotification | null
  onClose: () => void
  onAction?: () => void
}

const typeConfig: Record<ToastNotificationType, {
  icon: typeof Bell
  color: string
  bg: string
  border: string
  glow: string
}> = {
  info: {
    icon: Bell,
    color: '#22D3EE',
    bg: 'rgba(34, 211, 238, 0.15)',
    border: 'rgba(34, 211, 238, 0.4)',
    glow: '0 0 30px rgba(34, 211, 238, 0.3)',
  },
  alert: {
    icon: AlertTriangle,
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    glow: '0 0 30px rgba(239, 68, 68, 0.3)',
  },
  offer: {
    icon: Gift,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    glow: '0 0 30px rgba(245, 158, 11, 0.3)',
  },
  nps: {
    icon: Star,
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.4)',
    glow: '0 0 30px rgba(168, 85, 247, 0.3)',
  },
}

export function NotificationToast({ notification, onClose, onAction }: NotificationToastProps) {
  if (!notification) return null

  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: 'env(safe-area-inset-top, 16px)',
            left: '16px',
            right: '16px',
            zIndex: theme.zIndex.toast,
            background: 'linear-gradient(135deg, rgba(10, 12, 18, 0.98) 0%, rgba(15, 20, 30, 0.95) 100%)',
            border: `1px solid ${config.border}`,
            borderRadius: '16px',
            padding: '16px',
            boxShadow: config.glow,
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: config.bg,
                border: `1px solid ${config.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={20} color={config.color} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '4px',
                }}
              >
                <h4
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.bold,
                    color: config.color,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  {notification.title}
                </h4>
                <button
                  onClick={onClose}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} color={theme.colors.text.muted} />
                </button>
              </div>

              <p
                style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {notification.message}
              </p>

              {/* Action Button */}
              {notification.actionLabel && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onAction}
                  style={{
                    marginTop: '12px',
                    padding: '10px 16px',
                    background: config.bg,
                    border: `1px solid ${config.border}`,
                    borderRadius: '8px',
                    color: config.color,
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {notification.actionLabel}
                  <ExternalLink size={14} />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
