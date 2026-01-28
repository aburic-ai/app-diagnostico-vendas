/**
 * Card - Container com estilo glassmorphism
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { theme } from '../../styles/theme'

type CardVariant = 'default' | 'purple' | 'cyan' | 'gold'

interface CardProps {
  children: ReactNode
  variant?: CardVariant
  /** Padding interno */
  padding?: string
  /** Clicável */
  onClick?: () => void
  /** Animação de hover */
  hoverable?: boolean
  /** Classes adicionais */
  className?: string
}

const variantStyles: Record<CardVariant, { border: string; glow: string; bg: string }> = {
  default: {
    border: 'rgba(100, 120, 150, 0.2)',
    glow: 'rgba(100, 120, 150, 0.1)',
    bg: 'rgba(15, 17, 21, 0.6)',
  },
  purple: {
    border: 'rgba(168, 85, 247, 0.4)',
    glow: 'rgba(168, 85, 247, 0.15)',
    bg: 'rgba(88, 28, 135, 0.15)',
  },
  cyan: {
    border: 'rgba(34, 211, 238, 0.3)',
    glow: 'rgba(34, 211, 238, 0.1)',
    bg: 'rgba(8, 145, 178, 0.1)',
  },
  gold: {
    border: 'rgba(245, 158, 11, 0.3)',
    glow: 'rgba(245, 158, 11, 0.1)',
    bg: 'rgba(120, 80, 10, 0.1)',
  },
}

export function Card({
  children,
  variant = 'default',
  padding = '20px',
  onClick,
  hoverable = false,
  className,
}: CardProps) {
  const styles = variantStyles[variant]

  return (
    <motion.div
      onClick={onClick}
      whileHover={hoverable ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: theme.borderRadius.lg,
        padding,
        boxShadow: `0 0 20px ${styles.glow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
        backdropFilter: 'blur(10px)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
