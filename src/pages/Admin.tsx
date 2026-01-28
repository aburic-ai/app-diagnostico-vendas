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
  Power,
  Pause,
  Play,
  Users,
  Zap,
  Lock,
  Unlock,
  Check,
  Monitor,
  X,
  Coffee,
  Calendar,
  Clock,
  Settings,
} from 'lucide-react'
import { EVENT_MODULES, TOTAL_MODULES, getCurrentDay } from '../data/modules'
import { NotificationToast } from '../components/ui'
import type { Notification, NotificationType } from '../components/ui'
import { theme } from '../styles/theme'

// Estado do evento
type EventStatus = 'offline' | 'live' | 'paused' | 'lunch'

interface EventState {
  status: EventStatus
  currentModule: number
  offerReleased: boolean
  participantsOnline: number
  lunchReturnTime: string
}

// Dados do evento (editáveis)
interface EventData {
  edition: string
  day1Date: string
  day1Time: string
  day2Date: string
  day2Time: string
}

// Tipos de aviso
const notificationTypes: { type: NotificationType; label: string; icon: typeof Bell; color: string }[] = [
  { type: 'info', label: 'Info', icon: Bell, color: '#22D3EE' },
  { type: 'alert', label: 'Alerta', icon: AlertTriangle, color: '#EF4444' },
  { type: 'offer', label: 'Oferta', icon: Gift, color: '#F59E0B' },
  { type: 'nps', label: 'NPS', icon: Star, color: '#A855F7' },
]

// Templates de avisos
const notificationTemplates = [
  { title: 'Estamos começando!', message: 'Abra seu app e prepare-se para o diagnóstico.' },
  { title: 'Intervalo', message: 'Voltamos em 15 minutos. Aproveite para preencher seu diagnóstico.' },
  { title: 'Voltamos!', message: 'Próximo módulo começando agora.' },
  { title: 'Preencha seu diagnóstico', message: 'Não esqueça de registrar suas notas do módulo atual.' },
  { title: 'Oferta especial!', message: 'Condição exclusiva disponível agora para participantes.' },
]

export function Admin() {
  // Event State
  const [eventState, setEventState] = useState<EventState>({
    status: 'offline',
    currentModule: 0,
    offerReleased: false,
    participantsOnline: 0,
    lunchReturnTime: '14:00',
  })

  // Event Data (editável)
  const [eventData, setEventData] = useState<EventData>({
    edition: 'Fevereiro 2026',
    day1Date: '2026-02-28',
    day1Time: '09:30',
    day2Date: '2026-03-01',
    day2Time: '09:30',
  })
  const [showEventSettings, setShowEventSettings] = useState(false)

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    targetModule: number
    moduleName: string
  }>({ show: false, targetModule: 0, moduleName: '' })

  // Notification Form
  const [notifType, setNotifType] = useState<NotificationType>('info')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifAction, setNotifAction] = useState('')
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([])

  // Preview notification
  const [previewNotification, setPreviewNotification] = useState<Notification | null>(null)

  // Simulated online count
  useEffect(() => {
    if (eventState.status === 'live') {
      const interval = setInterval(() => {
        setEventState(prev => ({
          ...prev,
          participantsOnline: Math.min(700, prev.participantsOnline + Math.floor(Math.random() * 10)),
        }))
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [eventState.status])

  const currentModule = EVENT_MODULES[eventState.currentModule]
  const currentDay = getCurrentDay(eventState.currentModule)

  const handleToggleLive = () => {
    if (eventState.status === 'offline') {
      setEventState(prev => ({
        ...prev,
        status: 'live',
        participantsOnline: Math.floor(Math.random() * 100) + 50,
      }))
    } else {
      setEventState(prev => ({
        ...prev,
        status: 'offline',
        participantsOnline: 0,
      }))
    }
  }

  const handleTogglePause = () => {
    setEventState(prev => ({
      ...prev,
      status: prev.status === 'paused' ? 'live' : 'paused',
    }))
  }

  const handleToggleLunch = () => {
    setEventState(prev => ({
      ...prev,
      status: prev.status === 'lunch' ? 'live' : 'lunch',
    }))
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

  const confirmModuleChange = () => {
    setEventState(prev => ({ ...prev, currentModule: confirmDialog.targetModule }))
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

  const handleReleaseOffer = () => {
    setEventState(prev => ({ ...prev, offerReleased: !prev.offerReleased }))
  }

  const handleSendNotification = () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return

    const notification: Notification = {
      id: Date.now().toString(),
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      actionLabel: notifAction.trim() || undefined,
      timestamp: new Date(),
      read: false,
    }

    setSentNotifications(prev => [notification, ...prev])
    setPreviewNotification(notification)

    // Clear form
    setNotifTitle('')
    setNotifMessage('')
    setNotifAction('')

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
      case 'lunch': return 'ALMOÇO'
      default: return 'OFFLINE'
    }
  }

  const getStatusColor = () => {
    switch (eventState.status) {
      case 'live': return '#EF4444'
      case 'paused': return '#F59E0B'
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
        overflow: 'hidden',
      }}
    >
      {/* ==================== LADO ESQUERDO - CONTROLES ==================== */}
      <div
        style={{
          width: '55%',
          minWidth: '600px',
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEventSettings(!showEventSettings)}
            style={{
              padding: '10px',
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

          {/* Online Count */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
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
          </div>

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
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleToggleLive}
              style={{
                flex: 1,
                padding: '14px',
                background: eventState.status !== 'offline'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(34, 211, 238, 0.2)',
                border: `1px solid ${eventState.status !== 'offline' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 211, 238, 0.5)'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: eventState.status !== 'offline' ? '#EF4444' : theme.colors.accent.cyan.DEFAULT,
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              <Power size={18} />
              {eventState.status !== 'offline' ? 'ENCERRAR' : 'INICIAR TRANSMISSÃO'}
            </motion.button>

            {eventState.status !== 'offline' && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTogglePause}
                  style={{
                    padding: '14px 20px',
                    background: eventState.status === 'paused' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    border: `1px solid ${eventState.status === 'paused' ? 'rgba(34, 211, 238, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: eventState.status === 'paused' ? theme.colors.accent.cyan.DEFAULT : '#F59E0B',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {eventState.status === 'paused' ? <Play size={18} /> : <Pause size={18} />}
                  {eventState.status === 'paused' ? 'RETOMAR' : 'PAUSAR'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleToggleLunch}
                  style={{
                    padding: '14px 20px',
                    background: eventState.status === 'lunch' ? 'rgba(34, 211, 238, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    border: `1px solid ${eventState.status === 'lunch' ? 'rgba(34, 211, 238, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: eventState.status === 'lunch' ? theme.colors.accent.cyan.DEFAULT : '#F59E0B',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  <Coffee size={18} />
                  {eventState.status === 'lunch' ? 'FIM ALMOÇO' : 'ALMOÇO'}
                </motion.button>
              </>
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
                onChange={(e) => setEventState(prev => ({ ...prev, lunchReturnTime: e.target.value }))}
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

          {/* Module Selector with names visible */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {EVENT_MODULES.map((module) => (
              <motion.button
                key={module.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectModule(module.id)}
                style={{
                  padding: '10px 8px',
                  background:
                    module.id === eventState.currentModule
                      ? 'rgba(168, 85, 247, 0.3)'
                      : module.id < eventState.currentModule
                      ? 'rgba(34, 211, 238, 0.15)'
                      : 'rgba(100, 116, 139, 0.1)',
                  border: `1px solid ${
                    module.id === eventState.currentModule
                      ? 'rgba(168, 85, 247, 0.6)'
                      : module.id < eventState.currentModule
                      ? 'rgba(34, 211, 238, 0.3)'
                      : 'rgba(100, 116, 139, 0.2)'
                  }`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
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
                    }}
                  >
                    {module.id}
                  </span>
                  <span
                    style={{
                      fontSize: '8px',
                      padding: '1px 4px',
                      background: module.day === 1 ? 'rgba(34, 211, 238, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                      borderRadius: '3px',
                      color: module.day === 1 ? theme.colors.accent.cyan.DEFAULT : theme.colors.accent.purple.light,
                    }}
                  >
                    D{module.day}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '9px',
                    color:
                      module.id === eventState.currentModule
                        ? theme.colors.text.primary
                        : theme.colors.text.secondary,
                    margin: 0,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {module.title}
                </p>
              </motion.button>
            ))}
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
                  : 'Bloqueada - aguardando liberação'}
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
              {eventState.offerReleased ? <Lock size={16} /> : <Unlock size={16} />}
              {eventState.offerReleased ? 'BLOQUEAR' : 'LIBERAR OFERTA'}
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
          flex: 1,
          padding: '24px',
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
            Visão do Participante
          </span>
        </div>

        {/* Phone Mockup */}
        <div
          style={{
            width: '375px',
            height: '700px',
            background: '#050505',
            borderRadius: '40px',
            border: '8px solid #1a1a1f',
            boxShadow: '0 0 60px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Status Bar */}
          <div
            style={{
              height: '44px',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid rgba(100, 116, 139, 0.1)',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '28px',
                background: '#000',
                borderRadius: '14px',
              }}
            />
          </div>

          {/* Content */}
          <div
            style={{
              padding: '16px',
              height: 'calc(100% - 44px)',
              overflowY: 'auto',
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: '16px', textAlign: 'center' }}>
              <h3
                style={{
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '14px',
                  color: theme.colors.accent.cyan.DEFAULT,
                  letterSpacing: '0.1em',
                  margin: 0,
                }}
              >
                IMERSÃO
              </h3>
              <p style={{ fontSize: '10px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
                DIAGNÓSTICO DE VENDAS
              </p>
            </div>

            {/* Live Ticker Preview */}
            <div
              style={{
                background: 'rgba(15, 17, 21, 0.95)',
                border: eventState.status === 'live'
                  ? '1px solid rgba(255, 68, 68, 0.4)'
                  : eventState.status === 'lunch'
                  ? '1px solid rgba(245, 158, 11, 0.4)'
                  : '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              {eventState.status === 'live' && (
                <div
                  style={{
                    position: 'relative',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, #FF4444 50%, transparent 100%)',
                    marginBottom: '10px',
                    marginTop: '-14px',
                    marginLeft: '-14px',
                    marginRight: '-14px',
                  }}
                />
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                {eventState.status !== 'offline' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      background: eventState.status === 'lunch' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 68, 68, 0.15)',
                      borderRadius: '4px',
                    }}
                  >
                    {eventState.status === 'live' && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#FF4444',
                        }}
                      />
                    )}
                    {eventState.status === 'lunch' && <Coffee size={12} color="#F59E0B" />}
                    {eventState.status === 'paused' && <Pause size={12} color="#F59E0B" />}
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: eventState.status === 'live' ? '#FF4444' : '#F59E0B' }}>
                      {eventState.status === 'live' ? 'AO VIVO' : eventState.status === 'lunch' ? `ALMOÇO - Volta ${eventState.lunchReturnTime}` : 'PAUSADO'}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '9px', color: theme.colors.text.muted }}>OFFLINE</span>
                )}
                <span style={{ fontSize: '9px', color: theme.colors.text.muted }}>
                  MÓDULO {eventState.currentModule}/{TOTAL_MODULES - 1}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: eventState.status === 'lunch' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {eventState.status === 'lunch' ? (
                    <Coffee size={18} color="#F59E0B" />
                  ) : (
                    <Radio size={18} color="#FF4444" />
                  )}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: theme.colors.text.primary,
                      margin: 0,
                    }}
                  >
                    {eventState.status === 'lunch' ? 'HORA DO ALMOÇO' : currentModule?.title}
                  </p>
                  <p style={{ fontSize: '9px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
                    {eventState.status === 'lunch' ? `Retorno às ${eventState.lunchReturnTime}` : currentModule?.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Presence Card Preview (if live) */}
            {eventState.status === 'live' && (
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color={theme.colors.accent.purple.light} />
                    <span style={{ fontSize: '10px', color: theme.colors.accent.purple.light, fontWeight: 'bold' }}>
                      +10 XP
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    borderRadius: '6px',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '10px', color: theme.colors.accent.purple.light, fontWeight: 'bold' }}>
                    CONFIRMAR PRESENÇA
                  </span>
                </div>
              </motion.div>
            )}

            {/* Offer Preview (if released) */}
            {eventState.offerReleased && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Gift size={16} color="#F59E0B" />
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#F59E0B',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    OFERTA EXCLUSIVA
                  </span>
                </div>
                <p style={{ fontSize: '10px', color: theme.colors.text.secondary, margin: 0 }}>
                  Imersão IMPACT com condição especial
                </p>
              </motion.div>
            )}

            {/* Placeholder content */}
            <div
              style={{
                height: '120px',
                background: 'rgba(15, 17, 21, 0.5)',
                borderRadius: '10px',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                height: '80px',
                background: 'rgba(15, 17, 21, 0.5)',
                borderRadius: '10px',
              }}
            />
          </div>
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
