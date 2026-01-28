/**
 * LiveTicker - Agenda Ao Vivo com indicador pulsante
 *
 * Mostra o bloco atual do evento com badge "AO VIVO" animado
 */

import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import { theme } from '../../styles/theme'

interface LiveTickerProps {
  /** Número do bloco atual */
  currentBlock: number
  /** Título do bloco atual */
  blockTitle: string
  /** Subtítulo/descrição do bloco */
  blockSubtitle?: string
  /** Total de blocos */
  totalBlocks?: number
  /** Se está ao vivo */
  isLive?: boolean
}

export function LiveTicker({
  currentBlock,
  blockTitle,
  blockSubtitle,
  totalBlocks = 7,
  isLive = true,
}: LiveTickerProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
        border: isLive
          ? '1px solid rgba(255, 68, 68, 0.4)'
          : '1px solid rgba(100, 116, 139, 0.3)',
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
            background: 'linear-gradient(90deg, transparent 0%, #FF4444 50%, transparent 100%)',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.5)',
          }}
        />
      )}

      {/* Top Row - Badge + Block Number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        {/* AO VIVO Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(255, 68, 68, 0.15)',
            border: '1px solid rgba(255, 68, 68, 0.4)',
            borderRadius: '6px',
          }}
        >
          {/* Pulsing dot */}
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
              background: '#FF4444',
              boxShadow: '0 0 10px #FF4444',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: theme.typography.fontWeight.bold,
              color: '#FF4444',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            AO VIVO
          </span>
        </div>

        {/* Block Counter */}
        <span
          style={{
            fontSize: '11px',
            color: theme.colors.text.secondary,
            fontFamily: theme.typography.fontFamily.orbitron,
          }}
        >
          BLOCO {currentBlock}/{totalBlocks}
        </span>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Icon */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Radio size={22} color="#FF4444" />
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
            {blockTitle}
          </h3>
          {blockSubtitle && (
            <p
              style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                margin: '4px 0 0 0',
                lineHeight: 1.4,
              }}
            >
              {blockSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          gap: '4px',
        }}
      >
        {Array.from({ length: totalBlocks }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '3px',
              borderRadius: '2px',
              background:
                i < currentBlock
                  ? theme.colors.accent.cyan.DEFAULT
                  : i === currentBlock - 1
                  ? 'linear-gradient(90deg, #FF4444 0%, rgba(255, 68, 68, 0.3) 100%)'
                  : 'rgba(100, 116, 139, 0.2)',
              boxShadow: i < currentBlock ? `0 0 8px ${theme.colors.accent.cyan.DEFAULT}` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}
