/**
 * Página Pré-Evento - Dashboard/Cockpit Operacional
 *
 * Exibida após login, antes do evento começar.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  Radio,
  Target,
  Network,
  FileText,
  Video,
  Play,
  Check,
  Lock,
  ChevronRight,
  Zap,
  ShoppingCart,
  Info,
  X,
  Bell,
  User,
  Camera,
  Mail,
  Building2,
  Phone,
} from 'lucide-react'

import { PageWrapper, Countdown, BottomNav, AvatarButton, NotificationDrawer } from '../components/ui'
import type { Notification } from '../components/ui'
import { theme } from '../styles/theme'

interface JourneyStep {
  id: string
  title: string
  subtitle: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'locked' | 'purchase'
  progress?: number
  xp?: number
  isPurchase?: boolean
}

// Dados do perfil
interface ProfileData {
  name: string
  email: string
  phone: string
  company: string
  role: string
  photoUrl: string | null
}

export function PreEvento() {
  const [activeNav, setActiveNav] = useState('preparacao')
  const [showSchedule, setShowSchedule] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '',
    company: '',
    role: '',
    photoUrl: null,
  })

  // Calculate profile completion
  const profileFields = [profile.name, profile.email, profile.phone, profile.company, profile.role, profile.photoUrl]
  const completedFields = profileFields.filter(f => f && f.trim() !== '').length
  const profileProgress = Math.round((completedFields / profileFields.length) * 100)
  const isProfileComplete = profileProgress === 100

  // Notificações de exemplo
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'Bem-vindo à Imersão!',
      message: 'Complete seu perfil e as aulas preparatórias para ganhar XP.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'Aulas Bônus Disponíveis',
      message: 'Assista as aulas preparatórias para chegar pronto no evento.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
    },
  ])

  // Data do evento: 28/02/2026 às 9h30
  const eventDate = new Date('2026-02-28T09:30:00')

  const navItems = [
    { id: 'preparacao', label: 'Preparação', icon: <Rocket size={20} />, status: 'Liberado' },
    { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} />, badge: 'LIVE', status: 'Libera 14/03' },
    { id: 'posevento', label: 'Pós Evento', icon: <Target size={20} />, status: 'Libera 16/03' },
  ]

  // Steps depend on profile completion
  const getSteps = (): JourneyStep[] => [
    {
      id: 'imersao',
      title: 'Imersão Diagnóstico de Vendas',
      subtitle: 'Dois dias de um profundo diagnóstico no evento ao vivo sem gravação',
      icon: <Radio size={28} />,
      status: 'completed',
      xp: 50,
    },
    {
      id: 'protocolo',
      title: 'Protocolo de Iniciação',
      subtitle: 'Calibre seus dados para o seu sistema ser personalizado para o seu negócio',
      icon: <Network size={28} />,
      status: 'completed', // Protocolo agora é só concluído ou não, sem %
      xp: 100,
    },
    {
      id: 'perfil',
      title: 'Complete seu Perfil',
      subtitle: 'Adicione sua foto e informações para personalizar sua experiência',
      icon: <User size={28} />,
      status: isProfileComplete ? 'completed' : 'current',
      progress: isProfileComplete ? undefined : profileProgress,
      xp: 75,
    },
    {
      id: 'dossie',
      title: 'Dossiê do Negócio',
      subtitle: 'Análise completa do seu processo de vendas',
      icon: <FileText size={28} />,
      status: 'purchase',
      isPurchase: true,
      xp: 75,
    },
    {
      id: 'aulas',
      title: 'Aulas Editadas',
      subtitle: 'Chance de revisar o conteúdo do evento durante 1 ano',
      icon: <Video size={28} />,
      status: 'purchase',
      isPurchase: true,
      xp: 50,
    },
    {
      id: 'bonus',
      title: 'Assistir Aulas Bônus',
      subtitle: 'Clique abaixo para assistir as aulas bônus e chegar preparado para o evento',
      icon: <Play size={28} />,
      status: 'current',
      progress: 0,
      xp: 50,
    },
  ]

  const [steps, setSteps] = useState<JourneyStep[]>(getSteps())

  // Update steps when profile changes
  const updateStepsWithProfile = () => {
    setSteps(getSteps())
  }

  const totalXP = steps
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + (s.xp || 0), 0)

  const handleComplete = (stepId: string) => {
    setSteps(prev => {
      const stepIndex = prev.findIndex(s => s.id === stepId)
      const newSteps = [...prev]
      newSteps[stepIndex] = { ...newSteps[stepIndex], status: 'completed', progress: 100 }
      return newSteps
    })
  }

  const handleStepClick = (stepId: string, status: JourneyStep['status']) => {
    if (stepId === 'perfil') {
      setShowProfileModal(true)
    } else if (status === 'current') {
      handleComplete(stepId)
    }
  }

  // Handle photo upload simulation
  const handlePhotoUpload = () => {
    // Simula upload de foto
    setProfile(prev => ({
      ...prev,
      photoUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(prev.name) + '&background=22d3ee&color=050505&size=200',
    }))
    setTimeout(updateStepsWithProfile, 100)
  }

  // Handle profile field change
  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setTimeout(updateStepsWithProfile, 100)
  }

  const getStatusColor = (status: JourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return theme.colors.accent.cyan.DEFAULT
      case 'current':
        return theme.colors.accent.purple.light
      case 'purchase':
        return theme.colors.gold.DEFAULT
      case 'locked':
        return theme.colors.text.muted
    }
  }

  const getStatusGlow = (status: JourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return '0 0 30px rgba(34, 211, 238, 0.5)'
      case 'current':
        return '0 0 30px rgba(168, 85, 247, 0.5)'
      case 'purchase':
        return '0 0 20px rgba(245, 158, 11, 0.3)'
      case 'locked':
        return 'none'
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  }

  const headerVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  }

  return (
    <PageWrapper
      backgroundColor={theme.colors.background.dark}
      showAnimatedBackground={true}
      showOverlay={false}
    >
      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: '180px',
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ padding: '20px 16px' }}
        >
          {/* ==================== HEADER ==================== */}
          <motion.div variants={headerVariants} style={{ marginBottom: '20px' }}>
            {/* Top Bar - Avatar + Notifications */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              {/* XP Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                }}
              >
                <Zap size={14} color={theme.colors.gold.DEFAULT} />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: theme.colors.gold.DEFAULT,
                  }}
                >
                  {totalXP} XP
                </span>
              </div>

              {/* Right side - Notifications + Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Notification Bell */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifications(true)}
                  style={{
                    position: 'relative',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(100, 116, 139, 0.15)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Bell size={18} color={theme.colors.text.secondary} />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        border: '2px solid #050505',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#fff',
                      }}
                    >
                      {notifications.filter(n => !n.read).length}
                    </div>
                  )}
                </motion.button>

                {/* Avatar */}
                <AvatarButton
                  name={profile.name}
                  photoUrl={profile.photoUrl || undefined}
                  onClick={() => setShowProfileModal(true)}
                />
              </div>
            </div>

            {/* Logo/Título - Invertido */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {/* Título menor em branco */}
              <h1
                style={{
                  fontFamily: theme.typography.fontFamily.body,
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.secondary,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  margin: 0,
                  lineHeight: 1,
                }}
              >
                IMERSÃO ONLINE
              </h1>
              {/* Subtítulo maior em cyan com glow */}
              <h2
                style={{
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '22px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.accent.cyan.DEFAULT,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textShadow: `
                    0 0 20px rgba(34, 211, 238, 0.6),
                    0 0 40px rgba(34, 211, 238, 0.4)
                  `,
                  margin: '2px 0 0 0',
                  lineHeight: 1,
                }}
              >
                DIAGNÓSTICO DE VENDAS
              </h2>
            </div>

            {/* Countdown */}
            <div style={{ position: 'relative' }}>
              <Countdown targetDate={eventDate} label="INÍCIO DA OPERAÇÃO" />

              {/* Info Icon */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSchedule(true)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: theme.colors.accent.cyan.DEFAULT,
                }}
              >
                <Info size={14} />
              </motion.button>

              {/* Schedule Modal */}
              {showSchedule && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, rgba(10, 12, 18, 0.98) 0%, rgba(5, 8, 15, 0.99) 100%)',
                    border: '1px solid rgba(34, 211, 238, 0.4)',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    zIndex: 10,
                  }}
                >
                  {/* Close Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSchedule(false)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(100, 116, 139, 0.2)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: theme.colors.text.secondary,
                    }}
                  >
                    <X size={12} />
                  </motion.button>

                  {/* Schedule Content */}
                  <div
                    style={{
                      fontSize: '10px',
                      color: theme.colors.text.secondary,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    AGENDA DO EVENTO
                  </div>
                  <div
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '20px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.accent.cyan.DEFAULT,
                      textShadow: '0 0 15px rgba(34, 211, 238, 0.5)',
                      marginBottom: '12px',
                    }}
                  >
                    28/02 e 01/03
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: theme.colors.text.primary,
                      textAlign: 'center',
                      lineHeight: 1.6,
                    }}
                  >
                    <span style={{ color: theme.colors.accent.cyan.DEFAULT }}>9h30 - 12h30</span>
                    <span style={{ color: theme.colors.text.muted, margin: '0 8px' }}>|</span>
                    <span style={{ color: theme.colors.accent.cyan.DEFAULT }}>14h00 - 17h30</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ==================== JOURNEY / GAMIFICATION ==================== */}
          <motion.div variants={itemVariants}>
            {/* XP Counter + Progress */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
              }}
            >
              {/* XP Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Zap size={20} color={theme.colors.gold.DEFAULT} />
                <span
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '18px',
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.gold.DEFAULT,
                  }}
                >
                  {totalXP} XP
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: theme.colors.text.secondary,
                    marginLeft: '4px',
                  }}
                >
                  / 200 XP
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(10, 12, 18, 0.6)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalXP / 200) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${theme.colors.gold.DEFAULT} 0%, ${theme.colors.gold.light} 100%)`,
                      borderRadius: '4px',
                      boxShadow: `0 0 10px ${theme.colors.gold.DEFAULT}`,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    color: theme.colors.text.secondary,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginTop: '8px',
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  NÍVEL DE PRONTIDÃO DO SEU SISTEMA: {Math.round((totalXP / 200) * 100)}%
                </span>
              </div>
            </div>

            {/* Journey Steps */}
            <div style={{ position: 'relative' }}>
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  style={{ position: 'relative' }}
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '35px',
                        top: '70px',
                        width: '2px',
                        height: '40px',
                        background: step.status === 'completed'
                          ? `linear-gradient(180deg, ${theme.colors.accent.cyan.DEFAULT} 0%, ${theme.colors.accent.cyan.DEFAULT} 100%)`
                          : 'rgba(100, 116, 139, 0.3)',
                        boxShadow: step.status === 'completed'
                          ? `0 0 10px ${theme.colors.accent.cyan.DEFAULT}`
                          : 'none',
                      }}
                    />
                  )}

                  {/* Step Card */}
                  <motion.div
                    whileHover={step.status !== 'locked' ? { scale: 1.02 } : {}}
                    whileTap={step.status !== 'locked' ? { scale: 0.98 } : {}}
                    onClick={() => handleStepClick(step.id, step.status)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      marginBottom: '16px',
                      background: step.status === 'locked'
                        ? 'rgba(15, 17, 21, 0.6)'
                        : 'linear-gradient(135deg, rgba(15, 17, 21, 0.9) 0%, rgba(20, 25, 35, 0.8) 100%)',
                      border: `1px solid ${
                        step.status === 'completed'
                          ? 'rgba(34, 211, 238, 0.4)'
                          : step.status === 'current'
                          ? 'rgba(168, 85, 247, 0.4)'
                          : step.status === 'purchase'
                          ? 'rgba(245, 158, 11, 0.4)'
                          : 'rgba(100, 116, 139, 0.2)'
                      }`,
                      borderRadius: '12px',
                      boxShadow: getStatusGlow(step.status),
                      cursor: step.status === 'current' || step.status === 'purchase' ? 'pointer' : 'default',
                      opacity: step.status === 'locked' ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Icon Circle */}
                    <div
                      style={{
                        position: 'relative',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: step.status === 'completed'
                          ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)'
                          : step.status === 'current'
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)'
                          : step.status === 'purchase'
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)'
                          : 'rgba(30, 35, 45, 0.5)',
                        border: `2px solid ${getStatusColor(step.status)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getStatusColor(step.status),
                        boxShadow: step.status !== 'locked'
                          ? `inset 0 0 20px ${getStatusColor(step.status)}33`
                          : 'none',
                        flexShrink: 0,
                      }}
                    >
                      {step.status === 'completed' ? (
                        <Check size={28} strokeWidth={3} />
                      ) : step.status === 'locked' ? (
                        <Lock size={24} />
                      ) : step.status === 'purchase' ? (
                        <ShoppingCart size={24} />
                      ) : (
                        step.icon
                      )}

                      {/* Pulse animation for current */}
                      {step.status === 'current' && (
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
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
                            borderRadius: '50%',
                            border: `2px solid ${theme.colors.accent.purple.light}`,
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontFamily: theme.typography.fontFamily.orbitron,
                          fontSize: '14px',
                          fontWeight: theme.typography.fontWeight.bold,
                          color: step.status === 'locked'
                            ? theme.colors.text.muted
                            : theme.colors.text.primary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: 0,
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '11px',
                          color: theme.colors.text.secondary,
                          margin: '4px 0 0 0',
                        }}
                      >
                        {step.subtitle}
                      </p>

                      {/* Progress bar for current step */}
                      {step.status === 'current' && step.progress !== undefined && (
                        <div style={{ marginTop: '10px' }}>
                          <div
                            style={{
                              width: '100%',
                              height: '6px',
                              background: 'rgba(30, 35, 45, 0.8)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${step.progress}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              style={{
                                height: '100%',
                                background: `linear-gradient(90deg, ${theme.colors.accent.purple.DEFAULT} 0%, ${theme.colors.accent.purple.light} 100%)`,
                                borderRadius: '3px',
                                boxShadow: `0 0 10px ${theme.colors.accent.purple.light}`,
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '9px',
                              color: theme.colors.text.muted,
                              marginTop: '4px',
                              display: 'block',
                            }}
                          >
                            {step.progress}% completo
                          </span>
                        </div>
                      )}
                    </div>

                    {/* XP Badge */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      {/* XP Value - sempre mostrar se tiver xp */}
                      {step.xp && (
                        <>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: theme.typography.fontWeight.bold,
                              color: step.status === 'completed'
                                ? theme.colors.gold.DEFAULT
                                : step.isPurchase
                                ? theme.colors.gold.light
                                : theme.colors.text.muted,
                            }}
                          >
                            +{step.xp}
                          </span>
                          <span
                            style={{
                              fontSize: '8px',
                              color: step.isPurchase ? theme.colors.gold.light : theme.colors.text.muted,
                              textTransform: 'uppercase',
                            }}
                          >
                            XP
                          </span>
                        </>
                      )}
                      {/* Indicador de Compra */}
                      {step.isPurchase && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            marginTop: '4px',
                            padding: '2px 6px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '4px',
                          }}
                        >
                          <ShoppingCart size={10} color={theme.colors.gold.DEFAULT} />
                          <span
                            style={{
                              fontSize: '7px',
                              color: theme.colors.gold.DEFAULT,
                              textTransform: 'uppercase',
                              fontWeight: theme.typography.fontWeight.bold,
                              letterSpacing: '0.03em',
                            }}
                          >
                            Compra
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Arrow for current */}
                    {step.status === 'current' && (
                      <ChevronRight
                        size={20}
                        color={theme.colors.accent.purple.light}
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ==================== MÓDULOS PREPARATÓRIOS ==================== */}
          <motion.div variants={itemVariants} style={{ marginTop: '24px' }}>
            {/* Section Title */}
            <h3
              style={{
                fontSize: '14px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '16px',
              }}
            >
              MÓDULOS PREPARATÓRIOS{' '}
              <span style={{ color: theme.colors.text.secondary, fontWeight: 'normal' }}>
                (Aulas)
              </span>
            </h3>

            {/* Aulas Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
            >
              {[1, 2, 3].map((num) => (
                <motion.div
                  key={num}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(10, 15, 20, 0.8) 0%, rgba(5, 10, 18, 0.9) 100%)',
                    border: '1px solid rgba(34, 211, 238, 0.35)',
                    borderRadius: '8px',
                    padding: '14px 8px 10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 0 15px rgba(34, 211, 238, 0.05)',
                  }}
                >
                  {/* Aula Icon Image */}
                  <div
                    style={{
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src="/aula+pdf.png"
                      alt={`Aula ${num}`}
                      style={{
                        width: '70px',
                        height: 'auto',
                        filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))',
                      }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary,
                      letterSpacing: '0.03em',
                    }}
                  >
                    Aula {num}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ==================== PROFILE MODAL ==================== */}
      {showProfileModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '400px',
              maxHeight: '85vh',
              background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.98) 0%, rgba(10, 12, 18, 0.99) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '20px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={20} color={theme.colors.accent.purple.light} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: theme.colors.accent.purple.light,
                      margin: 0,
                    }}
                  >
                    MEU PERFIL
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Zap size={12} color={theme.colors.gold.DEFAULT} />
                    <span style={{ fontSize: '10px', color: theme.colors.gold.DEFAULT, fontWeight: 'bold' }}>
                      +75 XP ao completar
                    </span>
                  </div>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowProfileModal(false)}
                style={{
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color={theme.colors.text.muted} />
              </motion.button>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
              }}
            >
              {/* Progress */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: theme.colors.text.muted }}>
                    Progresso do perfil
                  </span>
                  <span style={{ fontSize: '11px', color: theme.colors.accent.purple.light, fontWeight: 'bold' }}>
                    {profileProgress}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(30, 35, 45, 0.8)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profileProgress}%` }}
                    style={{
                      height: '100%',
                      background: profileProgress === 100
                        ? theme.colors.accent.cyan.DEFAULT
                        : `linear-gradient(90deg, ${theme.colors.accent.purple.DEFAULT} 0%, ${theme.colors.accent.purple.light} 100%)`,
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePhotoUpload}
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: profile.photoUrl
                      ? `url(${profile.photoUrl}) center/cover`
                      : 'rgba(168, 85, 247, 0.15)',
                    border: `3px solid ${profile.photoUrl ? theme.colors.accent.cyan.DEFAULT : 'rgba(168, 85, 247, 0.4)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {!profile.photoUrl && (
                    <Camera size={32} color={theme.colors.accent.purple.light} />
                  )}
                  {/* Overlay on hover */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                  >
                    <Camera size={24} color="#fff" />
                  </div>
                </motion.button>
              </div>
              <p style={{ fontSize: '11px', color: theme.colors.text.muted, textAlign: 'center', marginBottom: '4px' }}>
                {profile.photoUrl ? 'Clique para alterar a foto' : 'Clique para adicionar uma foto'}
              </p>
              <p style={{ fontSize: '9px', color: theme.colors.text.muted, textAlign: 'center', marginBottom: '20px', fontStyle: 'italic' }}>
                Não aparecerá para outros participantes
              </p>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name */}
                <div>
                  <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <User size={12} />
                    Nome completo
                    {profile.name && <Check size={12} color={theme.colors.accent.cyan.DEFAULT} />}
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    placeholder="Seu nome"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: `1px solid ${profile.name ? 'rgba(34, 211, 238, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                      borderRadius: '10px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: theme.colors.text.muted, marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
                    Visível para outros participantes
                  </span>
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Mail size={12} />
                    E-mail
                    {profile.email && <Check size={12} color={theme.colors.accent.cyan.DEFAULT} />}
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: `1px solid ${profile.email ? 'rgba(34, 211, 238, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                      borderRadius: '10px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: theme.colors.text.muted, marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
                    Não aparecerá para outros participantes
                  </span>
                </div>

                {/* Phone */}
                <div>
                  <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Phone size={12} />
                    Telefone
                    {profile.phone && <Check size={12} color={theme.colors.accent.cyan.DEFAULT} />}
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: `1px solid ${profile.phone ? 'rgba(34, 211, 238, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                      borderRadius: '10px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: theme.colors.text.muted, marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
                    Não aparecerá para outros participantes
                  </span>
                </div>

                {/* Company */}
                <div>
                  <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Building2 size={12} />
                    Empresa
                    {profile.company && <Check size={12} color={theme.colors.accent.cyan.DEFAULT} />}
                  </label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => handleProfileChange('company', e.target.value)}
                    placeholder="Nome da empresa"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: `1px solid ${profile.company ? 'rgba(34, 211, 238, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                      borderRadius: '10px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: theme.colors.text.muted, marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
                    Não aparecerá para outros participantes
                  </span>
                </div>

                {/* Role */}
                <div>
                  <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <User size={12} />
                    Cargo / Função
                    {profile.role && <Check size={12} color={theme.colors.accent.cyan.DEFAULT} />}
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => handleProfileChange('role', e.target.value)}
                    placeholder="Seu cargo"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: `1px solid ${profile.role ? 'rgba(34, 211, 238, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                      borderRadius: '10px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: theme.colors.text.muted, marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
                    Não aparecerá para outros participantes
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(100, 116, 139, 0.2)',
              }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfileModal(false)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: isProfileComplete
                    ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                  border: `1px solid ${isProfileComplete ? 'rgba(34, 211, 238, 0.5)' : 'rgba(168, 85, 247, 0.5)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: isProfileComplete ? theme.colors.accent.cyan.DEFAULT : theme.colors.accent.purple.light,
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {isProfileComplete ? (
                  <>
                    <Check size={18} />
                    PERFIL COMPLETO
                  </>
                ) : (
                  'SALVAR ALTERAÇÕES'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ==================== NOTIFICATION DRAWER ==================== */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={() => {}}
      />

      {/* ==================== BOTTOM NAVIGATION ==================== */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
