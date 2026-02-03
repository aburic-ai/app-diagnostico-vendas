/**
 * Página Pré-Evento - Dashboard/Cockpit Operacional
 *
 * Exibida após login, antes do evento começar.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
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
  ArrowLeft,
  Download,
  Clock,
  Shield,
} from 'lucide-react'

import { PageWrapper, Countdown, BottomNav, AvatarButton, NotificationDrawer } from '../components/ui'
import { useNotifications } from '../hooks/useNotifications'
import { theme } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { useHeartbeat } from '../hooks/useHeartbeat'
import { useUserProgress } from '../hooks/useUserProgress'
import { useEventState } from '../hooks/useEventState'
import { XP_CONFIG, STEP_IDS } from '../config/xp-system'
import { supabase } from '../lib/supabase'

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

// Dados das aulas
interface LessonData {
  id: number
  title: string
  description: string
  duration: string
  videoUrl?: string
  pdfUrl?: string
  watched: boolean
}

const LESSONS: LessonData[] = [
  {
    id: 1,
    title: 'Introdução ao Diagnóstico',
    description: 'Entenda o que é a Imersão Diagnóstico de Vendas e como ela vai transformar sua visão sobre o processo de vendas.',
    duration: '12:34',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    pdfUrl: '/pdfs/aula-1.pdf',
    watched: false,
  },
  {
    id: 2,
    title: 'O Método IMPACT',
    description: 'Conheça as 6 etapas da jornada psicológica de compra e como cada uma afeta a decisão do seu cliente.',
    duration: '18:45',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    pdfUrl: '/pdfs/aula-2.pdf',
    watched: false,
  },
  {
    id: 3,
    title: 'Preparação para o Evento',
    description: 'Como aproveitar ao máximo os dois dias de imersão e extrair insights práticos para o seu negócio.',
    duration: '09:22',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    pdfUrl: '/pdfs/aula-3.pdf',
    watched: false,
  },
]

export function PreEvento() {
  const navigate = useNavigate()
  const { user, profile: userProfile, refreshProfile } = useAuth()
  useHeartbeat() // Atualiza last_seen_at a cada 30s
  const { xp, completedSteps, completeStep, isStepCompleted } = useUserProgress()
  const { isPreEventoAccessible, isAdmin } = useEventState()
  const [activeNav, setActiveNav] = useState('preparacao')
  const [showSchedule, setShowSchedule] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null)
  const [lessons, setLessons] = useState<LessonData[]>(LESSONS)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // Profile state - inicializar com dados do Supabase
  const [profile, setProfile] = useState<ProfileData>({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    phone: '',
    company: '',
    role: '',
    photoUrl: null,
  })

  // Atualizar profile quando userProfile carregar do Supabase
  useEffect(() => {
    if (userProfile) {
      console.log('📥 Carregando dados do perfil do Supabase:', {
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone,
        company: userProfile.company,
        role: userProfile.role,
        photo_url: userProfile.photo_url,
      })

      setProfile(prev => ({
        ...prev,
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        company: userProfile.company || '',
        role: userProfile.role || '',
        photoUrl: userProfile.photo_url || null,
      }))
    }
  }, [userProfile])

  // Calculate profile completion from Supabase profile
  const profileFields = [
    userProfile?.name,
    userProfile?.email,
    userProfile?.phone,
    userProfile?.company,
    userProfile?.role,
    userProfile?.photo_url,
  ]
  const completedFields = profileFields.filter(f => f && String(f).trim() !== '').length
  const profileProgress = Math.round((completedFields / profileFields.length) * 100)
  const isProfileComplete = profileProgress === 100

  // Notificações em tempo real
  const { notifications, unreadCount, markAllAsRead } = useNotifications()

  // Data do evento: 28/02/2026 às 9h30
  const eventDate = new Date('2026-02-28T09:30:00')

  const navItems = [
    { id: 'preparacao', label: 'Preparação', icon: <Rocket size={20} />, status: 'Liberado' },
    { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} />, badge: 'LIVE', status: 'Libera 14/03' },
    { id: 'posevento', label: 'Pós Evento', icon: <Target size={20} />, status: 'Libera 16/03' },
  ]

  // Steps depend on profile completion
  const getSteps = (): JourneyStep[] => {
    // Calcular progresso das aulas
    const watchedCount = lessons.filter(l => l.watched).length
    const totalLessons = lessons.length
    const lessonsProgress = Math.round((watchedCount / totalLessons) * 100)
    const allLessonsWatched = watchedCount === totalLessons
    const xpPerLesson = 20
    const earnedLessonsXP = watchedCount * xpPerLesson
    const remainingLessonsXP = XP_CONFIG.PRE_EVENT.WATCH_BONUS_LESSONS - earnedLessonsXP

    return [
      {
        id: STEP_IDS.PROTOCOL_SURVEY,
        title: 'Protocolo de Iniciação',
        subtitle: 'Calibre seus dados para o seu sistema ser personalizado para o seu negócio',
        icon: <Network size={28} />,
        status: isStepCompleted(STEP_IDS.PROTOCOL_SURVEY) ? 'completed' : 'current',
        xp: XP_CONFIG.PRE_EVENT.PROTOCOL_SURVEY,
      },
      {
        id: STEP_IDS.COMPLETE_PROFILE,
        title: 'Complete seu Perfil',
        subtitle: 'Adicione sua foto e informações para personalizar sua experiência',
        icon: <User size={28} />,
        status: isProfileComplete ? 'completed' : 'current',
        progress: isProfileComplete ? undefined : profileProgress,
        xp: XP_CONFIG.PRE_EVENT.COMPLETE_PROFILE,
      },
      {
        id: STEP_IDS.WATCH_BONUS_LESSONS,
        title: 'Assistir Aulas Bônus',
        subtitle: allLessonsWatched
          ? 'Todas as aulas foram assistidas!'
          : `${watchedCount}/${totalLessons} aulas assistidas • Clique para assistir`,
        icon: <Play size={28} />,
        status: allLessonsWatched ? 'completed' : 'current',
        progress: allLessonsWatched ? undefined : lessonsProgress,
        xp: remainingLessonsXP, // XP restante, não total
      },
      {
        id: STEP_IDS.PURCHASE_PDF_DIAGNOSIS,
        title: 'Dossiê do Negócio (PDF)',
        subtitle: 'Análise completa do seu processo de vendas',
        icon: <FileText size={28} />,
        status: 'purchase',
        isPurchase: true,
        xp: XP_CONFIG.PRE_EVENT.PURCHASE_PDF_DIAGNOSIS,
      },
      {
        id: STEP_IDS.PURCHASE_EDITED_LESSONS,
        title: 'Aulas Editadas',
        subtitle: 'Chance de revisar o conteúdo do evento durante 1 ano',
        icon: <Video size={28} />,
        status: 'purchase',
        isPurchase: true,
        xp: XP_CONFIG.PRE_EVENT.PURCHASE_EDITED_LESSONS,
      },
    ]
  }

  const [steps, setSteps] = useState<JourneyStep[]>(getSteps())

  // Update steps when profile, completed steps, or lessons change
  useEffect(() => {
    setSteps(getSteps())
  }, [userProfile, completedSteps, lessons])

  // Update steps when profile changes
  const updateStepsWithProfile = () => {
    setSteps(getSteps())
  }

  // Use XP from Supabase instead of local calculation
  const totalXP = xp

  const handleComplete = async (stepId: string) => {
    // Find step to get XP value
    const step = steps.find(s => s.id === stepId)
    if (!step) return

    // Save to Supabase
    await completeStep(stepId, step.xp || 0)

    // Update local state will happen automatically via useEffect
  }

  const handleStepClick = async (stepId: string, status: JourneyStep['status']) => {
    if (stepId === STEP_IDS.COMPLETE_PROFILE) {
      setShowProfileModal(true)
    } else if (stepId === STEP_IDS.WATCH_BONUS_LESSONS) {
      // Scroll suave para seção de aulas
      const lessonsSection = document.getElementById('aulas-bonus-section')
      if (lessonsSection) {
        lessonsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else if (stepId === STEP_IDS.PROTOCOL_SURVEY && status === 'current') {
      // Verificar se usuário já preencheu o protocolo
      const { data: surveyResponse } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (surveyResponse) {
        // Já preencheu → dar XP
        handleComplete(stepId)
      } else {
        // NÃO preencheu → redirecionar para Thank You Page
        navigate('/obrigado?email=' + encodeURIComponent(user?.email || ''))
      }
    } else if (status === 'current') {
      handleComplete(stepId)
    }
  }

  // Upload de foto para Supabase Storage
  const handlePhotoUpload = async () => {
    if (!user) return

    // Criar input de arquivo
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      console.log('📸 Starting photo upload...', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type,
        userId: user.id,
      })

      try {
        // Validar tamanho (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
          console.log('❌ File too large:', file.size)
          alert('Foto muito grande! Máximo 2MB.')
          return
        }

        // Validar tipo
        if (!file.type.startsWith('image/')) {
          console.log('❌ Invalid file type:', file.type)
          alert('Arquivo inválido! Use apenas imagens.')
          return
        }

        // Upload para Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        console.log('📤 Uploading to Supabase Storage...', {
          bucket: 'profiles',
          path: filePath,
        })

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, file, { upsert: true })

        if (uploadError) {
          console.error('❌ Upload error:', {
            message: uploadError.message,
            statusCode: uploadError.statusCode,
            error: uploadError,
          })
          throw uploadError
        }

        console.log('✅ Upload successful:', uploadData)

        // Pegar URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath)

        console.log('🔗 Public URL:', publicUrl)

        // Atualizar state local
        setProfile(prev => ({ ...prev, photoUrl: publicUrl }))
        setTimeout(updateStepsWithProfile, 100)

        console.log('✅ Photo upload complete!')

      } catch (error: any) {
        console.error('❌ Error uploading photo:', error)

        // Mostrar erro específico para debug
        const errorMessage = error?.message || error?.error_description || JSON.stringify(error)
        alert(`Erro ao fazer upload da foto:\n\n${errorMessage}\n\nVerifique as políticas do Storage no Supabase.`)
      }
    }

    // Abrir seletor de arquivo
    input.click()
  }

  // Handle profile field change
  const handleProfileChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setTimeout(updateStepsWithProfile, 100)
  }

  // Save profile to Supabase
  const handleSaveProfile = async () => {
    if (!user) {
      console.error('❌ No user found')
      return
    }

    console.log('💾 Salvando perfil...', {
      user_id: user.id,
      data: {
        name: profile.name,
        phone: profile.phone,
        company: profile.company,
        role: profile.role,
        photo_url: profile.photoUrl,
      }
    })

    setIsSavingProfile(true)
    setProfileSaved(false)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name || null,
          phone: profile.phone || null,
          company: profile.company || null,
          role: profile.role || null,
          photo_url: profile.photoUrl || null,
        })
        .eq('id', user.id)

      if (error) throw error

      console.log('✅ Profile saved to database successfully!')

      // Refresh profile from database
      await refreshProfile()
      console.log('🔄 Profile refreshed from database')

      // Mostrar feedback de sucesso
      setProfileSaved(true)

      // Se perfil está completo, marcar step como concluído
      if (isProfileComplete) {
        console.log('🎯 Perfil completo! Marcando step como concluído...')
        await completeStep(STEP_IDS.COMPLETE_PROFILE, XP_CONFIG.PRE_EVENT.COMPLETE_PROFILE)
      }

      // Fechar modal após 1 segundo
      setTimeout(() => {
        setShowProfileModal(false)
        setProfileSaved(false)
      }, 1500)
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      alert('Erro ao salvar perfil. Tente novamente.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Mark lesson as watched
  const handleMarkLessonWatched = async (lessonId: number) => {
    // Cada aula vale 20 XP (60 XP total ÷ 3 aulas)
    const XP_PER_LESSON = 20
    const stepId = `watch-lesson-${lessonId}`

    // Atualizar visualmente
    setLessons(prev => prev.map(l =>
      l.id === lessonId ? { ...l, watched: true } : l
    ))

    // Dar XP e salvar no banco
    await completeStep(stepId, XP_PER_LESSON)
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

  // Check tab access (admins bypass)
  if (!isAdmin && !isPreEventoAccessible()) {
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
            Esta aba será liberada automaticamente na data/hora configurada pelo instrutor. Aguarde a liberação.
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
          style={{ padding: '24px 16px' }}
        >
          {/* ==================== HEADER ==================== */}
          <motion.div variants={headerVariants} style={{ marginBottom: '28px' }}>
            {/* Top Bar - Avatar + Notifications */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
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
                        border: '2px solid #050505',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#fff',
                      }}
                    >
                      {unreadCount}
                    </div>
                  )}
                </motion.button>

                {/* Avatar */}
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
            </div>

            {/* Logo/Título - Invertido */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
                  / {XP_CONFIG.PRE_EVENT.TOTAL} XP
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
                    animate={{ width: `${(totalXP / XP_CONFIG.PRE_EVENT.TOTAL) * 100}%` }}
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
                  NÍVEL DE PRONTIDÃO DO SEU SISTEMA: {Math.round((totalXP / XP_CONFIG.PRE_EVENT.TOTAL) * 100)}%
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
                      {/* XP Value - mostrar diferente baseado no status */}
                      {step.status === 'completed' ? (
                        // Completo: Mostrar checkmark e "Ganho"
                        <>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(34, 211, 238, 0.15)',
                              border: '1.5px solid rgba(34, 211, 238, 0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={18} color={theme.colors.accent.cyan.DEFAULT} strokeWidth={3} />
                          </div>
                          <span
                            style={{
                              fontSize: '9px',
                              color: theme.colors.accent.cyan.DEFAULT,
                              fontWeight: theme.typography.fontWeight.semibold,
                              textTransform: 'uppercase',
                            }}
                          >
                            Ganho
                          </span>
                        </>
                      ) : step.xp && step.xp > 0 ? (
                        // Disponível ou em progresso: Mostrar +XP
                        <>
                          <span
                            style={{
                              fontSize: '18px',
                              fontWeight: theme.typography.fontWeight.bold,
                              color: step.status === 'locked'
                                ? theme.colors.text.muted
                                : step.isPurchase
                                ? theme.colors.gold.light
                                : theme.colors.gold.DEFAULT,
                              textShadow: step.status !== 'locked'
                                ? `0 0 12px ${step.isPurchase ? theme.colors.gold.light : theme.colors.gold.DEFAULT}66`
                                : 'none',
                            }}
                          >
                            +{step.xp}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              color: step.status === 'locked'
                                ? theme.colors.text.muted
                                : step.isPurchase
                                ? theme.colors.gold.light
                                : theme.colors.gold.DEFAULT,
                              textTransform: 'uppercase',
                              fontWeight: theme.typography.fontWeight.semibold,
                            }}
                          >
                            XP
                          </span>
                        </>
                      ) : null}
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
          <motion.div variants={itemVariants} id="aulas-bonus-section" style={{ marginTop: '24px', scrollMarginTop: '80px' }}>
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
              {lessons.map((lesson) => (
                <motion.div
                  key={lesson.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedLesson(lesson)}
                  style={{
                    background: lesson.watched
                      ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(10, 15, 20, 0.8) 0%, rgba(5, 10, 18, 0.9) 100%)',
                    border: `1px solid ${lesson.watched ? 'rgba(34, 211, 238, 0.5)' : 'rgba(34, 211, 238, 0.35)'}`,
                    borderRadius: '8px',
                    padding: '14px 8px 10px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: lesson.watched
                      ? '0 0 20px rgba(34, 211, 238, 0.2)'
                      : '0 0 15px rgba(34, 211, 238, 0.05)',
                    position: 'relative',
                  }}
                >
                  {/* Watched badge */}
                  {lesson.watched && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: theme.colors.accent.cyan.DEFAULT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={10} color="#050505" strokeWidth={3} />
                    </div>
                  )}

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
                      alt={`Aula ${lesson.id}`}
                      style={{
                        width: '70px',
                        height: 'auto',
                        filter: lesson.watched
                          ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.5))'
                          : 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.4))',
                      }}
                    />
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: lesson.watched ? theme.colors.accent.cyan.DEFAULT : theme.colors.text.primary,
                      letterSpacing: '0.03em',
                    }}
                  >
                    Aula {lesson.id}
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
                      +{XP_CONFIG.PRE_EVENT.COMPLETE_PROFILE} XP ao completar
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
              <p style={{ fontSize: '11px', color: theme.colors.text.muted, textAlign: 'center', marginBottom: '20px' }}>
                {profile.photoUrl ? 'Clique para alterar a foto' : 'Clique para adicionar uma foto'}
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
                whileHover={{ scale: isSavingProfile ? 1 : 1.02 }}
                whileTap={{ scale: isSavingProfile ? 1 : 0.98 }}
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: profileSaved
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)'
                    : isProfileComplete
                    ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                  border: `1px solid ${profileSaved ? 'rgba(16, 185, 129, 0.5)' : isProfileComplete ? 'rgba(34, 211, 238, 0.5)' : 'rgba(168, 85, 247, 0.5)'}`,
                  borderRadius: '12px',
                  cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: profileSaved
                    ? '#10B981'
                    : isProfileComplete
                    ? theme.colors.accent.cyan.DEFAULT
                    : theme.colors.accent.purple.light,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: isSavingProfile ? 0.7 : 1,
                }}
              >
                {isSavingProfile ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      style={{ display: 'flex' }}
                    >
                      <Zap size={18} />
                    </motion.div>
                    SALVANDO...
                  </>
                ) : profileSaved ? (
                  <>
                    <Check size={18} />
                    SALVO COM SUCESSO!
                  </>
                ) : isProfileComplete ? (
                  <>
                    <Check size={18} />
                    SALVAR PERFIL COMPLETO
                  </>
                ) : (
                  'SALVAR ALTERAÇÕES'
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ==================== LESSON MODAL ==================== */}
      {selectedLesson && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: theme.colors.background.dark,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(34, 211, 238, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedLesson(null)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(100, 116, 139, 0.2)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={20} color={theme.colors.text.secondary} />
            </motion.button>
            <div style={{ flex: 1 }}>
              <span
                style={{
                  fontSize: '10px',
                  color: theme.colors.accent.cyan.DEFAULT,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                AULA {selectedLesson.id}
              </span>
              <h2
                style={{
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '14px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                  margin: 0,
                }}
              >
                {selectedLesson.title}
              </h2>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: 'rgba(100, 116, 139, 0.15)',
                borderRadius: '8px',
              }}
            >
              <Clock size={12} color={theme.colors.text.secondary} />
              <span style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
                {selectedLesson.duration}
              </span>
            </div>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
            }}
          >
            {/* Video Player */}
            <div
              style={{
                width: '100%',
                aspectRatio: '16/9',
                background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.95) 0%, rgba(10, 12, 18, 0.98) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Video placeholder - in production this would be an actual video player */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'rgba(34, 211, 238, 0.15)',
                    border: '2px solid rgba(34, 211, 238, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Play size={32} color={theme.colors.accent.cyan.DEFAULT} fill={theme.colors.accent.cyan.DEFAULT} />
                </div>
                <span style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                  Clique para assistir
                </span>
              </div>
            </div>

            {/* Description */}
            <div
              style={{
                padding: '16px',
                background: 'rgba(10, 12, 18, 0.6)',
                border: '1px solid rgba(100, 116, 139, 0.2)',
                borderRadius: '12px',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Sobre esta aula
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {selectedLesson.description}
              </p>
            </div>

            {/* PDF Download */}
            {selectedLesson.pdfUrl && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={22} color={theme.colors.gold.DEFAULT} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.gold.DEFAULT,
                      display: 'block',
                    }}
                  >
                    Material em PDF
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Baixe o material complementar
                  </span>
                </div>
                <Download size={20} color={theme.colors.gold.DEFAULT} />
              </motion.button>
            )}
          </div>

          {/* Footer - Mark as watched */}
          <div
            style={{
              padding: '16px 20px',
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid rgba(100, 116, 139, 0.2)',
            }}
          >
            {selectedLesson.watched ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px',
                  background: 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '12px',
                }}
              >
                <Check size={20} color={theme.colors.accent.cyan.DEFAULT} />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: theme.colors.accent.cyan.DEFAULT,
                  }}
                >
                  AULA CONCLUÍDA
                </span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => {
                  await handleMarkLessonWatched(selectedLesson.id)
                  setSelectedLesson({ ...selectedLesson, watched: true })
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
                  border: '1px solid rgba(34, 211, 238, 0.5)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Check size={20} color={theme.colors.accent.cyan.DEFAULT} />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: theme.colors.accent.cyan.DEFAULT,
                  }}
                >
                  MARCAR COMO ASSISTIDA
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '8px',
                    padding: '4px 8px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    borderRadius: '6px',
                  }}
                >
                  <Zap size={12} color={theme.colors.gold.DEFAULT} />
                  <span style={{ fontSize: '11px', color: theme.colors.gold.DEFAULT, fontWeight: 'bold' }}>
                    +20 XP
                  </span>
                </div>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

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
