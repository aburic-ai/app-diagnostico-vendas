/**
 * NotificationDrawer - Drawer com histórico de notificações
 *
 * Abre ao clicar no ícone de sino no header
 * Mostra notificações do dia com timestamp
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, AlertTriangle, Gift, Star, Check } from 'lucide-react'
import { theme } from '../../styles/theme'
import type { Notification, NotificationType } from './NotificationToast'

interface NotificationDrawerProps {
  isOpen: boolean
  notifications: Notification[]
  onClose: () => void
  onMarkAllRead: () => void
}

const typeConfig: Record<NotificationType, {
  icon: typeof Bell
  color: string
}> = {
  info: { icon: Bell, color: '#22D3EE' },
  alert: { icon: AlertTriangle, color: '#EF4444' },
  offer: { icon: Gift, color: '#F59E0B' },
  nps: { icon: Star, color: '#A855F7' },
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function NotificationDrawer({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
}: NotificationDrawerProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: theme.zIndex.modal - 1,
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '360px',
              background: 'linear-gradient(180deg, rgba(8, 10, 15, 0.99) 0%, rgba(5, 8, 12, 0.99) 100%)',
              borderLeft: '1px solid rgba(34, 211, 238, 0.2)',
              zIndex: theme.zIndex.modal,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: 'env(safe-area-inset-top, 20px) 20px 16px 20px',
                borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(34, 211, 238, 0.1)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell size={20} color={theme.colors.accent.cyan.DEFAULT} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    AVISOS
                  </h3>
                  {unreadCount > 0 && (
                    <p
                      style={{
                        fontSize: '11px',
                        color: theme.colors.accent.cyan.DEFAULT,
                        margin: '2px 0 0 0',
                      }}
                    >
                      {unreadCount} não lido{unreadCount > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  background: 'rgba(100, 116, 139, 0.1)',
                  border: '1px solid rgba(100, 116, 139, 0.2)',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} color={theme.colors.text.muted} />
              </button>
            </div>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                style={{
                  margin: '12px 20px',
                  padding: '10px 16px',
                  background: 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '8px',
                  color: theme.colors.accent.cyan.DEFAULT,
                  fontSize: '12px',
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Check size={14} />
                Marcar todos como lido
              </button>
            )}

            {/* Notifications List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px 20px 20px',
              }}
            >
              {notifications.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    textAlign: 'center',
                  }}
                >
                  <Bell size={40} color={theme.colors.text.muted} style={{ marginBottom: '12px' }} />
                  <p
                    style={{
                      fontSize: '14px',
                      color: theme.colors.text.muted,
                      margin: 0,
                    }}
                  >
                    Nenhum aviso ainda
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notifications.map((notification, index) => {
                    const config = typeConfig[notification.type]
                    const Icon = config.icon

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                          padding: '14px',
                          background: notification.read
                            ? 'rgba(15, 17, 21, 0.5)'
                            : 'rgba(15, 17, 21, 0.8)',
                          border: `1px solid ${notification.read ? 'rgba(100, 116, 139, 0.15)' : 'rgba(100, 116, 139, 0.3)'}`,
                          borderRadius: '12px',
                          opacity: notification.read ? 0.7 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: `${config.color}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={16} color={config.color} />
                          </div>

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
                                  fontSize: '12px',
                                  fontWeight: theme.typography.fontWeight.semibold,
                                  color: theme.colors.text.primary,
                                  margin: 0,
                                }}
                              >
                                {notification.title}
                              </h4>
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: theme.colors.text.muted,
                                  flexShrink: 0,
                                }}
                              >
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: '11px',
                                color: theme.colors.text.secondary,
                                margin: 0,
                                lineHeight: 1.4,
                              }}
                            >
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
