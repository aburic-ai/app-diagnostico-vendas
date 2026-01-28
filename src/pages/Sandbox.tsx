/**
 * Sandbox - Proposta de Gamification Visual
 *
 * Sistema de progressão: Protocolo → Dossiê → Aulas Editadas
 * Cada etapa só desbloqueia após completar a anterior.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Network,
  FileText,
  Video,
  Check,
  Lock,
  ChevronRight,
  Zap,
  Radio,
  ShoppingCart,
  Play,
} from 'lucide-react'

import { PageWrapper } from '../components/ui'
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

export function Sandbox() {
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

      // Mark current as completed
      newSteps[stepIndex] = { ...newSteps[stepIndex], status: 'completed', progress: 100 }

      // Unlock next step
      if (stepIndex < newSteps.length - 1) {
        newSteps[stepIndex + 1] = { ...newSteps[stepIndex + 1], status: 'current', progress: 0 }
      }

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
          style={{ marginBottom: '24px', textAlign: 'center' }}
        >
          <h1
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '24px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.accent.cyan.DEFAULT,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
              margin: 0,
            }}
          >
            SUA JORNADA
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: theme.colors.text.secondary,
              marginTop: '4px',
            }}
          >
            Complete cada etapa para desbloquear a próxima
          </p>
        </motion.div>

        {/* XP Counter */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '32px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
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
        </motion.div>

        {/* Journey Steps */}
        <div style={{ position: 'relative' }}>
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              style={{ position: 'relative', marginBottom: index < steps.length - 1 ? '0' : '0' }}
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

                {/* XP Badge or Purchase Badge */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {step.isPurchase ? (
                    <>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                          border: '1px solid rgba(34, 211, 238, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShoppingCart size={14} color={theme.colors.accent.cyan.DEFAULT} />
                      </div>
                      <span
                        style={{
                          fontSize: '7px',
                          color: theme.colors.accent.cyan.DEFAULT,
                          textTransform: 'uppercase',
                          fontWeight: theme.typography.fontWeight.bold,
                          letterSpacing: '0.05em',
                        }}
                      >
                        Compra
                      </span>
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: theme.typography.fontWeight.bold,
                          color: step.status === 'completed'
                            ? theme.colors.gold.DEFAULT
                            : theme.colors.text.muted,
                        }}
                      >
                        +{step.xp}
                      </span>
                      <span
                        style={{
                          fontSize: '8px',
                          color: theme.colors.text.muted,
                          textTransform: 'uppercase',
                        }}
                      >
                        XP
                      </span>
                    </>
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

        {/* Helper Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            fontSize: '11px',
            color: theme.colors.text.muted,
            textAlign: 'center',
            marginTop: '20px',
            padding: '0 20px',
          }}
        >
          Clique no item ativo para simular conclusão
        </motion.p>
      </div>
    </PageWrapper>
  )
}
