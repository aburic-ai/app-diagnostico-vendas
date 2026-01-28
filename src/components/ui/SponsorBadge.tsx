/**
 * SponsorBadge - Badge de patrocínio "Imersão IMPACT"
 *
 * Texto discreto no footer de todas as páginas
 * Link ativo apenas após o evento
 */

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { theme } from '../../styles/theme'

interface SponsorBadgeProps {
  /** Se o link está ativo (após evento) */
  isLinkActive?: boolean
  /** Callback ao clicar no link */
  onLinkClick?: () => void
}

export function SponsorBadge({
  isLinkActive = false,
  onLinkClick,
}: SponsorBadgeProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: theme.colors.text.muted,
            letterSpacing: '0.05em',
          }}
        >
          Patrocinado por
        </span>
        <span
          style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: '11px',
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.accent.purple.light,
            letterSpacing: '0.05em',
          }}
        >
          IMERSÃO IMPACT
        </span>
      </div>

      {isLinkActive && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLinkClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              color: theme.colors.accent.purple.light,
              fontWeight: theme.typography.fontWeight.semibold,
            }}
          >
            Saiba mais
          </span>
          <ExternalLink size={12} color={theme.colors.accent.purple.light} />
        </motion.button>
      )}
    </div>
  )
}
