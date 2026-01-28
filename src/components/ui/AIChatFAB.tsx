/**
 * AIChatFAB - Floating Action Button para abrir o Chat IA
 *
 * Botão flutuante no canto inferior direito
 * Pulsa suavemente para chamar atenção
 */

import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'
import { theme } from '../../styles/theme'

interface AIChatFABProps {
  /** Callback ao clicar */
  onClick: () => void
  /** Se o chat está disponível (só durante evento) */
  isAvailable?: boolean
  /** Se tem mensagens não lidas */
  hasUnread?: boolean
}

export function AIChatFAB({
  onClick,
  isAvailable = true,
  hasUnread = false,
}: AIChatFABProps) {
  return (
    <motion.button
      whileHover={isAvailable ? { scale: 1.1 } : {}}
      whileTap={isAvailable ? { scale: 0.95 } : {}}
      onClick={isAvailable ? onClick : undefined}
      style={{
        position: 'fixed',
        bottom: 'calc(110px + env(safe-area-inset-bottom, 24px))',
        right: '16px',
        width: '60px',
        height: '60px',
        borderRadius: '20px',
        background: isAvailable
          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)'
          : 'rgba(100, 116, 139, 0.3)',
        border: isAvailable
          ? '2px solid rgba(168, 85, 247, 0.6)'
          : '2px solid rgba(100, 116, 139, 0.3)',
        boxShadow: isAvailable
          ? '0 4px 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)'
          : 'none',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: theme.zIndex.content + 5,
        opacity: isAvailable ? 1 : 0.5,
      }}
    >
      {/* Pulse animation */}
      {isAvailable && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '24px',
            border: '2px solid rgba(168, 85, 247, 0.5)',
          }}
        />
      )}

      {/* Icon */}
      <div style={{ position: 'relative' }}>
        <Bot
          size={28}
          color={isAvailable ? '#fff' : theme.colors.text.muted}
        />
        {isAvailable && (
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
            }}
          >
            <Sparkles size={14} color="#FBBF24" />
          </motion.div>
        )}
      </div>

      {/* Unread indicator */}
      {hasUnread && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#EF4444',
            border: '2px solid #050505',
            boxShadow: '0 0 10px #EF4444',
          }}
        />
      )}
    </motion.button>
  )
}
