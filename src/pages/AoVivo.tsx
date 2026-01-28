/**
 * Página Ao Vivo - Durante o Evento
 *
 * Core da experiência: diagnóstico em tempo real, gráfico radar,
 * alertas de gargalo, módulos em scroll horizontal e oferta bloqueada.
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket,
  Radio,
  Target,
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  Play,
  Bell,
  Zap,
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
import type { IMPACTData, Notification } from '../components/ui'
import { theme } from '../styles/theme'
import { getModuleById, EVENT_MODULES } from '../data/modules'

export function AoVivo() {
  const [activeNav, setActiveNav] = useState('aovivo')
  const [selectedDay, setSelectedDay] = useState<1 | 2>(1)
  const [showSliders, setShowSliders] = useState(true)
  const [currentModule] = useState(5) // Módulo atual (simulado)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [isOfferUnlocked] = useState(false) // Libera no módulo 11
  const [confirmedModules, setConfirmedModules] = useState<number[]>([0, 1, 2, 3, 4]) // Módulos já confirmados

  // Ref for horizontal scroll
  const modulesScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current module on mount
  useEffect(() => {
    if (modulesScrollRef.current) {
      const currentModuleElement = modulesScrollRef.current.querySelector(`[data-module="${currentModule}"]`)
      if (currentModuleElement) {
        currentModuleElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentModule])

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

  // Dados do diagnóstico
  const [day1Data, setDay1Data] = useState<IMPACTData>({
    inspiracao: 7,
    motivacao: 6,
    preparacao: 5,
    apresentacao: 4,
    conversao: 3,
    transformacao: 6,
  })

  const [day2Data, setDay2Data] = useState<IMPACTData>({
    inspiracao: 0,
    motivacao: 0,
    preparacao: 0,
    apresentacao: 0,
    conversao: 0,
    transformacao: 0,
  })

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
    name: 'João Silva',
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

  const updateDimension = (key: keyof IMPACTData, value: number) => {
    setCurrentData(prev => ({ ...prev, [key]: value }))
  }

  // Get current day from module
  const currentModuleData = getModuleById(currentModule)
  const currentDay = currentModuleData?.day || 1

  // Handle presence confirmation
  const handleConfirmPresence = (moduleId: number) => {
    if (!confirmedModules.includes(moduleId)) {
      setConfirmedModules(prev => [...prev, moduleId])
    }
  }

  // Calculate total XP from confirmed modules
  const totalXP = confirmedModules.length * 15

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

            {/* Header Section */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(100, 116, 139, 0.15)',
              }}
            >
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

              {/* Current Module Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
                    border: '1px solid rgba(255, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Radio size={22} color="#FF4444" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '10px',
                      color: theme.colors.text.muted,
                      margin: '0 0 2px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    MÓDULO {currentModule} DE {EVENT_MODULES.length - 1}
                  </p>
                  <h3
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '13px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {currentModuleData?.title || `MÓDULO ${currentModule}`}
                  </h3>
                  {currentModuleData?.subtitle && (
                    <p
                      style={{
                        fontSize: '10px',
                        color: theme.colors.text.secondary,
                        margin: '3px 0 0 0',
                        lineHeight: 1.4,
                      }}
                    >
                      {currentModuleData.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modules Horizontal Scroll */}
            <div style={{ padding: '12px 0 14px 0' }}>
              {/* Scroll hint */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 16px',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    color: theme.colors.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  MÓDULOS DO DIA
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    color: theme.colors.text.muted,
                  }}
                >
                  deslize →
                </span>
              </div>

              {/* Horizontal Scroll Container */}
              <div
                ref={modulesScrollRef}
                style={{
                  display: 'flex',
                  gap: '10px',
                  overflowX: 'auto',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingBottom: '4px',
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {EVENT_MODULES.filter(m => m.day === currentDay).map((mod) => {
                  const isPast = mod.id < currentModule
                  const isCurrent = mod.id === currentModule
                  const isFuture = mod.id > currentModule
                  const isConfirmed = confirmedModules.includes(mod.id)
                  const canConfirm = isCurrent && !isConfirmed

                  return (
                    <motion.div
                      key={mod.id}
                      data-module={mod.id}
                      whileTap={canConfirm ? { scale: 0.98 } : {}}
                      style={{
                        minWidth: isCurrent ? '180px' : '120px',
                        flexShrink: 0,
                        scrollSnapAlign: 'center',
                        padding: '12px',
                        background: isCurrent
                          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)'
                          : isPast
                          ? 'rgba(34, 211, 238, 0.08)'
                          : 'rgba(100, 116, 139, 0.05)',
                        border: isCurrent
                          ? '2px solid rgba(168, 85, 247, 0.5)'
                          : isPast
                          ? '1px solid rgba(34, 211, 238, 0.3)'
                          : '1px solid rgba(100, 116, 139, 0.2)',
                        borderRadius: '12px',
                        opacity: isFuture ? 0.5 : 1,
                        boxShadow: isCurrent ? '0 0 15px rgba(168, 85, 247, 0.3)' : 'none',
                      }}
                    >
                      {/* Module Number + Status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: isPast
                              ? 'rgba(34, 211, 238, 0.2)'
                              : isCurrent
                              ? 'rgba(168, 85, 247, 0.3)'
                              : 'rgba(100, 116, 139, 0.1)',
                            border: `1px solid ${
                              isPast
                                ? 'rgba(34, 211, 238, 0.4)'
                                : isCurrent
                                ? 'rgba(168, 85, 247, 0.5)'
                                : 'rgba(100, 116, 139, 0.2)'
                            }`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: isPast
                              ? theme.colors.accent.cyan.DEFAULT
                              : isCurrent
                              ? theme.colors.accent.purple.light
                              : theme.colors.text.muted,
                          }}
                        >
                          {isPast ? (
                            <Check size={12} />
                          ) : isCurrent ? (
                            <Play size={10} fill={theme.colors.accent.purple.light} />
                          ) : (
                            <Lock size={10} />
                          )}
                        </div>

                        {/* XP Badge or Live indicator */}
                        {(isPast || isCurrent) && isConfirmed ? (
                          <span
                            style={{
                              fontSize: '8px',
                              color: theme.colors.accent.cyan.DEFAULT,
                              padding: '2px 5px',
                              background: 'rgba(34, 211, 238, 0.1)',
                              borderRadius: '4px',
                            }}
                          >
                            +15 XP
                          </span>
                        ) : isCurrent ? (
                          <motion.div
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#FF4444',
                              boxShadow: '0 0 8px #FF4444',
                            }}
                          />
                        ) : null}
                      </div>

                      {/* Module Title */}
                      <p
                        style={{
                          fontSize: '9px',
                          fontWeight: theme.typography.fontWeight.bold,
                          color: isCurrent
                            ? theme.colors.accent.purple.light
                            : isPast
                            ? theme.colors.text.primary
                            : theme.colors.text.muted,
                          textTransform: 'uppercase',
                          margin: 0,
                          lineHeight: 1.3,
                        }}
                      >
                        {mod.title}
                      </p>

                      {/* Confirm Button - only for current module that hasn't been confirmed */}
                      {canConfirm && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleConfirmPresence(mod.id)}
                          style={{
                            width: '100%',
                            marginTop: '8px',
                            padding: '8px',
                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                            border: '1px solid rgba(168, 85, 247, 0.5)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            color: theme.colors.accent.purple.light,
                            fontSize: '9px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                          }}
                        >
                          <Zap size={10} />
                          +15 XP
                        </motion.button>
                      )}

                      {/* Confirmed indicator */}
                      {isCurrent && isConfirmed && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            marginTop: '8px',
                            padding: '6px',
                            background: 'rgba(34, 211, 238, 0.1)',
                            borderRadius: '6px',
                          }}
                        >
                          <Check size={10} color={theme.colors.accent.cyan.DEFAULT} />
                          <span
                            style={{
                              fontSize: '8px',
                              color: theme.colors.accent.cyan.DEFAULT,
                              fontWeight: 'bold',
                            }}
                          >
                            CONFIRMADO
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Hide scrollbar */}
              <style>{`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
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
            />
          </motion.div>

          {/* ==================== SPONSOR BADGE ==================== */}
          <motion.div variants={itemVariants}>
            <SponsorBadge
              isLinkActive={isOfferUnlocked}
              onLinkClick={() => {/* TODO: navigate to offer */}}
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

      {/* ==================== BOTTOM NAVIGATION ==================== */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
