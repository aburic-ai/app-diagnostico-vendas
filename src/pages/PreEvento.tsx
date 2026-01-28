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
} from 'lucide-react'

import { PageWrapper, Countdown, BottomNav } from '../components/ui'
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

export function PreEvento() {
  const [activeNav, setActiveNav] = useState('preparacao')
  const [showSchedule, setShowSchedule] = useState(false)

  // Data do evento: 28/02/2026 às 9h30
  const eventDate = new Date('2026-02-28T09:30:00')

  const navItems = [
    { id: 'preparacao', label: 'Preparação', icon: <Rocket size={20} />, status: 'Liberado' },
    { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} />, badge: 'LIVE', status: 'Libera 14/03' },
    { id: 'posevento', label: 'Pós Evento', icon: <Target size={20} />, status: 'Libera 16/03' },
  ]

  const [steps, setSteps] = useState<JourneyStep[]>([
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
      status: 'current',
      progress: 60,
      xp: 100,
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
  ])

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
                    onClick={() => step.status === 'current' && handleComplete(step.id)}
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

      {/* ==================== BOTTOM NAVIGATION ==================== */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
