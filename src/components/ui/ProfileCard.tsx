/**
 * ProfileCard - Card de perfil do usuário
 *
 * Mostra foto, dados, XP, badges e diagnóstico resumido
 * Usado na página de perfil dedicada
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Zap, Briefcase, Mail, Trophy, Target, Brain, Flame, Award, LogOut } from 'lucide-react'
import { theme } from '../../styles/theme'

interface Badge {
  id: string
  icon: typeof Trophy
  name: string
  description: string
  unlocked: boolean
}

interface ProfileCardProps {
  /** Nome do usuário */
  name: string
  /** Email do usuário */
  email: string
  /** Tipo de negócio */
  businessType?: string
  /** URL da foto */
  photoUrl?: string
  /** XP atual */
  currentXp: number
  /** XP total possível */
  totalXp: number
  /** Badges conquistados */
  badges?: Badge[]
  /** Gargalo identificado */
  gargalo?: { etapa: string; valor: number }
  /** Callback para upload de foto */
  onPhotoUpload?: () => void
  /** Callback para logout */
  onLogout?: () => void
}

const defaultBadges: Badge[] = [
  { id: 'diagnostico', icon: Target, name: 'Diagnóstico Completo', description: 'Preencheu Dia 1 e Dia 2', unlocked: false },
  { id: 'consultor', icon: Brain, name: 'Consultor IA', description: 'Usou o simulador 5x', unlocked: false },
  { id: 'maratonista', icon: Flame, name: 'Maratonista', description: 'Presente em todos os blocos', unlocked: false },
  { id: 'early', icon: Award, name: 'Early Bird', description: 'Primeiro a completar', unlocked: false },
]

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorFromName(name: string): string {
  const colors = ['#22D3EE', '#A855F7', '#F59E0B', '#EC4899', '#10B981', '#6366F1']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function ProfileCard({
  name,
  email,
  businessType,
  photoUrl,
  currentXp,
  totalXp,
  badges = defaultBadges,
  gargalo,
  onPhotoUpload,
  onLogout,
}: ProfileCardProps) {
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false)
  const initials = getInitials(name)
  const bgColor = getColorFromName(name)
  const progressPercent = Math.round((currentXp / totalXp) * 100)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* Photo + Name Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(10, 12, 18, 0.95) 0%, rgba(15, 20, 30, 0.9) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 0 40px rgba(34, 211, 238, 0.1)',
        }}
      >
        {/* Avatar */}
        <motion.div
          onHoverStart={() => setIsHoveringPhoto(true)}
          onHoverEnd={() => setIsHoveringPhoto(false)}
          onClick={onPhotoUpload}
          style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `3px solid ${photoUrl ? 'rgba(34, 211, 238, 0.5)' : bgColor}`,
            background: photoUrl ? 'transparent' : `${bgColor}20`,
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: `0 0 30px ${photoUrl ? 'rgba(34, 211, 238, 0.3)' : bgColor}40`,
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
          ) : (
            <span
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '32px',
                fontWeight: theme.typography.fontWeight.bold,
                color: bgColor,
              }}
            >
              {initials}
            </span>
          )}

          {/* Upload overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHoveringPhoto ? 1 : 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Camera size={24} color="#fff" />
            <span style={{ fontSize: '10px', color: '#fff' }}>Alterar</span>
          </motion.div>
        </motion.div>

        {/* Name */}
        <h2
          style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: '18px',
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {name}
        </h2>

        {/* Email */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px',
          }}
        >
          <Mail size={14} color={theme.colors.text.muted} />
          <span
            style={{
              fontSize: '12px',
              color: theme.colors.text.secondary,
            }}
          >
            {email}
          </span>
        </div>

        {/* Business Type */}
        {businessType && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '4px',
            }}
          >
            <Briefcase size={14} color={theme.colors.text.muted} />
            <span
              style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
              }}
            >
              {businessType}
            </span>
          </div>
        )}
      </div>

      {/* XP Progress Section */}
      <div
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} color={theme.colors.gold.DEFAULT} />
            <span
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '14px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.gold.DEFAULT,
                letterSpacing: '0.05em',
              }}
            >
              MEU PROGRESSO
            </span>
          </div>
          <span
            style={{
              fontSize: '12px',
              color: theme.colors.text.secondary,
            }}
          >
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '10px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '5px',
            overflow: 'hidden',
            marginBottom: '8px',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${theme.colors.gold.DEFAULT} 0%, ${theme.colors.gold.light} 100%)`,
              borderRadius: '5px',
              boxShadow: `0 0 15px ${theme.colors.gold.DEFAULT}80`,
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: theme.colors.text.muted,
          }}
        >
          <span>{currentXp} XP</span>
          <span>{totalXp} XP</span>
        </div>
      </div>

      {/* Badges Section */}
      <div
        style={{
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(10, 12, 18, 0.95) 0%, rgba(15, 20, 30, 0.9) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <Trophy size={20} color={theme.colors.accent.purple.light} />
          <span
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '14px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.accent.purple.light,
              letterSpacing: '0.05em',
            }}
          >
            CONQUISTAS
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {badges.map((badge) => {
            const Icon = badge.icon
            return (
              <motion.div
                key={badge.id}
                whileHover={badge.unlocked ? { scale: 1.1 } : {}}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    background: badge.unlocked
                      ? 'rgba(168, 85, 247, 0.2)'
                      : 'rgba(100, 116, 139, 0.1)',
                    border: `2px solid ${badge.unlocked ? theme.colors.accent.purple.light : 'rgba(100, 116, 139, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: badge.unlocked ? 1 : 0.4,
                    boxShadow: badge.unlocked ? '0 0 15px rgba(168, 85, 247, 0.3)' : 'none',
                  }}
                >
                  <Icon
                    size={24}
                    color={badge.unlocked ? theme.colors.accent.purple.light : theme.colors.text.muted}
                  />
                </div>
                <span
                  style={{
                    fontSize: '8px',
                    color: badge.unlocked ? theme.colors.text.secondary : theme.colors.text.muted,
                    textAlign: 'center',
                    maxWidth: '60px',
                  }}
                >
                  {badge.name}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Gargalo Section */}
      {gargalo && (
        <div
          style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <p
                style={{
                  fontSize: '11px',
                  color: theme.colors.text.muted,
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Gargalo Identificado
              </p>
              <p
                style={{
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '16px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: '#EF4444',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {gargalo.etapa}
              </p>
            </div>
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '20px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: '#EF4444',
                }}
              >
                {gargalo.valor}/10
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLogout}
        style={{
          padding: '16px',
          background: 'rgba(100, 116, 139, 0.1)',
          border: '1px solid rgba(100, 116, 139, 0.3)',
          borderRadius: '12px',
          color: theme.colors.text.muted,
          fontSize: '14px',
          fontWeight: theme.typography.fontWeight.semibold,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <LogOut size={18} />
        Sair da Conta
      </motion.button>
    </div>
  )
}
