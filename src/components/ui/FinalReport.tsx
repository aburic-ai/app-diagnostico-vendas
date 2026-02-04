/**
 * FinalReport - Relatório Final do Diagnóstico
 *
 * Mostra o score consolidado com gráfico radar estático
 * e opção de download do relatório
 */

import { motion } from 'framer-motion'
import { TrendingDown, AlertTriangle } from 'lucide-react'
import { theme } from '../../styles/theme'
import type { IMPACTData } from './RadarChart'

interface FinalReportProps {
  /** Dados do diagnóstico Dia 1 */
  data: IMPACTData
  /** Dados do diagnóstico Dia 2 (opcional) */
  dataDay2?: IMPACTData
  /** Score final (0-100) */
  score: number
  /** Gargalo principal identificado */
  gargalo: {
    etapa: string
    letra: string
    valor: number
  }
}

// Mini radar chart simplificado com suporte a dois dias
function MiniRadar({ data, dataDay2 }: { data: IMPACTData; dataDay2?: IMPACTData }) {
  const size = 120
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = (size / 2) - 20

  const LABELS = [
    { key: 'inspiracao', angle: -90, label: 'I' },
    { key: 'motivacao', angle: -30, label: 'M' },
    { key: 'preparacao', angle: 30, label: 'P' },
    { key: 'apresentacao', angle: 90, label: 'A' },
    { key: 'conversao', angle: 150, label: 'C' },
    { key: 'transformacao', angle: 210, label: 'T' },
  ]

  const polarToCartesian = (radius: number, angle: number) => {
    const angleInRadians = ((angle - 90) * Math.PI) / 180.0
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  // Pontos do Dia 1 (azul/cyan)
  const pointsDay1 = LABELS.map((item) => {
    const value = data[item.key as keyof IMPACTData] || 0
    const radius = (value / 10) * maxRadius
    const point = polarToCartesian(radius, item.angle)
    return `${point.x},${point.y}`
  }).join(' ')

  // Pontos do Dia 2 (roxo/purple) - se existir
  const pointsDay2 = dataDay2 ? LABELS.map((item) => {
    const value = dataDay2[item.key as keyof IMPACTData] || 0
    const radius = (value / 10) * maxRadius
    const point = polarToCartesian(radius, item.angle)
    return `${point.x},${point.y}`
  }).join(' ') : null

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

      {/* Axis lines */}
      {LABELS.map((item, i) => {
        const endpoint = polarToCartesian(maxRadius, item.angle)
        return (
          <line
            key={`axis-${i}`}
            x1={centerX}
            y1={centerY}
            x2={endpoint.x}
            y2={endpoint.y}
            stroke="rgba(100, 116, 139, 0.2)"
            strokeWidth="1"
          />
        )
      })}

      {/* Dia 1 polygon (azul/cyan) */}
      <polygon
        points={pointsDay1}
        fill="rgba(34, 211, 238, 0.2)"
        stroke={theme.colors.accent.cyan.DEFAULT}
        strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))' }}
      />

      {/* Dia 2 polygon (roxo/purple) - se existir */}
      {pointsDay2 && (
        <polygon
          points={pointsDay2}
          fill="rgba(168, 85, 247, 0.2)"
          stroke={theme.colors.accent.purple.light}
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.4))' }}
        />
      )}

      {/* Axis labels (IMPACT letters) */}
      {LABELS.map((item, i) => {
        const labelPos = polarToCartesian(maxRadius + 12, item.angle)
        return (
          <text
            key={`label-${i}`}
            x={labelPos.x}
            y={labelPos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFFFFF"
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              fontFamily: theme.typography.fontFamily.orbitron,
              letterSpacing: '0.08em',
            }}
          >
            {item.label}
          </text>
        )
      })}

      {/* Center dot */}
      <circle
        cx={centerX}
        cy={centerY}
        r="3"
        fill={dataDay2 ? theme.colors.accent.purple.light : theme.colors.accent.cyan.DEFAULT}
      />
    </svg>
  )
}

export function FinalReport({
  data,
  dataDay2,
  score,
  gargalo,
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
        <div>
          <div
            style={{
              background: 'rgba(10, 12, 18, 0.6)',
              borderRadius: '12px',
              padding: '10px',
              border: '1px solid rgba(100, 116, 139, 0.2)',
            }}
          >
            <MiniRadar data={data} dataDay2={dataDay2} />
          </div>

          {/* Legenda - só mostra se tiver dia 2 */}
          {dataDay2 && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '8px',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: theme.colors.accent.cyan.DEFAULT,
                  }}
                />
                <span style={{ fontSize: '9px', color: theme.colors.text.muted }}>
                  Dia 1
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: theme.colors.accent.purple.light,
                  }}
                />
                <span style={{ fontSize: '9px', color: theme.colors.text.muted }}>
                  Dia 2
                </span>
              </div>
            </div>
          )}
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
                {gargalo.letra} - {gargalo.etapa}
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
