/**
 * Admin - Painel de Controle do Evento
 *
 * Layout desktop com split view:
 * - Esquerda: Controles (módulo atual, avisos, oferta)
 * - Direita: Mockup do que o participante vê
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio,
  Send,
  Bell,
  Gift,
  AlertTriangle,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Power,
  Pause,
  Play,
  Users,
  Zap,
  Unlock,
  Check,
  Monitor,
  X,
  XCircle,
  Coffee,
  Calendar,
  Clock,
  Settings,
  Bot,
  Search,
  UserCheck,
  UserX,
  Activity,
  FileText,
  Save,
  Loader,
  Trash2,
} from 'lucide-react'
import { EVENT_MODULES, TOTAL_MODULES } from '../data/modules'
import { NotificationToast, ConfirmationModal } from '../components/ui'
import type { ToastNotification } from '../components/ui'
import { theme } from '../styles/theme'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { useEventState } from '../hooks/useEventState'
import type { NotificationType } from '../hooks/useNotifications'

// Estado do evento
// Participante online
interface OnlineParticipant {
  id: string
  name: string
  email: string
  xp: number
  currentModule: number
  lastActivity: Date
  status: 'active' | 'idle' | 'inactive'
}

// Mock de participantes online
const generateMockParticipants = (count: number): OnlineParticipant[] => {
  const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Rafael', 'Fernanda', 'Lucas', 'Beatriz', 'André', 'Camila', 'Bruno', 'Larissa', 'Diego', 'Patricia', 'Gustavo', 'Amanda', 'Rodrigo', 'Carolina']
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Gomes', 'Ribeiro', 'Martins', 'Carvalho', 'Rodrigues', 'Nascimento', 'Araújo', 'Barbosa', 'Moreira', 'Mendes', 'Pinto']

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const name = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`

    return {
      id: `user-${i}`,
      name,
      email,
      xp: Math.floor(Math.random() * 200) + 10,
      currentModule: Math.floor(Math.random() * 10),
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 300000)),
      status: (Math.random() > 0.2 ? 'active' : 'idle') as 'active' | 'idle',
    }
  }).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
}

// Dados do evento (editáveis)
interface EventData {
  edition: string
  day1Date: string
  day1Time: string
  day2Date: string
  day2Time: string
}

// Liberação das abas do app
interface TabRelease {
  preparacao: { enabled: boolean; unlockDate: string; unlockTime: string; lockDate: string; lockTime: string }
  aoVivo: { enabled: boolean; unlockDate: string; unlockTime: string; lockDate: string; lockTime: string }
  posEvento: { enabled: boolean; unlockDate: string; unlockTime: string; lockDate: string; lockTime: string }
}

// Links da oferta
interface OfferLinks {
  posEventoLink: string
  ingresso1Percent: string
  ingressoExecutivo: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  utmContent: string
}

// Tipos de aviso (mapped to NotificationType)
const notificationTypes: { type: NotificationType; label: string; icon: typeof Bell; color: string }[] = [
  { type: 'info', label: 'Info', icon: Bell, color: '#22D3EE' },
  { type: 'warning', label: 'Alerta', icon: AlertTriangle, color: '#EF4444' },
  { type: 'success', label: 'Oferta', icon: Gift, color: '#F59E0B' },
  { type: 'info', label: 'NPS', icon: Star, color: '#A855F7' },
]

// Helper to format time ago
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'agora'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}

// Templates de avisos
const notificationTemplates = [
  { title: 'Estamos começando!', message: 'Abra seu app e prepare-se para o diagnóstico.' },
  { title: 'Intervalo', message: 'Voltamos em 15 minutos. Aproveite para preencher seu diagnóstico.' },
  { title: 'Voltamos!', message: 'Próximo módulo começando agora.' },
  { title: 'Preencha seu diagnóstico', message: 'Não esqueça de registrar suas notas do módulo atual.' },
  { title: 'Oferta especial!', message: 'Condição exclusiva disponível agora para participantes.' },
]

export function Admin() {
  // Hooks
  const { user } = useAuth()
  const { createNotification, deleteAllNotifications } = useNotifications()
  const {
    eventState: dbEventState,
    loading: _loadingEventState,
    startEvent,
    pauseEvent,
    resumeEvent,
    finishEvent,
    setDay,
    setModule: setDbModule,
    unlockOffer,
    closeOffer,
    toggleAI,
    startLunch,
    toggleLunch,
    toggleActivity,
    triggerNPS,
    clearNPS,
    resetEvent,
    updateEventState,
  } = useEventState()

  // Map database event state to UI format
  const eventState = {
    status: dbEventState?.lunch_active ? 'lunch' : (dbEventState?.status || 'offline'),
    currentDay: dbEventState?.current_day || 1,
    currentModule: dbEventState?.current_module || 0,
    offerReleased: dbEventState?.offer_unlocked || false,
    aiEnabled: dbEventState?.ai_enabled || false,
    lunchActive: dbEventState?.lunch_active || false,
    participantsOnline: 0, // This could be computed from real data later
    lunchReturnTime: dbEventState?.lunch_started_at
      ? new Date(new Date(dbEventState.lunch_started_at).getTime() + (dbEventState.lunch_duration_minutes || 60) * 60000)
          .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '14:00',
  }

  // Event Data (editável)
  const [eventData, setEventData] = useState<EventData>({
    edition: 'Fevereiro 2026',
    day1Date: '2026-02-28',
    day1Time: '09:30',
    day2Date: '2026-03-01',
    day2Time: '09:30',
  })
  const [showEventSettings, setShowEventSettings] = useState(false)

  // Tab Release (liberação das abas)
  const [tabRelease, setTabRelease] = useState<TabRelease>({
    preparacao: {
      enabled: true,
      unlockDate: '2026-02-01',
      unlockTime: '00:00',
      lockDate: '2026-02-28',
      lockTime: '09:30'
    },
    aoVivo: {
      enabled: false,
      unlockDate: '2026-02-28',
      unlockTime: '09:30',
      lockDate: '2026-03-01',
      lockTime: '18:00'
    },
    posEvento: {
      enabled: false,
      unlockDate: '2026-03-01',
      unlockTime: '18:00',
      lockDate: '',
      lockTime: ''
    },
  })

  // Offer Links (links da oferta)
  const [offerLinks, setOfferLinks] = useState<OfferLinks>({
    posEventoLink: 'https://imersao.neuropersuasao.com.br/',
    ingresso1Percent: 'https://pay.hotmart.com/K91662125A?off=66czkxps',
    ingressoExecutivo: 'https://pay.hotmart.com/K91662125A?off=y1frgqvy',
    utmSource: 'appdiagn',
    utmMedium: 'app',
    utmCampaign: 'imersao2026',
    utmContent: 'oferta',
  })
  const [savingLinks, setSavingLinks] = useState(false)

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    targetModule: number
    moduleName: string
  }>({ show: false, targetModule: 0, moduleName: '' })

  // Finish Event Confirmation Modal
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showNPSModal, setShowNPSModal] = useState<'day1' | 'final' | null>(null)
  const [showClearNotificationsModal, setShowClearNotificationsModal] = useState(false)

  // Notification Form
  const [notifType, setNotifType] = useState<NotificationType>('info')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifAction, setNotifAction] = useState('')
  const [sentNotifications, setSentNotifications] = useState<ToastNotification[]>([])
  const [adminToast, setAdminToast] = useState<{ message: string; type: 'info' | 'warning' | 'success' } | null>(null)

  // Navigation Config (Avisos Clickables)
  const [actionType, setActionType] = useState<'none' | 'internal' | 'external'>('none')
  const [targetPage, setTargetPage] = useState('')
  const [targetSection, setTargetSection] = useState('')
  const [externalUrl, setExternalUrl] = useState('')

  // Preview notification (for toast display)
  const [previewNotification, setPreviewNotification] = useState<ToastNotification | null>(null)
  const [_lunchMinutesRemaining, setLunchMinutesRemaining] = useState<number>(0)

  // Lunch time modal
  const [showLunchTimeModal, setShowLunchTimeModal] = useState(false)
  const [lunchReturnTime, setLunchReturnTime] = useState('')

  // Participants modal
  const [showParticipants, setShowParticipants] = useState(false)
  const [participants, setParticipants] = useState<OnlineParticipant[]>([])
  const [participantSearch, setParticipantSearch] = useState('')
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false)

  // Access requests state
  const [accessRequests, setAccessRequests] = useState<any[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  // Users modal state
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [usersTab, setUsersTab] = useState<'all' | 'pending'>('all')
  const [usersFilter, setUsersFilter] = useState<'all' | 'online'>('all')
  const [usersSort, setUsersSortOption] = useState<'xp' | 'lastSeen'>('xp')

  // Calculate minutes remaining until lunch return
  const calculateLunchMinutes = () => {
    const [hours, minutes] = eventState.lunchReturnTime.split(':').map(Number)
    const now = new Date()
    const returnTime = new Date()
    returnTime.setHours(hours, minutes, 0, 0)
    const diffMs = returnTime.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffMs / 60000))
  }

  // Update lunch countdown every minute
  useEffect(() => {
    if (eventState.status === 'lunch') {
      setLunchMinutesRemaining(calculateLunchMinutes())
      const interval = setInterval(() => {
        setLunchMinutesRemaining(calculateLunchMinutes())
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [eventState.status, eventState.lunchReturnTime])

  // (Mock simulation removed - using real Supabase data now)

  // Fetch real participants from Supabase
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('xp', { ascending: false }) // Sort by XP (highest first)

        if (error) throw error

        // Map Profile to OnlineParticipant
        const now = new Date()
        const mappedParticipants: OnlineParticipant[] = (data || []).map((profile: Profile) => {
          // Calcular status baseado em last_seen_at
          const lastSeenAt = profile.last_seen_at ? new Date(profile.last_seen_at) : null
          const minutesSinceLastSeen = lastSeenAt
            ? (now.getTime() - lastSeenAt.getTime()) / 1000 / 60
            : Infinity

          // Status: 0-10min = online, 10-30min = away, 30+ = offline
          let status: 'active' | 'idle' | 'inactive'
          if (minutesSinceLastSeen < 10) {
            status = 'active' // Verde - Online
          } else if (minutesSinceLastSeen < 30) {
            status = 'idle' // Amarelo - Ausente
          } else {
            status = 'inactive' // Cinza - Offline
          }

          return {
            id: profile.id,
            name: profile.name || 'Participante',
            email: profile.email,
            xp: profile.xp,
            currentModule: 0, // TODO: Track current module per user
            lastActivity: lastSeenAt || new Date(profile.updated_at),
            status,
          }
        })

        setParticipants(mappedParticipants)
        // participantsOnline is computed from participants.length

        console.log(`📊 ${mappedParticipants.length} participantes carregados do Supabase`)
      } catch (error) {
        console.error('❌ Erro ao carregar participantes:', error)
        // Fallback to mock data if error
        setParticipants(generateMockParticipants(50))
      }
    }

    fetchParticipants()

    // Refresh every 30 seconds
    const interval = setInterval(fetchParticipants, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch access requests
  useEffect(() => {
    const fetchAccessRequests = async () => {
      try {
        setLoadingRequests(true)

        const { data, error } = await supabase
          .from('access_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) throw error

        setAccessRequests(data || [])
        console.log(`📋 ${(data || []).length} solicitações de acesso pendentes`)
      } catch (error) {
        console.error('❌ Erro ao carregar solicitações:', error)
        setAccessRequests([])
      } finally {
        setLoadingRequests(false)
      }
    }

    fetchAccessRequests()

    // Refresh every 30 seconds
    const interval = setInterval(fetchAccessRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch all users when modal opens
  useEffect(() => {
    if (!showUsersModal) return

    const fetchAllUsers = async () => {
      try {
        setLoadingUsers(true)

        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name, phone, company, role, xp, created_at, updated_at, last_seen_at')
          .order('created_at', { ascending: false })

        if (error) throw error

        setAllUsers(data || [])
        console.log(`👥 ${(data || []).length} usuários carregados`)
      } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error)
        setAllUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchAllUsers()
  }, [showUsersModal])

  // Load tab release settings from event_state
  useEffect(() => {
    if (!dbEventState) return

    const formatDateTime = (isoString: string | null) => {
      if (!isoString) return { date: '', time: '' }
      const d = new Date(isoString)
      // Usar timezone local consistentemente para data e hora
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
    }

    const unlockPrep = formatDateTime(dbEventState.pre_evento_unlock_date)
    const lockPrep = formatDateTime(dbEventState.pre_evento_lock_date)
    const unlockAoVivo = formatDateTime(dbEventState.ao_vivo_unlock_date)
    const lockAoVivo = formatDateTime(dbEventState.ao_vivo_lock_date)
    const unlockPos = formatDateTime(dbEventState.pos_evento_unlock_date)
    const lockPos = formatDateTime(dbEventState.pos_evento_lock_date)

    setTabRelease({
      preparacao: {
        enabled: dbEventState.pre_evento_enabled ?? true,
        unlockDate: unlockPrep.date,
        unlockTime: unlockPrep.time,
        lockDate: lockPrep.date,
        lockTime: lockPrep.time,
      },
      aoVivo: {
        enabled: dbEventState.ao_vivo_enabled ?? false,
        unlockDate: unlockAoVivo.date,
        unlockTime: unlockAoVivo.time,
        lockDate: lockAoVivo.date,
        lockTime: lockAoVivo.time,
      },
      posEvento: {
        enabled: dbEventState.pos_evento_enabled ?? false,
        unlockDate: unlockPos.date,
        unlockTime: unlockPos.time,
        lockDate: lockPos.date,
        lockTime: lockPos.time,
      },
    })
  }, [dbEventState])

  // Load event data from event_state
  useEffect(() => {
    if (!dbEventState) return

    setEventData({
      edition: dbEventState.edition || 'Fevereiro 2026',
      day1Date: dbEventState.day1_date || '2026-02-28',
      day1Time: dbEventState.day1_time || '09:30',
      day2Date: dbEventState.day2_date || '2026-03-01',
      day2Time: dbEventState.day2_time || '09:30',
    })
  }, [dbEventState])

  // Save tab release settings to event_state
  const saveTabSettings = async () => {
    const formatToISO = (date: string, time: string): string | null => {
      if (!date || !time) return null
      return `${date}T${time}:00-03:00` // Brazil timezone
    }

    const updates = {
      pre_evento_enabled: tabRelease.preparacao.enabled,
      pre_evento_unlock_date: formatToISO(tabRelease.preparacao.unlockDate, tabRelease.preparacao.unlockTime),
      pre_evento_lock_date: formatToISO(tabRelease.preparacao.lockDate, tabRelease.preparacao.lockTime),
      ao_vivo_enabled: tabRelease.aoVivo.enabled,
      ao_vivo_unlock_date: formatToISO(tabRelease.aoVivo.unlockDate, tabRelease.aoVivo.unlockTime),
      ao_vivo_lock_date: formatToISO(tabRelease.aoVivo.lockDate, tabRelease.aoVivo.lockTime),
      pos_evento_enabled: tabRelease.posEvento.enabled,
      pos_evento_unlock_date: formatToISO(tabRelease.posEvento.unlockDate, tabRelease.posEvento.unlockTime),
      pos_evento_lock_date: formatToISO(tabRelease.posEvento.lockDate, tabRelease.posEvento.lockTime),
      // Event Data
      edition: eventData.edition,
      day1_date: eventData.day1Date,
      day1_time: eventData.day1Time,
      day2_date: eventData.day2Date,
      day2_time: eventData.day2Time,
    }

    const { error } = await updateEventState(updates)

    if (error) {
      console.error('❌ Erro ao salvar configurações de abas:', error)
      setAdminToast({ message: 'Erro ao salvar configurações', type: 'warning' })
    } else {
      console.log('✅ Configurações de abas salvas')
      setAdminToast({ message: 'Configurações salvas com sucesso', type: 'success' })
    }
  }

  // Carregar links salvos ao montar o componente
  useEffect(() => {
    const loadOfferLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('event_state')
          .select('offer_links')
          .single()

        if (error) throw error

        // Se existirem links salvos, carregá-los
        if (data?.offer_links) {
          setOfferLinks(prev => ({
            ...prev,
            ...data.offer_links
          }))
          console.log('✅ Links da oferta carregados:', data.offer_links)
        }
      } catch (err) {
        console.error('Error loading offer links:', err)
      }
    }

    loadOfferLinks()
  }, [])

  // Auto-dismiss admin toast após 5 segundos
  useEffect(() => {
    if (!adminToast) return

    const timer = setTimeout(() => {
      setAdminToast(null)
    }, 5000)

    return () => clearTimeout(timer)
  }, [adminToast])

  // Filter participants by search and sort by XP (highest first)
  const filteredParticipants = participants
    .filter(p =>
      p.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(participantSearch.toLowerCase())
    )
    .sort((a, b) => b.xp - a.xp)

  const currentModule = EVENT_MODULES[eventState.currentModule]
  const currentDay = eventState.currentDay

  const handleSetDay = async (day: 1 | 2) => {
    console.log(`🗓️ [Admin] Mudando para dia ${day}...`)
    const result = await setDay(day)
    console.log('🗓️ [Admin] Resultado da mudança de dia:', result)

    if (result?.error) {
      console.error('❌ [Admin] Erro ao mudar dia:', result.error)
      setAdminToast({
        message: `Erro ao mudar para Dia ${day}: ${result.error.message}`,
        type: 'warning'
      })
      setTimeout(() => setAdminToast(null), 3000)
    } else {
      console.log(`✅ [Admin] Dia alterado para ${day}`)
    }
  }

  const handleToggleLive = async () => {
    if (eventState.status === 'offline' || eventState.status === 'finished') {
      await startEvent()
    } else {
      // Não faz nada - precisa usar PAUSAR ou FINALIZAR
      setAdminToast({
        message: 'Use os botões PAUSAR ou FINALIZAR EVENTO para encerrar',
        type: 'info'
      })
      setTimeout(() => setAdminToast(null), 3000)
    }
  }

  const handleTogglePause = async () => {
    const wasPaused = eventState.status === 'paused'

    if (wasPaused) {
      await resumeEvent()
      // Notificação de retorno
      console.log('📤 [Admin] Criando notificação de retorno...')
      const result = await createNotification(
        'info',
        'Transmissão Retomada',
        'O evento voltou ao vivo! Não perca o próximo módulo.'
      )
      console.log('📤 [Admin] Resultado da notificação:', result)
    } else {
      await pauseEvent()
      // Notificação de pausa
      console.log('📤 [Admin] Criando notificação de pausa...')
      const result = await createNotification(
        'warning',
        'Evento Pausado',
        'A transmissão foi pausada temporariamente. Aguarde o retorno.'
      )
      console.log('📤 [Admin] Resultado da notificação:', result)
    }
  }

  const handleFinishEvent = async () => {
    await finishEvent()
    console.log('✅ Evento finalizado pelo Admin')
    setShowFinishModal(false)
  }

  const handleSetupTestEvent = async () => {
    // Configura evento para começar em 1 minuto (para testes)
    const oneMinuteFromNow = new Date()
    oneMinuteFromNow.setMinutes(oneMinuteFromNow.getMinutes() + 1)

    await updateEventState({
      ao_vivo_unlock_date: oneMinuteFromNow.toISOString(),
      ao_vivo_enabled: true,
      pre_evento_enabled: true,
      status: 'offline',
    })

    console.log('🧪 Evento de teste configurado para 1 minuto')
    setAdminToast({
      message: 'Evento de teste configurado! Countdown inicia em 1 minuto.',
      type: 'success'
    })
    setTimeout(() => setAdminToast(null), 4000)
    setShowTestModal(false)
  }

  const handleResetEvent = async () => {
    await resetEvent()
    console.log('🔄 Evento resetado para estado pré-início')
    setAdminToast({
      message: 'Evento resetado! Status: offline, módulo: 0, como se nunca tivesse iniciado.',
      type: 'success'
    })
    setTimeout(() => setAdminToast(null), 4000)
    setShowResetModal(false)
  }

  const handleToggleLunch = async () => {
    const wasLunchActive = eventState.status === 'lunch'

    if (wasLunchActive) {
      // Fim do almoço
      await toggleLunch(60)
      console.log('📤 [Admin] Criando notificação de fim do almoço...')
      const result = await createNotification(
        'info',
        'Fim do Intervalo',
        'Voltamos! O evento continua agora. Esteja pronto para o próximo módulo.'
      )
      console.log('📤 [Admin] Resultado da notificação:', result)
    } else {
      // Início do almoço - abrir modal para pedir hora
      const now = new Date()
      const suggestedTime = new Date(now.getTime() + 60 * 60000) // +60 min
      const suggestedTimeStr = suggestedTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setLunchReturnTime(suggestedTimeStr)
      setShowLunchTimeModal(true)
    }
  }

  const handleConfirmLunchTime = async () => {
    const returnTimeInput = lunchReturnTime

    if (!returnTimeInput) {
      setShowLunchTimeModal(false)
      return
    }

    // Validar formato HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
    if (!timeRegex.test(returnTimeInput)) {
      setAdminToast({
        message: 'Formato inválido! Use HH:MM (ex: 14:30)',
        type: 'warning'
      })
      setTimeout(() => setAdminToast(null), 3000)
      return
    }

    // Calcular duração em minutos
    const now = new Date()
    const [hours, minutes] = returnTimeInput.split(':').map(Number)
    const returnTime = new Date()
    returnTime.setHours(hours, minutes, 0, 0)
    const diffMs = returnTime.getTime() - now.getTime()
    const durationMinutes = Math.max(1, Math.ceil(diffMs / 60000))

    console.log(`⏰ [Admin] Almoço iniciado - Retorno: ${returnTimeInput} (${durationMinutes} min)`)

    // Iniciar almoço
    await toggleLunch(durationMinutes)

    // Notificação de início do almoço
    console.log('📤 [Admin] Criando notificação de início do almoço...')
    const result = await createNotification(
      'info',
      'Intervalo para Almoço',
      `Estamos em intervalo. Retorno previsto: ${returnTimeInput}. Aproveite para descansar!`
    )
    console.log('📤 [Admin] Resultado da notificação:', result)

    setShowLunchTimeModal(false)
  }

  const handleToggleActivity = async () => {
    const wasActivity = eventState.status === 'activity'

    if (wasActivity) {
      await toggleActivity()
      // Notificação de fim da atividade
      console.log('📤 [Admin] Criando notificação de fim da atividade...')
      const result = await createNotification(
        'success',
        'Atividade Encerrada',
        'Atividade finalizada! Vamos retomar a transmissão ao vivo.'
      )
      console.log('📤 [Admin] Resultado da notificação:', result)
    } else {
      await toggleActivity()
      // Notificação de início da atividade
      console.log('📤 [Admin] Criando notificação de início da atividade...')
      const result = await createNotification(
        'info',
        'Momento de Prática',
        'Atividade liberada! Complete a tarefa proposta pelo instrutor e coloque em prática o que aprendeu.'
      )
      console.log('📤 [Admin] Resultado da notificação:', result)
    }
  }

  // Module change with confirmation
  const requestModuleChange = (targetModule: number) => {
    const targetModuleData = EVENT_MODULES[targetModule]
    setConfirmDialog({
      show: true,
      targetModule,
      moduleName: `${targetModule}. ${targetModuleData.title}`,
    })
  }

  const confirmModuleChange = async () => {
    await setDbModule(confirmDialog.targetModule)
    setConfirmDialog({ show: false, targetModule: 0, moduleName: '' })
  }

  const cancelModuleChange = () => {
    setConfirmDialog({ show: false, targetModule: 0, moduleName: '' })
  }

  const handlePrevModule = () => {
    if (eventState.currentModule > 0) {
      requestModuleChange(eventState.currentModule - 1)
    }
  }

  const handleNextModule = () => {
    if (eventState.currentModule < TOTAL_MODULES - 1) {
      requestModuleChange(eventState.currentModule + 1)
    }
  }

  const handleSelectModule = (moduleId: number) => {
    if (moduleId !== eventState.currentModule) {
      requestModuleChange(moduleId)
    }
  }

  const handleReleaseOffer = async () => {
    console.log('🎁 [Admin] Toggling offer...', { offerReleased: eventState.offerReleased })

    if (eventState.offerReleased) {
      console.log('🎁 [Admin] Encerrando oferta...')
      await closeOffer()

      // Criar notificação com link clicável para WhatsApp
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: 'warning',
          title: 'Imersão IMPACT Esgotada',
          message: 'A Imersão IMPACT esgotou. Para ficar na lista de espera em caso de desistência, clique aqui.',
          read_by: [],
          action_type: 'external',
          external_url: 'https://wa.me/5511942230050',
        })

      if (error) {
        console.error('Error creating notification:', error)
      }

      setAdminToast({ message: '⏹️ Oferta encerrada', type: 'info' })
    } else {
      console.log('🎁 [Admin] Liberando oferta...')
      await unlockOffer()
      await createNotification(
        'success',
        'IMERSÃO PRESENCIAL IMPACT Liberada!',
        'O Protocolo IMPACT de 2 Dias está disponível. Garanta sua vaga na imersão presencial.'
      )
      setAdminToast({ message: '🎁 Oferta IMPACT liberada', type: 'success' })
    }

    console.log('✅ [Admin] Oferta toggled')
  }

  const handleToggleAI = async () => {
    const wasEnabled = eventState.aiEnabled

    await toggleAI()

    if (wasEnabled) {
      await createNotification(
        'info',
        'Assistente IA Desativado',
        'O simulador de IA foi desabilitado.'
      )
      setAdminToast({ message: '🤖 Assistente IA desativado', type: 'info' })
    } else {
      await createNotification(
        'success',
        'Assistente IA Liberado!',
        'O simulador está disponível para mapear sua jornada psicológica de vendas.'
      )
      setAdminToast({ message: '🤖 Assistente IA liberado', type: 'success' })
    }
  }

  // Salvar links da oferta
  const handleSaveOfferLinks = async () => {
    setSavingLinks(true)
    try {
      // Salvar no event_state como JSONB
      if (!dbEventState?.id) {
        throw new Error('Event state não encontrado')
      }

      const { error } = await supabase
        .from('event_state')
        .update({
          offer_links: offerLinks,
        })
        .eq('id', dbEventState.id)

      if (error) throw error

      setAdminToast({ message: '✅ Links salvos com sucesso', type: 'success' })
    } catch (err) {
      console.error('Error saving offer links:', err)
      setAdminToast({ message: '❌ Erro ao salvar links', type: 'warning' })
    } finally {
      setSavingLinks(false)
    }
  }

  const handleLunchReturnTimeChange = async (timeString: string) => {
    // Parse the time string (HH:MM)
    const [hours, minutes] = timeString.split(':').map(Number)
    const now = new Date()
    const returnTime = new Date()
    returnTime.setHours(hours, minutes, 0, 0)

    // Calculate duration in minutes
    const diffMs = returnTime.getTime() - now.getTime()
    const durationMinutes = Math.max(0, Math.ceil(diffMs / 60000))

    // Start lunch with this duration
    await startLunch(durationMinutes)
  }

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      console.warn('Título ou mensagem vazia')
      return
    }

    try {
      console.log('📤 [Admin] Enviando notificação...', { notifType, notifTitle, actionType })

      // Construir config de navegação (se houver)
      const navigationConfig = actionType !== 'none' ? {
        action_type: actionType,
        target_page: actionType === 'internal' ? targetPage : undefined,
        target_section: actionType === 'internal' ? targetSection : undefined,
        external_url: actionType === 'external' ? externalUrl : undefined,
      } : undefined

      console.log('📤 [Admin] Navigation config:', navigationConfig)

      // Criar notificação no banco
      const { error, data } = await createNotification(
        notifType,
        notifTitle,
        notifMessage,
        navigationConfig
      )

      if (error) {
        console.error('❌ [Admin] Erro ao enviar notificação:', error)
        alert(`Erro ao enviar notificação: ${error.message || 'Erro desconhecido'}`)
        return
      }

      console.log('✅ [Admin] Notificação criada no banco:', data)

      // Preview local (for toast display only)
      const localNotif: ToastNotification = {
        id: Date.now().toString(),
        type: notifType as any, // NotificationType maps to ToastNotificationType
        title: notifTitle,
        message: notifMessage,
        actionLabel: notifAction.trim() || undefined,
        timestamp: new Date(),
        read: false,
      }

      setSentNotifications(prev => [localNotif as any, ...prev])
      setPreviewNotification(localNotif)

      // Clear form
      setNotifTitle('')
      setNotifMessage('')
      setNotifAction('')
      setActionType('none')
      setTargetPage('')
      setTargetSection('')
      setExternalUrl('')

      console.log('✅ [Admin] Notificação enviada com sucesso!')
    } catch (err) {
      console.error('❌ [Admin] Erro inesperado:', err)
      alert(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    }

    // Auto-hide preview
    setTimeout(() => setPreviewNotification(null), 5000)
  }

  const handleUseTemplate = (template: { title: string; message: string }) => {
    setNotifTitle(template.title)
    setNotifMessage(template.message)
  }

  const getStatusLabel = () => {
    switch (eventState.status) {
      case 'live': return 'AO VIVO'
      case 'paused': return 'PAUSADO'
      case 'activity': return 'ATIVIDADE'
      case 'lunch': return 'ALMOÇO'
      default: return 'OFFLINE'
    }
  }

  const getStatusColor = () => {
    switch (eventState.status) {
      case 'live': return '#EF4444'
      case 'paused': return '#F59E0B'
      case 'activity': return '#A855F7'
      case 'lunch': return '#F59E0B'
      default: return '#64748B'
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        maxHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        fontFamily: theme.typography.fontFamily.body,
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {/* ==================== LADO ESQUERDO - CONTROLES ==================== */}
      <div
        style={{
          width: '65%',
          padding: '24px',
          overflowY: 'auto',
          borderRight: '1px solid rgba(100, 116, 139, 0.2)',
          maxHeight: '100vh',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '24px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.accent.cyan.DEFAULT,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              PAINEL DE CONTROLE
            </h1>
            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, marginTop: '4px' }}>
              Imersão Diagnóstico de Vendas - {eventData.edition}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUsersModal(true)}
              style={{
                padding: '10px 14px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: theme.colors.accent.purple.DEFAULT,
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              <Users size={16} />
              Usuários
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEventSettings(!showEventSettings)}
              style={{
                padding: '10px 14px',
                background: 'rgba(100, 116, 139, 0.2)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: theme.colors.text.secondary,
                fontSize: '12px',
              }}
            >
              <Settings size={16} />
              Configurações
            </motion.button>
          </div>
        </div>

        {/* ==================== EVENT SETTINGS (Collapsible) ==================== */}
        <AnimatePresence>
          {showEventSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                overflow: 'hidden',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  padding: '20px',
                  background: 'rgba(15, 17, 21, 0.8)',
                  border: '1px solid rgba(100, 116, 139, 0.2)',
                  borderRadius: '16px',
                }}
              >
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: theme.colors.text.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Calendar size={16} />
                  Dados do Evento
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'block', marginBottom: '4px' }}>
                      Edição
                    </label>
                    <input
                      type="text"
                      value={eventData.edition}
                      onChange={(e) => setEventData(prev => ({ ...prev, edition: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10, 12, 18, 0.8)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'block', marginBottom: '4px' }}>
                      Data Dia 1
                    </label>
                    <input
                      type="date"
                      value={eventData.day1Date}
                      onChange={(e) => setEventData(prev => ({ ...prev, day1Date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10, 12, 18, 0.8)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'block', marginBottom: '4px' }}>
                      Horário Dia 1
                    </label>
                    <input
                      type="time"
                      value={eventData.day1Time}
                      onChange={(e) => setEventData(prev => ({ ...prev, day1Time: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10, 12, 18, 0.8)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1' }}>
                    {/* Empty spacer */}
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'block', marginBottom: '4px' }}>
                      Data Dia 2
                    </label>
                    <input
                      type="date"
                      value={eventData.day2Date}
                      onChange={(e) => setEventData(prev => ({ ...prev, day2Date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10, 12, 18, 0.8)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'block', marginBottom: '4px' }}>
                      Horário Dia 2
                    </label>
                    <input
                      type="time"
                      value={eventData.day2Time}
                      onChange={(e) => setEventData(prev => ({ ...prev, day2Time: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10, 12, 18, 0.8)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Tab Release Settings */}
                <div style={{ marginTop: '24px' }}>
                  <h2
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: theme.colors.text.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Unlock size={16} />
                    Liberação das Abas
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Preparação */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: tabRelease.preparacao.enabled ? 'rgba(34, 211, 238, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        border: `1px solid ${tabRelease.preparacao.enabled ? 'rgba(34, 211, 238, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                        borderRadius: '10px',
                      }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setTabRelease(prev => ({
                          ...prev,
                          preparacao: { ...prev.preparacao, enabled: !prev.preparacao.enabled }
                        }))}
                        style={{
                          width: '36px',
                          height: '20px',
                          borderRadius: '10px',
                          background: tabRelease.preparacao.enabled
                            ? theme.colors.accent.cyan.DEFAULT
                            : 'rgba(100, 116, 139, 0.3)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          flexShrink: 0,
                        }}
                      >
                        <motion.div
                          animate={{ x: tabRelease.preparacao.enabled ? 18 : 2 }}
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: '2px',
                          }}
                        />
                      </motion.button>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.colors.text.primary, minWidth: '100px' }}>
                        Preparação
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: theme.colors.text.muted, minWidth: '60px' }}>Liberar:</span>
                          <input
                            type="date"
                            value={tabRelease.preparacao.unlockDate}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              preparacao: { ...prev.preparacao, unlockDate: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                          <input
                            type="time"
                            value={tabRelease.preparacao.unlockTime}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              preparacao: { ...prev.preparacao, unlockTime: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: theme.colors.text.muted, minWidth: '60px' }}>Bloquear:</span>
                          <input
                            type="date"
                            value={tabRelease.preparacao.lockDate}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              preparacao: { ...prev.preparacao, lockDate: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                          <input
                            type="time"
                            value={tabRelease.preparacao.lockTime}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              preparacao: { ...prev.preparacao, lockTime: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: tabRelease.preparacao.enabled ? theme.colors.accent.cyan.DEFAULT : theme.colors.text.muted, marginLeft: 'auto' }}>
                        {tabRelease.preparacao.enabled ? '✓ Liberado' : 'Bloqueado'}
                      </span>
                    </div>

                    {/* Ao Vivo */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: tabRelease.aoVivo.enabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        border: `1px solid ${tabRelease.aoVivo.enabled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                        borderRadius: '10px',
                      }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setTabRelease(prev => ({
                          ...prev,
                          aoVivo: { ...prev.aoVivo, enabled: !prev.aoVivo.enabled }
                        }))}
                        style={{
                          width: '36px',
                          height: '20px',
                          borderRadius: '10px',
                          background: tabRelease.aoVivo.enabled
                            ? '#EF4444'
                            : 'rgba(100, 116, 139, 0.3)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          flexShrink: 0,
                        }}
                      >
                        <motion.div
                          animate={{ x: tabRelease.aoVivo.enabled ? 18 : 2 }}
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: '2px',
                          }}
                        />
                      </motion.button>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.colors.text.primary, minWidth: '100px' }}>
                        Ao Vivo
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: theme.colors.text.muted, minWidth: '60px' }}>Liberar:</span>
                          <input
                            type="date"
                            value={tabRelease.aoVivo.unlockDate}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              aoVivo: { ...prev.aoVivo, unlockDate: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                          <input
                            type="time"
                            value={tabRelease.aoVivo.unlockTime}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              aoVivo: { ...prev.aoVivo, unlockTime: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: theme.colors.text.muted, minWidth: '60px' }}>Bloquear:</span>
                          <input
                            type="date"
                            value={tabRelease.aoVivo.lockDate}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              aoVivo: { ...prev.aoVivo, lockDate: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                          <input
                            type="time"
                            value={tabRelease.aoVivo.lockTime}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              aoVivo: { ...prev.aoVivo, lockTime: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: tabRelease.aoVivo.enabled ? '#EF4444' : theme.colors.text.muted, marginLeft: 'auto' }}>
                        {tabRelease.aoVivo.enabled ? '✓ Liberado' : 'Bloqueado'}
                      </span>
                    </div>

                    {/* Pós Evento */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: tabRelease.posEvento.enabled ? 'rgba(168, 85, 247, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        border: `1px solid ${tabRelease.posEvento.enabled ? 'rgba(168, 85, 247, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                        borderRadius: '10px',
                      }}
                    >
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setTabRelease(prev => ({
                          ...prev,
                          posEvento: { ...prev.posEvento, enabled: !prev.posEvento.enabled }
                        }))}
                        style={{
                          width: '36px',
                          height: '20px',
                          borderRadius: '10px',
                          background: tabRelease.posEvento.enabled
                            ? theme.colors.accent.purple.light
                            : 'rgba(100, 116, 139, 0.3)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          flexShrink: 0,
                        }}
                      >
                        <motion.div
                          animate={{ x: tabRelease.posEvento.enabled ? 18 : 2 }}
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: '2px',
                          }}
                        />
                      </motion.button>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.colors.text.primary, minWidth: '100px' }}>
                        Pós Evento
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: theme.colors.text.muted, minWidth: '60px' }}>Liberar:</span>
                          <input
                            type="date"
                            value={tabRelease.posEvento.unlockDate}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              posEvento: { ...prev.posEvento, unlockDate: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                          <input
                            type="time"
                            value={tabRelease.posEvento.unlockTime}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              posEvento: { ...prev.posEvento, unlockTime: e.target.value }
                            }))}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: theme.colors.text.muted, minWidth: '60px' }}>Bloquear:</span>
                          <input
                            type="date"
                            value={tabRelease.posEvento.lockDate}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              posEvento: { ...prev.posEvento, lockDate: e.target.value }
                            }))}
                            placeholder="Opcional"
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                          <input
                            type="time"
                            value={tabRelease.posEvento.lockTime}
                            onChange={(e) => setTabRelease(prev => ({
                              ...prev,
                              posEvento: { ...prev.posEvento, lockTime: e.target.value }
                            }))}
                            placeholder="Opcional"
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', color: tabRelease.posEvento.enabled ? theme.colors.accent.purple.light : theme.colors.text.muted, marginLeft: 'auto' }}>
                        {tabRelease.posEvento.enabled ? '✓ Liberado' : 'Bloqueado'}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '12px', marginBottom: '16px' }}>
                    Toggle manual tem prioridade. Se desabilitado, bloqueia mesmo fora do horário. Bloqueio acontece automaticamente na data/hora de bloquear.
                  </p>

                  {/* Save Tab Settings Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveTabSettings}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <Save size={16} />
                    SALVAR CONFIGURAÇÕES DE ABAS
                  </motion.button>

                  {/* Clear All Notifications Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowClearNotificationsModal(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginTop: '12px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#EF4444',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      letterSpacing: '0.05em',
                    }}
                  >
                    <Trash2 size={16} />
                    LIMPAR TODOS OS AVISOS
                  </motion.button>
                </div>

                {/* Offer Links Settings */}
                <div style={{ marginTop: '24px' }}>
                  <h2
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: theme.colors.text.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Gift size={16} />
                    Links da Oferta
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Link Pós-Evento */}
                    <div>
                      <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'block', marginBottom: '4px' }}>
                        Link Pós-Evento (Imersão IMPACT)
                      </label>
                      <input
                        type="url"
                        value={offerLinks.posEventoLink}
                        onChange={(e) => setOfferLinks(prev => ({ ...prev, posEventoLink: e.target.value }))}
                        placeholder="https://imersao.neuropersuasao.com.br/"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 12, 18, 0.8)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          borderRadius: '8px',
                          color: theme.colors.text.primary,
                          fontSize: '12px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Ingresso 1% */}
                      <div>
                        <label style={{ fontSize: '11px', color: theme.colors.gold.DEFAULT, display: 'block', marginBottom: '4px' }}>
                          Ingresso 1% (Destaque)
                        </label>
                        <input
                          type="url"
                          value={offerLinks.ingresso1Percent}
                          onChange={(e) => setOfferLinks(prev => ({ ...prev, ingresso1Percent: e.target.value }))}
                          placeholder="https://pay.hotmart.com/..."
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 12, 18, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '8px',
                            color: theme.colors.text.primary,
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Ingresso Executivo */}
                      <div>
                        <label style={{ fontSize: '11px', color: theme.colors.text.muted, display: 'block', marginBottom: '4px' }}>
                          Ingresso Executivo
                        </label>
                        <input
                          type="url"
                          value={offerLinks.ingressoExecutivo}
                          onChange={(e) => setOfferLinks(prev => ({ ...prev, ingressoExecutivo: e.target.value }))}
                          placeholder="https://pay.hotmart.com/..."
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 12, 18, 0.8)',
                            border: '1px solid rgba(100, 116, 139, 0.3)',
                            borderRadius: '8px',
                            color: theme.colors.text.primary,
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* UTM Parameters */}
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '11px', color: theme.colors.accent.cyan.DEFAULT, display: 'block', marginBottom: '8px' }}>
                        Parâmetros UTM (adicionados automaticamente aos links)
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '9px', color: theme.colors.text.muted, display: 'block', marginBottom: '2px' }}>
                            utm_source
                          </label>
                          <input
                            type="text"
                            value={offerLinks.utmSource}
                            onChange={(e) => setOfferLinks(prev => ({ ...prev, utmSource: e.target.value }))}
                            placeholder="appdiagn"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', color: theme.colors.text.muted, display: 'block', marginBottom: '2px' }}>
                            utm_medium
                          </label>
                          <input
                            type="text"
                            value={offerLinks.utmMedium}
                            onChange={(e) => setOfferLinks(prev => ({ ...prev, utmMedium: e.target.value }))}
                            placeholder="app"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', color: theme.colors.text.muted, display: 'block', marginBottom: '2px' }}>
                            utm_campaign
                          </label>
                          <input
                            type="text"
                            value={offerLinks.utmCampaign}
                            onChange={(e) => setOfferLinks(prev => ({ ...prev, utmCampaign: e.target.value }))}
                            placeholder="imersao2026"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '9px', color: theme.colors.text.muted, display: 'block', marginBottom: '2px' }}>
                            utm_content
                          </label>
                          <input
                            type="text"
                            value={offerLinks.utmContent}
                            onChange={(e) => setOfferLinks(prev => ({ ...prev, utmContent: e.target.value }))}
                            placeholder="oferta"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              background: 'rgba(10, 12, 18, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.3)',
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '11px',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '10px', color: theme.colors.text.muted, marginTop: '4px' }}>
                      Exemplo de link final: {offerLinks.ingresso1Percent}{offerLinks.ingresso1Percent.includes('?') ? '&' : '?'}utm_source={offerLinks.utmSource}&utm_medium={offerLinks.utmMedium}&utm_campaign={offerLinks.utmCampaign}&utm_content={offerLinks.utmContent}
                    </p>

                    {/* Botão Salvar Links */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveOfferLinks}
                      disabled={savingLinks}
                      style={{
                        marginTop: '16px',
                        width: '100%',
                        padding: '14px',
                        background: savingLinks
                          ? 'rgba(100, 116, 139, 0.3)'
                          : 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
                        border: savingLinks
                          ? '1px solid rgba(100, 116, 139, 0.3)'
                          : '2px solid rgba(34, 211, 238, 0.4)',
                        borderRadius: '12px',
                        color: savingLinks ? theme.colors.text.muted : theme.colors.accent.cyan.DEFAULT,
                        fontSize: '13px',
                        fontWeight: theme.typography.fontWeight.bold,
                        letterSpacing: '0.05em',
                        cursor: savingLinks ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: savingLinks ? 0.6 : 1,
                      }}
                    >
                      {savingLinks ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader size={16} />
                          </motion.div>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Salvar Links da Oferta
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Test Tools Section */}
                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(100, 116, 139, 0.2)' }}>
                  <h2
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: theme.colors.text.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 16px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Clock size={16} />
                    🧪 Ferramentas de Teste
                  </h2>

                  <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '12px', lineHeight: 1.5 }}>
                    Ferramentas para testar funcionalidades do evento. <strong style={{ color: '#F59E0B' }}>⚠️ NÃO use durante evento real!</strong>
                  </p>

                  {/* Test Event Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowTestModal(true)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '2px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '12px',
                      color: '#F59E0B',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Clock size={16} />
                    EVENTO DE TESTE (1 MINUTO)
                  </motion.button>

                  <p style={{ fontSize: '10px', color: theme.colors.text.muted, marginTop: '8px', lineHeight: 1.4 }}>
                    Configura ao_vivo_unlock_date para daqui a 1 minuto. Útil para testar countdown e modal de confetti.
                  </p>

                  {/* Reset Event Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowResetModal(true)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      marginTop: '12px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '2px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '12px',
                      color: '#EF4444',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Power size={16} />
                    RESETAR EVENTO
                  </motion.button>

                  <p style={{ fontSize: '10px', color: theme.colors.text.muted, marginTop: '8px', lineHeight: 1.4 }}>
                    Volta o evento ao estado pré-início: offline, módulo 0, sem oferta. Como se nunca tivesse clicado em iniciar.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Bar */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Live Status */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              background: eventState.status !== 'offline'
                ? `${getStatusColor()}15`
                : 'rgba(100, 116, 139, 0.1)',
              border: `1px solid ${eventState.status !== 'offline' ? `${getStatusColor()}60` : 'rgba(100, 116, 139, 0.3)'}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getStatusColor(),
                boxShadow: eventState.status !== 'offline' ? `0 0 12px ${getStatusColor()}` : 'none',
                animation: eventState.status === 'live' ? 'pulse 1.5s infinite' : 'none',
              }}
            />
            <div>
              <p style={{ fontSize: '12px', color: theme.colors.text.muted, margin: 0 }}>STATUS</p>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: getStatusColor(),
                  margin: 0,
                }}
              >
                {getStatusLabel()}
              </p>
            </div>
          </div>

          {/* Online Count - Clickable */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowParticipants(true)}
            style={{
              flex: 1,
              padding: '16px',
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Users size={24} color={theme.colors.accent.cyan.DEFAULT} />
            <div>
              <p style={{ fontSize: '12px', color: theme.colors.text.muted, margin: 0 }}>
                ONLINE (logados e ativos)
              </p>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: theme.colors.accent.cyan.DEFAULT,
                  margin: 0,
                }}
              >
                {eventState.participantsOnline} / 1000
              </p>
            </div>
            <Search size={16} color={theme.colors.accent.cyan.DEFAULT} style={{ marginLeft: 'auto', opacity: 0.6 }} />
          </motion.button>

          {/* Current Day */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Zap size={24} color={theme.colors.accent.purple.light} />
            <div>
              <p style={{ fontSize: '12px', color: theme.colors.text.muted, margin: 0 }}>DIA</p>
              <p
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: theme.colors.accent.purple.light,
                  margin: 0,
                }}
              >
                DIA {currentDay}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== CONTROLE DO EVENTO ==================== */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(15, 17, 21, 0.8)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: theme.colors.text.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 16px 0',
            }}
          >
            Controle do Evento
          </h2>

          {/* Live/Pause/Lunch Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {/* Primeira linha: INICIAR/PAUSAR */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleToggleLive}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: (eventState.status === 'offline' || eventState.status === 'finished')
                    ? 'rgba(34, 211, 238, 0.2)'
                    : 'rgba(100, 116, 139, 0.2)',
                  border: `1px solid ${(eventState.status === 'offline' || eventState.status === 'finished') ? 'rgba(34, 211, 238, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: (eventState.status === 'offline' || eventState.status === 'finished') ? theme.colors.accent.cyan.DEFAULT : '#94A3B8',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                <Power size={18} />
                {(eventState.status === 'offline' || eventState.status === 'finished') ? 'INICIAR TRANSMISSÃO' : 'EM ANDAMENTO'}
              </motion.button>

              {(eventState.status !== 'offline' && eventState.status !== 'finished') && (
                <motion.button
                  whileHover={(eventState.status !== 'activity' && !eventState.lunchActive) ? { scale: 1.02 } : {}}
                  whileTap={(eventState.status !== 'activity' && !eventState.lunchActive) ? { scale: 0.98 } : {}}
                  onClick={handleTogglePause}
                  disabled={eventState.status === 'activity' || eventState.lunchActive}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: eventState.status === 'paused' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    border: `1px solid ${eventState.status === 'paused' ? 'rgba(34, 211, 238, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                    borderRadius: '10px',
                    cursor: (eventState.status === 'activity' || eventState.lunchActive) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: eventState.status === 'paused' ? theme.colors.accent.cyan.DEFAULT : '#F59E0B',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: (eventState.status === 'activity' || eventState.lunchActive) ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {eventState.status === 'paused' ? <Play size={18} /> : <Pause size={18} />}
                  {eventState.status === 'paused' ? 'RETOMAR' : 'PAUSAR'}
                </motion.button>
              )}
            </div>

            {/* Segunda linha: ATIVIDADE e ALMOÇO */}
            {(eventState.status !== 'offline' && eventState.status !== 'finished') && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  whileHover={(!eventState.lunchActive && eventState.status !== 'paused') ? { scale: 1.02 } : {}}
                  whileTap={(!eventState.lunchActive && eventState.status !== 'paused') ? { scale: 0.98 } : {}}
                  onClick={handleToggleActivity}
                  disabled={eventState.lunchActive || eventState.status === 'paused'}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: eventState.status === 'activity' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                    border: `1px solid ${eventState.status === 'activity' ? 'rgba(34, 211, 238, 0.5)' : 'rgba(168, 85, 247, 0.5)'}`,
                    borderRadius: '10px',
                    cursor: (eventState.lunchActive || eventState.status === 'paused') ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: eventState.status === 'activity' ? theme.colors.accent.cyan.DEFAULT : theme.colors.accent.purple.light,
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: (eventState.lunchActive || eventState.status === 'paused') ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <FileText size={18} />
                  {eventState.status === 'activity' ? 'FIM ATIVIDADE' : 'ATIVIDADE'}
                </motion.button>

                <motion.button
                  whileHover={(!eventState.status || eventState.status === 'live' || eventState.lunchActive) ? { scale: 1.02 } : {}}
                  whileTap={(!eventState.status || eventState.status === 'live' || eventState.lunchActive) ? { scale: 0.98 } : {}}
                  onClick={handleToggleLunch}
                  disabled={eventState.status === 'activity' || eventState.status === 'paused'}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: eventState.lunchActive ? 'rgba(34, 211, 238, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    border: `1px solid ${eventState.lunchActive ? 'rgba(34, 211, 238, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                    borderRadius: '10px',
                    cursor: (eventState.status === 'activity' || eventState.status === 'paused') ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: eventState.lunchActive ? theme.colors.accent.cyan.DEFAULT : '#F59E0B',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: (eventState.status === 'activity' || eventState.status === 'paused') ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <Coffee size={18} />
                  {eventState.lunchActive ? 'FIM ALMOÇO' : 'ALMOÇO'}
                </motion.button>
              </div>
            )}

            {/* Terceira linha: FINALIZAR EVENTO (menor e discreto) */}
            {(eventState.status !== 'offline' && eventState.status !== 'finished') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFinishModal(true)}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#EF4444',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  letterSpacing: '0.03em',
                }}
              >
                <XCircle size={14} />
                FINALIZAR EVENTO
              </motion.button>
            )}

          </div>

          {/* Lunch Return Time (only visible when lunch mode) */}
          {eventState.status === 'lunch' && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Clock size={18} color="#F59E0B" />
              <span style={{ fontSize: '13px', color: theme.colors.text.secondary }}>Retorno às:</span>
              <input
                type="time"
                value={eventState.lunchReturnTime}
                onChange={(e) => handleLunchReturnTimeChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(10, 12, 18, 0.8)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '6px',
                  color: '#F59E0B',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Current Module Display */}
          <div
            style={{
              padding: '16px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '11px', color: theme.colors.text.muted, margin: '0 0 4px 0' }}>
                  MÓDULO ATUAL
                </p>
                <p
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: theme.colors.accent.purple.light,
                    margin: 0,
                  }}
                >
                  {eventState.currentModule}. {currentModule?.title}
                </p>
                <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '4px 0 0 0' }}>
                  {currentModule?.subtitle}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevModule}
                  disabled={eventState.currentModule === 0}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(100, 116, 139, 0.2)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    cursor: eventState.currentModule === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: eventState.currentModule === 0 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={20} color={theme.colors.text.secondary} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNextModule}
                  disabled={eventState.currentModule === TOTAL_MODULES - 1}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    cursor: eventState.currentModule === TOTAL_MODULES - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: eventState.currentModule === TOTAL_MODULES - 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronRight size={20} color={theme.colors.accent.purple.light} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Day Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSetDay(1)}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: currentDay === 1 ? 'rgba(34, 211, 238, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                border: `1px solid ${currentDay === 1 ? 'rgba(34, 211, 238, 0.5)' : 'rgba(100, 116, 139, 0.2)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: currentDay === 1 ? theme.colors.accent.cyan.DEFAULT : theme.colors.text.muted,
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
              }}
            >
              DIA 1
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSetDay(2)}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: currentDay === 2 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                border: `1px solid ${currentDay === 2 ? 'rgba(168, 85, 247, 0.5)' : 'rgba(100, 116, 139, 0.2)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: currentDay === 2 ? theme.colors.accent.purple.light : theme.colors.text.muted,
                fontSize: '12px',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
              }}
            >
              DIA 2
            </motion.button>
          </div>

          {/* Module Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setModuleDropdownOpen(!moduleDropdownOpen)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: theme.colors.accent.purple.light,
                  }}
                >
                  {currentModule.id}.
                </span>
                <span
                  style={{
                    fontSize: '8px',
                    padding: '2px 6px',
                    background: currentDay === 1 ? 'rgba(34, 211, 238, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                    borderRadius: '4px',
                    color: currentDay === 1 ? theme.colors.accent.cyan.DEFAULT : theme.colors.accent.purple.light,
                  }}
                >
                  DIA {currentDay}
                </span>
                <span style={{ fontSize: '12px', color: theme.colors.text.primary }}>
                  {currentModule.title}
                </span>
              </div>
              {moduleDropdownOpen ? (
                <ChevronUp size={18} color={theme.colors.accent.purple.light} />
              ) : (
                <ChevronDown size={18} color={theme.colors.accent.purple.light} />
              )}
            </motion.button>

            <AnimatePresence>
              {moduleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'rgba(15, 17, 21, 0.98)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    zIndex: 50,
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}
                >
                  {EVENT_MODULES.map((module) => (
                    <motion.button
                      key={module.id}
                      whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}
                      onClick={() => {
                        handleSelectModule(module.id)
                        setModuleDropdownOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background:
                          module.id === eventState.currentModule
                            ? 'rgba(168, 85, 247, 0.25)'
                            : 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(100, 116, 139, 0.1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color:
                            module.id === eventState.currentModule
                              ? theme.colors.accent.purple.light
                              : module.id < eventState.currentModule
                              ? theme.colors.accent.cyan.DEFAULT
                              : theme.colors.text.muted,
                          minWidth: '18px',
                        }}
                      >
                        {module.id}
                      </span>
                      <span
                        style={{
                          fontSize: '7px',
                          padding: '2px 4px',
                          background: module.day === 1 ? 'rgba(34, 211, 238, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                          borderRadius: '3px',
                          color: module.day === 1 ? theme.colors.accent.cyan.DEFAULT : theme.colors.accent.purple.light,
                        }}
                      >
                        D{module.day}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color:
                            module.id === eventState.currentModule
                              ? theme.colors.text.primary
                              : theme.colors.text.secondary,
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {module.title}
                      </span>
                      {module.id < eventState.currentModule && (
                        <Check size={14} color={theme.colors.accent.cyan.DEFAULT} />
                      )}
                      {module.id === eventState.currentModule && (
                        <Radio size={14} color={theme.colors.accent.purple.light} />
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ==================== OFERTA IMPACT ==================== */}
        <div
          style={{
            padding: '20px',
            background: eventState.offerReleased
              ? 'rgba(245, 158, 11, 0.1)'
              : 'rgba(15, 17, 21, 0.8)',
            border: `1px solid ${eventState.offerReleased ? 'rgba(245, 158, 11, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: theme.colors.text.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 4px 0',
                }}
              >
                Oferta IMERSÃO IMPACT
              </h2>
              <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: 0 }}>
                {eventState.offerReleased
                  ? 'Liberada para os participantes'
                  : 'Não liberada - aguardando'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReleaseOffer}
              style={{
                padding: '12px 20px',
                background: eventState.offerReleased
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)',
                border: `1px solid ${eventState.offerReleased ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: eventState.offerReleased ? '#EF4444' : '#F59E0B',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              {eventState.offerReleased ? <XCircle size={16} /> : <Unlock size={16} />}
              {eventState.offerReleased ? 'ENCERRAR OFERTA' : 'LIBERAR OFERTA'}
            </motion.button>
          </div>
        </div>

        {/* ==================== ASSISTENTE IA ==================== */}
        <div
          style={{
            padding: '20px',
            background: eventState.aiEnabled
              ? 'rgba(168, 85, 247, 0.1)'
              : 'rgba(15, 17, 21, 0.8)',
            border: `1px solid ${eventState.aiEnabled ? 'rgba(168, 85, 247, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: theme.colors.text.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 4px 0',
                }}
              >
                Assistente IA
              </h2>
              <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: 0 }}>
                {eventState.aiEnabled
                  ? 'Habilitada para os participantes'
                  : 'Desabilitada - participantes não podem usar'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleAI}
              style={{
                padding: '12px 20px',
                background: eventState.aiEnabled
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(168, 85, 247, 0.2)',
                border: `1px solid ${eventState.aiEnabled ? 'rgba(239, 68, 68, 0.5)' : 'rgba(168, 85, 247, 0.5)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: eventState.aiEnabled ? '#EF4444' : '#A855F7',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              <Bot size={16} />
              {eventState.aiEnabled ? 'DESABILITAR IA' : 'HABILITAR IA'}
            </motion.button>
          </div>
        </div>

        {/* ==================== SOLICITAR NPS ==================== */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(15, 17, 21, 0.8)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: theme.colors.text.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: '0 0 4px 0',
              }}
            >
              Solicitar NPS
            </h2>
            <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: 0 }}>
              Envia formulário de NPS para os participantes (+XP)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNPSModal('day1')}
              style={{
                flex: 1,
                padding: '14px 16px',
                background: dbEventState?.nps_active === 'day1'
                  ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
                border: `1px solid ${dbEventState?.nps_active === 'day1' ? 'rgba(34, 211, 238, 0.5)' : 'rgba(168, 85, 247, 0.4)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Star size={20} color={dbEventState?.nps_active === 'day1' ? theme.colors.accent.cyan.DEFAULT : theme.colors.accent.purple.light} />
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: dbEventState?.nps_active === 'day1' ? theme.colors.accent.cyan.DEFAULT : theme.colors.accent.purple.light }}>
                {dbEventState?.nps_active === 'day1' ? 'NPS DIA 1 ATIVO' : 'NPS DIA 1'}
              </span>
              <span style={{ fontSize: '10px', color: theme.colors.text.muted }}>
                +30 XP
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNPSModal('final')}
              style={{
                flex: 1,
                padding: '14px 16px',
                background: dbEventState?.nps_active === 'final'
                  ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)'
                  : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
                border: `1px solid ${dbEventState?.nps_active === 'final' ? 'rgba(34, 211, 238, 0.5)' : 'rgba(245, 158, 11, 0.4)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Star size={20} color={dbEventState?.nps_active === 'final' ? theme.colors.accent.cyan.DEFAULT : theme.colors.gold.DEFAULT} />
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: dbEventState?.nps_active === 'final' ? theme.colors.accent.cyan.DEFAULT : theme.colors.gold.DEFAULT }}>
                {dbEventState?.nps_active === 'final' ? 'NPS EVENTO ATIVO' : 'NPS EVENTO'}
              </span>
              <span style={{ fontSize: '10px', color: theme.colors.text.muted }}>
                +30 XP
              </span>
            </motion.button>
          </div>
        </div>

        {/* ==================== ENVIO DE AVISOS ==================== */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(15, 17, 21, 0.8)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
            borderRadius: '16px',
            marginBottom: '40px',
          }}
        >
          <h2
            style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: theme.colors.text.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 16px 0',
            }}
          >
            Enviar Aviso
          </h2>

          {/* Notification Type Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {notificationTypes.map((nt) => {
              const Icon = nt.icon
              return (
                <motion.button
                  key={nt.type}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotifType(nt.type)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: notifType === nt.type ? `${nt.color}20` : 'rgba(100, 116, 139, 0.1)',
                    border: `1px solid ${notifType === nt.type ? `${nt.color}60` : 'rgba(100, 116, 139, 0.2)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    color: notifType === nt.type ? nt.color : theme.colors.text.muted,
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  <Icon size={14} />
                  {nt.label}
                </motion.button>
              )
            })}
          </div>

          {/* Templates */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '8px' }}>
              Templates rápidos:
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {notificationTemplates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleUseTemplate(t)}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(100, 116, 139, 0.1)',
                    border: '1px solid rgba(100, 116, 139, 0.2)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: theme.colors.text.secondary,
                    fontSize: '11px',
                  }}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="Título do aviso"
              style={{
                padding: '12px 14px',
                background: 'rgba(10, 12, 18, 0.8)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Mensagem do aviso"
              rows={3}
              style={{
                padding: '12px 14px',
                background: 'rgba(10, 12, 18, 0.8)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                fontFamily: theme.typography.fontFamily.body,
              }}
            />
            <input
              type="text"
              value={notifAction}
              onChange={(e) => setNotifAction(e.target.value)}
              placeholder="Texto do botão (opcional)"
              style={{
                padding: '12px 14px',
                background: 'rgba(10, 12, 18, 0.8)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                outline: 'none',
              }}
            />

            {/* Navigation Config */}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(100, 116, 139, 0.2)' }}>
              <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '8px' }}>
                Ação ao clicar (opcional):
              </p>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as 'none' | 'internal' | 'external')}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(10, 12, 18, 0.8)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '8px',
                  color: theme.colors.text.primary,
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              >
                <option value="none">Sem ação (apenas leitura)</option>
                <option value="internal">Link interno (navegar no app)</option>
                <option value="external">Link externo (abrir URL)</option>
              </select>

              {actionType === 'internal' && (
                <>
                  <select
                    value={targetPage}
                    onChange={(e) => setTargetPage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer',
                      marginBottom: '12px',
                    }}
                  >
                    <option value="">Selecione a página</option>
                    <option value="plano-7-dias">Plano 7 Dias (PosEvento)</option>
                    <option value="impact-offer">Oferta IMPACT (PosEvento)</option>
                    <option value="scenario-projection">Projeção de Cenário (PosEvento)</option>
                    <option value="final-report">Relatório Final (PosEvento)</option>
                    <option value="diagnostico">Diagnóstico (AoVivo)</option>
                    <option value="protocolo">Protocolo (PreEvento)</option>
                  </select>
                  <input
                    type="text"
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    placeholder="ID da seção (ex: action-plan, radar-chart)"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </>
              )}

              {actionType === 'external' && (
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="URL completa (https://...)"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(10, 12, 18, 0.8)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '8px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendNotification}
              disabled={!notifTitle.trim() || !notifMessage.trim()}
              style={{
                padding: '14px',
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.5)',
                borderRadius: '10px',
                cursor: !notifTitle.trim() || !notifMessage.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: theme.colors.accent.cyan.DEFAULT,
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: !notifTitle.trim() || !notifMessage.trim() ? 0.5 : 1,
              }}
            >
              <Send size={16} />
              ENVIAR PARA TODOS ({eventState.participantsOnline} online)
            </motion.button>
          </div>

          {/* Sent Notifications */}
          {sentNotifications.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginBottom: '10px' }}>
                Avisos enviados:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {sentNotifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(10, 12, 18, 0.5)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Check size={14} color="#22D3EE" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', color: theme.colors.text.primary, margin: 0 }}>
                        {n.title}
                      </p>
                    </div>
                    <span style={{ fontSize: '10px', color: theme.colors.text.muted }}>
                      {n.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== LADO DIREITO - MOCKUP DO PARTICIPANTE ==================== */}
      <div
        style={{
          width: '35%',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0d0d12 0%, #080810 100%)',
          overflowY: 'auto',
          maxHeight: '100vh',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Monitor size={18} color={theme.colors.text.muted} />
          <span style={{ fontSize: '12px', color: theme.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Visão do Participante (Tempo Real)
          </span>
        </div>

        {/* Live Iframe - Real Participant View */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            height: 'calc(100vh - 100px)',
            background: '#050505',
            borderRadius: '32px',
            border: '6px solid #1a1a1f',
            boxShadow: '0 0 60px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <iframe
            src="/ao-vivo"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
            title="Visão do Participante - Ao Vivo"
          />
        </div>
      </div>

      {/* ==================== CONFIRMATION DIALOG ==================== */}
      <AnimatePresence>
        {confirmDialog.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={cancelModuleChange}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.98) 0%, rgba(10, 12, 18, 0.98) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '20px',
                padding: '24px',
                width: '400px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: theme.colors.accent.purple.light,
                    margin: 0,
                  }}
                >
                  CONFIRMAR MUDANÇA
                </h3>
                <button
                  onClick={cancelModuleChange}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} color={theme.colors.text.muted} />
                </button>
              </div>

              <div
                style={{
                  padding: '16px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                }}
              >
                <p style={{ fontSize: '12px', color: theme.colors.text.muted, margin: '0 0 4px 0' }}>
                  Mudar para:
                </p>
                <p
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: theme.colors.accent.purple.light,
                    margin: 0,
                  }}
                >
                  {confirmDialog.moduleName}
                </p>
                <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: '4px 0 0 0' }}>
                  {EVENT_MODULES[confirmDialog.targetModule]?.subtitle}
                </p>
              </div>

              <p style={{ fontSize: '13px', color: theme.colors.text.secondary, marginBottom: '20px' }}>
                Todos os participantes online serão notificados da mudança de módulo.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelModuleChange}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(100, 116, 139, 0.2)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: theme.colors.text.secondary,
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  CANCELAR
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmModuleChange}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: theme.colors.accent.purple.light,
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  CONFIRMAR
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== PARTICIPANTS MODAL ==================== */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowParticipants(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.98) 0%, rgba(10, 12, 18, 0.98) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.4)',
                borderRadius: '20px',
                padding: '24px',
                width: '600px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(34, 211, 238, 0.2)',
                      border: '1px solid rgba(34, 211, 238, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={22} color={theme.colors.accent.cyan.DEFAULT} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: theme.typography.fontFamily.orbitron,
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: theme.colors.accent.cyan.DEFAULT,
                        margin: 0,
                      }}
                    >
                      PARTICIPANTES ONLINE
                    </h3>
                    <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
                      {filteredParticipants.length} de {eventState.participantsOnline} exibidos • Ordenado por XP ↓
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowParticipants(false)}
                  style={{
                    background: 'rgba(100, 116, 139, 0.2)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    padding: '10px',
                  }}
                >
                  <X size={20} color={theme.colors.text.muted} />
                </button>
              </div>

              {/* Stats Row */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <UserCheck size={18} color="#22C55E" />
                  <div>
                    <p style={{ fontSize: '10px', color: theme.colors.text.muted, margin: 0 }}>ATIVOS</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#22C55E', margin: 0 }}>
                      {filteredParticipants.filter(p => p.status === 'active').length}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <UserX size={18} color="#F59E0B" />
                  <div>
                    <p style={{ fontSize: '10px', color: theme.colors.text.muted, margin: 0 }}>INATIVOS</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#F59E0B', margin: 0 }}>
                      {filteredParticipants.filter(p => p.status === 'idle').length}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Activity size={18} color={theme.colors.accent.purple.light} />
                  <div>
                    <p style={{ fontSize: '10px', color: theme.colors.text.muted, margin: 0 }}>XP MÉDIO</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.accent.purple.light, margin: 0 }}>
                      {filteredParticipants.length > 0
                        ? Math.round(filteredParticipants.reduce((acc, p) => acc + p.xp, 0) / filteredParticipants.length)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search
                  size={18}
                  color={theme.colors.text.muted}
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    background: 'rgba(10, 12, 18, 0.8)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '10px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Participants List */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {filteredParticipants.length === 0 ? (
                  <div
                    style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: theme.colors.text.muted,
                    }}
                  >
                    {eventState.status === 'offline'
                      ? 'Nenhum participante online. Inicie a transmissão.'
                      : 'Nenhum participante encontrado.'}
                  </div>
                ) : (
                  filteredParticipants.slice(0, 50).map((participant) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        background: 'rgba(10, 12, 18, 0.5)',
                        border: `1px solid ${participant.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.15)'}`,
                        borderRadius: '10px',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: participant.status === 'active'
                            ? 'rgba(34, 197, 94, 0.2)'
                            : 'rgba(100, 116, 139, 0.2)',
                          border: `1px solid ${participant.status === 'active' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(100, 116, 139, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.text.primary }}>
                          {participant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                        {/* Online indicator */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: participant.status === 'active' ? '#22C55E' : '#F59E0B',
                            border: '2px solid #0a0a0f',
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p
                            style={{
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: theme.colors.text.primary,
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {participant.name}
                          </p>
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              background: participant.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: participant.status === 'active' ? '#22C55E' : '#F59E0B',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              fontWeight: 'bold',
                            }}
                          >
                            {participant.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '11px',
                            color: theme.colors.text.muted,
                            margin: '2px 0 0 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {participant.email}
                        </p>
                      </div>

                      {/* XP */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 10px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                      >
                        <Zap size={12} color={theme.colors.gold.DEFAULT} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT }}>
                          {participant.xp}
                        </span>
                      </div>

                      {/* Module */}
                      <div
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: '11px', color: theme.colors.accent.purple.light }}>
                          M{participant.currentModule}
                        </span>
                      </div>

                      {/* Last Activity */}
                      <span style={{ fontSize: '10px', color: theme.colors.text.muted, flexShrink: 0 }}>
                        {formatTimeAgo(participant.lastActivity)}
                      </span>
                    </motion.div>
                  ))
                )}
                {filteredParticipants.length > 50 && (
                  <p style={{ fontSize: '11px', color: theme.colors.text.muted, textAlign: 'center', padding: '10px' }}>
                    Mostrando 50 de {filteredParticipants.length} participantes
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== USERS MODAL ==================== */}
      <AnimatePresence>
        {showUsersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => {
              setShowUsersModal(false)
              setSelectedUser(null)
              setNewPassword('')
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.98) 0%, rgba(10, 12, 18, 0.98) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '20px',
                padding: '24px',
                width: '900px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={22} color={theme.colors.accent.purple.DEFAULT} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: theme.typography.fontFamily.orbitron,
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: theme.colors.accent.purple.DEFAULT,
                        margin: 0,
                      }}
                    >
                      GERENCIAR USUÁRIOS
                    </h3>
                    <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
                      {usersTab === 'all' ? `${allUsers.length} usuários cadastrados` : `${accessRequests.length} solicitações pendentes`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUsersModal(false)
                    setSelectedUser(null)
                    setNewPassword('')
                  }}
                  style={{
                    background: 'rgba(100, 116, 139, 0.2)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    padding: '10px',
                  }}
                >
                  <X size={20} color={theme.colors.text.muted} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setUsersTab('all')
                    setSelectedUser(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: usersTab === 'all' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                    border: `1px solid ${usersTab === 'all' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: usersTab === 'all' ? theme.colors.accent.purple.DEFAULT : theme.colors.text.muted,
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Users size={16} />
                  Todos os Usuários
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setUsersTab('pending')
                    setSelectedUser(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: usersTab === 'pending' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                    border: `1px solid ${usersTab === 'pending' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: usersTab === 'pending' ? theme.colors.status.danger : theme.colors.text.muted,
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <AlertTriangle size={16} />
                  Solicitações Pendentes
                  {accessRequests.length > 0 && (
                    <span
                      style={{
                        background: theme.colors.status.danger,
                        color: '#FFF',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      {accessRequests.length}
                    </span>
                  )}
                </motion.button>
              </div>

              {/* Search + Filter/Sort (only for all users tab) */}
              {usersTab === 'all' && (
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10, 12, 18, 0.8)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '10px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* Filter: All / Online */}
                    <button
                      onClick={() => setUsersFilter(usersFilter === 'online' ? 'all' : 'online')}
                      style={{
                        padding: '6px 12px',
                        background: usersFilter === 'online' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                        border: `1px solid ${usersFilter === 'online' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: usersFilter === 'online' ? '#22C55E' : theme.colors.text.muted,
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: usersFilter === 'online' ? '#22C55E' : 'rgba(100, 116, 139, 0.4)',
                      }} />
                      Online
                    </button>

                    {/* Sort options */}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => setUsersSortOption('xp')}
                        style={{
                          padding: '6px 10px',
                          background: usersSort === 'xp' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                          border: `1px solid ${usersSort === 'xp' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: usersSort === 'xp' ? theme.colors.gold.DEFAULT : theme.colors.text.muted,
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        XP ↓
                      </button>
                      <button
                        onClick={() => setUsersSortOption('lastSeen')}
                        style={{
                          padding: '6px 10px',
                          background: usersSort === 'lastSeen' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                          border: `1px solid ${usersSort === 'lastSeen' ? 'rgba(34, 211, 238, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: usersSort === 'lastSeen' ? theme.colors.accent.cyan.DEFAULT : theme.colors.text.muted,
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        Recente ↓
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
                {usersTab === 'all' ? (
                  // ALL USERS TAB
                  loadingUsers ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.text.muted }}>
                      Carregando usuários...
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {allUsers
                        .filter(u =>
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.name || '').toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .filter(u => {
                          if (usersFilter !== 'online') return true
                          if (!u.last_seen_at) return false
                          return (Date.now() - new Date(u.last_seen_at).getTime()) / 1000 / 60 < 10
                        })
                        .sort((a, b) => {
                          if (usersSort === 'xp') return (b.xp || 0) - (a.xp || 0)
                          const aTime = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0
                          const bTime = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0
                          return bTime - aTime
                        })
                        .slice(0, 50)
                        .map((user) => {
                          const lastSeen = user.last_seen_at ? new Date(user.last_seen_at) : null
                          const minutesAgo = lastSeen
                            ? (Date.now() - lastSeen.getTime()) / 1000 / 60
                            : Infinity
                          const userStatus = minutesAgo < 10 ? 'active' : minutesAgo < 30 ? 'idle' : 'inactive'
                          const statusColor = userStatus === 'active' ? '#22C55E' : userStatus === 'idle' ? '#F59E0B' : 'rgba(100, 116, 139, 0.4)'
                          const lastSeenLabel = lastSeen
                            ? minutesAgo < 1 ? 'agora'
                              : minutesAgo < 60 ? `${Math.floor(minutesAgo)}min atrás`
                              : minutesAgo < 1440 ? `${Math.floor(minutesAgo / 60)}h atrás`
                              : `${Math.floor(minutesAgo / 1440)}d atrás`
                            : 'nunca'

                          return (
                          <motion.div
                            key={user.id}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setSelectedUser(user)}
                            style={{
                              padding: '12px 16px',
                              background: selectedUser?.id === user.id ? 'rgba(168, 85, 247, 0.15)' : 'rgba(10, 12, 18, 0.8)',
                              border: `1px solid ${selectedUser?.id === user.id ? 'rgba(168, 85, 247, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
                              borderRadius: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                              {/* Status dot */}
                              <div
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: statusColor,
                                  boxShadow: userStatus === 'active' ? '0 0 6px #22C55E' : 'none',
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.text.primary, margin: '0 0 2px 0' }}>
                                  {user.name || 'Sem nome'}
                                </p>
                                <p
                                  style={{
                                    fontSize: '11px',
                                    color: theme.colors.text.muted,
                                    margin: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <div
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  borderRadius: '6px',
                                }}
                              >
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT }}>
                                  {user.xp || 0} XP
                                </span>
                              </div>
                              <span style={{ fontSize: '9px', color: statusColor, minWidth: '50px', textAlign: 'right' }}>
                                {lastSeenLabel}
                              </span>
                            </div>
                          </motion.div>
                          )
                        })}
                    </div>
                  )
                ) : (
                  // PENDING REQUESTS TAB
                  loadingRequests ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.text.muted }}>
                      Carregando solicitações...
                    </div>
                  ) : accessRequests.length === 0 ? (
                    <div
                      style={{
                        padding: '40px',
                        textAlign: 'center',
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '12px',
                        color: theme.colors.text.secondary,
                      }}
                    >
                      ✅ Nenhuma solicitação pendente
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {accessRequests.map((request) => (
                        <div
                          key={request.id}
                          style={{
                            padding: '16px',
                            background: 'rgba(10, 12, 18, 0.8)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, margin: '0 0 4px 0' }}>
                                {request.email}
                              </p>
                              {request.transaction_id && (
                                <p style={{ fontSize: '11px', color: theme.colors.text.muted, margin: '0 0 4px 0' }}>
                                  Transaction: {request.transaction_id}
                                </p>
                              )}
                              <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: 0 }}>
                                Motivo: {
                                  request.reason === 'purchase_not_found' ? 'Compra não encontrada' :
                                  request.reason === 'status_not_approved' ? 'Status não aprovado' :
                                  request.reason === 'purchase_refunded' ? 'Compra reembolsada' :
                                  request.reason === 'wrong_product' ? 'Produto incorreto' :
                                  request.reason
                                }
                              </p>
                              <p style={{ fontSize: '10px', color: theme.colors.text.muted, margin: '4px 0 0 0' }}>
                                {new Date(request.requested_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                if (!confirm(`Aprovar acesso para ${request.email}?`)) return

                                const { error } = await supabase
                                  .from('access_requests')
                                  .update({
                                    status: 'approved',
                                    reviewed_at: new Date().toISOString(),
                                    reviewed_by: user?.id,
                                  })
                                  .eq('id', request.id)

                                if (error) {
                                  alert('Erro ao aprovar: ' + error.message)
                                  return
                                }

                                setAccessRequests(prev => prev.filter(r => r.id !== request.id))
                                alert('✅ Acesso aprovado!')
                              }}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.2) 100%)',
                                border: '1px solid rgba(34, 197, 94, 0.5)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#22C55E',
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}
                            >
                              ✓ APROVAR
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                if (!confirm(`Rejeitar acesso para ${request.email}?`)) return

                                const { error } = await supabase
                                  .from('access_requests')
                                  .update({
                                    status: 'rejected',
                                    reviewed_at: new Date().toISOString(),
                                    reviewed_by: user?.id,
                                  })
                                  .eq('id', request.id)

                                if (error) {
                                  alert('Erro ao rejeitar: ' + error.message)
                                  return
                                }

                                setAccessRequests(prev => prev.filter(r => r.id !== request.id))
                                alert('❌ Acesso rejeitado.')
                              }}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: theme.colors.status.danger,
                                fontSize: '12px',
                                fontWeight: 'bold',
                              }}
                            >
                              ✗ REJEITAR
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Footer - Password Reset (only when user is selected in all users tab) */}
              {selectedUser && usersTab === 'all' && (
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px',
                  }}
                >
                  <p style={{ fontSize: '12px', color: theme.colors.text.primary, margin: '0 0 12px 0', fontWeight: '600' }}>
                    Trocar senha de: <span style={{ color: theme.colors.accent.purple.DEFAULT }}>{selectedUser.email}</span>
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha (mín. 6 caracteres)"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'rgba(10, 12, 18, 0.8)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        if (!newPassword || newPassword.length < 6) {
                          alert('Senha deve ter no mínimo 6 caracteres')
                          return
                        }

                        if (!confirm(`Trocar senha do usuário ${selectedUser.email}?`)) return

                        try {
                          const { error } = await supabase.auth.admin.updateUserById(selectedUser.id, {
                            password: newPassword,
                          })

                          if (error) {
                            alert('❌ Erro ao trocar senha: ' + error.message)
                            return
                          }

                          alert(`✅ Senha alterada com sucesso!\n\nEmail: ${selectedUser.email}\nNova senha: ${newPassword}\n\nInforme ao usuário por WhatsApp.`)
                          setNewPassword('')
                          setSelectedUser(null)
                        } catch (err: any) {
                          alert('❌ Erro: ' + err.message)
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: theme.colors.accent.purple.light,
                        fontSize: '12px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      TROCAR SENHA
                    </motion.button>
                  </div>
                  <p style={{ fontSize: '10px', color: theme.colors.text.muted, margin: '8px 0 0 0' }}>
                    ⚠️ Informe a nova senha ao usuário por WhatsApp
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Preview - positioned over the mockup */}
      <AnimatePresence>
        {previewNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            style={{
              position: 'fixed',
              top: '100px',
              right: '80px',
              width: '340px',
              zIndex: 1000,
            }}
          >
            <NotificationToast
              notification={previewNotification}
              onClose={() => setPreviewNotification(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Toast */}
      <AnimatePresence>
        {adminToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              padding: '16px 20px',
              background: adminToast.type === 'info' ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)'
                : adminToast.type === 'warning' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              maxWidth: '400px',
              zIndex: 10000,
            }}
          >
            {adminToast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lunch Time Modal */}
      <AnimatePresence>
        {showLunchTimeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setShowLunchTimeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '440px',
                width: '90%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 20px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  border: '2px solid rgba(249, 115, 22, 0.4)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Coffee size={32} color="#F97316" />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#fff',
                  textAlign: 'center',
                  marginBottom: '8px',
                  fontFamily: theme.typography.fontFamily.orbitron,
                  letterSpacing: '0.05em',
                }}
              >
                Intervalo para Almoço
              </h3>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: '28px',
                  lineHeight: '1.5',
                }}
              >
                Informe o horário de retorno que será enviado aos participantes
              </p>

              {/* Time Input */}
              <div style={{ marginBottom: '28px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                    fontWeight: '500',
                  }}
                >
                  Horário de Retorno
                </label>
                <input
                  type="time"
                  value={lunchReturnTime}
                  onChange={(e) => setLunchReturnTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(249, 115, 22, 0.3)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLunchTimeModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(100, 116, 139, 0.2)',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '12px',
                    color: theme.colors.text.secondary,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: theme.typography.fontFamily.body,
                  }}
                >
                  Cancelar
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmLunchTime}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontFamily: theme.typography.fontFamily.body,
                    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                  }}
                >
                  Confirmar
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal - Finish Event */}
      <ConfirmationModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onConfirm={handleFinishEvent}
        title="ATENÇÃO: Finalizar Evento"
        message="Você está prestes a encerrar a imersão ao vivo. Esta ação é irreversível."
        confirmText="Finalizar Evento"
        cancelText="Cancelar"
        type="danger"
        details={[
          'Encerrar a transmissão ao vivo',
          'Redirecionar participantes para Pós-Evento',
          'Não pode ser desfeito facilmente',
        ]}
      />

      {/* Confirmation Modal - Test Event */}
      <ConfirmationModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        onConfirm={handleSetupTestEvent}
        title="🧪 Configurar Evento de Teste"
        message="Isso vai alterar as datas do evento para começar em 1 minuto."
        confirmText="Sim, configurar teste"
        cancelText="Cancelar"
        type="warning"
        details={[
          'Define ao_vivo_unlock_date para daqui a 1 minuto',
          'Habilita a aba Ao Vivo (ao_vivo_enabled)',
          'Define status como offline',
          '⚠️ Não use durante o evento real!',
        ]}
      />

      {/* Confirmation Modal - Reset Event */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetEvent}
        title="🔄 Resetar Estado do Evento"
        message="Isso vai resetar o evento como se nunca tivesse sido iniciado."
        confirmText="Sim, resetar evento"
        cancelText="Cancelar"
        type="danger"
        details={[
          'Status volta para offline, Dia 1, Módulo 0',
          'Limpa event_started_at e event_finished_at',
          'Remove oferta, NPS, intervalo',
          'Restaura datas das abas (Prep 03/02, AoVivo 02/02, Pós 02/03)',
          '⚠️ Não use durante o evento real!',
        ]}
      />

      {/* Confirmation Modal - NPS */}
      <ConfirmationModal
        isOpen={showNPSModal !== null}
        onClose={() => setShowNPSModal(null)}
        onConfirm={async () => {
          if (!showNPSModal) return
          const isAlreadyActive = dbEventState?.nps_active === showNPSModal
          if (isAlreadyActive) {
            await clearNPS()
            setAdminToast({ message: 'NPS desativado', type: 'success' })
          } else {
            await triggerNPS(showNPSModal)
            setAdminToast({
              message: `NPS ${showNPSModal === 'day1' ? 'Dia 1' : 'Evento'} ativado! Overlay aparecerá para todos os participantes.`,
              type: 'success',
            })
          }
          setTimeout(() => setAdminToast(null), 4000)
          setShowNPSModal(null)
        }}
        title={
          dbEventState?.nps_active === showNPSModal
            ? `Desativar NPS ${showNPSModal === 'day1' ? 'Dia 1' : 'Evento'}?`
            : `Solicitar NPS ${showNPSModal === 'day1' ? 'Dia 1' : 'Evento'}?`
        }
        message={
          dbEventState?.nps_active === showNPSModal
            ? 'O overlay de NPS será removido para quem ainda não respondeu.'
            : 'Um overlay bloqueante aparecerá na tela de todos os participantes até que respondam.'
        }
        confirmText={dbEventState?.nps_active === showNPSModal ? 'Sim, desativar' : 'Sim, solicitar NPS'}
        cancelText="Cancelar"
        type={dbEventState?.nps_active === showNPSModal ? 'warning' : 'info'}
        details={
          dbEventState?.nps_active === showNPSModal
            ? ['Remove o overlay de NPS', 'Quem já respondeu mantém o XP']
            : [
                'Overlay full-screen não fechável',
                'Participante só continua após responder',
                `+30 XP ao responder`,
                'Aparece via realtime para todos conectados',
              ]
        }
      />

      {/* Confirmation Modal - Clear Notifications */}
      <ConfirmationModal
        isOpen={showClearNotificationsModal}
        onClose={() => setShowClearNotificationsModal(false)}
        onConfirm={async () => {
          const { error } = await deleteAllNotifications()
          if (error) {
            setAdminToast({ message: 'Erro ao limpar avisos', type: 'warning' })
          } else {
            setAdminToast({ message: 'Todos os avisos foram apagados', type: 'success' })
          }
          setTimeout(() => setAdminToast(null), 4000)
        }}
        title="Limpar Todos os Avisos"
        message="Tem certeza que deseja apagar TODOS os avisos? Esta ação não pode ser desfeita."
        confirmText="Sim, apagar todos"
        cancelText="Cancelar"
        type="danger"
        details={[
          'Todos os avisos serão removidos permanentemente',
          'Participantes não verão mais nenhum aviso anterior',
          'Esta ação não pode ser desfeita',
        ]}
      />

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
