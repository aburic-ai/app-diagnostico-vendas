/**
 * Página Ao Vivo - Durante o Evento
 *
 * Core da experiência: diagnóstico em tempo real, gráfico radar,
 * alertas de gargalo, módulos em scroll horizontal e oferta bloqueada.
 */

import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  Pause,
  Coffee,
  CheckSquare,
  Shield,
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
  AIChatInterface,
  SponsorBadge,
  ProfileModal,
  EventCountdown,
  EventFinishedView,
  LiveEventModal,
  NPSForm,
} from '../components/ui'
import type { IMPACTData } from '../components/ui'
import { theme } from '../styles/theme'
import { getModuleById, EVENT_MODULES } from '../data/modules'
import { useDiagnostic, useAuth, useUserProgress } from '../hooks'
import { useHeartbeat } from '../hooks/useHeartbeat'
import { useEventState } from '../hooks/useEventState'
import { useNotifications } from '../hooks/useNotifications'
import type { DiagnosticScores } from '../hooks'
import { XP_CONFIG, STEP_IDS } from '../config/xp-system'
import { supabase } from '../lib/supabase'

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
// Agora ambos usam os mesmos nomes em português!
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
  // Mesmos nomes, retorna direto
  return { ...scores }
}

// Helper: Converter IMPACTData para DiagnosticScores
// Agora ambos usam os mesmos nomes em português!
const impactToScores = (impact: IMPACTData): DiagnosticScores => {
  // Mesmos nomes, retorna direto
  return { ...impact }
}

export function AoVivo() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  useHeartbeat() // Atualiza last_seen_at a cada 30s
  const { getDiagnosticByDay, saveDiagnostic, loading: diagnosticLoading } = useDiagnostic()
  const { completeStep, isStepCompleted } = useUserProgress()
  const { eventState, isPosEventoAccessible, isAdmin } = useEventState()
  const location = useLocation()

  // Refs para scroll to section (avisos clickables)
  const diagnosticSlidersRef = useRef<HTMLDivElement>(null)

  const [activeNav] = useState('aovivo')
  const [selectedDay, setSelectedDay] = useState<1 | 2>((eventState?.current_day === 2 ? 2 : 1) as 1 | 2)
  const [showSliders, setShowSliders] = useState(true)

  // Get current module and status from database
  const currentModule = eventState?.current_module || 0
  const isLive = eventState?.status === 'live'
  const isPaused = eventState?.status === 'paused'
  const isLunch = eventState?.lunch_active || false
  const isActivity = eventState?.status === 'activity'

  // Sync selectedDay with eventState.current_day
  useEffect(() => {
    if (eventState?.current_day && eventState.current_day !== selectedDay) {
      console.log(`🗓️ [AoVivo] Dia mudou no servidor: ${selectedDay} → ${eventState.current_day}`)
      setSelectedDay(eventState.current_day as 1 | 2)
    }
  }, [eventState?.current_day])

  // Debug log
  console.log('🎮 [AoVivo] Status:', {
    status: eventState?.status,
    lunch_active: eventState?.lunch_active,
    current_day: eventState?.current_day,
    selectedDay,
    isLive,
    isPaused,
    isLunch,
    isActivity,
  })

  const [viewingModule, setViewingModule] = useState(currentModule)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const isOfferUnlocked = eventState?.offer_visible || false
  const [confirmedModules, setConfirmedModules] = useState<number[]>([]) // Módulos confirmados (vazio inicialmente, carregado do perfil)

  // Notificações reais do banco de dados
  const {
    notifications,
    unreadCount,
    markAllAsRead,
  } = useNotifications()

  // Sync viewing module with current module from Admin
  useEffect(() => {
    if (eventState?.current_module !== undefined) {
      setViewingModule(eventState.current_module)
    }
  }, [eventState?.current_module])

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
    const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
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
  const showGargalo = hasFilledData(currentData) && gargalo && gargalo[1] <= 5
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
    gargalo: gargalo && gargalo[0] && gargaloMap[gargalo[0]]
      ? { etapa: gargaloMap[gargalo[0]].etapa, valor: gargalo[1] }
      : { etapa: 'Inspiração', valor: 0 },
    diagnostico: currentData,
  }

  // Dynamic nav items baseado no estado do evento
  const navItems = [
    {
      id: 'preparacao',
      label: 'Preparação',
      icon: <Rocket size={20} />,
      status: 'Liberado',
      isAccessible: true
    },
    {
      id: 'aovivo',
      label: 'Ao Vivo',
      icon: <Radio size={20} />,
      badge: isLive ? 'LIVE' : (eventState?.status === 'offline' ? 'EM BREVE' : undefined),
      status: isLive ? 'Liberado' : (eventState?.status === 'offline' ? 'Em Breve' : 'Liberado'),
      isAccessible: true
    },
    {
      id: 'posevento',
      label: 'Pós Evento',
      icon: <Target size={20} />,
      status: isPosEventoAccessible() ? 'Liberado' :
        eventState?.pos_evento_unlock_date ?
          `Libera ${new Date(eventState.pos_evento_unlock_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}` :
          'Bloqueado',
      isAccessible: isPosEventoAccessible()
    },
  ]

  // Handler de navegação entre abas
  const handleNavigation = (tabId: string) => {
    const routes: Record<string, string> = {
      preparacao: '/pre-evento',
      aovivo: '/ao-vivo',
      posevento: '/pos-evento',
    }

    if (routes[tabId]) {
      navigate(routes[tabId])
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

  const updateDimension = async (key: keyof IMPACTData, value: number) => {
    console.log(`🔄 [AoVivo] updateDimension chamado: ${key} = ${value}, dia = ${selectedDay}`)

    // Atualizar estado local imediatamente (UX responsivo)
    const updatedData = { ...currentData, [key]: value }
    setCurrentData(updatedData)

    // Salvar no banco em background
    try {
      const scores = impactToScores(updatedData)
      console.log('📝 [AoVivo] Scores a salvar:', scores)
      console.log('👤 [AoVivo] User:', user?.id)

      const result = await saveDiagnostic(selectedDay, scores)
      console.log('💾 [AoVivo] Resultado do save:', result)

      if (result.error) {
        console.error('❌ Erro ao salvar diagnóstico:', result.error)
      } else {
        console.log(`✅ Diagnóstico Dia ${selectedDay} salvo com sucesso!`)
      }
    } catch (err) {
      console.error('❌ Exceção ao salvar diagnóstico:', err)
    }
  }

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

  // Detectar quando countdown do Ao Vivo acabou (para mostrar "Evento Prestes a Iniciar")
  const [aoVivoCountdownEnded, setAoVivoCountdownEnded] = useState(false)

  useEffect(() => {
    if (!eventState?.ao_vivo_unlock_date) return

    const check = () => {
      const now = new Date()
      const target = new Date(eventState.ao_vivo_unlock_date!)
      setAoVivoCountdownEnded(now >= target)
    }

    check()
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [eventState?.ao_vivo_unlock_date])

  // NPS: mostrar formulário bloqueante quando admin ativa
  const npsType = eventState?.nps_active as 'day1' | 'final' | null
  const npsStepId = npsType === 'day1' ? STEP_IDS.NPS_DAY1 : npsType === 'final' ? STEP_IDS.NPS_FINAL : null
  const showNPS = !!(npsType && npsStepId && !isStepCompleted(npsStepId) && !isAdmin)

  const handleNPSSubmit = async (score: number, feedback: string, type: 'day1' | 'final') => {
    const stepId = type === 'day1' ? STEP_IDS.NPS_DAY1 : STEP_IDS.NPS_FINAL
    const xpReward = type === 'day1' ? XP_CONFIG.EVENT.NPS_DAY1 : XP_CONFIG.EVENT.NPS_FINAL

    try {
      await completeStep(stepId, xpReward)

      // Salvar resposta NPS no banco
      await supabase.from('nps_responses').insert({
        user_id: user?.id,
        type,
        score,
        feedback: feedback || null,
        event_day: eventState?.current_day || 1,
      })

      console.log(`✅ NPS ${type} enviado! Score: ${score}, +${xpReward} XP`)
    } catch (error) {
      console.error('❌ Erro ao salvar NPS:', error)
    }
  }

  // FINISHED - Redirect to Pós-Evento
  if (eventState?.status === 'finished') {
    return <EventFinishedView />
  }

  // Show countdown while event is offline and countdown hasn't ended yet
  if (eventState?.status === 'offline' && eventState?.ao_vivo_unlock_date && !aoVivoCountdownEnded) {
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
            paddingBottom: '100px',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
            }}
          >
            <EventCountdown
              targetDate={eventState.ao_vivo_unlock_date}
              day={eventState.current_day || 1}
            />
          </motion.div>
        </div>
        <BottomNav items={navItems} activeId={activeNav} onSelect={handleNavigation} />
      </PageWrapper>
    )
  }

  // Evento prestes a iniciar: offline + (countdown acabou ou sem data agendada)
  if (eventState?.status === 'offline') {
    return (
      <PageWrapper
        backgroundColor={theme.colors.background.dark}
        showAnimatedBackground={true}
        showOverlay={false}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          {/* Ícone pulsante */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
              border: '2px solid rgba(34, 211, 238, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '28px',
              boxShadow: '0 0 40px rgba(34, 211, 238, 0.3)',
            }}
          >
            <Radio size={48} color={theme.colors.accent.cyan.DEFAULT} />
          </motion.div>

          {/* Título */}
          <h2
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '22px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.accent.cyan.DEFAULT,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '12px',
              textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
            }}
          >
            Evento Prestes a Iniciar
          </h2>

          {/* Subtítulo */}
          <p
            style={{
              fontSize: '15px',
              color: theme.colors.text.secondary,
              lineHeight: 1.6,
              maxWidth: '340px',
              marginBottom: '32px',
            }}
          >
            Aguardando o instrutor iniciar a transmissão ao vivo. Fique nesta tela — você será redirecionado automaticamente.
          </p>

          {/* Indicador de loading com dots */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: theme.colors.accent.cyan.DEFAULT,
                  boxShadow: `0 0 8px ${theme.colors.accent.cyan.DEFAULT}`,
                }}
              />
            ))}
          </div>

          {/* Avisos importantes */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '340px',
            width: '100%',
          }}>
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                textAlign: 'left',
              }}
            >
              <Zap size={20} color="#22D3EE" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{
                fontSize: '13px',
                color: '#E2E8F0',
                lineHeight: '1.5',
                margin: 0,
              }}>
                <strong style={{ color: '#22D3EE' }}>Esta é a página do evento ao vivo!</strong><br />
                Diagnóstico em tempo real, chat com IA, check-ins de módulos e muito mais.
              </p>
            </div>

            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                textAlign: 'left',
              }}
            >
              <Star size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{
                fontSize: '13px',
                color: '#E2E8F0',
                lineHeight: '1.5',
                margin: 0,
              }}>
                <strong style={{ color: '#F59E0B' }}>Evento 100% online e ao vivo.</strong><br />
                A gravação não está inclusa e pode ser adquirida na aba de preparação até o início do evento.
              </p>
            </div>
          </div>
        </div>
        <BottomNav items={navItems} activeId={activeNav} onSelect={handleNavigation} />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      backgroundColor={theme.colors.background.dark}
      showAnimatedBackground={true}
      showOverlay={false}
    >
      {/* Live Event Modal - aparece quando evento está ao vivo */}
      <LiveEventModal isLive={isLive} />

      {/* NPS Form - overlay bloqueante quando admin ativa */}
      {npsType && (
        <NPSForm
          type={npsType}
          isOpen={showNPS}
          onClose={() => {}} // mandatory = não fecha
          onSubmit={handleNPSSubmit}
          mandatory={true}
        />
      )}

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

              {/* Avatar with Admin Badge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <AvatarButton
                  name={profile?.name || 'Usuário'}
                  photoUrl={profile?.photo_url || undefined}
                  onClick={() => setShowProfileModal(true)}
                />

                {/* Admin Badge */}
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/admin')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                      border: '1px solid rgba(147, 51, 234, 0.4)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title="Acessar painel de administração"
                  >
                    <Shield size={12} color={theme.colors.accent.purple.light} />
                    <span
                      style={{
                        fontFamily: theme.typography.fontFamily.orbitron,
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: theme.colors.accent.purple.light,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Admin
                    </span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* ==================== UNIFIED LIVE + MODULES BOX ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              marginBottom: '20px',
              background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
              border: `1px solid ${
                isLive ? 'rgba(255, 68, 68, 0.4)'
                : isPaused ? 'rgba(245, 158, 11, 0.4)'
                : isLunch ? 'rgba(245, 158, 11, 0.4)'
                : isActivity ? 'rgba(168, 85, 247, 0.4)'
                : 'rgba(100, 116, 139, 0.3)'
              }`,
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
                background: `linear-gradient(90deg, transparent 0%, ${
                  isLive ? '#FF4444'
                  : isPaused ? '#F59E0B'
                  : isLunch ? '#F59E0B'
                  : isActivity ? '#A855F7'
                  : '#64748B'
                } 50%, transparent 100%)`,
                boxShadow: `0 0 20px ${
                  isLive ? '#FF444480'
                  : isPaused ? '#F59E0B80'
                  : isLunch ? '#F59E0B80'
                  : isActivity ? '#A855F780'
                  : '#64748B80'
                }`,
              }}
            />

            {/* Status Overlay - Soft color layer */}
            <AnimatePresence>
              {(isPaused || isLunch || isActivity) && isViewingCurrent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isPaused || isLunch
                      ? 'rgba(245, 158, 11, 0.35)'
                      : 'rgba(168, 85, 247, 0.35)',
                    backdropFilter: 'blur(6px)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    zIndex: 10,
                  }}
                >
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    {isPaused && <Pause size={36} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />}
                    {isLunch && <Coffee size={36} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />}
                    {isActivity && <CheckSquare size={36} color="rgba(255, 255, 255, 0.95)" strokeWidth={2.5} />}
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                      fontSize: '15px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: 'rgba(255, 255, 255, 0.98)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      textAlign: 'center',
                    }}
                  >
                    {isPaused && 'Pausado'}
                    {isLunch && 'Intervalo'}
                    {isActivity && 'Atividade'}
                  </motion.div>

                  {/* Subtitle */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      textAlign: 'center',
                      maxWidth: '80%',
                    }}
                  >
                    {isPaused && 'A transmissão será retomada em breve'}
                    {isLunch && eventState?.lunch_started_at && (() => {
                      const lunchEnd = new Date(eventState.lunch_started_at)
                      lunchEnd.setMinutes(lunchEnd.getMinutes() + (eventState.lunch_duration_minutes || 60))
                      return `Retorno previsto: ${lunchEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    })()}
                    {isLunch && !eventState?.lunch_started_at && 'Aproveite para descansar'}
                    {isActivity && 'Complete a atividade proposta'}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

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
                {/* Left side - Status badge + Day */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Status Badge - conditional */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      background: isLive ? 'rgba(255, 68, 68, 0.15)'
                        : isPaused ? 'rgba(245, 158, 11, 0.15)'
                        : isLunch ? 'rgba(245, 158, 11, 0.15)'
                        : isActivity ? 'rgba(168, 85, 247, 0.15)'
                        : 'rgba(100, 116, 139, 0.15)',
                      border: `1px solid ${
                        isLive ? 'rgba(255, 68, 68, 0.4)'
                        : isPaused ? 'rgba(245, 158, 11, 0.4)'
                        : isLunch ? 'rgba(245, 158, 11, 0.4)'
                        : isActivity ? 'rgba(168, 85, 247, 0.4)'
                        : 'rgba(100, 116, 139, 0.3)'
                      }`,
                      borderRadius: '6px',
                    }}
                  >
                    {/* Pulse animation only for live */}
                    {isLive && (
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
                    )}
                    {!isLive && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: isPaused ? '#F59E0B'
                            : isLunch ? '#F59E0B'
                            : isActivity ? '#A855F7'
                            : '#64748B',
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: theme.typography.fontWeight.bold,
                        color: isLive ? '#FF4444'
                          : isPaused ? '#F59E0B'
                          : isLunch ? '#F59E0B'
                          : isActivity ? '#A855F7'
                          : '#64748B',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {isLive ? 'AO VIVO'
                        : isPaused ? 'PAUSADO'
                        : isLunch ? 'INTERVALO'
                        : isActivity ? 'ATIVIDADE'
                        : 'OFFLINE'}
                    </span>
                  </div>

                  {/* Day Badge */}
                  <span
                    style={{
                      fontSize: '10px',
                      color: selectedDay === 1 ? theme.colors.accent.cyan.DEFAULT : theme.colors.accent.purple.light,
                      fontWeight: theme.typography.fontWeight.semibold,
                      padding: '4px 8px',
                      background: selectedDay === 1 ? 'rgba(34, 211, 238, 0.1)' : 'rgba(168, 85, 247, 0.1)',
                      borderRadius: '6px',
                    }}
                  >
                    DIA {selectedDay}
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
                      color: isViewingCurrent
                        ? (isLive ? '#FF4444'
                          : isPaused ? '#F59E0B'
                          : isLunch ? '#F59E0B'
                          : isActivity ? '#A855F7'
                          : '#64748B')
                        : theme.colors.text.muted,
                      margin: '0 0 2px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {isViewingCurrent
                      ? (isLive ? '● AO VIVO AGORA'
                        : isPaused ? '⏸ PAUSADO'
                        : isLunch ? '☕ INTERVALO'
                        : isActivity ? '📝 ATIVIDADE'
                        : '⚫ OFFLINE')
                      : `MÓDULO ${viewingModule} DE ${EVENT_MODULES.length - 1}`}
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
          {showGargalo && gargalo && gargalo[0] && (
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
              whileTap={eventState?.ai_enabled ? { scale: 0.95 } : {}}
              onClick={eventState?.ai_enabled ? () => setShowAIChat(true) : undefined}
              style={{
                padding: '16px',
                background: eventState?.ai_enabled
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)'
                  : 'rgba(30, 35, 45, 0.5)',
                border: eventState?.ai_enabled
                  ? '1px solid rgba(168, 85, 247, 0.4)'
                  : '1px solid rgba(100, 116, 139, 0.2)',
                borderRadius: '12px',
                cursor: eventState?.ai_enabled ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                opacity: eventState?.ai_enabled ? 1 : 0.5,
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: eventState?.ai_enabled
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'rgba(30, 35, 45, 0.8)',
                  border: eventState?.ai_enabled
                    ? '1px solid rgba(168, 85, 247, 0.3)'
                    : '1px solid rgba(100, 116, 139, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Brain
                  size={22}
                  color={eventState?.ai_enabled ? theme.colors.accent.purple.light : theme.colors.text.muted}
                />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: eventState?.ai_enabled ? theme.colors.accent.purple.light : theme.colors.text.muted,
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
                Mapear jornada psicológica
              </span>
            </motion.button>
          </motion.div>

          {/* ==================== LOCKED OFFER ==================== */}
          <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
            <LockedOffer
              title="PROTOCOLO IMPACT"
              subtitle="Imersão Presencial de 2 Dias"
              isUnlocked={isOfferUnlocked}
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
        isAvailable={eventState?.ai_enabled || false}
      />

      {/* ==================== NOTIFICATION DRAWER ==================== */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={markAllAsRead}
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

              {/* AI Chat Interface */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <AIChatInterface
                  userContext={userContext}
                  isAvailable={eventState?.ai_enabled && eventState?.status === 'live'}
                  onBack={() => setShowAIChat(false)}
                  event_day={selectedDay}
                  module_id={viewingModule}
                />
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
                    Imersão Presencial IMPACT - 2 Dias
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
      <BottomNav items={navItems} activeId={activeNav} onSelect={handleNavigation} />

      {/* ==================== PROFILE MODAL ==================== */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </PageWrapper>
  )
}
