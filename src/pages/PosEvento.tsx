/**
 * Página Pós-Evento - Consolidação e Ação
 *
 * Fase onde o participante vê o resultado final do diagnóstico,
 * a projeção de consequências e o plano de ação de 7 dias.
 *
 * "Debriefing Militar" - Acabou a batalha, agora estamos na sala
 * de estratégia decidindo o próximo ataque.
 */

import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Rocket,
  Radio,
  Target,
  Shield,
  Bell,
  User,
  Mail,
  Phone,
  Building2,
  Camera,
  Check,
  X,
} from 'lucide-react'

import {
  PageWrapper,
  BottomNav,
  SystemAlert,
  FinalReport,
  ScenarioProjection,
  ActionPlan,
  LockedOffer,
  AvatarButton,
  NotificationDrawer,
  PageHeader,
} from '../components/ui'
import type { IMPACTData, ActionItem, Notification } from '../components/ui'
import { theme } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { useUserProgress } from '../hooks/useUserProgress'
import { XP_CONFIG, STEP_IDS } from '../config/xp-system'

// Dados do perfil
interface ProfileData {
  name: string
  email: string
  phone: string
  company: string
  role: string
  photoUrl: string | null
}

// Links da oferta (viriam do Admin/Backend)
const OFFER_LINKS = {
  posEventoLink: 'https://imersao.neuropersuasao.com.br/',
  utmSource: 'appdiagn',
  utmMedium: 'app',
  utmCampaign: 'imersao2026',
  utmContent: 'posevento',
}

// Helper para construir URL com UTM
const buildOfferUrl = (baseUrl: string, utmContent?: string): string => {
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}utm_source=${OFFER_LINKS.utmSource}&utm_medium=${OFFER_LINKS.utmMedium}&utm_campaign=${OFFER_LINKS.utmCampaign}&utm_content=${utmContent || OFFER_LINKS.utmContent}`
}

export function PosEvento() {
  const { profile: userProfile, user } = useAuth()
  const { completeStep, isStepCompleted } = useUserProgress()
  const location = useLocation()

  // Refs para scroll to section (avisos clickables)
  const finalReportRef = useRef<HTMLDivElement>(null)
  const scenarioProjectionRef = useRef<HTMLDivElement>(null)
  const impactOfferRef = useRef<HTMLDivElement>(null)
  const actionPlanRef = useRef<HTMLDivElement>(null)

  const [activeNav, setActiveNav] = useState('posevento')
  const [showAlert, setShowAlert] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: userProfile?.name || 'Participante',
    email: userProfile?.email || '',
    phone: '(11) 99999-9999',
    company: 'Empresa XYZ',
    role: 'CEO',
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
      type: 'offer',
      title: 'Imersão IMPACT Liberada!',
      message: 'Seu diagnóstico foi concluído. Garanta sua vaga na imersão presencial.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'Plano de 7 dias ativo',
      message: 'Complete as tarefas diárias para consolidar seu diagnóstico.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: false,
    },
    {
      id: '3',
      type: 'nps',
      title: 'Avalie sua experiência',
      message: 'Sua opinião é importante para nós.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true,
    },
  ])

  // Handle photo upload simulation
  const handlePhotoUpload = () => {
    setProfile(prev => ({
      ...prev,
      photoUrl: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(prev.name) + '&background=f59e0b&color=050505&size=200',
    }))
  }

  // Handle profile field change
  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  // Dados do diagnóstico consolidado (viria do estado global/backend)
  const diagnosticData: IMPACTData = {
    inspiracao: 7,
    motivacao: 6,
    preparacao: 5,
    apresentacao: 4,
    conversao: 3,
    transformacao: 6,
  }

  // Calcular score (média * 10)
  const values = Object.values(diagnosticData)
  const average = values.reduce((a, b) => a + b, 0) / values.length
  const score = Math.round(average * 10)

  // Encontrar gargalo (menor valor)
  const entries = Object.entries(diagnosticData) as [keyof IMPACTData, number][]
  const sorted = entries.sort((a, b) => a[1] - b[1])
  const gargaloKey = sorted[0][0]
  const gargaloValue = sorted[0][1]

  const gargaloMap: Record<keyof IMPACTData, string> = {
    inspiracao: 'Inspiração',
    motivacao: 'Motivação',
    preparacao: 'Preparação',
    apresentacao: 'Apresentação',
    conversao: 'Conversão',
    transformacao: 'Transformação',
  }

  const gargalo = {
    etapa: gargaloMap[gargaloKey],
    letra: gargaloKey[0].toUpperCase(),
    valor: gargaloValue,
  }

  // Plano de ação de 7 dias
  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: '1',
      day: 1,
      title: 'Revisar anotações do evento',
      description: 'Consolide os principais insights em 3 bullets.',
      completed: false,
    },
    {
      id: '2',
      day: 2,
      title: 'Reunião de alinhamento',
      description: 'Compartilhe o diagnóstico com sócios/equipe.',
      completed: false,
    },
    {
      id: '3',
      day: 3,
      title: 'Mapear gargalo principal',
      description: `Analise onde o "${gargalo.etapa}" trava no seu processo.`,
      completed: false,
    },
    {
      id: '4',
      day: 4,
      title: 'Listar 3 ações imediatas',
      description: 'Defina micro-correções que podem ser feitas esta semana.',
      completed: false,
    },
    {
      id: '5',
      day: 5,
      title: 'Implementar primeira correção',
      description: 'Execute a ação de menor esforço com maior impacto.',
      completed: false,
    },
    {
      id: '6',
      day: 6,
      title: 'Medir resultado inicial',
      description: 'Compare métricas antes vs depois da correção.',
      completed: false,
    },
    {
      id: '7',
      day: 7,
      title: 'Decidir próximo passo',
      description: 'Continuar sozinho ou ativar o Protocolo IMPACT?',
      completed: false,
    },
  ])

  // Dia atual (simulado - seria calculado pela data real)
  const currentDay = 1

  // Scroll to section (avisos clickables)
  useEffect(() => {
    const state = location.state as { scrollTo?: string; highlight?: boolean } | undefined
    if (!state?.scrollTo) return

    // Mapear target_section para ref
    const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
      'final-report': finalReportRef,
      'scenario-projection': scenarioProjectionRef,
      'impact-offer': impactOfferRef,
      'locked-offer': impactOfferRef,
      'action-plan': actionPlanRef,
      'plano-7-dias': actionPlanRef,
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

  // Carregar ações completadas do perfil (completed_steps)
  useEffect(() => {
    if (userProfile?.completed_steps) {
      const completedDays = userProfile.completed_steps
        .filter(step => step.startsWith('plan-7-days-day-'))
        .map(step => {
          const match = step.match(/plan-7-days-day-(\d+)/)
          return match ? parseInt(match[1]) : null
        })
        .filter((day): day is number => day !== null)

      if (completedDays.length > 0) {
        setActions(prev =>
          prev.map(action =>
            completedDays.includes(action.day)
              ? { ...action, completed: true }
              : action
          )
        )
        console.log('📥 Dias completados carregados:', completedDays)
      }
    }
  }, [userProfile?.completed_steps])

  const handleToggleAction = async (id: string) => {
    const action = actions.find(a => a.id === id)
    if (!action) return

    const isCompleting = !action.completed

    // Atualizar estado local imediatamente (UX responsivo)
    setActions(prev =>
      prev.map(a =>
        a.id === id ? { ...a, completed: !a.completed } : a
      )
    )

    // Se estiver marcando como completo, salvar no Supabase com XP
    if (isCompleting) {
      try {
        // Calcular XP baseado no dia (progressão crescente)
        const day = action.day
        let xp: number
        if (day <= 3) {
          xp = XP_CONFIG.POST_EVENT.PLAN_7_DAYS.DAY_1 // 10 XP (dias 1-3)
        } else if (day <= 5) {
          xp = XP_CONFIG.POST_EVENT.PLAN_7_DAYS.DAY_4 // 15 XP (dias 4-5)
        } else {
          xp = XP_CONFIG.POST_EVENT.PLAN_7_DAYS.DAY_6 // 20 XP (dias 6-7)
        }

        const stepId = `plan-7-days-day-${day}`
        await completeStep(stepId, xp)
        console.log(`✅ Dia ${day} do Plano 7 Dias completo! +${xp} XP`)
      } catch (error) {
        console.error('❌ Erro ao completar ação:', error)
        // Reverter estado se falhar
        setActions(prev =>
          prev.map(a =>
            a.id === id ? { ...a, completed: false } : a
          )
        )
      }
    }
  }

  const navItems = [
    { id: 'preparacao', label: 'Preparação', icon: <Rocket size={20} />, status: 'Liberado' },
    { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} />, badge: 'LIVE', status: 'Liberado' },
    { id: 'posevento', label: 'Pós Evento', icon: <Target size={20} />, status: 'Liberado' },
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
          </motion.div>

          {/* ==================== HEADER STATUS ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            >
              <Shield size={14} color={theme.colors.gold.DEFAULT} />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.gold.DEFAULT,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                STATUS: FASE DE EXECUÇÃO
              </span>
            </div>

            <h1
              style={{
                fontFamily: theme.typography.fontFamily.body,
                fontSize: '11px',
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.secondary,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              DIAGNÓSTICO FINALIZADO
            </h1>
            <h2
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '20px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.gold.DEFAULT,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                margin: '4px 0 0 0',
              }}
            >
              PROTOCOLO DE CORREÇÃO ATIVO
            </h2>
          </motion.div>

          {/* ==================== SYSTEM ALERT ==================== */}
          {showAlert && (
            <motion.div variants={itemVariants} style={{ marginBottom: '16px' }}>
              <SystemAlert
                type="offer"
                title="PROTOCOLO DE CORREÇÃO DISPONÍVEL"
                message={`Seu diagnóstico aponta falha crítica em ${gargalo.etapa}. Ative o protocolo presencial.`}
                actionLabel="ATIVAR"
                onAction={() => window.open(buildOfferUrl(OFFER_LINKS.posEventoLink, 'alert'), '_blank')}
                onClose={() => setShowAlert(false)}
              />
            </motion.div>
          )}

          {/* ==================== FINAL REPORT ==================== */}
          <motion.div ref={finalReportRef} variants={itemVariants} style={{ marginBottom: '20px' }}>
            <FinalReport
              data={diagnosticData}
              score={score}
              gargalo={gargalo}
              onDownload={() => console.log('Baixar PDF')}
            />
          </motion.div>

          {/* ==================== SCENARIO PROJECTION ==================== */}
          <motion.div ref={scenarioProjectionRef} variants={itemVariants} style={{ marginBottom: '20px' }}>
            <ScenarioProjection gargalo={gargalo.etapa} />
          </motion.div>

          {/* ==================== UNLOCKED OFFER (PREMIUM) ==================== */}
          <motion.div ref={impactOfferRef} variants={itemVariants} style={{ marginBottom: '20px' }}>
            <LockedOffer
              title="IMERSÃO PRESENCIAL IMPACT"
              subtitle="Protocolo de Correção em 3 Dias"
              isUnlocked={true}
              onClick={() => {
                // Abrir link
                window.open(buildOfferUrl(OFFER_LINKS.posEventoLink, 'oferta'), '_blank')

                // Tracking: Interesse em IMPACT (o XP total de 300 virá do webhook Hotmart)
                console.log('📊 Usuário clicou em "Imersão IMPACT"')
                // TODO: Track event para analytics
              }}
            />
          </motion.div>

          {/* ==================== ACTION PLAN ==================== */}
          <motion.div ref={actionPlanRef} variants={itemVariants}>
            <ActionPlan
              actions={actions}
              currentDay={currentDay}
              onToggleAction={handleToggleAction}
            />
          </motion.div>

          {/* ==================== FOOTER MESSAGE ==================== */}
          <motion.div
            variants={itemVariants}
            style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(10, 12, 18, 0.6)',
              borderRadius: '12px',
              border: '1px solid rgba(100, 116, 139, 0.2)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              "O evento terminou. A transformação começa agora."
            </p>
            <p
              style={{
                fontSize: '10px',
                color: theme.colors.text.muted,
                margin: '8px 0 0 0',
              }}
            >
              Mantenha o app aberto pelos próximos 7 dias.
            </p>
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
              border: '1px solid rgba(245, 158, 11, 0.4)',
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
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={20} color={theme.colors.gold.DEFAULT} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: theme.colors.gold.DEFAULT,
                      margin: 0,
                    }}
                  >
                    MEU PERFIL
                  </h3>
                  <span style={{ fontSize: '10px', color: theme.colors.text.muted }}>
                    Diagnóstico finalizado
                  </span>
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
                  <span style={{ fontSize: '11px', color: theme.colors.gold.DEFAULT, fontWeight: 'bold' }}>
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
                        : `linear-gradient(90deg, ${theme.colors.gold.DEFAULT} 0%, ${theme.colors.gold.light} 100%)`,
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
                      : 'rgba(245, 158, 11, 0.15)',
                    border: `3px solid ${profile.photoUrl ? theme.colors.accent.cyan.DEFAULT : 'rgba(245, 158, 11, 0.4)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {!profile.photoUrl && (
                    <Camera size={32} color={theme.colors.gold.DEFAULT} />
                  )}
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
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 179, 8, 0.2) 100%)',
                  border: `1px solid ${isProfileComplete ? 'rgba(34, 211, 238, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: isProfileComplete ? theme.colors.accent.cyan.DEFAULT : theme.colors.gold.DEFAULT,
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
        userId={user?.id}
      />

      {/* ==================== BOTTOM NAVIGATION ==================== */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
