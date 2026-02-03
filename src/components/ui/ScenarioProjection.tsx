/**
 * ScenarioProjection - Simulador de Consequências 30/60/90 dias
 *
 * Mostra projeção do que acontece se não corrigir o gargalo
 * "A faca na caveira" - transforma diagnóstico em previsibilidade de desastre
 */

import { motion } from 'framer-motion'
import { TrendingDown, Calendar, AlertOctagon, Skull } from 'lucide-react'
import { theme } from '../../styles/theme'

interface ProjectionPoint {
  days: number
  label: string
  description: string
  severity: 'warning' | 'danger' | 'critical'
}

interface ScenarioProjectionProps {
  /** Gargalo identificado */
  gargalo: string
  /** Pontos de projeção customizados */
  projections?: ProjectionPoint[]
  /** Estado de carregamento */
  loading?: boolean
  /** Erro ao gerar projeções */
  error?: string | null
}

const defaultProjections: ProjectionPoint[] = [
  {
    days: 30,
    label: 'Perda de Tração',
    description: 'Equipe volta aos velhos hábitos. Insights começam a ser esquecidos.',
    severity: 'warning',
  },
  {
    days: 60,
    label: 'Estagnação de Conversão',
    description: 'Custo de aquisição sobe 20-30%. Pipeline travado.',
    severity: 'danger',
  },
  {
    days: 90,
    label: 'Colapso do Lucro',
    description: 'Retorno ao padrão pré-evento. Todo investimento perdido.',
    severity: 'critical',
  },
]

const severityConfig = {
  warning: {
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  danger: {
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
  },
  critical: {
    color: '#DC2626',
    bg: 'rgba(220, 38, 38, 0.2)',
    border: 'rgba(220, 38, 38, 0.5)',
  },
}

export function ScenarioProjection({
  gargalo,
  projections = defaultProjections,
  loading = false,
  error = null,
}: ScenarioProjectionProps) {
  // Use custom projections if available and no error, otherwise fallback to default
  const displayProjections = !error && projections && projections.length > 0 ? projections : defaultProjections

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(20, 10, 10, 0.95) 0%, rgba(15, 8, 8, 0.98) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        padding: '18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Danger pattern overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              rgba(239, 68, 68, 0.03) 20px,
              rgba(239, 68, 68, 0.03) 40px
            )
          `,
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertOctagon size={20} color="#EF4444" />
        </motion.div>
        <div>
          <h3
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '12px',
              fontWeight: theme.typography.fontWeight.bold,
              color: '#EF4444',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            PROJEÇÃO DE CENÁRIO
          </h3>
          <p
            style={{
              fontSize: '10px',
              color: theme.colors.text.muted,
              margin: '2px 0 0 0',
            }}
          >
            Consequências sem correção do gargalo "{gargalo}"
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '3px solid rgba(239, 68, 68, 0.2)',
              borderTopColor: '#EF4444',
            }}
          />
          <p
            style={{
              fontSize: '13px',
              color: theme.colors.text.secondary,
              margin: 0,
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Gerando sua projeção personalizada...
          </p>
          <p
            style={{
              fontSize: '10px',
              color: theme.colors.text.muted,
              margin: 0,
            }}
          >
            Analisando seu diagnóstico e conversas com IA
          </p>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 14px',
            marginBottom: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertOctagon size={16} color="#EF4444" />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '11px',
                color: '#EF4444',
                margin: 0,
                fontWeight: theme.typography.fontWeight.semibold,
              }}
            >
              Erro ao gerar projeção personalizada
            </p>
            <p
              style={{
                fontSize: '10px',
                color: theme.colors.text.muted,
                margin: '2px 0 0 0',
              }}
            >
              Usando projeção padrão baseada no gargalo identificado
            </p>
          </div>
        </motion.div>
      )}

      {/* Trend Line Visual */}
      {!loading && (
        <div
          style={{
            position: 'relative',
            marginBottom: '20px',
            padding: '0 10px',
          }}
        >
        {/* Timeline base */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '30px',
            right: '30px',
            height: '3px',
            background: 'rgba(100, 116, 139, 0.2)',
            borderRadius: '2px',
            zIndex: 0,
          }}
        />

        {/* Declining trend overlay */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '20px',
            left: '30px',
            right: '30px',
            height: '3px',
            background: 'linear-gradient(90deg, #F59E0B 0%, #EF4444 50%, #DC2626 100%)',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
            zIndex: 1,
          }}
        />

        {/* Day markers */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {displayProjections.map((point, index) => (
            <motion.div
              key={point.days}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.2 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
              }}
            >
              {/* Day badge - solid dark background to block the timeline */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, #0a0808 0%, #0f0a0a 70%), ${severityConfig[point.severity].bg}`,
                  border: `2px solid ${severityConfig[point.severity].color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 15px ${severityConfig[point.severity].color}50, inset 0 0 20px ${severityConfig[point.severity].bg}`,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '11px',
                    fontWeight: theme.typography.fontWeight.bold,
                    color: severityConfig[point.severity].color,
                  }}
                >
                  T+{point.days}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      )}

      {/* Projection Cards */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayProjections.map((point, index) => {
          const config = severityConfig[point.severity]
          return (
            <motion.div
              key={point.days}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.15 }}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: '10px',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${config.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {point.severity === 'critical' ? (
                  <Skull size={16} color={config.color} />
                ) : (
                  <TrendingDown size={16} color={config.color} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                  }}
                >
                  <Calendar size={12} color={theme.colors.text.muted} />
                  <span
                    style={{
                      fontSize: '10px',
                      color: theme.colors.text.muted,
                    }}
                  >
                    {point.days} dias
                  </span>
                </div>
                <h4
                  style={{
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.bold,
                    color: config.color,
                    margin: 0,
                  }}
                >
                  {point.label}
                </h4>
                <p
                  style={{
                    fontSize: '10px',
                    color: theme.colors.text.secondary,
                    margin: '4px 0 0 0',
                    lineHeight: 1.4,
                  }}
                >
                  {point.description}
                </p>
              </div>
            </motion.div>
          )
          })}
        </div>
      )}

      {/* Bottom info - Data sources */}
      {!loading && (
        <div
        style={{
          marginTop: '14px',
          padding: '12px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            color: theme.colors.text.secondary,
            margin: 0,
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          <span style={{ color: '#60A5FA', fontWeight: theme.typography.fontWeight.semibold }}>
            Projeção personalizada
          </span>
          {' '}gerada com base no seu diagnóstico IMPACT, respostas da pesquisa de calibragem e conversas com a IA durante o evento.
        </p>
        </div>
      )}
    </div>
  )
}
