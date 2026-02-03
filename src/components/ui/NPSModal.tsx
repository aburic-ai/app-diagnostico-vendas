/**
 * NPSModal - Modal bloqueante full-screen para avaliação NPS
 *
 * Características:
 * - Não pode ser fechado sem responder
 * - Cobre a tela inteira com overlay escuro
 * - Design minimalista e focado
 * - Escala 0-10 estilo NPS clássico
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Send } from 'lucide-react'
import { theme } from '../../styles/theme'
import { Button } from './Button'

export type NPSType = 'day1' | 'final'

interface NPSModalProps {
  isOpen: boolean
  type: NPSType
  onSubmit: (score: number, feedback?: string) => void
}

const NPS_CONFIG = {
  day1: {
    title: 'Como foi seu Dia 1?',
    subtitle: 'Em uma escala de 0 a 10, qual a probabilidade de você recomendar esta imersão para um amigo ou colega?',
    xp: 30,
    followUpPrompt: {
      promoter: 'Que ótimo! O que mais te impressionou até agora?',
      passive: 'O que podemos melhorar para te impressionar mais?',
      detractor: 'Sentimos muito. O que não atendeu suas expectativas?',
    },
  },
  final: {
    title: 'Avalie a Imersão Completa',
    subtitle: 'Em uma escala de 0 a 10, qual a probabilidade de você recomendar o Diagnóstico de Vendas para um amigo ou colega?',
    xp: 30,
    followUpPrompt: {
      promoter: 'Que ótimo! Qual foi o maior impacto que a imersão trouxe para você?',
      passive: 'O que faltou para ser uma experiência excepcional?',
      detractor: 'Sentimos muito. O que podemos melhorar na próxima edição?',
    },
  },
}

export function NPSModal({ isOpen, type, onSubmit }: NPSModalProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const config = NPS_CONFIG[type]

  const handleSubmit = async () => {
    if (selectedScore === null) return

    setIsSubmitting(true)
    await onSubmit(selectedScore, feedback.trim() || undefined)
    setIsSubmitting(false)
  }

  const getScoreColor = (score: number): string => {
    if (score <= 6) return '#EF4444' // Detrator (vermelho)
    if (score <= 8) return '#F59E0B' // Neutro (amarelo)
    return '#10B981' // Promotor (verde)
  }

  const getScoreLabel = (score: number): string => {
    if (score <= 6) return 'Detrator (0-6)'
    if (score <= 8) return 'Passivo (7-8)'
    return 'Promotor (9-10)'
  }

  const getScoreCategory = (score: number): 'promoter' | 'passive' | 'detractor' => {
    if (score >= 9) return 'promoter'
    if (score >= 7) return 'passive'
    return 'detractor'
  }

  const getFeedbackPrompt = (): string => {
    if (selectedScore === null) return 'Seu feedback (opcional)'
    const category = getScoreCategory(selectedScore)
    return config.followUpPrompt[category]
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            style={{
              width: '100%',
              maxWidth: '600px',
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 20px 60px rgba(168, 85, 247, 0.3)',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ display: 'inline-block', marginBottom: '16px' }}
              >
                <Star size={48} color="#A855F7" fill="#A855F7" />
              </motion.div>

              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: theme.colors.text.primary,
                  marginBottom: '8px',
                }}
              >
                {config.title}
              </h2>

              <p
                style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  marginBottom: '8px',
                }}
              >
                {config.subtitle}
              </p>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(34, 211, 238, 0.1)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: '#22D3EE',
                  fontWeight: 600,
                }}
              >
                <Star size={14} fill="#22D3EE" />
                +{config.xp} XP ao responder
              </div>
            </div>

            {/* NPS Scale 0-10 */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(11, 1fr)',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <motion.button
                    key={score}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedScore(score)}
                    style={{
                      padding: '12px 8px',
                      background:
                        selectedScore === score
                          ? getScoreColor(score)
                          : 'rgba(100, 116, 139, 0.15)',
                      border:
                        selectedScore === score
                          ? `2px solid ${getScoreColor(score)}`
                          : '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '10px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: selectedScore === score ? '#fff' : theme.colors.text.secondary,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {score}
                  </motion.button>
                ))}
              </div>

              {/* Labels */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: theme.colors.text.muted,
                  paddingTop: '8px',
                }}
              >
                <span>Nada provável</span>
                <span>Muito provável</span>
              </div>

              {/* Selected score feedback */}
              {selectedScore !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: '16px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: getScoreColor(selectedScore),
                  }}
                >
                  {getScoreLabel(selectedScore)}
                </motion.div>
              )}
            </div>

            {/* Feedback opcional - dinâmico baseado no score */}
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: theme.colors.text.secondary,
                  marginBottom: '8px',
                }}
              >
                {getFeedbackPrompt()}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  selectedScore !== null && selectedScore >= 9
                    ? 'Compartilhe sua experiência...'
                    : 'Seu feedback nos ajuda a melhorar...'
                }
                maxLength={500}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  background: 'rgba(100, 116, 139, 0.1)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: theme.colors.text.primary,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <div
                style={{
                  fontSize: '11px',
                  color: theme.colors.text.muted,
                  marginTop: '4px',
                  textAlign: 'right',
                }}
              >
                {feedback.length}/500
              </div>
            </div>

            {/* Submit Button */}
            <Button
              variant="primary"
              withBeam
              onClick={handleSubmit}
              disabled={selectedScore === null || isSubmitting}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                'Enviando...'
              ) : (
                <>
                  <Send size={18} />
                  Enviar Avaliação
                </>
              )}
            </Button>

            {/* Info footer */}
            <p
              style={{
                marginTop: '16px',
                fontSize: '11px',
                color: theme.colors.text.muted,
                textAlign: 'center',
              }}
            >
              Sua avaliação é anônima e nos ajuda a melhorar a experiência
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
