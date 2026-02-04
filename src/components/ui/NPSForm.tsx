/**
 * NPSForm - Pesquisa de Satisfação
 *
 * Escala de 0-10 (NPS internamente, mas sem jargão para o participante)
 * Duas variantes: Dia 1 e Evento Final
 * Concede XP ao participante ao preencher
 * Renderiza via Portal no body para evitar problemas com transform de pais
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircleHeart, Zap, Send, Check } from 'lucide-react'
import { theme } from '../../styles/theme'
import { XP_CONFIG } from '../../config/xp-system'

type NPSType = 'day1' | 'final'

interface NPSFormProps {
  type: NPSType
  isOpen: boolean
  onClose: () => void
  onSubmit: (score: number, feedback: string, type: NPSType) => void
  xpReward?: number
  mandatory?: boolean
}

const npsConfig: Record<NPSType, { title: string; question: string; contextHint: string; xp: number }> = {
  day1: {
    title: 'O QUANTO ESSE PRIMEIRO DIA VALEU A PENA?',
    question: 'Em uma escala de 0 a 10, o quanto esse primeiro dia foi valioso a ponto de você recomendá-lo a um colega ou amigo?',
    contextHint: 'A nota 9 ou 10 indica que a experiência foi excelente e recomendável. Use a escala que melhor representa o que você sentiu.',
    xp: XP_CONFIG.EVENT.NPS_DAY1,
  },
  final: {
    title: 'O QUANTO A IMERSÃO VALEU A PENA?',
    question: 'Em uma escala de 0 a 10, o quanto a Imersão Diagnóstico de Vendas foi valiosa a ponto de você recomendá-la a um colega ou amigo?',
    contextHint: 'A nota 9 ou 10 indica que a experiência foi excelente e recomendável. Use a escala que melhor representa o que você sentiu.',
    xp: XP_CONFIG.EVENT.NPS_FINAL,
  },
}

const getScoreFeedback = (score: number): { message: string; emoji: string } => {
  if (score <= 3) return { message: 'Lamentamos que sua experiência não tenha sido boa', emoji: '😔' }
  if (score <= 5) return { message: 'Obrigado pelo feedback honesto', emoji: '🤔' }
  if (score <= 6) return { message: 'Valorizamos sua sinceridade', emoji: '🙂' }
  if (score <= 8) return { message: 'Bom saber que está gostando!', emoji: '😊' }
  return { message: 'Incrível! Ficamos felizes que está amando!', emoji: '🤩' }
}

const getFeedbackPlaceholder = (score: number | null, type: NPSType): string => {
  if (score === null) return 'O ponto mais forte (ou mais fraco) foi...'
  if (score <= 6) return 'O ponto mais fraco foi...'
  if (score <= 8) return 'O ponto mais forte (ou mais fraco) foi...'
  return type === 'day1'
    ? 'O que mais te marcou nesse primeiro dia foi...'
    : 'O que mais te marcou na imersão foi...'
}

export function NPSForm({
  type,
  isOpen,
  onClose,
  onSubmit,
  xpReward,
  mandatory = true,
}: NPSFormProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)

  // Manter modal visível internamente mesmo se o parent mudar isOpen
  useEffect(() => {
    if (isOpen && !submitted) {
      setInternalOpen(true)
    }
  }, [isOpen, submitted])

  const config = npsConfig[type]
  const finalXP = xpReward ?? config.xp

  const handleSubmit = () => {
    if (selectedScore === null) return
    onSubmit(selectedScore, feedback, type)
    setSubmitted(true)
    // Manter a mensagem de sucesso visível por pelo menos 2.5s
    setTimeout(() => {
      setInternalOpen(false)
      onClose()
      setTimeout(() => {
        setSelectedScore(null)
        setFeedback('')
        setSubmitted(false)
      }, 300)
    }, 2500)
  }

  const getScoreColor = (score: number) => {
    if (score <= 6) return '#EF4444'
    if (score <= 8) return '#F59E0B'
    return '#22C55E'
  }

  const NPS_Z_INDEX = 9999

  return createPortal(
    <AnimatePresence>
      {internalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: NPS_Z_INDEX,
            background: 'linear-gradient(180deg, rgba(5, 8, 15, 0.99) 0%, rgba(10, 12, 18, 1) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Scrollable content wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.1 }}
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '32px 24px',
              margin: 'auto',
            }}
          >
            {!submitted ? (
              <>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 18px',
                      boxShadow: '0 0 40px rgba(168, 85, 247, 0.2)',
                    }}
                  >
                    <MessageCircleHeart size={32} color={theme.colors.accent.purple.light} />
                  </div>
                  <h3
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '18px',
                      fontWeight: theme.typography.fontWeight.bold,
                      color: theme.colors.text.primary,
                      letterSpacing: '0.08em',
                      margin: '0 0 8px 0',
                    }}
                  >
                    {config.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Zap size={16} color={theme.colors.gold.DEFAULT} />
                    <span style={{ fontSize: '13px', color: theme.colors.gold.DEFAULT, fontWeight: 'bold' }}>
                      +{finalXP} XP por contribuir com a melhoria da experiência
                    </span>
                  </div>
                </div>

                {/* Question */}
                <p
                  style={{
                    fontSize: '16px',
                    color: theme.colors.text.primary,
                    lineHeight: 1.6,
                    marginBottom: '28px',
                    textAlign: 'center',
                  }}
                >
                  {config.question}
                </p>

                {/* Context hint */}
                <p
                  style={{
                    fontSize: '13px',
                    color: theme.colors.text.muted,
                    lineHeight: 1.5,
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {config.contextHint}
                </p>

                {/* Score Selection */}
                <div style={{ marginBottom: '24px' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(11, 1fr)',
                      gap: '6px',
                    }}
                  >
                    {Array.from({ length: 11 }).map((_, i) => {
                      const isSelected = selectedScore === i
                      const scoreColor = getScoreColor(i)
                      const hintOpacity = i <= 6 ? 0.06 : i <= 8 ? 0.06 : 0.08
                      const hintColor = getScoreColor(i)
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedScore(i)}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '10px',
                            background: isSelected
                              ? scoreColor
                              : `${hintColor}${Math.round(hintOpacity * 255).toString(16).padStart(2, '0')}`,
                            border: `2px solid ${isSelected ? scoreColor : 'rgba(100, 116, 139, 0.25)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: theme.typography.fontFamily.orbitron,
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: isSelected ? '#fff' : theme.colors.text.secondary,
                            boxShadow: isSelected ? `0 0 20px ${scoreColor}60` : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {i}
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Scale labels */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '10px',
                      fontSize: '11px',
                      color: theme.colors.text.muted,
                    }}
                  >
                    <span>Nenhuma chance</span>
                    <span>Com certeza!</span>
                  </div>

                  {/* Score feedback contextual */}
                  {selectedScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: '14px',
                        padding: '12px 16px',
                        background: `${getScoreColor(selectedScore)}12`,
                        border: `1px solid ${getScoreColor(selectedScore)}30`,
                        borderRadius: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '14px', color: getScoreColor(selectedScore) }}>
                        {getScoreFeedback(selectedScore).emoji} {getScoreFeedback(selectedScore).message}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Feedback */}
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      color: theme.colors.text.secondary,
                      marginBottom: '10px',
                      fontWeight: 500,
                    }}
                  >
                    O que mais influenciou essa nota?
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={getFeedbackPlaceholder(selectedScore, type)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(100, 116, 139, 0.1)',
                      border: '1px solid rgba(100, 116, 139, 0.25)',
                      borderRadius: '12px',
                      color: theme.colors.text.primary,
                      fontSize: '15px',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(168, 85, 247, 0.4)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(100, 116, 139, 0.25)'
                    }}
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={selectedScore !== null ? { scale: 1.02 } : {}}
                  whileTap={selectedScore !== null ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={selectedScore === null}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    background: selectedScore !== null
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)'
                      : 'rgba(100, 116, 139, 0.2)',
                    border: `1px solid ${selectedScore !== null ? 'rgba(168, 85, 247, 0.5)' : 'rgba(100, 116, 139, 0.2)'}`,
                    borderRadius: '14px',
                    cursor: selectedScore !== null ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: selectedScore !== null ? '#fff' : theme.colors.text.muted,
                    fontWeight: 'bold',
                    fontSize: '16px',
                    boxShadow: selectedScore !== null ? '0 4px 24px rgba(168, 85, 247, 0.3)' : 'none',
                  }}
                >
                  <Send size={20} />
                  CONCLUIR AVALIAÇÃO
                </motion.button>
              </>
            ) : (
              /* Success State */
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 0',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '2px solid #22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    boxShadow: '0 0 40px rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <Check size={40} color="#22C55E" />
                </motion.div>
                <h3
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#22C55E',
                    marginBottom: '10px',
                  }}
                >
                  OBRIGADO!
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: theme.colors.text.secondary,
                    textAlign: 'center',
                    marginBottom: '20px',
                  }}
                >
                  Sua avaliação foi registrada com sucesso
                </p>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '12px',
                  }}
                >
                  <Zap size={20} color={theme.colors.gold.DEFAULT} />
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: theme.colors.gold.DEFAULT,
                    }}
                  >
                    +{finalXP} XP
                  </span>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
