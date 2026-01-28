/**
 * FinalReport - Relatório Final do Diagnóstico
 *
 * Mostra o score consolidado com gráfico radar estático
 * e opção de download do relatório
 */

import { motion } from 'framer-motion'
import { FileDown, TrendingDown, AlertTriangle } from 'lucide-react'
import { theme } from '../../styles/theme'
import type { IMPACTData } from './RadarChart'

interface FinalReportProps {
  /** Dados do diagnóstico */
  data: IMPACTData
  /** Score final (0-100) */
  score: number
  /** Gargalo principal identificado */
  gargalo: {
    etapa: string
    letra: string
    valor: number
  }
  /** Callback ao baixar relatório */
  onDownload?: () => void
}

// Mini radar chart simplificado
function MiniRadar({ data }: { data: IMPACTData }) {
  const size = 120
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = (size / 2) - 20

  const LABELS = [
    { key: 'inspiracao', angle: -90 },
    { key: 'motivacao', angle: -30 },
    { key: 'preparacao', angle: 30 },
    { key: 'apresentacao', angle: 90 },
    { key: 'conversao', angle: 150 },
    { key: 'transformacao', angle: 210 },
  ]

  const polarToCartesian = (radius: number, angle: number) => {
    const angleInRadians = ((angle - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  const points = LABELS.map((item) => {
    const value = data[item.key as keyof IMPACTData] || 0
    const radius = (value / 10) * maxRadius
    const point = polarToCartesian(radius, item.angle)
    return `${point.x},${point.y}`
  }).join(' ')

  return (
    <svg width={size} height={size}>
      {/* Grid circles */}
      {[0.5, 1].map((level, i) => (
        <circle
          key={i}
          cx={centerX}
          cy={centerY}
          r={maxRadius * level}
          fill="none"
          stroke="rgba(100, 116, 139, 0.2)"
          strokeWidth="1"
        />
      ))}
      {/* Data polygon */}
      <polygon
        points={points}
        fill="rgba(34, 211, 238, 0.3)"
        stroke={theme.colors.accent.cyan.DEFAULT}
        strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))' }}
      />
      {/* Center dot */}
      <circle
        cx={centerX}
        cy={centerY}
        r="3"
        fill={theme.colors.accent.cyan.DEFAULT}
      />
    </svg>
  )
}

export function FinalReport({
  data,
  score,
  gargalo,
  onDownload,
}: FinalReportProps) {
  const getScoreStatus = (s: number) => {
    if (s < 30) return { label: 'CRÍTICO', color: '#EF4444' }
    if (s < 50) return { label: 'ATENÇÃO', color: '#F59E0B' }
    if (s < 70) return { label: 'MODERADO', color: '#22D3EE' }
    return { label: 'BOM', color: '#22C55E' }
  }

  const status = getScoreStatus(score)

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 0 30px rgba(34, 211, 238, 0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '12px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.secondary,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            RELATÓRIO FINAL
          </h3>
          <p
            style={{
              fontSize: '10px',
              color: theme.colors.text.muted,
              margin: '4px 0 0 0',
            }}
          >
            Diagnóstico I.M.P.A.C.T. Consolidado
          </p>
        </div>

        {/* Download Button */}
        {onDownload && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <FileDown size={14} color={theme.colors.accent.cyan.DEFAULT} />
            <span
              style={{
                fontSize: '9px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.accent.cyan.DEFAULT,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              PDF
            </span>
          </motion.button>
        )}
      </div>

      {/* Main Content */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        {/* Mini Radar */}
        <div
          style={{
            background: 'rgba(10, 12, 18, 0.6)',
            borderRadius: '12px',
            padding: '10px',
            border: '1px solid rgba(100, 116, 139, 0.2)',
          }}
        >
          <MiniRadar data={data} />
        </div>

        {/* Score & Stats */}
        <div style={{ flex: 1 }}>
          {/* Score */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '42px',
                fontWeight: theme.typography.fontWeight.bold,
                color: status.color,
                lineHeight: 1,
                textShadow: `0 0 30px ${status.color}`,
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: '16px',
                color: theme.colors.text.muted,
              }}
            >
              /100
            </span>
          </div>

          {/* Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: `${status.color}20`,
              border: `1px solid ${status.color}50`,
              borderRadius: '6px',
              marginBottom: '12px',
            }}
          >
            {score < 50 && <TrendingDown size={12} color={status.color} />}
            <span
              style={{
                fontSize: '10px',
                fontWeight: theme.typography.fontWeight.bold,
                color: status.color,
                letterSpacing: '0.1em',
              }}
            >
              {status.label}
            </span>
          </div>

          {/* Gargalo Highlight */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
            }}
          >
            <AlertTriangle size={16} color="#EF4444" />
            <div>
              <span
                style={{
                  fontSize: '9px',
                  color: theme.colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Gargalo Principal
              </span>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: '#EF4444',
                  margin: '2px 0 0 0',
                }}
              >
                {gargalo.letra} - {gargalo.etapa} ({gargalo.valor}/10)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer message */}
      <p
        style={{
          fontSize: '10px',
          color: theme.colors.text.muted,
          textAlign: 'center',
          margin: '16px 0 0 0',
          fontStyle: 'italic',
        }}
      >
        "Este é o retrato atual do seu sistema de vendas."
      </p>
    </div>
  )
}
