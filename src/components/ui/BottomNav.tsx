/**
 * BottomNav - Navegação inferior com sequência visual clara
 *
 * Mostra visualmente que é uma progressão: 1 → 2 → 3
 * Números/cadeados ficam acima dos ícones para clareza.
 */

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Lock, ChevronRight } from 'lucide-react'
import { theme } from '../../styles/theme'

interface NavItem {
  id: string
  label: string
  icon: ReactNode
  badge?: string
  status?: string
}

interface BottomNavProps {
  items: NavItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function BottomNav({ items, activeId, onSelect }: BottomNavProps) {
  const activeIndex = items.findIndex(item => item.id === activeId)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, rgba(5, 5, 10, 0.98) 0%, rgba(0, 0, 5, 0.99) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(34, 211, 238, 0.15)',
        padding: '10px 8px env(safe-area-inset-bottom, 24px) 8px',
        zIndex: 50,
      }}
    >
      {/* Nav Buttons with integrated step numbers */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          gap: '6px',
        }}
      >
        {items.map((item, index) => {
          const isActive = item.id === activeId
          const isLocked = index > activeIndex
          const isCompleted = index < activeIndex

          return (
            <div
              key={item.id}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* Connector arrows between items */}
              {index < items.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '-3px',
                    zIndex: 2,
                  }}
                >
                  <ChevronRight
                    size={14}
                    color={isCompleted ? theme.colors.accent.cyan.DEFAULT : 'rgba(100, 116, 139, 0.4)'}
                    style={{
                      filter: isCompleted ? `drop-shadow(0 0 4px ${theme.colors.accent.cyan.DEFAULT})` : 'none',
                    }}
                  />
                </div>
              )}

              {/* Step Number Badge - Above the button */}
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  marginBottom: '6px',
                  background: isCompleted
                    ? theme.colors.accent.cyan.DEFAULT
                    : isActive
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)'
                    : 'rgba(30, 35, 45, 0.8)',
                  border: isCompleted
                    ? `2px solid ${theme.colors.accent.cyan.DEFAULT}`
                    : isActive
                    ? '2px solid rgba(168, 85, 247, 0.6)'
                    : '2px solid rgba(100, 116, 139, 0.3)',
                  color: isCompleted || isActive ? '#fff' : theme.colors.text.muted,
                  boxShadow: isActive
                    ? '0 0 12px rgba(168, 85, 247, 0.6)'
                    : isCompleted
                    ? `0 0 8px ${theme.colors.accent.cyan.DEFAULT}`
                    : 'none',
                }}
              >
                {isLocked ? <Lock size={10} /> : index + 1}
              </div>

              {/* Nav Button */}
              <motion.button
                onClick={() => !isLocked && onSelect(item.id)}
                whileTap={!isLocked ? { scale: 0.97 } : {}}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(88, 28, 135, 0.1) 100%)'
                    : isLocked
                    ? 'rgba(10, 12, 18, 0.3)'
                    : 'rgba(10, 12, 18, 0.6)',
                  border: isActive
                    ? '1px solid rgba(168, 85, 247, 0.4)'
                    : isLocked
                    ? '1px solid rgba(100, 116, 139, 0.1)'
                    : '1px solid rgba(34, 211, 238, 0.15)',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  padding: '10px 6px 8px 6px',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                {/* Icon Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: isActive
                      ? 'rgba(168, 85, 247, 0.1)'
                      : isCompleted
                      ? 'rgba(34, 211, 238, 0.1)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(168, 85, 247, 0.3)'
                      : isCompleted
                      ? '1px solid rgba(34, 211, 238, 0.3)'
                      : '1px solid rgba(100, 116, 139, 0.2)',
                    color: isActive
                      ? theme.colors.accent.purple.light
                      : isCompleted
                      ? theme.colors.accent.cyan.DEFAULT
                      : theme.colors.text.muted,
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {item.icon}

                  {/* Badge */}
                  {item.badge && !isLocked && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '6px',
                        fontWeight: 'bold',
                        color: '#FF4444',
                        background: 'rgba(255, 68, 68, 0.15)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        border: '1px solid rgba(255, 68, 68, 0.4)',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.badge}
                    </div>
                  )}
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: '8px',
                    fontWeight: theme.typography.fontWeight.bold,
                    color: isActive
                      ? theme.colors.accent.purple.light
                      : isCompleted
                      ? theme.colors.accent.cyan.DEFAULT
                      : theme.colors.text.muted,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    textShadow: isActive ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {item.label}
                </span>

                {/* Status */}
                {item.status && (
                  <span
                    style={{
                      fontSize: '7px',
                      fontWeight: theme.typography.fontWeight.medium,
                      color: item.status.toLowerCase().includes('liberado')
                        ? theme.colors.accent.cyan.DEFAULT
                        : theme.colors.text.muted,
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                      marginTop: '-2px',
                    }}
                  >
                    {item.status}
                  </span>
                )}
              </motion.button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
