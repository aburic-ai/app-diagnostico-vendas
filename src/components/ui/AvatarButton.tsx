/**
 * AvatarButton - Botão de avatar para o header
 *
 * Mostra foto do usuário ou iniciais
 * Clicável para ir ao perfil
 */

import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { theme } from '../../styles/theme'

interface AvatarButtonProps {
  /** URL da foto do usuário */
  photoUrl?: string
  /** Nome do usuário (para gerar iniciais) */
  name?: string
  /** Tamanho do avatar */
  size?: number
  /** Callback ao clicar */
  onClick?: () => void
  /** Se tem notificação não lida */
  hasNotification?: boolean
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorFromName(name: string): string {
  const colors = [
    '#22D3EE', // cyan
    '#A855F7', // purple
    '#F59E0B', // gold
    '#EC4899', // pink
    '#10B981', // green
    '#6366F1', // indigo
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function AvatarButton({
  photoUrl,
  name = 'User',
  size = 36,
  onClick,
  hasNotification = false,
}: AvatarButtonProps) {
  const initials = getInitials(name)
  const bgColor = getColorFromName(name)

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: `2px solid ${photoUrl ? 'rgba(34, 211, 238, 0.4)' : bgColor}40`,
        background: photoUrl ? 'transparent' : `${bgColor}20`,
        cursor: 'pointer',
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 15px ${photoUrl ? 'rgba(34, 211, 238, 0.2)' : bgColor}30`,
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : name !== 'User' ? (
        <span
          style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: `${size * 0.35}px`,
            fontWeight: theme.typography.fontWeight.bold,
            color: bgColor,
            letterSpacing: '0.05em',
          }}
        >
          {initials}
        </span>
      ) : (
        <User size={size * 0.5} color={theme.colors.text.muted} />
      )}

      {/* Notification dot */}
      {hasNotification && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#EF4444',
            border: '2px solid #050505',
            boxShadow: '0 0 8px #EF4444',
          }}
        />
      )}
    </motion.button>
  )
}
