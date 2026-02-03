/**
 * ConfirmationModal - Modal de confirmação customizado
 *
 * Substitui window.confirm() com design consistente
 */

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { theme } from '../../styles/theme'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  details?: string[]
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  details = [],
}: ConfirmationModalProps) {
  const typeColors = {
    danger: {
      icon: '#EF4444',
      border: 'rgba(239, 68, 68, 0.5)',
      bg: 'rgba(239, 68, 68, 0.1)',
      button: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
    },
    warning: {
      icon: '#F59E0B',
      border: 'rgba(245, 158, 11, 0.5)',
      bg: 'rgba(245, 158, 11, 0.1)',
      button: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.9) 100%)',
    },
    info: {
      icon: '#3B82F6',
      border: 'rgba(59, 130, 246, 0.5)',
      bg: 'rgba(59, 130, 246, 0.1)',
      button: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
    },
  }

  const colors = typeColors[type]

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

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
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: theme.colors.background.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '24px 24px 20px 24px',
                  borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={24} color={colors.icon} />
                </div>

                {/* Title + Close */}
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                      marginBottom: '8px',
                      lineHeight: 1.3,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: theme.colors.text.secondary,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {message}
                  </p>
                </div>

                {/* Close button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(100, 116, 139, 0.1)',
                    border: '1px solid rgba(100, 116, 139, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <X size={16} color={theme.colors.text.muted} />
                </motion.button>
              </div>

              {/* Details (if any) */}
              {details.length > 0 && (
                <div
                  style={{
                    padding: '20px 24px',
                    background: 'rgba(5, 8, 12, 0.5)',
                    borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '13px',
                      color: theme.colors.text.secondary,
                      marginBottom: '12px',
                      fontWeight: theme.typography.fontWeight.semibold,
                    }}
                  >
                    Isso irá:
                  </p>
                  <ul
                    style={{
                      margin: 0,
                      padding: 0,
                      listStyle: 'none',
                    }}
                  >
                    {details.map((detail, index) => (
                      <li
                        key={index}
                        style={{
                          fontSize: '13px',
                          color: theme.colors.text.secondary,
                          marginBottom: index < details.length - 1 ? '8px' : 0,
                          paddingLeft: '20px',
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: '0',
                            color: colors.icon,
                          }}
                        >
                          •
                        </span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                {/* Cancel Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(100, 116, 139, 0.15)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '10px',
                    color: theme.colors.text.secondary,
                    fontSize: '14px',
                    fontWeight: theme.typography.fontWeight.semibold,
                    cursor: 'pointer',
                  }}
                >
                  {cancelText}
                </motion.button>

                {/* Confirm Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  style={{
                    padding: '12px 24px',
                    background: colors.button,
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: theme.typography.fontWeight.bold,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {confirmText}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
