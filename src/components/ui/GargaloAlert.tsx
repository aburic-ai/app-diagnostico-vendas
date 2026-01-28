/**
 * GargaloAlert - Card de Alerta do Gargalo Principal
 *
 * Mostra o gargalo identificado no diagnóstico com impacto e urgência
 */

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, Clock } from 'lucide-react'
import { theme } from '../../styles/theme'

interface GargaloAlertProps {
  /** Nome da etapa com gargalo (ex: "Conversão") */
  etapa: string
  /** Letra da dimensão (C) */
  letra: string
  /** Valor atual (0-10) */
  valor: number
  /** Impacto estimado no negócio */
  impacto: string
  /** Consequência de não corrigir */
  consequencia?: string
  /** Se está expandido */
  expanded?: boolean
  /** Callback ao clicar */
  onClick?: () => void
}

export function GargaloAlert({
  etapa,
  letra,
  valor,
  impacto,
  consequencia,
  expanded = false,
  onClick,
}: GargaloAlertProps) {
  const isCritical = valor <= 3
  const alertColor = isCritical ? '#EF4444' : '#F59E0B'
  const alertColorRgb = isCritical ? '239, 68, 68' : '245, 158, 11'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, rgba(${alertColorRgb}, 0.15) 0%, rgba(${alertColorRgb}, 0.05) 100%)`,
        border: `1px solid rgba(${alertColorRgb}, 0.5)`,
        borderRadius: '14px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Animated glow effect */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${alertColorRgb}, 0.3) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        {/* Alert Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `rgba(${alertColorRgb}, 0.2)`,
            border: `2px solid ${alertColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 0 20px rgba(${alertColorRgb}, 0.4)`,
          }}
        >
          <AlertTriangle size={22} color={alertColor} />
        </motion.div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: `rgba(${alertColorRgb}, 0.2)`,
              border: `1px solid rgba(${alertColorRgb}, 0.4)`,
              borderRadius: '4px',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                fontSize: '9px',
                fontWeight: theme.typography.fontWeight.bold,
                color: alertColor,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {isCritical ? 'GARGALO CRÍTICO' : 'PONTO DE ATENÇÃO'}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '16px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: `rgba(${alertColorRgb}, 0.3)`,
                border: `1px solid ${alertColor}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: alertColor,
                fontWeight: theme.typography.fontWeight.bold,
              }}
            >
              {letra}
            </span>
            {etapa}
          </h3>

          {/* Value indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            <TrendingDown size={14} color={alertColor} />
            <span
              style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
              }}
            >
              Nota atual:
            </span>
            <span
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '16px',
                fontWeight: theme.typography.fontWeight.bold,
                color: alertColor,
                textShadow: `0 0 10px rgba(${alertColorRgb}, 0.5)`,
              }}
            >
              {valor}/10
            </span>
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div
        style={{
          marginTop: '14px',
          padding: '12px',
          background: 'rgba(10, 12, 18, 0.6)',
          borderRadius: '8px',
          border: '1px solid rgba(100, 116, 139, 0.2)',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            color: theme.colors.text.primary,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: alertColor, fontWeight: theme.typography.fontWeight.semibold }}>
            Impacto:
          </span>{' '}
          {impacto}
        </p>

        {/* Consequence (expanded) */}
        {expanded && consequencia && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ marginTop: '10px', overflow: 'hidden' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px',
                background: `rgba(${alertColorRgb}, 0.1)`,
                borderRadius: '6px',
                border: `1px solid rgba(${alertColorRgb}, 0.2)`,
              }}
            >
              <Clock size={14} color={alertColor} style={{ flexShrink: 0, marginTop: '2px' }} />
              <p
                style={{
                  fontSize: '11px',
                  color: theme.colors.text.secondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: alertColor }}>Se não corrigir em 30 dias:</span>{' '}
                {consequencia}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Subtle message */}
      <p
        style={{
          fontSize: '10px',
          color: theme.colors.text.muted,
          margin: '12px 0 0 0',
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        "Isso provavelmente não se resolve sozinho."
      </p>
    </motion.div>
  )
}
