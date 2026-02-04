/**
 * EventCountdown - Countdown até o início do evento
 * Substitui a tela "OFFLINE" com um timer visual
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Radio, Zap, Star } from 'lucide-react'
import { theme } from '../../styles/theme'

// Confetti component
function Confetti() {
  const confettiCount = 50
  const confettiColors = ['#22D3EE', '#A855F7', '#F59E0B', '#EF4444', '#10B981']

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      {Array.from({ length: confettiCount }).map((_, i) => {
        const randomX = Math.random() * 100
        const randomDelay = Math.random() * 2
        const randomDuration = 3 + Math.random() * 2
        const randomRotation = Math.random() * 360
        const randomColor = confettiColors[Math.floor(Math.random() * confettiColors.length)]

        return (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${randomX}vw`, rotate: 0, opacity: 1 }}
            animate={{
              y: '110vh',
              rotate: randomRotation + 720,
              opacity: 0,
            }}
            transition={{
              duration: randomDuration,
              delay: randomDelay,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              backgroundColor: randomColor,
              borderRadius: '2px',
            }}
          />
        )
      })}
    </div>
  )
}

interface EventCountdownProps {
  targetDate: Date | string
  eventTitle?: string
  day?: number
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function EventCountdown({
  targetDate,
  eventTitle = 'IMERSÃO DIAGNÓSTICO DE VENDAS',
  day: _day = 1,
}: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft())

  function calculateTimeLeft(): TimeLeft {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    const now = new Date()
    const difference = target.getTime() - now.getTime()

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  const formatDate = () => {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    return target.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = () => {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
    return target.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '40px 20px 120px 20px',
        background: 'linear-gradient(180deg, rgba(10, 12, 18, 0) 0%, rgba(15, 17, 21, 0.6) 100%)',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            background: 'rgba(100, 116, 139, 0.15)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: '12px',
            marginBottom: '24px',
          }}
        >
          <Radio size={20} color={theme.colors.text.secondary} />
          <span
            style={{
              fontSize: '12px',
              color: theme.colors.text.secondary,
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            TRANSMISSÃO NÃO INICIADA
          </span>
        </motion.div>

        <h1
          style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: '20px',
            fontWeight: 'bold',
            color: theme.colors.text.primary,
            margin: 0,
            letterSpacing: '0.05em',
          }}
        >
          {eventTitle}
        </h1>
      </div>

      {/* Countdown Timer ou Mensagem de Evento Iniciando */}
      {timeLeft.total === 0 ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: 'center',
            marginBottom: '40px',
            maxWidth: '500px',
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Confetes animados */}
          <Confetti />

          <div
            style={{
              padding: '40px 20px',
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
              border: '2px solid rgba(34, 211, 238, 0.5)',
              borderRadius: '20px',
              boxShadow: '0 0 30px rgba(34, 211, 238, 0.3)',
              position: 'relative',
              zIndex: 20,
            }}
          >
            <motion.h2
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '28px',
                fontWeight: 'bold',
                color: theme.colors.accent.cyan.DEFAULT,
                marginBottom: '16px',
                letterSpacing: '0.1em',
                textShadow: `0 0 20px ${theme.colors.accent.cyan.DEFAULT}`,
              }}
            >
              🔴 EVENTO NO AR
            </motion.h2>
            <p
              style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              Clique na aba <strong style={{ color: theme.colors.accent.purple.light }}>AO VIVO</strong> abaixo
            </p>
          </div>
        </motion.div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '40px',
            maxWidth: '500px',
            width: '100%',
          }}
        >
          {[
            { value: timeLeft.days, label: 'Dias' },
            { value: timeLeft.hours, label: 'Horas' },
            { value: timeLeft.minutes, label: 'Min' },
            { value: timeLeft.seconds, label: 'Seg' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              style={{
                background: 'rgba(15, 17, 21, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '16px',
                padding: '20px 12px',
                textAlign: 'center',
              }}
            >
              <motion.div
                key={item.value}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: theme.colors.accent.purple.light,
                  marginBottom: '8px',
                  textShadow: `0 0 20px ${theme.colors.accent.purple.DEFAULT}40`,
                }}
              >
                {formatNumber(item.value)}
              </motion.div>
              <div
                style={{
                  fontSize: '10px',
                  color: theme.colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Event Info - Simplificado */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
          maxWidth: '400px',
          marginBottom: '24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
          }}
        >
          <Calendar size={16} color={theme.colors.accent.cyan.DEFAULT} />
          <span
            style={{
              fontSize: '13px',
              color: theme.colors.text.secondary,
            }}
          >
            {formatDate()}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
          }}
        >
          <Clock size={16} color={theme.colors.accent.cyan.DEFAULT} />
          <span
            style={{
              fontSize: '13px',
              color: theme.colors.text.secondary,
            }}
          >
            {formatTime()} (horário de Brasília)
          </span>
        </motion.div>
      </div>

      {/* Avisos importantes */}
      <div
        style={{
          marginTop: '48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '600px',
          width: '100%',
        }}
      >
        {/* Aviso 1: Manter página aberta */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            textAlign: 'left',
          }}
        >
          <Zap size={16} color="#22D3EE" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p
            style={{
              fontSize: '12px',
              color: '#E2E8F0',
              lineHeight: '1.5',
              margin: 0,
            }}
          >
            <strong style={{ color: '#22D3EE' }}>No dia do evento, acesse esta página!</strong>
            <br />
            Aqui você terá todos os recursos ao vivo: diagnóstico em tempo real, chat com IA, check-ins de módulos e muito mais.
          </p>
        </motion.div>

        {/* Aviso 2: Gravação */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            textAlign: 'left',
          }}
        >
          <Star size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p
            style={{
              fontSize: '12px',
              color: '#E2E8F0',
              lineHeight: '1.5',
              margin: 0,
            }}
          >
            <strong style={{ color: '#F59E0B' }}>Evento 100% online e ao vivo.</strong>
            <br />
            A gravação não está inclusa. Se desejar, ela pode ser adquirida na página de preparação até o início do evento. Depois não estará mais disponível.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
