/**
 * LockedOffer - Card de Oferta Bloqueada
 *
 * Mostra a oferta IMPACT presencial com cadeado que destrava no momento certo
 */

import { motion } from 'framer-motion'
import { Lock, Unlock, Sparkles, ArrowRight, Clock } from 'lucide-react'
import { theme } from '../../styles/theme'

interface LockedOfferProps {
  /** Título da oferta */
  title: string
  /** Subtítulo */
  subtitle: string
  /** Se está desbloqueado */
  isUnlocked?: boolean
  /** Horário que desbloqueia (ex: "16:30") */
  unlockTime?: string
  /** Mensagem quando bloqueado */
  lockedMessage?: string
  /** Callback ao clicar (quando desbloqueado) */
  onClick?: () => void
}

export function LockedOffer({
  title = 'PROTOCOLO IMPACT',
  subtitle = 'Imersão Presencial',
  isUnlocked = false,
  unlockTime = '16:30',
  lockedMessage = 'Essa etapa exige algo que não acontece sozinho.',
  onClick,
}: LockedOfferProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={isUnlocked && onClick ? { scale: 0.98 } : {}}
      onClick={isUnlocked ? onClick : undefined}
      style={{
        background: isUnlocked
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(30, 35, 45, 0.9) 0%, rgba(20, 25, 35, 0.95) 100%)',
        border: isUnlocked
          ? '2px solid rgba(245, 158, 11, 0.6)'
          : '1px solid rgba(100, 116, 139, 0.3)',
        borderRadius: '16px',
        padding: '18px',
        position: 'relative',
        overflow: 'hidden',
        cursor: isUnlocked ? 'pointer' : 'default',
        boxShadow: isUnlocked
          ? '0 0 40px rgba(245, 158, 11, 0.3)'
          : 'none',
      }}
    >
      {/* Sparkle effects when unlocked */}
      {isUnlocked && (
        <>
          <motion.div
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              top: 10,
              right: 20,
              color: theme.colors.gold.light,
            }}
          >
            <Sparkles size={16} />
          </motion.div>
          <motion.div
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            style={{
              position: 'absolute',
              bottom: 15,
              left: 25,
              color: theme.colors.gold.DEFAULT,
            }}
          >
            <Sparkles size={12} />
          </motion.div>
        </>
      )}

      {/* Locked overlay pattern */}
      {!isUnlocked && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(100, 116, 139, 0.05) 10px,
                rgba(100, 116, 139, 0.05) 20px
              )
            `,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Lock Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: isUnlocked
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 179, 8, 0.2) 100%)'
              : 'rgba(30, 35, 45, 0.8)',
            border: isUnlocked
              ? '2px solid rgba(245, 158, 11, 0.5)'
              : '1px solid rgba(100, 116, 139, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isUnlocked
              ? '0 0 25px rgba(245, 158, 11, 0.4)'
              : 'none',
          }}
        >
          {isUnlocked ? (
            <motion.div
              initial={{ rotate: -20 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Unlock size={26} color={theme.colors.gold.DEFAULT} />
            </motion.div>
          ) : (
            <Lock size={24} color={theme.colors.text.muted} />
          )}
        </div>

        {/* Text Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              background: isUnlocked
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(100, 116, 139, 0.15)',
              border: isUnlocked
                ? '1px solid rgba(245, 158, 11, 0.4)'
                : '1px solid rgba(100, 116, 139, 0.2)',
              borderRadius: '4px',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '8px',
                fontWeight: theme.typography.fontWeight.bold,
                color: isUnlocked ? theme.colors.gold.DEFAULT : theme.colors.text.muted,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {isUnlocked ? 'DISPONÍVEL AGORA' : 'PRÓXIMO NÍVEL'}
            </span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '15px',
              fontWeight: theme.typography.fontWeight.bold,
              color: isUnlocked ? theme.colors.gold.DEFAULT : theme.colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
              textShadow: isUnlocked ? '0 0 15px rgba(245, 158, 11, 0.5)' : 'none',
            }}
          >
            {title}
          </h3>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '12px',
              color: isUnlocked ? theme.colors.text.primary : theme.colors.text.muted,
              margin: '4px 0 0 0',
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Arrow (when unlocked) */}
        {isUnlocked && (
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight size={24} color={theme.colors.gold.DEFAULT} />
          </motion.div>
        )}
      </div>

      {/* Bottom Message */}
      <div
        style={{
          marginTop: '14px',
          padding: '10px 12px',
          background: isUnlocked
            ? 'rgba(245, 158, 11, 0.1)'
            : 'rgba(10, 12, 18, 0.6)',
          borderRadius: '8px',
          border: isUnlocked
            ? '1px solid rgba(245, 158, 11, 0.2)'
            : '1px solid rgba(100, 116, 139, 0.15)',
        }}
      >
        {isUnlocked ? (
          <p
            style={{
              fontSize: '11px',
              color: theme.colors.gold.light,
              margin: 0,
              textAlign: 'center',
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            Toque para conhecer a próxima etapa da sua jornada
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Clock size={14} color={theme.colors.text.muted} />
            <p
              style={{
                fontSize: '11px',
                color: theme.colors.text.muted,
                margin: 0,
              }}
            >
              {lockedMessage}
            </p>
          </div>
        )}
      </div>

      {/* Unlock time indicator */}
      {!isUnlocked && unlockTime && (
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(100, 116, 139, 0.4)',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              color: theme.colors.text.muted,
            }}
          >
            Libera às{' '}
            <span style={{ color: theme.colors.text.secondary, fontWeight: theme.typography.fontWeight.semibold }}>
              {unlockTime}
            </span>
          </span>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'rgba(100, 116, 139, 0.4)',
            }}
          />
        </div>
      )}
    </motion.div>
  )
}
