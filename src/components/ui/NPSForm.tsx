/**
 * NPSForm - Formulário de NPS clássico
 *
 * Escala de 0-10 com pergunta padrão de NPS
 * Duas variantes: NPS Dia 1 e NPS Evento Final
 * Concede XP ao participante ao preencher
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Zap, Send, Check } from 'lucide-react'
import { theme } from '../../styles/theme'

type NPSType = 'day1' | 'final'

interface NPSFormProps {
  /** Tipo do NPS */
  type: NPSType
  /** Se está aberto */
  isOpen: boolean
  /** Callback ao fechar */
  onClose: () => void
  /** Callback ao enviar */
  onSubmit: (score: number, feedback: string, type: NPSType) => void
  /** XP concedido */
  xpReward?: number
  /** Se é obrigatório (não pode fechar sem responder) */
  mandatory?: boolean
}

const npsConfig: Record<NPSType, { title: string; question: string; xp: number }> = {
  day1: {
    title: 'NPS - DIA 1',
    question: 'De 0 a 10, o quanto você recomendaria o primeiro dia da Imersão para um amigo?',
    xp: 25,
  },
  final: {
    title: 'NPS - EVENTO COMPLETO',
    question: 'De 0 a 10, o quanto você recomendaria a Imersão Diagnóstico de Vendas para um amigo?',
    xp: 50,
  },
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

  const config = npsConfig[type]
  const finalXP = xpReward ?? config.xp

  const handleSubmit = () => {
    if (selectedScore === null) return
    onSubmit(selectedScore, feedback, type)
    setSubmitted(true)
    setTimeout(() => {
      onClose()
      // Reset state after close
      setTimeout(() => {
        setSelectedScore(null)
        setFeedback('')
        setSubmitted(false)
      }, 300)
    }, 2000)
  }

  const getScoreColor = (score: number) => {
    if (score <= 6) return '#EF4444' // Detractor - Red
    if (score <= 8) return '#F59E0B' // Passive - Yellow
    return '#22C55E' // Promoter - Green
  }

  const getScoreLabel = (score: number) => {
    if (score <= 6) return 'Detrator'
    if (score <= 8) return 'Neutro'
    return 'Promotor'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={mandatory ? undefined : onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: theme.zIndex.modal - 1,
              backdropFilter: 'blur(12px)',
              cursor: mandatory ? 'default' : 'pointer',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100% - 32px)',
              maxWidth: '380px',
              background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.98) 0%, rgba(10, 12, 18, 0.99) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              zIndex: theme.zIndex.modal,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            {!submitted ? (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                      <Star size={20} color={theme.colors.accent.purple.light} />
                    </div>
                    <div>
                      <h3
                        style={{
                          fontFamily: theme.typography.fontFamily.orbitron,
                          fontSize: '14px',
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.accent.purple.light,
                          letterSpacing: '0.05em',
                          margin: 0,
                        }}
                      >
                        {config.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Zap size={12} color={theme.colors.gold.DEFAULT} />
                        <span style={{ fontSize: '10px', color: theme.colors.gold.DEFAULT, fontWeight: 'bold' }}>
                          +{finalXP} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  {!mandatory && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onClose}
                      style={{
                        background: 'rgba(100, 116, 139, 0.2)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={18} color={theme.colors.text.muted} />
                    </motion.button>
                  )}
                </div>

                {/* Question */}
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.colors.text.primary,
                    lineHeight: 1.5,
                    marginBottom: '20px',
                  }}
                >
                  {config.question}
                </p>

                {/* Score Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(11, 1fr)',
                      gap: '4px',
                    }}
                  >
                    {Array.from({ length: 11 }).map((_, i) => {
                      const isSelected = selectedScore === i
                      const scoreColor = getScoreColor(i)
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedScore(i)}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            background: isSelected ? scoreColor : 'rgba(100, 116, 139, 0.15)',
                            border: `2px solid ${isSelected ? scoreColor : 'rgba(100, 116, 139, 0.2)'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: theme.typography.fontFamily.orbitron,
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: isSelected ? '#fff' : theme.colors.text.secondary,
                            boxShadow: isSelected ? `0 0 15px ${scoreColor}50` : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {i}
                        </motion.button>
                      )
                    })}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      fontSize: '9px',
                      color: theme.colors.text.muted,
                    }}
                  >
                    <span>Nada provável</span>
                    <span>Muito provável</span>
                  </div>
                  {selectedScore !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: `${getScoreColor(selectedScore)}15`,
                        border: `1px solid ${getScoreColor(selectedScore)}40`,
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '11px', color: getScoreColor(selectedScore), fontWeight: 'bold' }}>
                        {getScoreLabel(selectedScore)} ({selectedScore}/10)
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Feedback */}
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: theme.colors.text.secondary,
                      marginBottom: '8px',
                    }}
                  >
                    O que motivou sua nota? (opcional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Conte-nos mais sobre sua experiência..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(100, 116, 139, 0.1)',
                      border: '1px solid rgba(100, 116, 139, 0.2)',
                      borderRadius: '10px',
                      color: theme.colors.text.primary,
                      fontSize: '13px',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
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
                    padding: '14px 20px',
                    background: selectedScore !== null
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)'
                      : 'rgba(100, 116, 139, 0.2)',
                    border: `1px solid ${selectedScore !== null ? 'rgba(168, 85, 247, 0.5)' : 'rgba(100, 116, 139, 0.2)'}`,
                    borderRadius: '12px',
                    cursor: selectedScore !== null ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: selectedScore !== null ? '#fff' : theme.colors.text.muted,
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                >
                  <Send size={18} />
                  ENVIAR AVALIAÇÃO
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
                  padding: '20px 0',
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '2px solid #22C55E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <Check size={30} color="#22C55E" />
                </motion.div>
                <h3
                  style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#22C55E',
                    marginBottom: '8px',
                  }}
                >
                  OBRIGADO!
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    textAlign: 'center',
                    marginBottom: '16px',
                  }}
                >
                  Sua avaliação foi registrada
                </p>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '10px',
                  }}
                >
                  <Zap size={18} color={theme.colors.gold.DEFAULT} />
                  <span
                    style={{
                      fontFamily: theme.typography.fontFamily.orbitron,
                      fontSize: '14px',
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
        </>
      )}
    </AnimatePresence>
  )
}
