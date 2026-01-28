/**
 * Sandbox - Demonstração dos Novos Componentes v2
 *
 * Seções:
 * 1. Sistema de Notificações (Toast + Drawer)
 * 2. Gamification Live (PresenceConfirmCard)
 * 3. Perfil do Usuário (ProfileCard + AvatarButton)
 * 4. Chat IA (AIChatInterface + FAB)
 * 5. Sponsor Badge
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, User, Bot, Award, Megaphone, ChevronRight, ArrowLeft } from 'lucide-react'

import { PageWrapper } from '../components/ui'
import { NotificationToast, NotificationDrawer } from '../components/ui'
import type { Notification } from '../components/ui'
import { PresenceConfirmCard } from '../components/ui'
import { AvatarButton, ProfileCard } from '../components/ui'
import { AIChatFAB, AIChatInterface } from '../components/ui'
import { SponsorBadge } from '../components/ui'
import { theme } from '../styles/theme'

type SandboxSection = 'menu' | 'notifications' | 'gamification' | 'profile' | 'aichat' | 'sponsor'

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'Intervalo de 15 minutos',
    message: 'Aproveite para preencher seu diagnóstico do Bloco 3 antes de continuarmos.',
    actionLabel: 'Preencher agora',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: '2',
    type: 'alert',
    title: 'Voltamos em 5 minutos',
    message: 'Prepare-se para o próximo bloco sobre Conversão.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
  },
  {
    id: '3',
    type: 'offer',
    title: 'Oferta Especial!',
    message: 'Desconto exclusivo de 20% para quem confirmar até o final do evento.',
    actionLabel: 'Ver oferta',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: true,
  },
  {
    id: '4',
    type: 'nps',
    title: 'Como está sendo sua experiência?',
    message: 'Sua opinião é importante para melhorarmos cada vez mais.',
    actionLabel: 'Avaliar',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    read: true,
  },
]

// User context for AI chat
const mockUserContext = {
  name: 'João Silva',
  businessType: 'Consultoria B2B',
  gargalo: { etapa: 'Conversão', valor: 3 },
  diagnostico: {
    inspiracao: 7,
    motivacao: 6,
    preparacao: 5,
    apresentacao: 4,
    conversao: 3,
    transformacao: 6,
  },
}

interface MenuItemProps {
  icon: typeof Bell
  title: string
  description: string
  onClick: () => void
  color: string
}

function MenuItem({ icon: Icon, title, description, onClick, color }: MenuItemProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: '100%',
        padding: '18px',
        background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.9) 0%, rgba(20, 25, 35, 0.8) 100%)',
        border: `1px solid ${color}40`,
        borderRadius: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        textAlign: 'left',
        boxShadow: `0 0 20px ${color}20`,
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: `${color}15`,
          border: `1px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={24} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: '14px',
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '12px',
            color: theme.colors.text.secondary,
            margin: '4px 0 0 0',
          }}
        >
          {description}
        </p>
      </div>
      <ChevronRight size={20} color={theme.colors.text.muted} />
    </motion.button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: 'rgba(100, 116, 139, 0.1)',
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: '10px',
        cursor: 'pointer',
        marginBottom: '20px',
      }}
    >
      <ArrowLeft size={18} color={theme.colors.text.secondary} />
      <span style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
        Voltar ao menu
      </span>
    </motion.button>
  )
}

export function Sandbox() {
  const [currentSection, setCurrentSection] = useState<SandboxSection>('menu')

  // Notification states
  const [notifications, setNotifications] = useState(mockNotifications)
  const [showToast, setShowToast] = useState(false)
  const [currentToast, setCurrentToast] = useState<Notification | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)

  // Presence states
  const [presenceConfirmed, setPresenceConfirmed] = useState(false)
  const [presenceExpired, setPresenceExpired] = useState(false)

  // Profile states
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>()

  const handleShowToast = (notification: Notification) => {
    setCurrentToast(notification)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      setCurrentToast(null)
    }, 5000)
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // ============================================
  // MENU PRINCIPAL
  // ============================================
  if (currentSection === 'menu') {
    return (
      <PageWrapper
        backgroundColor={theme.colors.background.dark}
        showAnimatedBackground={true}
        showOverlay={false}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px 16px',
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ marginBottom: '28px', textAlign: 'center' }}
          >
            <h1
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '20px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.accent.cyan.DEFAULT,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
                margin: 0,
              }}
            >
              SANDBOX V2
            </h1>
            <p
              style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
                marginTop: '6px',
              }}
            >
              Demonstração dos novos componentes
            </p>
          </motion.div>

          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <MenuItem
                icon={Megaphone}
                title="Sistema de Avisos"
                description="Toast + Drawer de notificações"
                onClick={() => setCurrentSection('notifications')}
                color="#22D3EE"
              />
            </motion.div>

            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <MenuItem
                icon={Award}
                title="Gamification Live"
                description="Confirmação de presença com timer"
                onClick={() => setCurrentSection('gamification')}
                color="#F59E0B"
              />
            </motion.div>

            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MenuItem
                icon={User}
                title="Perfil do Usuário"
                description="Avatar, XP, badges e diagnóstico"
                onClick={() => setCurrentSection('profile')}
                color="#A855F7"
              />
            </motion.div>

            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <MenuItem
                icon={Bot}
                title="Chat com IA"
                description="Interface completa do simulador"
                onClick={() => setCurrentSection('aichat')}
                color="#EC4899"
              />
            </motion.div>

            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <MenuItem
                icon={Bell}
                title="Sponsor Badge"
                description="Patrocínio Imersão IMPACT"
                onClick={() => setCurrentSection('sponsor')}
                color="#10B981"
              />
            </motion.div>
          </div>
        </div>
      </PageWrapper>
    )
  }

  // ============================================
  // SEÇÃO: NOTIFICAÇÕES
  // ============================================
  if (currentSection === 'notifications') {
    return (
      <PageWrapper
        backgroundColor={theme.colors.background.dark}
        showAnimatedBackground={true}
        showOverlay={false}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px 16px',
          }}
        >
          <BackButton onClick={() => setCurrentSection('menu')} />

          <h2
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '16px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.accent.cyan.DEFAULT,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              margin: '0 0 20px 0',
            }}
          >
            Sistema de Avisos
          </h2>

          {/* Header Demo com Avatar e Bell */}
          <div
            style={{
              padding: '16px',
              background: 'rgba(15, 17, 21, 0.9)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '14px',
              marginBottom: '20px',
            }}
          >
            <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '12px' }}>
              Simulação do Header com sino e avatar:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: theme.colors.text.primary }}>
                IMERSÃO DIAGNÓSTICO
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Bell Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDrawer(true)}
                  style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(34, 211, 238, 0.1)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bell size={20} color={theme.colors.accent.cyan.DEFAULT} />
                  {unreadCount > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #050505',
                      }}
                    >
                      {unreadCount}
                    </div>
                  )}
                </motion.button>

                {/* Avatar */}
                <AvatarButton
                  name="João Silva"
                  size={40}
                  onClick={() => setCurrentSection('profile')}
                />
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleShowToast(notifications[0])}
              style={{
                padding: '14px',
                background: 'rgba(34, 211, 238, 0.15)',
                border: '1px solid rgba(34, 211, 238, 0.4)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#22D3EE',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Toast INFO
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleShowToast(notifications[1])}
              style={{
                padding: '14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#EF4444',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Toast ALERTA
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleShowToast(notifications[2])}
              style={{
                padding: '14px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#F59E0B',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Toast OFERTA
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleShowToast(notifications[3])}
              style={{
                padding: '14px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: '#A855F7',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Toast NPS
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDrawer(true)}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
              border: '1px solid rgba(34, 211, 238, 0.4)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: theme.colors.accent.cyan.DEFAULT,
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Abrir Drawer de Avisos ({notifications.length})
          </motion.button>
        </div>

        {/* Toast */}
        <NotificationToast
          notification={showToast ? currentToast : null}
          onClose={() => {
            setShowToast(false)
            setCurrentToast(null)
          }}
        />

        {/* Drawer */}
        <NotificationDrawer
          isOpen={showDrawer}
          notifications={notifications}
          onClose={() => setShowDrawer(false)}
          onMarkAllRead={handleMarkAllRead}
        />
      </PageWrapper>
    )
  }

  // ============================================
  // SEÇÃO: GAMIFICATION LIVE
  // ============================================
  if (currentSection === 'gamification') {
    return (
      <PageWrapper
        backgroundColor={theme.colors.background.dark}
        showAnimatedBackground={true}
        showOverlay={false}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px 16px',
          }}
        >
          <BackButton onClick={() => setCurrentSection('menu')} />

          <h2
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '16px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.gold.DEFAULT,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              margin: '0 0 8px 0',
            }}
          >
            Gamification Live
          </h2>
          <p
            style={{
              fontSize: '12px',
              color: theme.colors.text.secondary,
              marginBottom: '20px',
            }}
          >
            Card de confirmação de presença com timer regressivo
          </p>

          {/* Presence Card - Active */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '8px' }}>
              Estado: Aguardando confirmação (timer de 30s para demo)
            </p>
            <PresenceConfirmCard
              blockNumber={3}
              blockName="Motivação - Transformando interesse em desejo"
              xpReward={10}
              timeLimit={30}
              onConfirm={() => setPresenceConfirmed(true)}
              onExpire={() => setPresenceExpired(true)}
              isConfirmed={presenceConfirmed}
              isExpired={presenceExpired}
            />
          </div>

          {/* Reset buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setPresenceConfirmed(false)
                setPresenceExpired(false)
              }}
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(100, 116, 139, 0.15)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                color: theme.colors.text.secondary,
                fontSize: '12px',
              }}
            >
              Resetar Demo
            </motion.button>
          </div>

          {/* Explanation */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(15, 17, 21, 0.8)',
              border: '1px solid rgba(100, 116, 139, 0.2)',
              borderRadius: '12px',
            }}
          >
            <h4 style={{ fontSize: '12px', color: theme.colors.text.primary, margin: '0 0 10px 0' }}>
              Como funciona:
            </h4>
            <ul style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
              <li>Admin avança bloco → Card aparece para usuários</li>
              <li>Timer regressivo de 10 min (30s na demo)</li>
              <li>Usuário clica "Confirmar Presença" → ganha XP</li>
              <li>Se tempo expira → perde os XP daquele bloco</li>
              <li>Cores mudam conforme urgência (roxo → amarelo → vermelho)</li>
            </ul>
          </div>
        </div>
      </PageWrapper>
    )
  }

  // ============================================
  // SEÇÃO: PERFIL
  // ============================================
  if (currentSection === 'profile') {
    return (
      <PageWrapper
        backgroundColor={theme.colors.background.dark}
        showAnimatedBackground={true}
        showOverlay={false}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px 16px',
          }}
        >
          <BackButton onClick={() => setCurrentSection('menu')} />

          <h2
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '16px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.accent.purple.light,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              margin: '0 0 20px 0',
            }}
          >
            Perfil do Usuário
          </h2>

          <ProfileCard
            name="João Silva"
            email="joao.silva@empresa.com.br"
            businessType="Consultoria B2B"
            photoUrl={profilePhotoUrl}
            currentXp={175}
            totalXp={350}
            badges={[
              { id: 'diagnostico', icon: Award, name: 'Diagnóstico Completo', description: '', unlocked: true },
              { id: 'consultor', icon: Bot, name: 'Consultor IA', description: '', unlocked: true },
              { id: 'maratonista', icon: Award, name: 'Maratonista', description: '', unlocked: false },
              { id: 'early', icon: Award, name: 'Early Bird', description: '', unlocked: false },
            ]}
            gargalo={{ etapa: 'Conversão', valor: 3 }}
            onPhotoUpload={() => {
              // Simular upload
              setProfilePhotoUrl(profilePhotoUrl ? undefined : 'https://i.pravatar.cc/200')
            }}
            onLogout={() => alert('Logout clicked')}
          />
        </div>
      </PageWrapper>
    )
  }

  // ============================================
  // SEÇÃO: AI CHAT
  // ============================================
  if (currentSection === 'aichat') {
    return (
      <PageWrapper
        backgroundColor={theme.colors.background.dark}
        showAnimatedBackground={false}
        showOverlay={false}
      >
        <AIChatInterface
          userContext={mockUserContext}
          isAvailable={true}
          onBack={() => setCurrentSection('menu')}
        />
      </PageWrapper>
    )
  }

  // ============================================
  // SEÇÃO: SPONSOR
  // ============================================
  if (currentSection === 'sponsor') {
    return (
      <PageWrapper
        backgroundColor={theme.colors.background.dark}
        showAnimatedBackground={true}
        showOverlay={false}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '20px 16px',
          }}
        >
          <BackButton onClick={() => setCurrentSection('menu')} />

          <h2
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '16px',
              fontWeight: theme.typography.fontWeight.bold,
              color: '#10B981',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              margin: '0 0 20px 0',
            }}
          >
            Sponsor Badge
          </h2>

          {/* Demo área */}
          <div
            style={{
              padding: '20px',
              background: 'rgba(15, 17, 21, 0.9)',
              border: '1px solid rgba(100, 116, 139, 0.2)',
              borderRadius: '14px',
              marginBottom: '20px',
            }}
          >
            <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '16px' }}>
              Versão SEM link (durante evento):
            </p>
            <SponsorBadge isLinkActive={false} />
          </div>

          <div
            style={{
              padding: '20px',
              background: 'rgba(15, 17, 21, 0.9)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '14px',
              marginBottom: '20px',
            }}
          >
            <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '16px' }}>
              Versão COM link (após evento):
            </p>
            <SponsorBadge
              isLinkActive={true}
              onLinkClick={() => alert('Navegar para página da oferta')}
            />
          </div>

          {/* FAB Demo */}
          <div
            style={{
              padding: '20px',
              background: 'rgba(15, 17, 21, 0.9)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '14px',
            }}
          >
            <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '16px' }}>
              FAB do Chat IA (fixo no canto inferior direito):
            </p>
            <p style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
              O botão flutuante pulsa suavemente para chamar atenção e abre a interface do chat ao clicar.
            </p>
          </div>
        </div>

        {/* FAB */}
        <AIChatFAB
          onClick={() => setCurrentSection('aichat')}
          isAvailable={true}
        />
      </PageWrapper>
    )
  }

  return null
}
