/**
 * ActionPlan - Plano Tático de 7 Dias
 *
 * Lista de ações diárias para manter o participante engajado
 * após o evento. Cada dia tem micro-passos fáceis de executar.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Circle, Calendar, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { theme } from '../../styles/theme'

export interface ActionItem {
  id: string
  day: number
  title: string
  description: string
  completed: boolean
}

interface ActionPlanProps {
  /** Lista de ações */
  actions: ActionItem[]
  /** Dia atual (1-7) */
  currentDay: number
  /** Callback ao completar uma ação */
  onToggleAction: (id: string) => void
  /** Se está expandido */
  defaultExpanded?: boolean
}

export function ActionPlan({
  actions,
  currentDay,
  onToggleAction,
  defaultExpanded = true,
}: ActionPlanProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const completedCount = actions.filter(a => a.completed).length
  const totalActions = actions.length

  const getActionStatus = (day: number) => {
    if (day < currentDay) return 'past'
    if (day === currentDay) return 'current'
    return 'future'
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header (clickable) */}
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 179, 8, 0.08) 100%)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calendar size={20} color={theme.colors.gold.DEFAULT} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '12px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.gold.DEFAULT,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              ORDEM DO DIA
            </h3>
            <p
              style={{
                fontSize: '10px',
                color: theme.colors.text.secondary,
                margin: '2px 0 0 0',
              }}
            >
              Protocolo de Descompressão (7 Dias)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Progress indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(245, 158, 11, 0.2)',
              borderRadius: '6px',
            }}
          >
            <span
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '12px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.gold.DEFAULT,
              }}
            >
              {completedCount}/{totalActions}
            </span>
          </div>
          {expanded ? (
            <ChevronUp size={20} color={theme.colors.gold.DEFAULT} />
          ) : (
            <ChevronDown size={20} color={theme.colors.gold.DEFAULT} />
          )}
        </div>
      </motion.button>

      {/* Action List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '12px 16px 16px 16px' }}>
              {/* Day progress bar */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '16px',
                }}
              >
                {Array.from({ length: 7 }).map((_, i) => {
                  const dayNum = i + 1
                  const status = getActionStatus(dayNum)
                  const dayAction = actions.find(a => a.day === dayNum)
                  const isCompleted = dayAction?.completed

                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: '6px',
                        borderRadius: '3px',
                        background: isCompleted
                          ? theme.colors.accent.cyan.DEFAULT
                          : status === 'current'
                          ? `linear-gradient(90deg, ${theme.colors.gold.DEFAULT} 0%, ${theme.colors.gold.light} 100%)`
                          : 'rgba(100, 116, 139, 0.2)',
                        boxShadow: isCompleted
                          ? `0 0 8px ${theme.colors.accent.cyan.DEFAULT}`
                          : status === 'current'
                          ? `0 0 8px ${theme.colors.gold.DEFAULT}`
                          : 'none',
                      }}
                    />
                  )
                })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {actions.map((action, index) => {
                  const status = getActionStatus(action.day)
                  const isActive = status === 'current'
                  const isPast = status === 'past'
                  const isFuture = status === 'future'

                  return (
                    <motion.div
                      key={action.id}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => (isActive || isPast) && onToggleAction(action.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px',
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%)'
                          : 'rgba(15, 17, 21, 0.5)',
                        border: `1px solid ${
                          action.completed
                            ? 'rgba(34, 211, 238, 0.4)'
                            : isActive
                            ? 'rgba(245, 158, 11, 0.3)'
                            : 'rgba(100, 116, 139, 0.15)'
                        }`,
                        borderRadius: '10px',
                        cursor: isFuture ? 'default' : 'pointer',
                        opacity: isFuture ? 0.5 : 1,
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: action.completed
                            ? theme.colors.accent.cyan.DEFAULT
                            : 'rgba(100, 116, 139, 0.15)',
                          border: `2px solid ${
                            action.completed
                              ? theme.colors.accent.cyan.DEFAULT
                              : isActive
                              ? theme.colors.gold.DEFAULT
                              : 'rgba(100, 116, 139, 0.3)'
                          }`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: action.completed
                            ? `0 0 10px ${theme.colors.accent.cyan.DEFAULT}`
                            : 'none',
                        }}
                      >
                        {action.completed ? (
                          <Check size={14} color="#000000" strokeWidth={3} />
                        ) : isFuture ? (
                          <Clock size={12} color={theme.colors.text.muted} />
                        ) : (
                          <Circle size={10} color={isActive ? theme.colors.gold.DEFAULT : theme.colors.text.muted} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: theme.typography.fontWeight.bold,
                              color: isActive ? theme.colors.gold.DEFAULT : theme.colors.text.muted,
                              padding: '2px 6px',
                              background: isActive ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.15)',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            DIA {action.day}
                          </span>
                          {isActive && (
                            <span
                              style={{
                                fontSize: '8px',
                                color: theme.colors.gold.light,
                                textTransform: 'uppercase',
                              }}
                            >
                              HOJE
                            </span>
                          )}
                        </div>
                        <h4
                          style={{
                            fontSize: '12px',
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: action.completed
                              ? theme.colors.accent.cyan.DEFAULT
                              : theme.colors.text.primary,
                            margin: 0,
                            textDecoration: action.completed ? 'line-through' : 'none',
                            opacity: action.completed ? 0.8 : 1,
                          }}
                        >
                          {action.title}
                        </h4>
                        <p
                          style={{
                            fontSize: '10px',
                            color: theme.colors.text.secondary,
                            margin: '4px 0 0 0',
                            lineHeight: 1.4,
                          }}
                        >
                          {action.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
