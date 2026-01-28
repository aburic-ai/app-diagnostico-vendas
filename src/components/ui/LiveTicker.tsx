/**
 * LiveTicker - Agenda Ao Vivo com indicador pulsante
 *
 * Mostra o módulo atual do evento com badge "AO VIVO" animado
 * Suporta 17 módulos (0-16) distribuídos em 2 dias
 */

import { motion } from 'framer-motion'
import { Radio, Pause, Coffee } from 'lucide-react'
import { theme } from '../../styles/theme'
import { EVENT_MODULES, getModuleById, getModulesByDay } from '../../data/modules'

type EventStatus = 'live' | 'paused' | 'offline'

interface LiveTickerProps {
  /** Número do módulo atual (0-16) */
  currentModule: number
  /** Status do evento */
  status?: EventStatus
  /** Dia atual (1 ou 2) */
  currentDay?: 1 | 2
}

export function LiveTicker({
  currentModule,
  status = 'live',
  currentDay = 1,
}: LiveTickerProps) {
  const module = getModuleById(currentModule)
  const totalModules = EVENT_MODULES.length
  const dayModules = getModulesByDay(currentDay)

  const isLive = status === 'live'
  const isPaused = status === 'paused'

  // Cores baseadas no status
  const statusColors = {
    live: { border: 'rgba(255, 68, 68, 0.4)', bg: 'rgba(255, 68, 68, 0.15)', text: '#FF4444', glow: '#FF4444' },
    paused: { border: 'rgba(245, 158, 11, 0.4)', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', glow: '#F59E0B' },
    offline: { border: 'rgba(100, 116, 139, 0.3)', bg: 'rgba(100, 116, 139, 0.1)', text: '#64748B', glow: 'transparent' },
  }

  const colors = statusColors[status]

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow effect when live */}
      {isLive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent 0%, ${colors.glow} 50%, transparent 100%)`,
            boxShadow: `0 0 20px ${colors.glow}80`,
          }}
        />
      )}

      {/* Top Row - Badge + Module Number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        {/* Status Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
          }}
        >
          {/* Pulsing dot (only when live) */}
          {isLive ? (
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: colors.text,
                boxShadow: `0 0 10px ${colors.text}`,
              }}
            />
          ) : isPaused ? (
            <Coffee size={12} color={colors.text} />
          ) : (
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: colors.text,
              }}
            />
          )}
          <span
            style={{
              fontSize: '10px',
              fontWeight: theme.typography.fontWeight.bold,
              color: colors.text,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {isLive ? 'AO VIVO' : isPaused ? 'INTERVALO' : 'OFFLINE'}
          </span>
        </div>

        {/* Module Counter + Day */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              color: theme.colors.accent.cyan.DEFAULT,
              fontWeight: theme.typography.fontWeight.semibold,
              padding: '2px 6px',
              background: 'rgba(34, 211, 238, 0.1)',
              borderRadius: '4px',
            }}
          >
            DIA {currentDay}
          </span>
          <span
            style={{
              fontSize: '11px',
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fontFamily.orbitron,
            }}
          >
            MÓDULO {currentModule}/{totalModules - 1}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Icon */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(220, 38, 38, 0.1) 100%)`,
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isPaused ? (
            <Pause size={22} color={colors.text} />
          ) : (
            <Radio size={22} color={colors.text} />
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '13px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {module?.title || `MÓDULO ${currentModule}`}
          </h3>
          {module?.subtitle && (
            <p
              style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                margin: '4px 0 0 0',
                lineHeight: 1.4,
              }}
            >
              {module.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Progress indicator - Shows current day modules */}
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          gap: '3px',
        }}
      >
        {dayModules.map((mod) => {
          const isPast = mod.id < currentModule
          const isCurrent = mod.id === currentModule

          return (
            <div
              key={mod.id}
              style={{
                flex: 1,
                height: '3px',
                borderRadius: '2px',
                background: isPast
                  ? theme.colors.accent.cyan.DEFAULT
                  : isCurrent
                  ? `linear-gradient(90deg, ${colors.text} 0%, ${colors.text}50 100%)`
                  : 'rgba(100, 116, 139, 0.2)',
                boxShadow: isPast
                  ? `0 0 6px ${theme.colors.accent.cyan.DEFAULT}`
                  : isCurrent
                  ? `0 0 6px ${colors.text}`
                  : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Day indicator dots below progress */}
      <div
        style={{
          marginTop: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: theme.colors.text.muted,
        }}
      >
        <span>Módulo {dayModules[0]?.id}</span>
        <span>Módulo {dayModules[dayModules.length - 1]?.id}</span>
      </div>
    </div>
  )
}
