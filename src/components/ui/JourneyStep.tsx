/**
 * JourneyStep - Componente de passo da jornada de gamification
 *
 * Usado para mostrar etapas do usuario com status visual
 * (completed, current, purchase, locked)
 */

import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, ShoppingCart, ChevronRight } from 'lucide-react'
import { theme } from '../../styles/theme'

export type JourneyStepStatus = 'completed' | 'current' | 'locked' | 'purchase'

export interface JourneyStepProps {
  /** Icone do passo */
  icon: ReactNode
  /** Titulo principal */
  title: string
  /** Subtitulo/descricao */
  subtitle: string
  /** Status do passo */
  status: JourneyStepStatus
  /** Progresso (0-100) - apenas para status 'current' */
  progress?: number
  /** XP ganho ao completar */
  xp?: number
  /** Se e item de compra */
  isPurchase?: boolean
  /** Callback ao clicar */
  onClick?: () => void
  /** Indice para animacao */
  index?: number
  /** Se e o ultimo item (nao mostra linha conectora) */
  isLast?: boolean
  /** Tooltip de orientação (opcional) */
  tooltip?: string
}

export function JourneyStep({
  icon,
  title,
  subtitle,
  status,
  progress,
  xp,
  isPurchase,
  onClick,
  index = 0,
  isLast = false,
  tooltip,
}: JourneyStepProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const statusConfig = theme.gamification.stepStatus[status]

  const getStatusIcon = () => {
    if (status === 'completed') return <Check size={28} strokeWidth={3} />
    if (status === 'locked') return <Lock size={24} />
    if (status === 'purchase') return <ShoppingCart size={24} />
    return icon
  }

  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.1 }}
      style={{ position: 'relative' }}
    >
      {/* Linha conectora vertical */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            left: '27px',
            top: '56px',
            width: '2px',
            height: 'calc(100% - 40px)',
            background:
              status === 'completed'
                ? `linear-gradient(180deg, ${theme.colors.accent.cyan.DEFAULT} 0%, ${theme.colors.accent.cyan.dark} 100%)`
                : 'linear-gradient(180deg, rgba(100, 116, 139, 0.3) 0%, rgba(100, 116, 139, 0.1) 100%)',
          }}
        />
      )}

      {/* Card do Step */}
      <motion.div
        whileTap={status === 'current' || status === 'purchase' ? { scale: 0.98 } : {}}
        onClick={onClick}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px',
          marginBottom: '12px',
          background:
            status === 'locked'
              ? statusConfig.bgGradient
              : 'linear-gradient(135deg, rgba(15, 17, 21, 0.9) 0%, rgba(20, 25, 35, 0.8) 100%)',
          border: `1px solid ${statusConfig.border}`,
          borderRadius: '12px',
          boxShadow: statusConfig.glow,
          cursor: status === 'current' || status === 'purchase' ? 'pointer' : 'default',
          opacity: status === 'locked' ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Tooltip */}
        {tooltip && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 12px',
              background: 'rgba(15, 17, 21, 0.98)',
              border: `1px solid ${statusConfig.color}`,
              borderRadius: '8px',
              boxShadow: `0 4px 12px ${statusConfig.color}33`,
              zIndex: 10,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                color: statusConfig.color,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              {tooltip}
            </span>
            {/* Seta do tooltip */}
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                background: 'rgba(15, 17, 21, 0.98)',
                borderRight: `1px solid ${statusConfig.color}`,
                borderBottom: `1px solid ${statusConfig.color}`,
              }}
            />
          </motion.div>
        )}
        {/* Badge "COMPLETO" para status completed */}
        {status === 'completed' && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '4px 8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 1,
            }}
          >
            <Check size={10} color="#10B981" strokeWidth={3} />
            <span
              style={{
                fontSize: '9px',
                color: '#10B981',
                fontWeight: theme.typography.fontWeight.bold,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Completo
            </span>
          </div>
        )}
        {/* Icon Circle */}
        <div
          style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: statusConfig.bgGradient,
            border: `2px solid ${statusConfig.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: statusConfig.color,
            boxShadow: status !== 'locked' ? `inset 0 0 20px ${statusConfig.color}33` : 'none',
            flexShrink: 0,
          }}
        >
          {getStatusIcon()}

          {/* Pulse animation for current */}
          {status === 'current' && (
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                border: `2px solid ${statusConfig.color}`,
              }}
            />
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
              marginBottom: '4px',
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>
          <p
            style={{
              fontSize: '11px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>

          {/* Progress bar for current status */}
          {status === 'current' && progress !== undefined && (
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(100, 116, 139, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${theme.colors.accent.purple.DEFAULT} 0%, ${theme.colors.accent.purple.light} 100%)`,
                    borderRadius: '2px',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '9px',
                  color: theme.colors.accent.purple.light,
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                {progress}% completo
              </span>
            </div>
          )}
        </div>

        {/* XP Badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          {/* XP Value - sempre mostrar se tiver xp */}
          {xp && (
            <>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: status === 'completed'
                    ? theme.colors.gold.DEFAULT
                    : isPurchase
                    ? theme.colors.gold.light
                    : theme.colors.text.muted,
                }}
              >
                +{xp}
              </span>
              <span
                style={{
                  fontSize: '8px',
                  color: isPurchase ? theme.colors.gold.light : theme.colors.text.muted,
                  textTransform: 'uppercase',
                }}
              >
                XP
              </span>
            </>
          )}
          {/* Indicador de Compra */}
          {isPurchase && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                marginTop: '4px',
                padding: '2px 6px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '4px',
              }}
            >
              <ShoppingCart size={10} color={theme.colors.gold.DEFAULT} />
              <span
                style={{
                  fontSize: '7px',
                  color: theme.colors.gold.DEFAULT,
                  textTransform: 'uppercase',
                  fontWeight: theme.typography.fontWeight.bold,
                  letterSpacing: '0.03em',
                }}
              >
                Compra
              </span>
            </div>
          )}
        </div>

        {/* Arrow for current */}
        {status === 'current' && (
          <ChevronRight
            size={20}
            color={theme.colors.accent.purple.light}
            style={{ flexShrink: 0 }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
