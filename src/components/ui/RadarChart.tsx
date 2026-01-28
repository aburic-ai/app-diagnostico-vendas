/**
 * RadarChart - Gráfico Radar para Diagnóstico IMPACT
 *
 * Visualização spider chart com 6 dimensões:
 * I - Inspiração, M - Motivação, P - Preparação,
 * A - Apresentação, C - Conversão, T - Transformação
 */

import { motion } from 'framer-motion'
import { theme } from '../../styles/theme'

export interface IMPACTData {
  inspiracao: number // 0-10
  motivacao: number
  preparacao: number
  apresentacao: number
  conversao: number
  transformacao: number
}

interface RadarChartProps {
  /** Dados do Dia 1 */
  data1?: IMPACTData
  /** Dados do Dia 2 */
  data2?: IMPACTData
  /** Dia selecionado para exibir (1 ou 2, ou 'both') */
  selectedDay?: 1 | 2 | 'both'
  /** Tamanho do gráfico */
  size?: number
}

const LABELS = [
  { key: 'inspiracao', label: 'I', fullLabel: 'Inspiração', angle: -90 },
  { key: 'motivacao', label: 'M', fullLabel: 'Motivação', angle: -30 },
  { key: 'preparacao', label: 'P', fullLabel: 'Preparação', angle: 30 },
  { key: 'apresentacao', label: 'A', fullLabel: 'Apresentação', angle: 90 },
  { key: 'conversao', label: 'C', fullLabel: 'Conversão', angle: 150 },
  { key: 'transformacao', label: 'T', fullLabel: 'Transformação', angle: 210 },
]

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function getDataPoints(
  data: IMPACTData,
  centerX: number,
  centerY: number,
  maxRadius: number
): string {
  const points = LABELS.map((item) => {
    const value = data[item.key as keyof IMPACTData] || 0
    const radius = (value / 10) * maxRadius
    const point = polarToCartesian(centerX, centerY, radius, item.angle)
    return `${point.x},${point.y}`
  })
  return points.join(' ')
}

export function RadarChart({
  data1,
  data2,
  selectedDay = 'both',
  size = 280,
}: RadarChartProps) {
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = (size / 2) - 40

  // Grid circles (0, 2.5, 5, 7.5, 10)
  const gridLevels = [0.25, 0.5, 0.75, 1]

  // Default empty data
  const defaultData: IMPACTData = {
    inspiracao: 0,
    motivacao: 0,
    preparacao: 0,
    apresentacao: 0,
    conversao: 0,
    transformacao: 0,
  }

  const activeData1 = data1 || defaultData
  const activeData2 = data2 || defaultData

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(10, 12, 18, 0.95) 0%, rgba(5, 8, 15, 0.98) 100%)',
        border: '1px solid rgba(34, 211, 238, 0.3)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 0 30px rgba(34, 211, 238, 0.1)',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h3
          style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: '14px',
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.accent.cyan.DEFAULT,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
            textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
          }}
        >
          DIAGNÓSTICO I.M.P.A.C.T.
        </h3>
        <p
          style={{
            fontSize: '11px',
            color: theme.colors.text.secondary,
            margin: '4px 0 0 0',
          }}
        >
          Jornada Psicológica de Venda
        </p>
      </div>

      {/* SVG Chart */}
      <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
        {/* Grid circles */}
        {gridLevels.map((level, i) => (
          <motion.circle
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            cx={centerX}
            cy={centerY}
            r={maxRadius * level}
            fill="none"
            stroke="rgba(100, 116, 139, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* Grid lines from center to each point */}
        {LABELS.map((item, i) => {
          const point = polarToCartesian(centerX, centerY, maxRadius, item.angle)
          return (
            <motion.line
              key={i}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
              x1={centerX}
              y1={centerY}
              x2={point.x}
              y2={point.y}
              stroke="rgba(100, 116, 139, 0.15)"
              strokeWidth="1"
            />
          )
        })}

        {/* Data polygon - Day 1 (Cyan) */}
        {(selectedDay === 1 || selectedDay === 'both') && data1 && (
          <motion.polygon
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            points={getDataPoints(activeData1, centerX, centerY, maxRadius)}
            fill="rgba(34, 211, 238, 0.2)"
            stroke={theme.colors.accent.cyan.DEFAULT}
            strokeWidth="2"
            style={{
              transformOrigin: `${centerX}px ${centerY}px`,
              filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.5))',
            }}
          />
        )}

        {/* Data polygon - Day 2 (Purple) */}
        {(selectedDay === 2 || selectedDay === 'both') && data2 && (
          <motion.polygon
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
            points={getDataPoints(activeData2, centerX, centerY, maxRadius)}
            fill="rgba(168, 85, 247, 0.15)"
            stroke={theme.colors.accent.purple.light}
            strokeWidth="2"
            style={{
              transformOrigin: `${centerX}px ${centerY}px`,
              filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))',
            }}
          />
        )}

        {/* Labels */}
        {LABELS.map((item, i) => {
          const labelRadius = maxRadius + 25
          const point = polarToCartesian(centerX, centerY, labelRadius, item.angle)
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.05 }}
            >
              {/* Circle background for letter */}
              <circle
                cx={point.x}
                cy={point.y}
                r="14"
                fill="rgba(10, 12, 18, 0.9)"
                stroke={theme.colors.accent.cyan.DEFAULT}
                strokeWidth="1"
              />
              {/* Letter */}
              <text
                x={point.x}
                y={point.y + 4}
                textAnchor="middle"
                fill={theme.colors.accent.cyan.DEFAULT}
                fontSize="12"
                fontWeight="bold"
                fontFamily={theme.typography.fontFamily.orbitron}
              >
                {item.label}
              </text>
            </motion.g>
          )
        })}

        {/* Center dot */}
        <circle
          cx={centerX}
          cy={centerY}
          r="4"
          fill={theme.colors.accent.cyan.DEFAULT}
          style={{ filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))' }}
        />
      </svg>

      {/* Legend */}
      {selectedDay === 'both' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            marginTop: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: theme.colors.accent.cyan.DEFAULT,
                boxShadow: `0 0 8px ${theme.colors.accent.cyan.DEFAULT}`,
              }}
            />
            <span style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
              Dia 1
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: theme.colors.accent.purple.light,
                boxShadow: `0 0 8px ${theme.colors.accent.purple.light}`,
              }}
            />
            <span style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
              Dia 2
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
