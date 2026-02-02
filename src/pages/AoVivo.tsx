/**
 * Página Ao Vivo - Durante o Evento
 *
 * Core da experiência: diagnóstico em tempo real, gráfico radar,
 * alertas de gargalo, módulos em scroll horizontal e oferta bloqueada.
 */

import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket,
  Radio,
  Target,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
  Bell,
  Zap,
  X,
  Star,
  Crown,
  Ticket,
} from 'lucide-react'

import {
  PageWrapper,
  BottomNav,
  PageHeader,
  RadarChart,
  DiagnosticSlider,
  GargaloAlert,
  LockedOffer,
  AvatarButton,
  NotificationDrawer,
  AIChatFAB,
  SponsorBadge,
} from '../components/ui'
import type { IMPACTData } from '../components/ui'
import type { Notification } from '../hooks/useNotifications'
import { theme } from '../styles/theme'
import { getModuleById, EVENT_MODULES } from '../data/modules'
import { useDiagnostic, useAuth, useUserProgress } from '../hooks'
import type { DiagnosticScores } from '../hooks'
import { XP_CONFIG } from '../config/xp-system'

// Links da oferta (viriam do Admin/Backend)
const OFFER_LINKS = {
  ingresso1Percent: 'https://pay.hotmart.com/K91662125A?off=66czkxps',
  ingressoExecutivo: 'https://pay.hotmart.com/K91662125A?off=y1frgqvy',
  utmSource: 'appdiagn',
  utmMedium: 'app',
  utmCampaign: 'imersao2026',
  utmContent: 'aovivo',
}

// Helper para construir URL com UTM
const buildOfferUrl = (baseUrl: string, utmContent?: string): string => {
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}utm_source=${OFFER_LINKS.utmSource}&utm_medium=${OFFER_LINKS.utmMedium}&utm_campaign=${OFFER_LINKS.utmCampaign}&utm_content=${utmContent || OFFER_LINKS.utmContent}`
}

// Helper: Converter DiagnosticScores para IMPACTData
const scoresToIMPACT = (scores: DiagnosticScores | null): IMPACTData => {
  if (!scores) {
    return {
      inspiracao: 0,
      motivacao: 0,
      preparacao: 0,
      apresentacao: 0,
      conversao: 0,
      transformacao: 0,
    }
  }
  return {
    inspiracao: scores.intention_score,
    motivacao: scores.message_score,
    preparacao: scores.pain_score,
    apresentacao: scores.authority_score,
    conversao: scores.commitment_score,
    transformacao: scores.transformation_score,
  }
}

// Helper: Converter IMPACTData para DiagnosticScores
const impactToScores = (impact: IMPACTData): DiagnosticScores => {
  return {
    intention_score: impact.inspiracao,
    message_score: impact.motivacao,
    pain_score: impact.preparacao,
    authority_score: impact.apresentacao,
    commitment_score: impact.conversao,
    transformation_score: impact.transformacao,
  }
}

export function AoVivo() {
  const { profile, user } = useAuth()
  const { getDiagnosticByDay, saveDiagnostic, loading: diagnosticLoading } = useDiagnostic()
  const { completeStep } = useUserProgress()
  const location = useLocation()

  // Refs para scroll to section (avisos clickables)
  const diagnosticSlidersRef = useRef<HTMLDivElement>(null)

  const [activeNav, setActiveNav] = useState('aovivo')
  const [selectedDay, setSelectedDay] = useState<1 | 2>(1)
  const [showSliders, setShowSliders] = useState(true)
  const [currentModule] = useState(5) // Módulo atual (simulado - vem do admin)
  const [viewingModule, setViewingModule] = useState(5) // Módulo que o usuário está vendo
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [isOfferUnlocked] = useState(false) // Libera no módulo 11
  const [confirmedModules, setConfirmedModules] = useState<number[]>([0, 1, 2, 3, 4]) // Módulos já confirmados

  // Notificações de exemplo
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'info',
      title: 'Intervalo de 15 minutos',
      message: 'Aproveite para preencher seu diagnóstico',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: true,
    },
    {
      id: '2',
      type: 'alert',
      title: 'Voltamos ao vivo!',
      message: 'Módulo 5 começando agora',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  // Dados do diagnóstico - inicializados vazios, carregados do banco via useEffect
  const [day1Data, setDay1Data] = useState<IMPACTData>({
    inspiracao: 0,
    motivacao: 0,
    preparacao: 0,
    apresentacao: 0,
    conversao: 0,
    transformacao: 0,
  })

  const [day2Data, setDay2Data] = useState<IMPACTData>({
    inspiracao: 0,
    motivacao: 0,
    preparacao: 0,
    apresentacao: 0,
    conversao: 0,
    transformacao: 0,
  })

  // Scroll to section (avisos clickables)
  useEffect(() => {
    const state = location.state as { scrollTo?: string; highlight?: boolean } | undefined
    if (!state?.scrollTo) return

    // Mapear target_section para ref
    const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
      'diagnostico': diagnosticSlidersRef,
      'diagnostic-sliders': diagnosticSlidersRef,
    }

    const targetRef = sectionRefs[state.scrollTo]
    if (!targetRef?.current) return

    // Aguardar animações carregarem
    setTimeout(() => {
      targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Highlight opcional
      if (state.highlight && targetRef.current) {
        const element = targetRef.current
        element.style.animation = 'pulse 1s ease-in-out 2'

        // Remover animation após terminar
        setTimeout(() => {
          element.style.animation = ''
        }, 2000)
      }
    }, 500) // Delay para garantir que componentes renderizaram
  }, [location])

  // Carregar diagnósticos do banco quando disponíveis
  useEffect(() => {
    const day1Diagnostic = getDiagnosticByDay(1)
    const day2Diagnostic = getDiagnosticByDay(2)

    if (day1Diagnostic) {
      setDay1Data(scoresToIMPACT(day1Diagnostic))
    }

    if (day2Diagnostic) {
      setDay2Data(scoresToIMPACT(day2Diagnostic))
    }
  }, [diagnosticLoading])

  // Carregar módulos confirmados do perfil (completed_steps)
  useEffect(() => {
    if (profile?.completed_steps) {
      const moduleSteps = profile.completed_steps
        .filter(step => step.startsWith('module-') && step.endsWith('-checkin'))
        .map(step => {
          const match = step.match(/module-(\d+)-checkin/)
          return match ? parseInt(match[1]) : null
        })
        .filter((id): id is number => id !== null)

      if (moduleSteps.length > 0) {
        setConfirmedModules(moduleSteps)
        console.log('📥 Módulos confirmados carregados:', moduleSteps)
      }
    }
  }, [profile?.completed_steps])

  const currentData = selectedDay === 1 ? day1Data : day2Data
  const setCurrentData = selectedDay === 1 ? setDay1Data : setDay2Data

  // Encontrar gargalo (menor valor)
  const findGargalo = (data: IMPACTData) => {
    const entries = Object.entries(data) as [keyof IMPACTData, number][]
    const sorted = entries.sort((a, b) => a[1] - b[1])
    return sorted[0]
  }

  // Verificar se há dados preenchidos (não todos zeros)
  const hasFilledData = (data: IMPACTData) => {
    return Object.values(data).some(value => value > 0)
  }

  const gargalo = findGargalo(currentData)
  const showGargalo = hasFilledData(currentData) && gargalo[1] <= 5
  const gargaloMap: Record<keyof IMPACTData, { etapa: string; letra: string }> = {
    inspiracao: { etapa: 'Inspiração', letra: 'I' },
    motivacao: { etapa: 'Motivação', letra: 'M' },
    preparacao: { etapa: 'Preparação', letra: 'P' },
    apresentacao: { etapa: 'Apresentação', letra: 'A' },
    conversao: { etapa: 'Conversão', letra: 'C' },
    transformacao: { etapa: 'Transformação', letra: 'T' },
  }

  // Contexto do usuário para o chat
  const userContext = {
    name: profile?.name || 'Participante',
    businessType: 'Consultoria B2B',
    gargalo: { etapa: gargaloMap[gargalo[0]].etapa, valor: gargalo[1] },
    diagnostico: currentData,
  }

  const navItems = [
    { id: 'preparacao', label: 'Preparação', icon: <Rocket size={20} />, status: 'Liberado' },
    { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} />, badge: 'LIVE', status: 'Liberado' },
    { id: 'posevento', label: 'Pós Evento', icon: <Target size={20} />, status: 'Libera 16/03' },
  ]

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

  const updateDimension = async (key: keyof IMPACTData, value: number) => {
    // Atualizar estado local imediatamente (UX responsivo)
    const updatedData = { ...currentData, [key]: value }
    setCurrentData(updatedData)

    // Salvar no banco em background
    try {
      const scores = impactToScores(updatedData)
      const { error } = await saveDiagnostic(selectedDay, scores)

      if (error) {
        console.error('Erro ao salvar diagnóstico:', error)
      } else {
        console.log(`✅ Diagnóstico Dia ${selectedDay} salvo`)
      }
    } catch (err) {
      console.error('Erro ao salvar diagnóstico:', err)
    }
  }

  // Get current day from module
  const currentModuleData = getModuleById(currentModule)
  const currentDay = currentModuleData?.day || 1

  // Get viewing module data (for navigation)
  const viewingModuleData = getModuleById(viewingModule)
  const viewingDay = viewingModuleData?.day || 1
  const isViewingCurrent = viewingModule === currentModule
  const isViewingConfirmed = confirmedModules.includes(viewingModule)
  const canConfirmViewing = isViewingCurrent && !isViewingConfirmed

  // Handle presence confirmation
  const handleConfirmPresence = async (moduleId: number) => {
    if (!confirmedModules.includes(moduleId)) {
      // Atualizar estado local imediatamente (UX responsivo)
      setConfirmedModules(prev => [...prev, moduleId])

      // Salvar no Supabase com XP
      try {
        const stepId = `module-${moduleId}-checkin`
        await completeStep(stepId, XP_CONFIG.EVENT.MODULE_CHECKIN)
        console.log(`✅ Módulo ${moduleId} confirmado! +${XP_CONFIG.EVENT.MODULE_CHECKIN} XP`)
      } catch (error) {
        console.error('❌ Erro ao confirmar presença:', error)
      }
    }
  }

  // Navigate modules
  const handlePrevModule = () => {
    const dayModules = EVENT_MODULES.filter(m => m.day === viewingDay)
    const currentIndex = dayModules.findIndex(m => m.id === viewingModule)
    if (currentIndex > 0) {
      setViewingModule(dayModules[currentIndex - 1].id)
    }
  }

  const handleNextModule = () => {
    const dayModules = EVENT_MODULES.filter(m => m.day === viewingDay)
    const currentIndex = dayModules.findIndex(m => m.id === viewingModule)
    if (currentIndex < dayModules.length - 1) {
      setViewingModule(dayModules[currentIndex + 1].id)
    }
  }

  // Check if can navigate
  const dayModules = EVENT_MODULES.filter(m => m.day === viewingDay)
  const viewingIndex = dayModules.findIndex(m => m.id === viewingModule)
  const canGoPrev = viewingIndex > 0
  const canGoNext = viewingIndex < dayModules.length - 1

  // Calculate total XP from confirmed modules
  const totalXP = confirmedModules.length * XP_CONFIG.EVENT.MODULE_CHECKIN

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
          style={{ padding: '16px' }}
        >
          {/* ==================== HEADER WITH AVATAR ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}
          >
            <PageHeader
              title="IMERSÃO ONLINE"
              subtitle="DIAGNÓSTICO DE VENDAS"
              marginBottom="0px"
              centered={false}
            />

            {/* Avatar + Notifications */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(true)}
                style={{
                  position: 'relative',
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={20} color={theme.colors.text.secondary} />
                {unreadCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#EF4444',
                      border: '2px solid #050505',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#fff',
                    }}
                  >
                    {unreadCount}
                  </div>
                )}
              </motion.button>
              <AvatarButton
                name="João Silva"
                onClick={() => {/* TODO: navigate to profile */}}
              />
            </div>
          </motion.div>

          {/* ==================== UNIFIED LIVE + MODULES BOX ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              marginBottom: '20px',
              background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
              border: '1px solid rgba(255, 68, 68, 0.4)',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top glow effect */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent 0%, #FF4444 50%, transparent 100%)',
                boxShadow: '0 0 20px #FF444480',
              }}
            />

            {/* Content Section */}
            <div style={{ padding: '14px 16px' }}>
              {/* Top Row - Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                {/* Left side - Live badge + Day */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* AO VIVO Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: 'rgba(255, 68, 68, 0.15)',
                      border: '1px solid rgba(255, 68, 68, 0.4)',
                      borderRadius: '6px',
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#FF4444',
                        boxShadow: '0 0 10px #FF4444',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: theme.typography.fontWeight.bold,
                        color: '#FF4444',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      AO VIVO
                    </span>
                  </div>

                  {/* Day Badge */}
                  <span
                    style={{
                      fontSize: '10px',
                      color: theme.colors.accent.cyan.DEFAULT,
                      fontWeight: theme.typography.fontWeight.semibold,
                      padding: '4px 8px',
                      background: 'rgba(34, 211, 238, 0.1)',
                      borderRadius: '6px',
                    }}
                  >
                    DIA {currentDay}
                  </span>
                </div>

                {/* Right side - XP Counter */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '6px',
                  }}
                >
                  <Zap size={12} color={theme.colors.gold.DEFAULT} />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: theme.colors.gold.DEFAULT,
                    }}
                  >
                    {totalXP} XP
                  </span>
                </div>
              </div>

              {/* Module Info with Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Previous Arrow */}
                <motion.button
                  whileTap={canGoPrev ? { scale: 0.9 } : {}}
                  onClick={handlePrevModule}
                  disabled={!canGoPrev}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: canGoPrev ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.05)',
                    border: `1px solid ${canGoPrev ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)'}`,
                    cursor: canGoPrev ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    opacity: canGoPrev ? 1 : 0.3,
                  }}
                >
                  <ChevronLeft size={20} color={theme.colors.text.secondary} />
                </motion.button>

                {/* Module Content */}
                <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: '10px',
                      color: isViewingCurrent ? '#FF4444' : theme.colors.text.muted,
                      margin: '0 0 2px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {isViewingCurrent ? '● AO VIVO AGORA' : `MÓDULO ${viewingModule} DE ${EVENT_MODULES.length - 1}`}
                  </p>
                  <h3
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: isViewingCurrent ? theme.colors.text.primary : theme.colors.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {viewingModuleData?.title || `MÓDULO ${viewingModule}`}
                  </h3>
                  {viewingModuleData?.subtitle && (
                    <p
                      style={{
                        fontSize: '11px',
                        color: theme.colors.text.secondary,
                        margin: '4px 0 0 0',
                        lineHeight: 1.4,
                      }}
                    >
                      {viewingModuleData.subtitle}
                    </p>
                  )}
                </div>

                {/* Next Arrow */}
                <motion.button
                  whileTap={canGoNext ? { scale: 0.9 } : {}}
                  onClick={handleNextModule}
                  disabled={!canGoNext}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: canGoNext ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.05)',
                    border: `1px solid ${canGoNext ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.1)'}`,
                    cursor: canGoNext ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    opacity: canGoNext ? 1 : 0.3,
                  }}
                >
                  <ChevronRight size={20} color={theme.colors.text.secondary} />
                </motion.button>
              </div>

              {/* Confirm Presence Button */}
              {isViewingCurrent && (
                <div style={{ marginTop: '14px' }}>
                  {canConfirmViewing ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleConfirmPresence(viewingModule)}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: theme.colors.accent.purple.light,
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Zap size={16} />
                      ESTOU ASSISTINDO +{XP_CONFIG.EVENT.MODULE_CHECKIN} XP
                    </motion.button>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        background: 'rgba(34, 211, 238, 0.1)',
                        border: '1px solid rgba(34, 211, 238, 0.3)',
                        borderRadius: '10px',
                      }}
                    >
                      <Check size={16} color={theme.colors.accent.cyan.DEFAULT} />
                      <span
                        style={{
                          fontSize: '12px',
                          color: theme.colors.accent.cyan.DEFAULT,
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                        }}
                      >
                        CHECK-IN CONFIRMADO
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Not current module indicator */}
              {!isViewingCurrent && (
                <div style={{ marginTop: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: viewingModule < currentModule ? 'rgba(34, 211, 238, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      border: `1px solid ${viewingModule < currentModule ? 'rgba(34, 211, 238, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                      borderRadius: '10px',
                    }}
                  >
                    {viewingModule < currentModule ? (
                      <>
                        <Check size={16} color={theme.colors.accent.cyan.DEFAULT} />
                        <span style={{ fontSize: '11px', color: theme.colors.accent.cyan.DEFAULT, fontWeight: 'bold' }}>
                          MÓDULO CONCLUÍDO
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} color={theme.colors.text.muted} />
                        <span style={{ fontSize: '11px', color: theme.colors.text.muted, fontWeight: 'bold' }}>
                          EM BREVE
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ==================== DAY SELECTOR ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            {[1, 2].map((day) => (
              <motion.button
                key={day}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(day as 1 | 2)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: selectedDay === day
                    ? day === 1
                      ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)'
                    : 'rgba(15, 17, 21, 0.6)',
                  border: `1px solid ${
                    selectedDay === day
                      ? day === 1
                        ? 'rgba(34, 211, 238, 0.5)'
                        : 'rgba(168, 85, 247, 0.5)'
                      : 'rgba(100, 116, 139, 0.2)'
                  }`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: selectedDay === day
                    ? day === 1
                      ? '0 0 20px rgba(34, 211, 238, 0.3)'
                      : '0 0 20px rgba(168, 85, 247, 0.3)'
                    : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.bold,
                    color: selectedDay === day
                      ? day === 1
                        ? theme.colors.accent.cyan.DEFAULT
                        : theme.colors.accent.purple.light
                      : theme.colors.text.muted,
                    letterSpacing: '0.1em',
                  }}
                >
                  DIA {day}
                </span>
                <p
                  style={{
                    fontSize: '10px',
                    color: theme.colors.text.secondary,
                    margin: '4px 0 0 0',
                  }}
                >
                  {day === 1 ? 'Etapas da Jornada' : 'Profundidade'}
                </p>
              </motion.button>
            ))}
          </motion.div>

          {/* ==================== RADAR CHART ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <RadarChart
              data1={day1Data}
              data2={day2Data.inspiracao > 0 ? day2Data : undefined}
              selectedDay={selectedDay}
              size={280}
            />
          </motion.div>

          {/* ==================== SLIDERS SECTION ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            {/* Toggle Header */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSliders(!showSliders)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: showSliders ? '12px 12px 0 0' : '12px',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                AJUSTAR DIAGNÓSTICO
              </span>
              {showSliders ? (
                <ChevronUp size={20} color={theme.colors.accent.cyan.DEFAULT} />
              ) : (
                <ChevronDown size={20} color={theme.colors.accent.cyan.DEFAULT} />
              )}
            </motion.button>

            {/* Sliders */}
            {showSliders && (
              <motion.div
                ref={diagnosticSlidersRef}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  background: 'rgba(10, 12, 18, 0.5)',
                  border: '1px solid rgba(34, 211, 238, 0.2)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <DiagnosticSlider
                  label="Inspiração"
                  letter="I"
                  description="O cliente sabe que tem um problema?"
                  value={currentData.inspiracao}
                  onChange={(v) => updateDimension('inspiracao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Motivação"
                  letter="M"
                  description="Ele quer resolver agora?"
                  value={currentData.motivacao}
                  onChange={(v) => updateDimension('motivacao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Preparação"
                  letter="P"
                  description="Ele está pronto para comprar?"
                  value={currentData.preparacao}
                  onChange={(v) => updateDimension('preparacao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Apresentação"
                  letter="A"
                  description="Sua oferta é clara?"
                  value={currentData.apresentacao}
                  onChange={(v) => updateDimension('apresentacao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Conversão"
                  letter="C"
                  description="Ele consegue comprar sem fricção?"
                  value={currentData.conversao}
                  onChange={(v) => updateDimension('conversao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
                <DiagnosticSlider
                  label="Transformação"
                  letter="T"
                  description="Ele vira um promotor?"
                  value={currentData.transformacao}
                  onChange={(v) => updateDimension('transformacao', v)}
                  color={selectedDay === 1 ? 'cyan' : 'purple'}
                />
              </motion.div>
            )}
          </motion.div>

          {/* ==================== GARGALO ALERT ==================== */}
          {showGargalo && (
            <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
              <GargaloAlert
                etapa={gargaloMap[gargalo[0]].etapa}
                letra={gargaloMap[gargalo[0]].letra}
                valor={gargalo[1]}
                impacto="Clientes abandonam antes de fechar porque não percebem urgência ou valor."
                consequencia="Perda estimada de 30-40% das vendas potenciais no próximo trimestre."
                expanded={true}
              />
            </motion.div>
          )}

          {/* ==================== ACTION BUTTONS ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {/* Workbook Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.4)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(34, 211, 238, 0.2)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookOpen size={22} color={theme.colors.accent.cyan.DEFAULT} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.accent.cyan.DEFAULT,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Workbook
              </span>
              <span
                style={{
                  fontSize: '9px',
                  color: theme.colors.text.secondary,
                }}
              >
                Exercícios do módulo
              </span>
            </motion.button>

            {/* IA Simulator Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAIChat(true)}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Brain size={22} color={theme.colors.accent.purple.light} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.accent.purple.light,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Simulador IA
              </span>
              <span
                style={{
                  fontSize: '9px',
                  color: theme.colors.text.secondary,
                }}
              >
                Testar hipóteses
              </span>
            </motion.button>
          </motion.div>

          {/* ==================== LOCKED OFFER ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <LockedOffer
              title="PROTOCOLO IMPACT"
              subtitle="Imersão Presencial de 3 Dias"
              isUnlocked={isOfferUnlocked}
              unlockTime="15:00"
              lockedMessage="Essa etapa exige algo que não acontece sozinho."
              onClick={isOfferUnlocked ? () => setShowOfferModal(true) : undefined}
            />
          </motion.div>

          {/* ==================== SPONSOR BADGE ==================== */}
          <motion.div variants={itemVariants}>
            <SponsorBadge
              isLinkActive={isOfferUnlocked}
              onLinkClick={() => setShowOfferModal(true)}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* ==================== FLOATING AI CHAT BUTTON ==================== */}
      <AIChatFAB
        onClick={() => setShowAIChat(true)}
        isAvailable={true}
      />

      {/* ==================== NOTIFICATION DRAWER ==================== */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={() => console.log('Mark all as read')}
        userId={user?.id}
      />

      {/* ==================== AI CHAT MODAL ==================== */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: theme.colors.background.dark,
              zIndex: 1000,
            }}
          >
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Brain size={24} color={theme.colors.accent.purple.light} />
                  <h3
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.accent.purple.light,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    SIMULADOR DE VENDAS IA
                  </h3>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAIChat(false)}
                  style={{
                    background: 'rgba(100, 116, 139, 0.2)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: theme.colors.text.secondary,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Fechar
                </motion.button>
              </div>

              {/* Context Card */}
              <div
                style={{
                  margin: '16px',
                  padding: '12px 16px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    color: theme.colors.accent.purple.light,
                    textTransform: 'uppercase',
                    fontWeight: theme.typography.fontWeight.bold,
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                  }}
                >
                  Contexto do seu diagnóstico
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: theme.colors.text.secondary,
                  }}
                >
                  <span>Negócio: {userContext.businessType}</span>
                  <span style={{ color: '#EF4444' }}>
                    Gargalo: {userContext.gargalo.etapa} ({userContext.gargalo.valor}/10)
                  </span>
                </div>
              </div>

              {/* Placeholder content */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                }}
              >
                <p style={{ color: theme.colors.text.muted, textAlign: 'center' }}>
                  Chat com IA será implementado com integração OpenAI
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== OFFER MODAL ==================== */}
      <AnimatePresence>
        {showOfferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOfferModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.98) 0%, rgba(10, 12, 18, 0.99) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Top glow effect */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent 0%, #F59E0B 50%, transparent 100%)',
                  boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)',
                }}
              />

              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowOfferModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(100, 116, 139, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <X size={16} color={theme.colors.text.secondary} />
              </motion.button>

              {/* Content */}
              <div style={{ padding: '28px 24px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: '0 0 30px rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    <Ticket size={28} color={theme.colors.gold.DEFAULT} />
                  </div>
                  <h2
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '18px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      margin: '0 0 8px 0',
                    }}
                  >
                    ESCOLHA SEU INGRESSO
                  </h2>
                  <p
                    style={{
                      fontSize: '13px',
                      color: theme.colors.text.secondary,
                      margin: 0,
                    }}
                  >
                    Imersão Presencial IMPACT - 3 Dias
                  </p>
                </div>

                {/* Ingresso 1% - HIGHLIGHTED */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.open(buildOfferUrl(OFFER_LINKS.ingresso1Percent, 'ingresso1percent'), '_blank')}
                  style={{
                    width: '100%',
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
                    border: '2px solid rgba(245, 158, 11, 0.6)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 40px rgba(245, 158, 11, 0.25)',
                  }}
                >
                  {/* Recommended badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '0',
                      right: '0',
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      padding: '4px 12px',
                      borderRadius: '0 12px 0 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={10} color="#000" fill="#000" />
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
                        RECOMENDADO
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Crown size={24} color="#000" />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <h3
                        style={{
                          fontFamily: theme.typography.fontFamily.orbitron,
                          fontSize: '16px',
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.gold.DEFAULT,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: '0 0 4px 0',
                        }}
                      >
                        INGRESSO 1%
                      </h3>
                      <p
                        style={{
                          fontSize: '11px',
                          color: theme.colors.text.secondary,
                          margin: 0,
                        }}
                      >
                        Acesso VIP + Benefícios exclusivos
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Ingresso Executivo - Secondary */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.open(buildOfferUrl(OFFER_LINKS.ingressoExecutivo, 'ingressoexecutivo'), '_blank')}
                  style={{
                    width: '100%',
                    padding: '18px',
                    background: 'rgba(100, 116, 139, 0.1)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(100, 116, 139, 0.2)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Ticket size={22} color={theme.colors.text.secondary} />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <h3
                        style={{
                          fontFamily: theme.typography.fontFamily.orbitron,
                          fontSize: '14px',
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.text.primary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: '0 0 4px 0',
                        }}
                      >
                        INGRESSO EXECUTIVO
                      </h3>
                      <p
                        style={{
                          fontSize: '11px',
                          color: theme.colors.text.muted,
                          margin: 0,
                        }}
                      >
                        Acesso completo à imersão
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Footer note */}
                <p
                  style={{
                    fontSize: '10px',
                    color: theme.colors.text.muted,
                    textAlign: 'center',
                    marginTop: '16px',
                    marginBottom: 0,
                  }}
                >
                  Você será redirecionado para a página de pagamento seguro
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== BOTTOM NAVIGATION ==================== */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
