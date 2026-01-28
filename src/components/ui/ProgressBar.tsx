/**
 * ProgressBar - Barra de progresso com glow
 */

import { theme } from '../../styles/theme'

interface ProgressBarProps {
  /** Valor de 0 a 100 */
  value: number
  /** Label abaixo da barra */
  label?: string
  /** Gradiente customizado */
  gradient?: string
}

export function ProgressBar({
  value,
  label,
  gradient = 'linear-gradient(90deg, #DC2626 0%, #7C3AED 50%, #A855F7 100%)',
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div style={{ width: '100%' }}>
      {/* Track */}
      <div
        style={{
          width: '100%',
          height: '14px',
          background: 'rgba(20, 25, 35, 0.9)',
          borderRadius: '7px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Fill */}
        <div
          style={{
            width: `${clampedValue}%`,
            height: '100%',
            background: gradient,
            borderRadius: '7px',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3)',
            transition: 'width 0.5s ease-out',
          }}
        />
      </div>

      {/* Label */}
      {label && (
        <div
          style={{
            marginTop: '8px',
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            letterSpacing: theme.typography.letterSpacing.wide,
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
