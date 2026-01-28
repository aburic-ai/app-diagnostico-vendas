/**
 * Página Demo - Preview para Captura de Vídeo
 *
 * Página otimizada para gravação de vídeo promocional.
 * Inclui modo Tour automático que demonstra todas as funcionalidades.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Radio,
  BookOpen,
  MessageSquare,
  Calendar,
  Bell,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  Sparkles,
  Rocket,
} from 'lucide-react'

import { PageWrapper, RadarChart } from '../components/ui'
import type { IMPACTData } from '../components/ui'
import { theme } from '../styles/theme'

// Tour steps configuration with phases
interface TourStep {
  id: string
  title: string
  description: string
  duration: number
  phase: 'intro' | 'pre' | 'durante' | 'pos' | 'end'
}

const TOUR_STEPS: TourStep[] = [
  // INTRO
  { id: 'intro', title: 'Bem-vindo ao Cockpit', description: 'Seu painel de diagnóstico de vendas', duration: 2000, phase: 'intro' },
  // PRÉ-EVENTO
  { id: 'phase-pre', title: 'PRÉ-EVENTO', description: 'Preparação antes do evento', duration: 2000, phase: 'pre' },
  { id: 'aulas', title: 'Aulas Preparatórias', description: 'Conteúdo exclusivo + bônus', duration: 3000, phase: 'pre' },
  // DURANTE O EVENTO
  { id: 'phase-durante', title: 'DURANTE O EVENTO', description: 'Diagnóstico em tempo real', duration: 2000, phase: 'durante' },
  { id: 'agenda', title: 'Agenda Ao Vivo', description: 'Acompanhe cada módulo', duration: 2500, phase: 'durante' },
  { id: 'sliders', title: 'Diagnóstico IMPACT', description: 'Avalie cada etapa da sua jornada', duration: 4000, phase: 'durante' },
  { id: 'radar', title: 'Visualização Radar', description: 'Veja seu diagnóstico completo', duration: 2500, phase: 'durante' },
  { id: 'gargalo', title: 'Identificação de Gargalos', description: 'Descubra onde sua venda trava', duration: 3000, phase: 'durante' },
  { id: 'ia', title: 'Assistente IA', description: 'Suporte inteligente ao vivo', duration: 2500, phase: 'durante' },
  { id: 'avisos', title: 'Avisos em Tempo Real', description: 'Notificações da organização', duration: 2500, phase: 'durante' },
  // PÓS-EVENTO
  { id: 'phase-pos', title: 'PÓS-EVENTO', description: 'Consolidação e ação', duration: 2000, phase: 'pos' },
  { id: 'relatorio', title: 'Relatório Final', description: 'Consolidação do seu diagnóstico', duration: 3000, phase: 'pos' },
  { id: 'posevento', title: 'Plano de 7 Dias', description: 'Acompanhamento pós-evento', duration: 3000, phase: 'pos' },
  // END
  { id: 'end', title: 'Pronto para Transformar?', description: 'Seu diagnóstico completo em 2 dias', duration: 2500, phase: 'end' },
]

const IMPACT_LABELS = ['I', 'M', 'P', 'A', 'C', 'T']
const IMPACT_NAMES = ['Inspiração', 'Motivação', 'Preparação', 'Apresentação', 'Conversão', 'Transformação']

export function Demo() {
  const [isTourRunning, setIsTourRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const xpRef = useRef(0)
  const isAnimatingXpRef = useRef(false)

  // Slider values (animated)
  const [sliderValues, setSliderValues] = useState([0, 0, 0, 0, 0, 0])

  // Diagnostic data derived from sliders
  const diagnosticData: IMPACTData = {
    inspiracao: sliderValues[0],
    motivacao: sliderValues[1],
    preparacao: sliderValues[2],
    apresentacao: sliderValues[3],
    conversao: sliderValues[4],
    transformacao: sliderValues[5],
  }

  // XP
  const [xp, setXp] = useState(0)
  const [showXpAnimation, setShowXpAnimation] = useState(false)

  // Phase states
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'pre' | 'durante' | 'pos' | 'end'>('intro')

  // Visibility states
  const [showPhaseTransition, setShowPhaseTransition] = useState(false)
  const [showAulas, setShowAulas] = useState(false)
  const [showAgenda, setShowAgenda] = useState(false)
  const [showSliders, setShowSliders] = useState(false)
  const [showRadar, setShowRadar] = useState(false)
  const [showGargalo, setShowGargalo] = useState(false)
  const [showIA, setShowIA] = useState(false)
  const [showAvisos, setShowAvisos] = useState(false)
  const [showRelatorio, setShowRelatorio] = useState(false)
  const [showPosEvento, setShowPosEvento] = useState(false)

  // Highlights
  const [highlightFeature, setHighlightFeature] = useState<string | null>(null)

  // Notification animation
  const [activeNotification, setActiveNotification] = useState<number | null>(null)

  // Reset everything
  const resetDemo = useCallback(() => {
    setSliderValues([0, 0, 0, 0, 0, 0])
    setXp(0)
    setCurrentPhase('intro')
    setShowPhaseTransition(false)
    setShowAulas(false)
    setShowAgenda(false)
    setShowSliders(false)
    setShowRadar(false)
    setShowGargalo(false)
    setShowIA(false)
    setShowAvisos(false)
    setShowRelatorio(false)
    setShowPosEvento(false)
    setHighlightFeature(null)
    setActiveNotification(null)
    setCurrentStep(0)
    setShowIntro(true)
  }, [])

  // Animate sliders one by one
  const animateSliders = useCallback(() => {
    const targetValues = [8, 7, 6, 5, 3, 7]
    const stepsPerSlider = 20
    const delayBetween = 400

    targetValues.forEach((target, sliderIndex) => {
      setTimeout(() => {
        let step = 0
        const interval = setInterval(() => {
          step++
          const progress = step / stepsPerSlider
          setSliderValues(prev => {
            const newValues = [...prev]
            newValues[sliderIndex] = Math.round(target * progress)
            return newValues
          })
          if (step >= stepsPerSlider) {
            clearInterval(interval)
          }
        }, 50)
      }, sliderIndex * delayBetween)
    })
  }, [])

  // Animate XP - using ref to avoid dependency on xp state
  const animateXp = useCallback((target: number) => {
    if (isAnimatingXpRef.current) return // Prevent multiple animations
    isAnimatingXpRef.current = true
    setShowXpAnimation(true)
    const steps = 30
    let currentStepNum = 0
    const startXp = xpRef.current

    const interval = setInterval(() => {
      currentStepNum++
      const progress = currentStepNum / steps
      const newXp = Math.round(startXp + (target - startXp) * progress)
      xpRef.current = newXp
      setXp(newXp)
      if (currentStepNum >= steps) {
        clearInterval(interval)
        isAnimatingXpRef.current = false
        setTimeout(() => setShowXpAnimation(false), 500)
      }
    }, 50)
  }, []) // No dependencies - uses refs

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element && contentRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Tour step actions
  const executeStepAction = useCallback((stepId: string, _phase: TourStep['phase']) => {
    setHighlightFeature(stepId)

    switch (stepId) {
      case 'intro':
        setShowIntro(false)
        setCurrentPhase('intro')
        break
      case 'phase-pre':
        setCurrentPhase('pre')
        setShowPhaseTransition(true)
        setTimeout(() => setShowPhaseTransition(false), 1500)
        break
      case 'aulas':
        setShowAulas(true)
        scrollToSection('section-aulas')
        animateXp(50)
        break
      case 'phase-durante':
        setCurrentPhase('durante')
        setShowPhaseTransition(true)
        setTimeout(() => setShowPhaseTransition(false), 1500)
        break
      case 'agenda':
        setShowAgenda(true)
        scrollToSection('section-agenda')
        break
      case 'sliders':
        setShowSliders(true)
        scrollToSection('section-sliders')
        setTimeout(() => animateSliders(), 500)
        break
      case 'radar':
        setShowRadar(true)
        scrollToSection('section-radar')
        break
      case 'gargalo':
        setShowGargalo(true)
        scrollToSection('section-gargalo')
        break
      case 'ia':
        setShowIA(true)
        scrollToSection('section-ia')
        break
      case 'avisos':
        setShowAvisos(true)
        scrollToSection('section-avisos')
        setActiveNotification(0)
        setTimeout(() => setActiveNotification(1), 800)
        setTimeout(() => setActiveNotification(2), 1600)
        break
      case 'phase-pos':
        setCurrentPhase('pos')
        setShowPhaseTransition(true)
        setTimeout(() => setShowPhaseTransition(false), 1500)
        break
      case 'relatorio':
        setShowRelatorio(true)
        scrollToSection('section-relatorio')
        animateXp(200)
        break
      case 'posevento':
        setShowPosEvento(true)
        scrollToSection('section-posevento')
        break
      case 'end':
        setCurrentPhase('end')
        setHighlightFeature(null)
        break
    }
  }, [animateSliders, animateXp])

  // Run tour
  useEffect(() => {
    if (!isTourRunning) return

    const step = TOUR_STEPS[currentStep]
    if (!step) {
      setIsTourRunning(false)
      return
    }

    executeStepAction(step.id, step.phase)

    const timeout = setTimeout(() => {
      if (currentStep < TOUR_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        setIsTourRunning(false)
      }
    }, step.duration)

    return () => clearTimeout(timeout)
  }, [isTourRunning, currentStep, executeStepAction])

  const startTour = () => {
    resetDemo()
    setShowIntro(false)
    setIsTourRunning(true)
    setCurrentStep(0)
  }

  const pauseTour = () => {
    setIsTourRunning(false)
  }

  const currentTourStep = TOUR_STEPS[currentStep]

  return (
    <PageWrapper
      backgroundColor={theme.colors.background.dark}
      showAnimatedBackground={true}
      showOverlay={false}
    >
      {/* ==================== TOUR STEPS BAR (TOP) ==================== */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'linear-gradient(180deg, rgba(5, 5, 5, 0.98) 0%, rgba(5, 5, 5, 0.9) 80%, transparent 100%)',
          padding: '12px 16px 20px',
        }}
      >
        {/* Demo Mode Badge + XP */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 8px #EF4444',
              }}
            />
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#EF4444', textTransform: 'uppercase' }}>
              DEMO
            </span>
            <Video size={12} color="#EF4444" />
          </div>

          <motion.div
            animate={showXpAnimation ? { scale: [1, 1.15, 1] } : {}}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '6px',
            }}
          >
            <Zap size={14} color={theme.colors.gold.DEFAULT} />
            <span style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '14px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT }}>
              {xp} XP
            </span>
          </motion.div>
        </div>

        {/* Phase Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          {[
            { id: 'pre', label: 'PRÉ', icon: Rocket, color: theme.colors.accent.cyan.DEFAULT },
            { id: 'durante', label: 'AO VIVO', icon: Radio, color: theme.colors.accent.purple.light },
            { id: 'pos', label: 'PÓS', icon: Target, color: theme.colors.gold.DEFAULT },
          ].map((p) => (
            <motion.div
              key={p.id}
              animate={{
                opacity: currentPhase === p.id || (p.id === 'pre' && currentPhase === 'intro') ? 1 : 0.4,
                scale: currentPhase === p.id ? 1.05 : 1,
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                background: currentPhase === p.id ? `${p.color}25` : 'transparent',
                border: `1px solid ${currentPhase === p.id ? p.color : 'rgba(100, 116, 139, 0.3)'}`,
                borderRadius: '6px',
              }}
            >
              <p.icon size={12} color={currentPhase === p.id ? p.color : theme.colors.text.muted} />
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: currentPhase === p.id ? p.color : theme.colors.text.muted, textTransform: 'uppercase' }}>
                {p.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
          {TOUR_STEPS.filter(s => !s.id.startsWith('phase-')).map((step) => {
            const realIndex = TOUR_STEPS.findIndex(s => s.id === step.id)
            const phaseColor = step.phase === 'pre' ? theme.colors.accent.cyan.DEFAULT
              : step.phase === 'durante' ? theme.colors.accent.purple.light
                : step.phase === 'pos' ? theme.colors.gold.DEFAULT
                  : theme.colors.text.secondary
            return (
              <motion.div
                key={step.id}
                animate={{
                  background: realIndex < currentStep
                    ? phaseColor
                    : realIndex === currentStep && isTourRunning
                      ? phaseColor
                      : 'rgba(100, 116, 139, 0.3)',
                  width: realIndex === currentStep && isTourRunning ? '20px' : '12px',
                }}
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  transition: 'all 0.3s ease',
                }}
              />
            )
          })}
        </div>

        {/* Current Step Info */}
        {isTourRunning && currentTourStep && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginTop: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
              <Sparkles size={12} color={theme.colors.accent.purple.light} />
              <span style={{ fontSize: '9px', color: theme.colors.accent.purple.light, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
            </div>
            <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '14px', fontWeight: 'bold', color: theme.colors.text.primary, margin: 0 }}>
              {currentTourStep.title}
            </h3>
            <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
              {currentTourStep.description}
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ==================== SCROLLABLE CONTENT ==================== */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 16px 120px',
        }}
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', marginBottom: '24px' }}
        >
          <h1 style={{ fontFamily: theme.typography.fontFamily.body, fontSize: '10px', fontWeight: theme.typography.fontWeight.medium, color: theme.colors.text.secondary, letterSpacing: '0.25em', textTransform: 'uppercase', margin: 0 }}>
            IMERSÃO ONLINE
          </h1>
          <h2 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '20px', fontWeight: theme.typography.fontWeight.bold, color: theme.colors.accent.cyan.DEFAULT, letterSpacing: '0.08em', textTransform: 'uppercase', textShadow: '0 0 20px rgba(34, 211, 238, 0.6)', margin: '4px 0 0 0' }}>
            DIAGNÓSTICO DE VENDAS
          </h2>
        </motion.div>

        {/* ==================== AULAS BÔNUS ==================== */}
        <AnimatePresence>
          {showAulas && (
            <motion.div
              id="section-aulas"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: highlightFeature === 'aulas' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(10, 12, 18, 0.6)',
                border: `2px solid ${highlightFeature === 'aulas' ? theme.colors.accent.cyan.DEFAULT : 'rgba(34, 211, 238, 0.3)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'aulas' ? '0 0 30px rgba(34, 211, 238, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <BookOpen size={20} color={theme.colors.accent.cyan.DEFAULT} />
                <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '12px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, textTransform: 'uppercase', margin: 0 }}>
                  AULAS BÔNUS
                </h3>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '6px' }}>
                  <Zap size={12} color={theme.colors.gold.DEFAULT} />
                  <span style={{ fontSize: '10px', color: theme.colors.gold.DEFAULT, fontWeight: 'bold' }}>+50 XP</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.15 }}
                    style={{
                      padding: '12px 8px',
                      background: 'linear-gradient(135deg, rgba(10, 15, 20, 0.8) 0%, rgba(5, 10, 18, 0.9) 100%)',
                      border: '1px solid rgba(34, 211, 238, 0.35)',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(34, 211, 238, 0.15)', border: '1px solid rgba(34, 211, 238, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                      <Play size={18} color={theme.colors.accent.cyan.DEFAULT} fill={theme.colors.accent.cyan.DEFAULT} />
                    </div>
                    <span style={{ fontSize: '10px', color: theme.colors.text.primary, fontWeight: 'bold' }}>Aula {i}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== AGENDA AO VIVO ==================== */}
        <AnimatePresence>
          {showAgenda && (
            <motion.div
              id="section-agenda"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: highlightFeature === 'agenda' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(10, 12, 18, 0.6)',
                border: `2px solid ${highlightFeature === 'agenda' ? theme.colors.accent.purple.light : 'rgba(168, 85, 247, 0.3)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'agenda' ? '0 0 30px rgba(168, 85, 247, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Radio size={20} color={theme.colors.accent.purple.light} />
                <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '12px', fontWeight: 'bold', color: theme.colors.accent.purple.light, textTransform: 'uppercase', margin: 0 }}>
                  AGENDA AO VIVO
                </h3>
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ marginLeft: 'auto', padding: '4px 10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '6px' }}
                >
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#EF4444', textTransform: 'uppercase' }}>AO VIVO</span>
                </motion.div>
              </div>

              {/* Current Block */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                  padding: '14px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '10px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.typography.fontFamily.orbitron, fontSize: '14px', fontWeight: 'bold', color: theme.colors.accent.purple.light }}>
                    3
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '9px', color: theme.colors.text.muted, textTransform: 'uppercase' }}>MÓDULO ATUAL</span>
                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: theme.colors.text.primary, margin: '2px 0 0 0' }}>Preparação</p>
                  </div>
                  <Clock size={16} color={theme.colors.accent.purple.light} />
                </div>
              </motion.div>

              {/* Next blocks */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[4, 5, 6].map((num, i) => (
                  <motion.div
                    key={num}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'rgba(100, 116, 139, 0.1)',
                      border: '1px solid rgba(100, 116, 139, 0.2)',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: theme.colors.text.muted }}>{num}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== SLIDERS IMPACT ==================== */}
        <AnimatePresence>
          {showSliders && (
            <motion.div
              id="section-sliders"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: highlightFeature === 'sliders' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(10, 12, 18, 0.6)',
                border: `2px solid ${highlightFeature === 'sliders' ? theme.colors.accent.cyan.DEFAULT : 'rgba(34, 211, 238, 0.3)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'sliders' ? '0 0 30px rgba(34, 211, 238, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Target size={20} color={theme.colors.accent.cyan.DEFAULT} />
                <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '12px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, textTransform: 'uppercase', margin: 0 }}>
                  DIAGNÓSTICO IMPACT
                </h3>
              </div>

              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {IMPACT_LABELS.map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: sliderValues[i] > 0 ? 'rgba(34, 211, 238, 0.2)' : 'rgba(100, 116, 139, 0.15)',
                      border: `1px solid ${sliderValues[i] > 0 ? 'rgba(34, 211, 238, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: sliderValues[i] > 0 ? theme.colors.accent.cyan.DEFAULT : theme.colors.text.muted,
                    }}>
                      {label}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '10px', color: theme.colors.text.muted, marginBottom: '4px' }}>{IMPACT_NAMES[i]}</div>
                      <div style={{ position: 'relative', height: '8px', background: 'rgba(30, 35, 45, 0.8)', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div
                          animate={{ width: `${sliderValues[i] * 10}%` }}
                          transition={{ duration: 0.3 }}
                          style={{
                            height: '100%',
                            background: sliderValues[i] <= 4
                              ? 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)'
                              : sliderValues[i] <= 6
                                ? 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)'
                                : 'linear-gradient(90deg, #22D3EE 0%, #67E8F9 100%)',
                            borderRadius: '4px',
                            boxShadow: sliderValues[i] > 0 ? '0 0 10px rgba(34, 211, 238, 0.5)' : 'none',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{
                      width: '32px',
                      textAlign: 'center',
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: sliderValues[i] <= 4 ? '#EF4444' : sliderValues[i] <= 6 ? theme.colors.gold.DEFAULT : theme.colors.accent.cyan.DEFAULT,
                    }}>
                      {sliderValues[i]}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== RADAR CHART ==================== */}
        <AnimatePresence>
          {showRadar && (
            <motion.div
              id="section-radar"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: highlightFeature === 'radar' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(10, 12, 18, 0.6)',
                border: `2px solid ${highlightFeature === 'radar' ? theme.colors.accent.cyan.DEFAULT : 'rgba(34, 211, 238, 0.3)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'radar' ? '0 0 40px rgba(34, 211, 238, 0.4)' : 'none',
              }}
            >
              <RadarChart data1={diagnosticData} selectedDay={1} size={240} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== GARGALO ==================== */}
        <AnimatePresence>
          {showGargalo && (
            <motion.div
              id="section-gargalo"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)',
                border: `2px solid ${highlightFeature === 'gargalo' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.4)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'gargalo' ? '0 0 30px rgba(239, 68, 68, 0.4)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5, repeat: 3 }}>
                  <AlertTriangle size={24} color="#EF4444" />
                </motion.div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>GARGALO IDENTIFICADO</span>
                  <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '18px', fontWeight: 'bold', color: '#EF4444', margin: 0 }}>CONVERSÃO</h3>
                </div>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', border: '3px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '20px', fontWeight: 'bold', color: '#EF4444' }}>3</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: theme.colors.text.secondary, margin: 0, lineHeight: 1.5 }}>
                Clientes abandonam antes de fechar porque não percebem urgência ou valor.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== ASSISTENTE IA ==================== */}
        <AnimatePresence>
          {showIA && (
            <motion.div
              id="section-ia"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: highlightFeature === 'ia' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(10, 12, 18, 0.6)',
                border: `2px solid ${highlightFeature === 'ia' ? theme.colors.accent.purple.light : 'rgba(168, 85, 247, 0.3)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'ia' ? '0 0 30px rgba(168, 85, 247, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <MessageSquare size={20} color={theme.colors.accent.purple.light} />
                <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '12px', fontWeight: 'bold', color: theme.colors.accent.purple.light, textTransform: 'uppercase', margin: 0 }}>
                  ASSISTENTE IA
                </h3>
                <div style={{ marginLeft: 'auto', padding: '4px 10px', background: 'rgba(34, 211, 238, 0.2)', border: '1px solid rgba(34, 211, 238, 0.5)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, textTransform: 'uppercase' }}>LIBERADO AO VIVO</span>
                </div>
              </div>

              {/* Chat Preview */}
              <div style={{ padding: '12px', background: 'rgba(5, 5, 5, 0.5)', borderRadius: '10px', marginBottom: '12px' }}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} color={theme.colors.accent.purple.light} />
                  </div>
                  <div style={{ flex: 1, padding: '10px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: 0, lineHeight: 1.4 }}>
                      Como posso ajudar você a melhorar sua conversão?
                    </p>
                  </div>
                </motion.div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Digite sua pergunta..."
                  disabled
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'rgba(30, 35, 45, 0.6)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '10px',
                    color: theme.colors.text.muted,
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={20} color={theme.colors.accent.purple.light} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== AVISOS ==================== */}
        <AnimatePresence>
          {showAvisos && (
            <motion.div
              id="section-avisos"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: highlightFeature === 'avisos' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(10, 12, 18, 0.6)',
                border: `2px solid ${highlightFeature === 'avisos' ? theme.colors.gold.DEFAULT : 'rgba(245, 158, 11, 0.3)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'avisos' ? '0 0 30px rgba(245, 158, 11, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <Bell size={20} color={theme.colors.gold.DEFAULT} />
                <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '12px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT, textTransform: 'uppercase', margin: 0 }}>
                  AVISOS EM TEMPO REAL
                </h3>
              </div>

              {/* Notifications */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: Radio, text: 'Módulo 4 iniciando em 5 minutos', color: theme.colors.accent.purple.light },
                  { icon: Target, text: 'Complete seu diagnóstico agora!', color: theme.colors.accent.cyan.DEFAULT },
                  { icon: Zap, text: '+25 XP por participação', color: theme.colors.gold.DEFAULT },
                ].map((notif, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{
                      opacity: activeNotification !== null && i <= activeNotification ? 1 : 0.3,
                      x: activeNotification !== null && i <= activeNotification ? 0 : 30,
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      background: 'rgba(5, 5, 5, 0.5)',
                      border: `1px solid ${activeNotification === i ? notif.color : 'rgba(100, 116, 139, 0.2)'}`,
                      borderRadius: '10px',
                      boxShadow: activeNotification === i ? `0 0 15px ${notif.color}40` : 'none',
                    }}
                  >
                    <notif.icon size={18} color={notif.color} />
                    <span style={{ fontSize: '12px', color: theme.colors.text.primary }}>{notif.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== RELATÓRIO FINAL ==================== */}
        <AnimatePresence>
          {showRelatorio && (
            <motion.div
              id="section-relatorio"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: highlightFeature === 'relatorio' ? 'rgba(34, 211, 238, 0.15)' : 'rgba(10, 12, 18, 0.6)',
                border: `2px solid ${highlightFeature === 'relatorio' ? theme.colors.accent.cyan.DEFAULT : 'rgba(34, 211, 238, 0.3)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'relatorio' ? '0 0 30px rgba(34, 211, 238, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FileText size={20} color={theme.colors.accent.cyan.DEFAULT} />
                <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '12px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, textTransform: 'uppercase', margin: 0 }}>
                  RELATÓRIO FINAL
                </h3>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <CheckCircle size={16} color={theme.colors.accent.cyan.DEFAULT} />
                  <span style={{ fontSize: '10px', color: theme.colors.accent.cyan.DEFAULT, fontWeight: 'bold' }}>COMPLETO</span>
                </motion.div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Score', value: '62%', color: theme.colors.accent.cyan.DEFAULT },
                  { label: 'Gargalo', value: 'C', color: '#EF4444' },
                  { label: 'Potencial', value: '+40%', color: theme.colors.gold.DEFAULT },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    style={{
                      padding: '12px',
                      background: 'rgba(5, 5, 5, 0.5)',
                      borderRadius: '10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '20px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '9px', color: theme.colors.text.muted, textTransform: 'uppercase', marginTop: '4px' }}>{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Download Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
                  border: '1px solid rgba(34, 211, 238, 0.5)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                <FileText size={18} color={theme.colors.accent.cyan.DEFAULT} />
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT }}>BAIXAR RELATÓRIO PDF</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== PÓS-EVENTO ==================== */}
        <AnimatePresence>
          {showPosEvento && (
            <motion.div
              id="section-posevento"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: '20px',
                padding: '16px',
                background: highlightFeature === 'posevento' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(10, 12, 18, 0.6)',
                border: `2px solid ${highlightFeature === 'posevento' ? theme.colors.gold.DEFAULT : 'rgba(245, 158, 11, 0.3)'}`,
                borderRadius: '16px',
                boxShadow: highlightFeature === 'posevento' ? '0 0 30px rgba(245, 158, 11, 0.3)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Calendar size={20} color={theme.colors.gold.DEFAULT} />
                <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '12px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT, textTransform: 'uppercase', margin: 0 }}>
                  PLANO DE 7 DIAS
                </h3>
              </div>

              {/* Days */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <motion.div
                    key={day}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: day * 0.1 }}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      background: day <= 2
                        ? 'rgba(34, 211, 238, 0.2)'
                        : day === 3
                          ? 'rgba(245, 158, 11, 0.2)'
                          : 'rgba(100, 116, 139, 0.1)',
                      border: `1px solid ${day <= 2 ? 'rgba(34, 211, 238, 0.5)' : day === 3 ? 'rgba(245, 158, 11, 0.5)' : 'rgba(100, 116, 139, 0.2)'}`,
                      borderRadius: '6px',
                      textAlign: 'center',
                    }}
                  >
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: day <= 2 ? theme.colors.accent.cyan.DEFAULT : day === 3 ? theme.colors.gold.DEFAULT : theme.colors.text.muted,
                    }}>
                      {day}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Current Task */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} color={theme.colors.gold.DEFAULT} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '9px', color: theme.colors.text.muted, textTransform: 'uppercase' }}>DIA 3 - TAREFA</span>
                  <p style={{ fontSize: '13px', fontWeight: 'bold', color: theme.colors.text.primary, margin: '2px 0 0 0' }}>Revisar proposta de valor</p>
                </div>
                <ChevronRight size={18} color={theme.colors.gold.DEFAULT} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==================== CONTROLS (BOTTOM) ==================== */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          background: 'linear-gradient(0deg, rgba(5, 5, 5, 0.98) 0%, rgba(5, 5, 5, 0.95) 80%, transparent 100%)',
          display: 'flex',
          gap: '12px',
          zIndex: 60,
        }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={isTourRunning ? pauseTour : startTour}
          style={{
            flex: 1,
            padding: '16px',
            background: isTourRunning
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(234, 179, 8, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
            border: `1px solid ${isTourRunning ? 'rgba(245, 158, 11, 0.5)' : 'rgba(34, 211, 238, 0.5)'}`,
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          {isTourRunning ? (
            <>
              <Pause size={20} color={theme.colors.gold.DEFAULT} />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT }}>PAUSAR</span>
            </>
          ) : (
            <>
              <Play size={20} color={theme.colors.accent.cyan.DEFAULT} fill={theme.colors.accent.cyan.DEFAULT} />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT }}>INICIAR TOUR</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetDemo}
          style={{
            width: '56px',
            height: '56px',
            background: 'rgba(100, 116, 139, 0.2)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RotateCcw size={20} color={theme.colors.text.secondary} />
        </motion.button>
      </div>

      {/* ==================== PHASE TRANSITION OVERLAY ==================== */}
      <AnimatePresence>
        {showPhaseTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 5, 5, 0.95)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 90,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{ textAlign: 'center' }}
            >
              {currentPhase === 'pre' && (
                <>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)',
                      border: '2px solid rgba(34, 211, 238, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <Rocket size={36} color={theme.colors.accent.cyan.DEFAULT} />
                  </motion.div>
                  <h2 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '24px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                    PRÉ-EVENTO
                  </h2>
                  <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
                    Preparação antes do evento
                  </p>
                </>
              )}
              {currentPhase === 'durante' && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)',
                      border: '2px solid rgba(168, 85, 247, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                      boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)',
                    }}
                  >
                    <Radio size={36} color={theme.colors.accent.purple.light} />
                  </motion.div>
                  <h2 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '24px', fontWeight: 'bold', color: theme.colors.accent.purple.light, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                    DURANTE O EVENTO
                  </h2>
                  <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
                    Diagnóstico em tempo real
                  </p>
                </>
              )}
              {currentPhase === 'pos' && (
                <>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '24px',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.2) 100%)',
                      border: '2px solid rgba(245, 158, 11, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <Target size={36} color={theme.colors.gold.DEFAULT} />
                  </motion.div>
                  <h2 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '24px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                    PÓS-EVENTO
                  </h2>
                  <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
                    Consolidação e plano de ação
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== INTRO OVERLAY ==================== */}
      <AnimatePresence>
        {showIntro && !isTourRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(5, 5, 5, 0.98)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ textAlign: 'center' }}
            >
              <motion.div
                animate={{ boxShadow: ['0 0 30px rgba(34, 211, 238, 0.3)', '0 0 60px rgba(34, 211, 238, 0.5)', '0 0 30px rgba(34, 211, 238, 0.3)'] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '30px',
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
                  border: '2px solid rgba(34, 211, 238, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 32px',
                }}
              >
                <TrendingUp size={48} color={theme.colors.accent.cyan.DEFAULT} />
              </motion.div>

              <h1 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '26px', fontWeight: 'bold', color: theme.colors.text.primary, margin: '0 0 8px 0', textTransform: 'uppercase' }}>
                COCKPIT DE VENDAS
              </h1>
              <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: '0 0 32px 0', lineHeight: 1.6 }}>
                Diagnóstico completo da sua jornada<br />de vendas em tempo real
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startTour}
                style={{
                  padding: '18px 48px',
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.4) 0%, rgba(6, 182, 212, 0.3) 100%)',
                  border: '2px solid rgba(34, 211, 238, 0.6)',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 0 40px rgba(34, 211, 238, 0.3)',
                }}
              >
                <Play size={24} color={theme.colors.accent.cyan.DEFAULT} fill={theme.colors.accent.cyan.DEFAULT} />
                <span style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '16px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  VER DEMONSTRAÇÃO
                </span>
              </motion.button>

              <p style={{ fontSize: '11px', color: theme.colors.text.muted, marginTop: '20px' }}>
                Tour automático de ~35 segundos
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
