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
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Rocket,
  Radio,
  Target,
  Shield,
  Bell,
  Lock,
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
  ProfileModal,
} from '../components/ui'
import type { IMPACTData, ActionItem } from '../components/ui'
import { useNotifications } from '../hooks/useNotifications'
import { useEventState } from '../hooks/useEventState'
import { useScenarioProjection } from '../hooks/useScenarioProjection'
import { useActionPlan } from '../hooks/useActionPlan'
import { theme } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { useHeartbeat } from '../hooks/useHeartbeat'
import { useUserProgress } from '../hooks/useUserProgress'
import { useDiagnostic } from '../hooks/useDiagnostic'
import { XP_CONFIG } from '../config/xp-system'

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
  const navigate = useNavigate()
  const { profile: userProfile, user } = useAuth()
  useHeartbeat() // Atualiza last_seen_at a cada 30s
  const { completeStep } = useUserProgress()
  const { eventState, isPosEventoAccessible, isAdmin } = useEventState()
  const { getDiagnosticByDay, loading: diagnosticLoading } = useDiagnostic()
  const { projections, loading: loadingProjections, error: errorProjections } = useScenarioProjection()
  const location = useLocation()

  // State para forçar atualização dos dados
  const [, setDataLoaded] = useState(false)

  // Garantir que dados foram carregados
  useEffect(() => {
    if (!diagnosticLoading) {
      setDataLoaded(true)
      console.log('📊 [PosEvento] Dados do diagnóstico carregados')
    }
  }, [diagnosticLoading])

  // Event state
  const isOfferVisible = eventState?.offer_visible || false

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

  // Sincronizar com dados do Supabase (incluindo foto)
  useEffect(() => {
    if (userProfile) {
      setProfile(prev => ({
        ...prev,
        name: userProfile.name || prev.name,
        email: userProfile.email || prev.email,
        phone: userProfile.phone || prev.phone,
        company: userProfile.company || prev.company,
        role: userProfile.role || prev.role,
        photoUrl: userProfile.photo_url || prev.photoUrl,
      }))
    }
  }, [userProfile])

  // Notificações em tempo real
  const { notifications, markAllAsRead } = useNotifications()

  // Buscar dados reais do diagnóstico do banco
  const diagnosticDay1 = getDiagnosticByDay(1)
  const diagnosticDay2 = getDiagnosticByDay(2)

  // Debug: Ver o que está retornando
  console.log('📊 [PosEvento] Diagnóstico Dia 1:', diagnosticDay1)
  console.log('📊 [PosEvento] Diagnóstico Dia 2:', diagnosticDay2)

  // Converter para IMPACTData (Dia 1)
  // Agora as interfaces usam os mesmos nomes em português!
  const diagnosticDataDay1: IMPACTData = diagnosticDay1 ? {
    inspiracao: diagnosticDay1.inspiracao || 0,
    motivacao: diagnosticDay1.motivacao || 0,
    preparacao: diagnosticDay1.preparacao || 0,
    apresentacao: diagnosticDay1.apresentacao || 0,
    conversao: diagnosticDay1.conversao || 0,
    transformacao: diagnosticDay1.transformacao || 0,
  } : {
    inspiracao: 0,
    motivacao: 0,
    preparacao: 0,
    apresentacao: 0,
    conversao: 0,
    transformacao: 0,
  }

  // Converter para IMPACTData (Dia 2 - dados consolidados)
  const diagnosticDataDay2: IMPACTData | undefined = diagnosticDay2 ? {
    inspiracao: diagnosticDay2.inspiracao || 0,
    motivacao: diagnosticDay2.motivacao || 0,
    preparacao: diagnosticDay2.preparacao || 0,
    apresentacao: diagnosticDay2.apresentacao || 0,
    conversao: diagnosticDay2.conversao || 0,
    transformacao: diagnosticDay2.transformacao || 0,
  } : undefined // Não mostrar Dia 2 se não houver dados

  // ============================================
  // VERIFICAR SE TEM DIAGNÓSTICO
  // ============================================
  const hasDiagnostic = !!(diagnosticDay1 || diagnosticDay2)

  // ============================================
  // CALCULAR SCORE (Média Simples dos 2 dias)
  // ============================================
  let score = 0
  let diagnosticData: IMPACTData = diagnosticDataDay1 // Fallback

  if (hasDiagnostic) {
    if (diagnosticDataDay2 && diagnosticDay1) {
      // TEM OS 2 DIAS: Média simples
      const keys: (keyof IMPACTData)[] = [
        'inspiracao',
        'motivacao',
        'preparacao',
        'apresentacao',
        'conversao',
        'transformacao',
      ]

      // Calcular média de cada dimensão
      const avgData: IMPACTData = {} as IMPACTData
      keys.forEach(key => {
        avgData[key] = (diagnosticDataDay1[key] + diagnosticDataDay2[key]) / 2
      })

      diagnosticData = avgData

      // Score = média das 6 dimensões × 10
      const values = Object.values(avgData)
      const average = values.reduce((a, b) => a + b, 0) / values.length
      score = Math.round(average * 10)

      console.log('📊 [PosEvento] Média dos 2 dias:', avgData)
      console.log('📊 [PosEvento] Score calculado:', score)
    } else if (diagnosticDataDay2) {
      // TEM SÓ DIA 2
      diagnosticData = diagnosticDataDay2
      const values = Object.values(diagnosticDataDay2)
      const average = values.reduce((a, b) => a + b, 0) / values.length
      score = Math.round(average * 10)
    } else {
      // TEM SÓ DIA 1
      diagnosticData = diagnosticDataDay1
      const values = Object.values(diagnosticDataDay1)
      const average = values.reduce((a, b) => a + b, 0) / values.length
      score = Math.round(average * 10)
    }
  }

  // ============================================
  // ENCONTRAR GARGALO (menor valor)
  // Prioridade em caso de empate: I > M > P > A > C > T
  // ============================================

  const gargaloMap: Record<keyof IMPACTData, { nome: string; peso: number }> = {
    inspiracao: { nome: 'Inspiração', peso: 1 },
    motivacao: { nome: 'Motivação', peso: 2 },
    preparacao: { nome: 'Preparação', peso: 3 },
    apresentacao: { nome: 'Apresentação', peso: 4 },
    conversao: { nome: 'Conversão', peso: 5 },
    transformacao: { nome: 'Transformação', peso: 6 },
  }

  const entries = Object.entries(diagnosticData) as [keyof IMPACTData, number][]
  const sorted = entries.sort((a, b) => {
    // Primeiro: ordenar por valor (menor primeiro)
    if (a[1] !== b[1]) {
      return a[1] - b[1]
    }
    // Empate: ordenar por peso (I=1, M=2, P=3, A=4, C=5, T=6)
    return gargaloMap[a[0]].peso - gargaloMap[b[0]].peso
  })

  const gargaloKey = sorted[0][0]
  const gargaloValue = sorted[0][1]

  const gargalo = {
    etapa: gargaloMap[gargaloKey].nome,
    letra: gargaloKey[0].toUpperCase(),
    valor: gargaloValue,
  }

  // Plano de ação de 7 dias - Gerado por IA com fallback hardcoded
  const {
    actions: generatedActions,
    loading: loadingPlan,
    error: errorPlan,
    cached: planCached,
    isPersonalized,
  } = useActionPlan()

  // Estado local para gerenciar completed (UI somente, não persiste)
  const [actions, setActions] = useState<ActionItem[]>(generatedActions)

  // Sincronizar com ações geradas pelo hook
  useEffect(() => {
    if (generatedActions.length > 0) {
      setActions(generatedActions)
    }
  }, [generatedActions])

  // Dia atual (simulado - seria calculado pela data real)
  const currentDay = 1

  // Scroll to section (avisos clickables)
  useEffect(() => {
    const state = location.state as { scrollTo?: string; highlight?: boolean } | undefined
    if (!state?.scrollTo) return

    // Mapear target_section para ref
    const sectionRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
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

  // Check tab access (admins bypass)
  if (!isAdmin && !isPosEventoAccessible()) {
    return (
      <PageWrapper backgroundColor={theme.colors.background.dark}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <Lock size={64} color={theme.colors.text.muted} style={{ marginBottom: '24px' }} />
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: theme.colors.text.primary,
            marginBottom: '12px',
          }}>
            Aba Bloqueada
          </h2>
          <p style={{
            fontSize: '16px',
            color: theme.colors.text.secondary,
            maxWidth: '500px',
          }}>
            Esta aba será liberada automaticamente após o evento ao vivo. Aguarde a liberação.
          </p>
        </div>
        <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
      </PageWrapper>
    )
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
              {notifications.filter(n => !n.read_by?.includes(user?.id || '')).length > 0 && (
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
                  {notifications.filter(n => !n.read_by?.includes(user?.id || '')).length}
                </div>
              )}
            </motion.button>

            {/* Avatar with Admin Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <AvatarButton
                name={profile.name}
                photoUrl={profile.photoUrl || undefined}
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
            {hasDiagnostic ? (
              <FinalReport
                data={diagnosticDataDay1}
                dataDay2={diagnosticDataDay2}
                score={score}
                gargalo={gargalo}
                onDownload={() => console.log('Baixar PDF')}
              />
            ) : (
              // DIAGNÓSTICO NÃO REALIZADO
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '2px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <Target size={32} color={theme.colors.gold.DEFAULT} />
                </div>
                <h3
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '20px',
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.gold.DEFAULT,
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                  }}
                >
                  DIAGNÓSTICO PENDENTE
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    lineHeight: 1.6,
                    maxWidth: '500px',
                    margin: '0 auto 16px',
                  }}
                >
                  Você não preencheu o diagnóstico IMPACT durante o evento ao vivo.
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: theme.colors.text.muted,
                    fontStyle: 'italic',
                  }}
                >
                  O diagnóstico estava disponível apenas durante a imersão ao vivo.
                </p>
              </div>
            )}
          </motion.div>

          {/* ==================== SCENARIO PROJECTION ==================== */}
          <motion.div ref={scenarioProjectionRef} variants={itemVariants} style={{ marginBottom: '20px' }}>
            <ScenarioProjection
              gargalo={gargalo.etapa}
              projections={projections}
              loading={loadingProjections}
              error={errorProjections}
            />
          </motion.div>

          {/* ==================== UNLOCKED OFFER (PREMIUM) ==================== */}
          <motion.div ref={impactOfferRef} variants={itemVariants} style={{ marginBottom: '20px' }}>
            <LockedOffer
              title="IMERSÃO PRESENCIAL IMPACT"
              subtitle="Imersão Presencial de 2 Dias"
              isUnlocked={isOfferVisible}
              onClick={isOfferVisible ? () => {
                // Abrir link
                window.open(buildOfferUrl(OFFER_LINKS.posEventoLink, 'oferta'), '_blank')

                // Tracking: Interesse em IMPACT (o XP total de 300 virá do webhook Hotmart)
                console.log('📊 Usuário clicou em "Imersão IMPACT"')
                // TODO: Track event para analytics
              } : undefined}
            />
          </motion.div>

          {/* ==================== ACTION PLAN ==================== */}
          <motion.div ref={actionPlanRef} variants={itemVariants}>
            {/* Badge de plano personalizado */}
            {isPersonalized && !loadingPlan && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  padding: '8px 14px',
                  background: 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: theme.colors.accent.cyan.DEFAULT,
                  fontWeight: theme.typography.fontWeight.semibold,
                }}
              >
                <span>✨</span>
                <span>
                  Plano personalizado com IA baseado no seu gargalo e perfil
                  {planCached && ' (cache)'}
                </span>
              </motion.div>
            )}

            {/* Erro ao gerar plano (usando fallback) */}
            {errorPlan && !isPersonalized && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                  padding: '8px 14px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: theme.colors.gold.DEFAULT,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                <span>ℹ️</span>
                <span>Plano padrão (não foi possível gerar personalizado)</span>
              </motion.div>
            )}

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
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />


      {/* ==================== NOTIFICATION DRAWER ==================== */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={markAllAsRead}
        userId={user?.id}
      />

      {/* ==================== BOTTOM NAVIGATION ==================== */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
