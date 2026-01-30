/**
 * ThankYou Page - Página pós-compra
 *
 * Fluxo:
 * 1. Recebe transaction_id via URL (ou pede email se não tiver)
 * 2. Exibe pesquisa de calibragem (8 perguntas)
 * 3. CTA WhatsApp
 * 4. Criação de senha
 * 5. Auto-login e redirect para /pre-evento
 *
 * Rota: /obrigado?transaction=HP123456789
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  MessageCircle,
  Lock,
  AlertCircle,
  Loader2,
} from 'lucide-react'

import { PageWrapper, Card, Button, Input } from '../components/ui'
import { theme } from '../styles/theme'
import {
  SURVEY_QUESTIONS,
  SURVEY_INTRO,
  type SurveyData,
  createEmptySurveyData,
  getVisibleQuestions,
} from '../data/survey-config'
import { generateWhatsAppMessage } from '../lib/whatsapp-message'

// ============================================
// TYPES
// ============================================

type Step = 'verification' | 'survey' | 'whatsapp' | 'password' | 'success' | 'error'

type VerificationStatus = 'checking' | 'not_found' | 'found'

const WHATSAPP_LINK = 'https://chat.whatsapp.com/GRUPO_EXCLUSIVO'
const SUPPORT_WHATSAPP = '+5511942230050'

// ============================================
// HELPER FUNCTIONS
// ============================================

const getPasswordStrength = (password: string): { level: 'weak' | 'medium' | 'strong'; score: number } => {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { level: 'weak', score }
  if (score <= 3) return { level: 'medium', score }
  return { level: 'strong', score }
}

const strengthColors = {
  weak: theme.colors.status.danger,
  medium: theme.colors.gold.DEFAULT,
  strong: theme.colors.accent.cyan.DEFAULT,
}

const strengthLabels = {
  weak: 'Fraca',
  medium: 'Média',
  strong: 'Forte',
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ThankYou() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // State
  const [step, setStep] = useState<Step>('verification')
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('checking')
  const [identifier, setIdentifier] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [surveyData, setSurveyData] = useState<SurveyData>(createEmptySurveyData())
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userFound, setUserFound] = useState(false)

  // Get transaction from URL on mount
  useEffect(() => {
    const transaction = searchParams.get('transaction')
    if (transaction) {
      setIdentifier(transaction)
      // Start polling for user
      pollForUser(transaction)
    } else {
      // No transaction - show checking animation for 10s, then ask for email
      setVerificationStatus('checking')
      setTimeout(() => {
        setVerificationStatus('not_found')
      }, 10000) // 10 seconds
    }
  }, [searchParams])

  // Poll for user in database (simulated - would call Supabase)
  const pollForUser = async (searchIdentifier: string) => {
    let attempts = 0
    const maxAttempts = 5 // 10 seconds (5 * 2s)

    const poll = async () => {
      attempts++

      // TODO: Replace with actual Supabase query
      // const { data } = await supabase
      //   .from('users')
      //   .select('*')
      //   .or(`transaction_id.eq.${searchIdentifier},email.eq.${searchIdentifier}`)
      //   .single()
      console.log(`Polling for user with identifier: ${searchIdentifier}, attempt ${attempts}`)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // For demo, simulate finding user after a few attempts
      const userExists = attempts >= 2 // Simulated

      if (userExists) {
        setUserFound(true)
        setVerificationStatus('found')
        return
      }

      if (attempts >= maxAttempts) {
        // User not found after 10s
        setUserFound(false)
        setVerificationStatus('not_found')
        return
      }

      // Continue polling
      setTimeout(poll, 2000)
    }

    poll()
  }

  // Handle email submission
  const handleEmailSubmit = () => {
    if (!email) {
      setEmailError('Digite seu e-mail')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('E-mail inválido')
      return
    }
    setEmailError('')
    setVerificationStatus('checking')
    pollForUser(email)
  }

  // Handle manual proceed (skip verification)
  const handleManualProceed = () => {
    setStep('survey')
  }

  // Handle survey answer
  const handleSurveyAnswer = (questionId: string, value: string) => {
    setSurveyData((prev) => ({ ...prev, [questionId]: value }))
  }

  // Navigate survey
  const visibleQuestions = getVisibleQuestions(surveyData)
  const currentQ = visibleQuestions[currentQuestion]
  const isLastQuestion = currentQuestion === visibleQuestions.length - 1

  const nextQuestion = () => {
    if (isLastQuestion) {
      // Gerar mensagem WhatsApp personalizada em background
      generateWhatsAppMessage(surveyData).then((result) => {
        console.log('[ThankYou] Mensagem WhatsApp gerada:', result)
        // TODO: Salvar no Supabase quando disponivel
        // await supabase.from('whatsapp_messages').insert({
        //   transaction_id: identifier,
        //   email: email || null,
        //   survey_data: surveyData,
        //   prompt: result.prompt,
        //   generated_message: result.message,
        //   used_fallback: result.usedFallback,
        // })
      })
      setStep('whatsapp')
    } else {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  // Handle password submission
  const handlePasswordSubmit = async () => {
    setPasswordError('')

    if (password.length < 8) {
      setPasswordError('Mínimo 8 caracteres')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Inclua pelo menos 1 letra maiúscula')
      return
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Inclua pelo menos 1 número')
      return
    }
    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Save to Supabase
      // await supabase.from('survey_responses').insert({
      //   transaction_id: identifier,
      //   email: email || null,
      //   ...surveyData,
      // })
      //
      // if (userFound) {
      //   await supabase.auth.updateUser({ password })
      //   // Auto-login is handled by Supabase
      // }
      console.log('Saving data for identifier:', identifier, 'email:', email, 'survey:', surveyData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (userFound) {
        // Success - redirect to app
        setStep('success')
        setTimeout(() => {
          navigate('/pre-evento')
        }, 2000)
      } else {
        // Show error state with WhatsApp support
        setStep('error')
      }
    } catch (error) {
      console.error('Error saving data:', error)
      setStep('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordStrength = getPasswordStrength(password)

  // ============================================
  // RENDER
  // ============================================

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
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AnimatePresence mode="wait">
          {/* VERIFICATION STATE - Intro + Verification Box */}
          {step === 'verification' && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '600px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              {/* Progress bar at 90% */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '10px',
                      color: theme.colors.accent.cyan.DEFAULT,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    INICIALIZAÇÃO DO SISTEMA
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: theme.colors.accent.cyan.DEFAULT,
                      fontWeight: theme.typography.fontWeight.bold,
                    }}
                  >
                    90%
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    background: 'rgba(34, 211, 238, 0.15)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #06B6D4 0%, #22D3EE 100%)',
                      borderRadius: '3px',
                      boxShadow: '0 0 10px rgba(34, 211, 238, 0.5)',
                    }}
                  />
                </div>
              </div>

              {/* Title with Mini Radar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                }}
              >
                {/* Mini Animated Radar */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    width: '60px',
                    height: '60px',
                    position: 'relative',
                    flexShrink: 0,
                  }}
                >
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    {/* Grid circles */}
                    {[0.33, 0.66, 1].map((level, i) => (
                      <circle
                        key={i}
                        cx="30"
                        cy="30"
                        r={20 * level}
                        fill="none"
                        stroke="rgba(34, 211, 238, 0.2)"
                        strokeWidth="1"
                      />
                    ))}
                    {/* Grid lines */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180
                      const x2 = 30 + 20 * Math.cos(rad)
                      const y2 = 30 + 20 * Math.sin(rad)
                      return (
                        <line
                          key={i}
                          x1="30"
                          y1="30"
                          x2={x2}
                          y2={y2}
                          stroke="rgba(34, 211, 238, 0.15)"
                          strokeWidth="1"
                        />
                      )
                    })}
                    {/* Animated data polygon */}
                    <motion.polygon
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        points: [
                          '30,14 44,22 44,38 30,46 16,38 16,22',
                          '30,12 46,20 48,36 30,48 12,36 14,20',
                          '30,16 42,24 42,40 30,44 18,40 18,24',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      fill="rgba(34, 211, 238, 0.15)"
                      stroke={theme.colors.accent.cyan.DEFAULT}
                      strokeWidth="1.5"
                      style={{
                        filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.6))',
                      }}
                    />
                    {/* Center dot */}
                    <motion.circle
                      cx="30"
                      cy="30"
                      r="3"
                      fill={theme.colors.accent.cyan.DEFAULT}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.8))',
                      }}
                    />
                    {/* Scanning line */}
                    <motion.line
                      x1="30"
                      y1="30"
                      x2="30"
                      y2="10"
                      stroke={theme.colors.accent.cyan.DEFAULT}
                      strokeWidth="1"
                      style={{
                        transformOrigin: '30px 30px',
                        filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.8))',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  </svg>
                </motion.div>

                {/* Title Text */}
                <div style={{ textAlign: 'left' }}>
                  <h1
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.accent.cyan.DEFAULT,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: '2px',
                      textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
                    }}
                  >
                    SISTEMA DETECTADO.
                  </h1>
                  <h2
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '12px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    INICIANDO CALIBRAGEM.
                  </h2>
                </div>
              </div>

              {/* Content Card */}
              <Card variant="default">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p
                    style={{
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Seu lugar na Imersão está garantido. Agora, precisamos ativar a sua principal ferramenta de trabalho.
                  </p>

                  <p
                    style={{
                      fontSize: '13px',
                      color: theme.colors.text.secondary,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Você terá acesso ao <strong style={{ color: theme.colors.accent.cyan.DEFAULT }}>App Cockpit</strong>, um sistema de inteligência que vai te acompanhar em tempo real ao longo de toda a imersão. Ele será o seu "painel de controle", cruzando o conteúdo da aula com a realidade do seu negócio.
                  </p>

                  <p
                    style={{
                      fontSize: '13px',
                      color: theme.colors.text.secondary,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Para que o <strong style={{ color: theme.colors.accent.purple.light }}>Radar de Performance</strong> e a <strong style={{ color: theme.colors.accent.purple.light }}>Inteligência Artificial</strong> do sistema funcionem e gerem insights precisos para você, é necessário calibrar o sistema com seus inputs iniciais.
                  </p>

                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '10px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12px',
                        color: theme.colors.gold.light,
                        lineHeight: 1.5,
                        margin: 0,
                        fontWeight: theme.typography.fontWeight.medium,
                      }}
                    >
                      Preencha os dados abaixo para gerar seu <strong>Perfil Base</strong> e liberar imediatamente o seu acesso ao sistema.
                    </p>
                  </div>

                  <p
                    style={{
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                      lineHeight: 1.5,
                      margin: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    Responda com precisão absoluta. Se você inserir dados imprecisos, o algoritmo lhe entregará um diagnóstico falho. Se você for preciso, você terá um assistente de vendas que você nunca teve antes.
                  </p>
                </div>
              </Card>

              {/* Verification Box - Changes based on status */}
              <AnimatePresence mode="wait">
                {verificationStatus === 'checking' && (
                  <motion.div
                    key="checking"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card variant="purple">
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '8px 0',
                        }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 size={32} color={theme.colors.accent.purple.light} />
                        </motion.div>
                        <div style={{ textAlign: 'center' }}>
                          <p
                            style={{
                              fontFamily: theme.typography.fontFamily.orbitron,
                              fontSize: '12px',
                              color: theme.colors.accent.purple.light,
                              marginBottom: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                            }}
                          >
                            VERIFICANDO COMPRA...
                          </p>
                          <p
                            style={{
                              fontSize: '11px',
                              color: theme.colors.text.muted,
                            }}
                          >
                            Aguarde enquanto localizamos seus dados
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {verificationStatus === 'found' && (
                  <motion.div
                    key="found"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card variant="cyan">
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '8px 0',
                        }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                          <CheckCircle size={40} color={theme.colors.accent.cyan.DEFAULT} />
                        </motion.div>
                        <div style={{ textAlign: 'center' }}>
                          <p
                            style={{
                              fontFamily: theme.typography.fontFamily.orbitron,
                              fontSize: '14px',
                              color: theme.colors.accent.cyan.DEFAULT,
                              marginBottom: '4px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                            }}
                          >
                            COMPRA IDENTIFICADA!
                          </p>
                          <p
                            style={{
                              fontSize: '11px',
                              color: theme.colors.text.secondary,
                            }}
                          >
                            Seu acesso foi confirmado. Clique abaixo para iniciar a calibragem.
                          </p>
                        </div>
                        <Button onClick={() => setStep('survey')}>
                          INICIAR CALIBRAGEM
                          <ChevronRight size={18} />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {verificationStatus === 'not_found' && (
                  <motion.div
                    key="not_found"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card variant="default">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p
                          style={{
                            fontSize: '13px',
                            color: theme.colors.text.secondary,
                            textAlign: 'center',
                            margin: 0,
                          }}
                        >
                          Informe o e-mail usado na compra para identificar seu acesso:
                        </p>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoFocus
                        />
                        {emailError && (
                          <p
                            style={{
                              fontSize: '12px',
                              color: theme.colors.status.danger,
                              textAlign: 'center',
                              margin: 0,
                            }}
                          >
                            {emailError}
                          </p>
                        )}
                        <Button onClick={handleEmailSubmit}>
                          VERIFICAR E-MAIL
                          <ChevronRight size={18} />
                        </Button>
                        <button
                          onClick={handleManualProceed}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: theme.colors.text.muted,
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '8px',
                            textDecoration: 'underline',
                          }}
                        >
                          Continuar sem verificação
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* SURVEY STATE */}
          {step === 'survey' && currentQ && (
            <motion.div
              key={`survey-${currentQuestion}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '600px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              {/* Progress */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '10px',
                      color: theme.colors.accent.purple.light,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    CALIBRAGEM DO SISTEMA
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: theme.colors.text.muted,
                    }}
                  >
                    {currentQuestion + 1} / {visibleQuestions.length}
                  </span>
                </div>
                <div
                  style={{
                    height: '4px',
                    background: 'rgba(124, 58, 237, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentQuestion + 1) / visibleQuestions.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: '100%',
                      background: theme.gradients.button,
                      borderRadius: '2px',
                    }}
                  />
                </div>
              </div>

              {/* Survey Intro (first question only) */}
              {currentQuestion === 0 && (
                <div
                  style={{
                    marginBottom: '20px',
                    padding: '14px 16px',
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    borderRadius: '10px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.accent.purple.light,
                      marginBottom: '6px',
                    }}
                  >
                    {SURVEY_INTRO.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {SURVEY_INTRO.subtitle}
                  </p>
                </div>
              )}

              {/* Question */}
              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    marginBottom: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  {currentQ.question}
                </h2>

                {/* Orientation */}
                <p
                  style={{
                    fontSize: '13px',
                    color: theme.colors.text.muted,
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    fontStyle: 'italic',
                  }}
                >
                  {currentQ.orientation}
                </p>

                {currentQ.type === 'select' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentQ.options?.map((option) => {
                      const isSelected = surveyData[currentQ.id as keyof SurveyData] === option
                      return (
                        <motion.button
                          key={option}
                          onClick={() => handleSurveyAnswer(currentQ.id, option)}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            padding: '16px',
                            background: isSelected
                              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)'
                              : 'rgba(15, 17, 21, 0.6)',
                            border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.5)' : 'rgba(100, 120, 150, 0.2)'}`,
                            borderRadius: '12px',
                            textAlign: 'left',
                            color: isSelected ? theme.colors.text.primary : theme.colors.text.secondary,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {option}
                        </motion.button>
                      )
                    })}
                  </div>
                )}

                {currentQ.type === 'textarea' && (
                  <textarea
                    value={surveyData[currentQ.id as keyof SurveyData]}
                    onChange={(e) => handleSurveyAnswer(currentQ.id, e.target.value)}
                    placeholder={currentQ.placeholder}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '16px',
                      background: theme.colors.background.glass,
                      border: '1px solid rgba(100, 120, 150, 0.3)',
                      borderRadius: '12px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      fontFamily: theme.typography.fontFamily.body,
                      resize: 'vertical',
                    }}
                  />
                )}
              </div>

              {/* Navigation */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                {currentQuestion > 0 && (
                  <motion.button
                    onClick={prevQuestion}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '14px 20px',
                      background: 'rgba(15, 17, 21, 0.6)',
                      border: '1px solid rgba(100, 120, 150, 0.3)',
                      borderRadius: '12px',
                      color: theme.colors.text.secondary,
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ChevronLeft size={18} />
                    Voltar
                  </motion.button>
                )}
                <div style={{ flex: 1 }}>
                  <Button
                    onClick={nextQuestion}
                    disabled={currentQ.required && !surveyData[currentQ.id as keyof SurveyData]}
                  >
                    {isLastQuestion ? 'FINALIZAR PESQUISA' : 'PRÓXIMA'}
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* WHATSAPP CTA STATE */}
          {step === 'whatsapp' && (
            <motion.div
              key="whatsapp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                maxWidth: '600px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              {/* Step Progress Indicator */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '10px',
                      color: theme.colors.accent.cyan.DEFAULT,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    PASSO 1 DE 2
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                    }}
                  >
                    Grupo de Avisos
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      background: theme.colors.accent.cyan.DEFAULT,
                      borderRadius: '2px',
                      boxShadow: '0 0 8px rgba(34, 211, 238, 0.5)',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      background: 'rgba(124, 58, 237, 0.3)',
                      borderRadius: '2px',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                  }}
                >
                  <span style={{ fontSize: '9px', color: theme.colors.accent.cyan.DEFAULT }}>
                    WhatsApp
                  </span>
                  <span style={{ fontSize: '9px', color: theme.colors.text.muted }}>
                    Criar Senha
                  </span>
                </div>
              </div>

              {/* Success Header */}
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
                    border: '2px solid rgba(34, 211, 238, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)',
                  }}
                >
                  <CheckCircle size={40} color={theme.colors.accent.cyan.DEFAULT} />
                </motion.div>
                <h2
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '18px',
                    color: theme.colors.accent.cyan.DEFAULT,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '8px',
                  }}
                >
                  Pesquisa Completa!
                </h2>
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    lineHeight: 1.5,
                  }}
                >
                  Suas respostas foram registradas.
                </p>
              </div>

              {/* WhatsApp Card */}
              <Card variant="gold">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MessageCircle size={28} color="#FFF" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.gold.light,
                        marginBottom: '4px',
                      }}
                    >
                      Grupo de Avisos
                    </h3>
                    <p
                      style={{
                        fontSize: '12px',
                        color: theme.colors.text.secondary,
                        lineHeight: 1.5,
                      }}
                    >
                      Este é o grupo silencioso onde serão enviados os materiais e avisos importantes para você não perder nenhuma informação.
                    </p>
                  </div>
                </div>
                <motion.a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '16px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontWeight: theme.typography.fontWeight.bold,
                    fontSize: '14px',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <MessageCircle size={18} />
                  ENTRAR NO GRUPO
                </motion.a>
              </Card>

              <Button onClick={() => setStep('password')}>
                PRÓXIMO PASSO
                <ChevronRight size={18} />
              </Button>
            </motion.div>
          )}

          {/* PASSWORD STATE */}
          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                maxWidth: '600px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              {/* Step Progress Indicator */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '10px',
                      color: theme.colors.accent.purple.light,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    PASSO 2 DE 2
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                    }}
                  >
                    Criar Senha
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      background: theme.colors.accent.cyan.DEFAULT,
                      borderRadius: '2px',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: '4px',
                      background: theme.colors.accent.purple.light,
                      borderRadius: '2px',
                      boxShadow: '0 0 8px rgba(168, 85, 247, 0.5)',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '6px',
                  }}
                >
                  <span style={{ fontSize: '9px', color: theme.colors.accent.cyan.DEFAULT }}>
                    WhatsApp ✓
                  </span>
                  <span style={{ fontSize: '9px', color: theme.colors.accent.purple.light }}>
                    Criar Senha
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                    border: '2px solid rgba(168, 85, 247, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Lock size={28} color={theme.colors.accent.purple.light} />
                </div>
                <h2
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '16px',
                    color: theme.colors.text.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '8px',
                  }}
                >
                  Crie sua senha
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    lineHeight: 1.5,
                  }}
                >
                  Essa senha será usada para acessar seu cockpit durante e após o evento.
                </p>
              </div>

              <Card variant="default">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Password Input */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: theme.colors.text.muted,
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Senha
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: theme.colors.text.muted,
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {/* Strength Indicator */}
                    {password && (
                      <div style={{ marginTop: '8px' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            marginBottom: '4px',
                          }}
                        >
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: '4px',
                                borderRadius: '2px',
                                background:
                                  i <= passwordStrength.score
                                    ? strengthColors[passwordStrength.level]
                                    : 'rgba(100, 120, 150, 0.2)',
                              }}
                            />
                          ))}
                        </div>
                        <p
                          style={{
                            fontSize: '11px',
                            color: strengthColors[passwordStrength.level],
                          }}
                        >
                          Força: {strengthLabels[passwordStrength.level]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        color: theme.colors.text.muted,
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Confirmar Senha
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Digite novamente"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: theme.colors.text.muted,
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p
                        style={{
                          fontSize: '11px',
                          color: theme.colors.status.danger,
                          marginTop: '6px',
                        }}
                      >
                        As senhas não coincidem
                      </p>
                    )}
                  </div>

                  {passwordError && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: theme.colors.status.danger,
                        textAlign: 'center',
                      }}
                    >
                      {passwordError}
                    </p>
                  )}
                </div>
              </Card>

              <div
                style={{
                  fontSize: '11px',
                  color: theme.colors.text.muted,
                  textAlign: 'center',
                }}
              >
                <p>Requisitos: 8+ caracteres, 1 maiúscula, 1 número</p>
              </div>

              <Button onClick={handlePasswordSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    CRIANDO ACESSO...
                  </>
                ) : (
                  <>
                    CRIAR MINHA CONTA
                    <ChevronRight size={18} />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '20px',
                maxWidth: '600px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  border: '2px solid rgba(34, 211, 238, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 50px rgba(34, 211, 238, 0.4)',
                }}
              >
                <CheckCircle size={50} color={theme.colors.accent.cyan.DEFAULT} />
              </motion.div>
              <div>
                <h2
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '20px',
                    color: theme.colors.accent.cyan.DEFAULT,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '8px',
                  }}
                >
                  Tudo Pronto!
                </h2>
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                  }}
                >
                  Redirecionando para o cockpit...
                </p>
              </div>
              <Loader2
                size={24}
                color={theme.colors.accent.purple.light}
                style={{ animation: 'spin 1s linear infinite' }}
              />
            </motion.div>
          )}

          {/* ERROR STATE */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '24px',
                maxWidth: '600px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
                    border: '2px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}
                >
                  <AlertCircle size={40} color={theme.colors.gold.DEFAULT} />
                </div>
                <h2
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '16px',
                    color: theme.colors.gold.DEFAULT,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '12px',
                  }}
                >
                  Quase lá!
                </h2>
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    lineHeight: 1.6,
                  }}
                >
                  Suas respostas foram salvas, mas não conseguimos localizar sua compra automaticamente.
                </p>
              </div>

              <Card variant="gold">
                <div style={{ textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: '13px',
                      color: theme.colors.text.secondary,
                      marginBottom: '16px',
                      lineHeight: 1.5,
                    }}
                  >
                    Envie uma mensagem para nosso suporte com seu <strong>e-mail de compra</strong> e
                    liberaremos seu acesso manualmente.
                  </p>
                  <motion.a
                    href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}?text=Olá! Comprei a Imersão Diagnóstico de Vendas mas não consegui criar meu acesso automático. Meu email: ${email || '[seu email]'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      borderRadius: '12px',
                      color: '#FFF',
                      fontWeight: theme.typography.fontWeight.bold,
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    <MessageCircle size={18} />
                    FALAR COM SUPORTE
                  </motion.a>
                  <p
                    style={{
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                      marginTop: '12px',
                    }}
                  >
                    WhatsApp: {SUPPORT_WHATSAPP}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spin animation keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PageWrapper>
  )
}
