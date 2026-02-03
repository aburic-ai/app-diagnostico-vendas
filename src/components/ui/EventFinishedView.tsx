import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { PageWrapper } from './PageWrapper'
import { theme } from '../../styles/theme'

export function EventFinishedView() {
  const navigate = useNavigate()

  // Auto-redirect após 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/pos-evento')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <PageWrapper
      backgroundColor={theme.colors.background.dark}
      showAnimatedBackground={true}
      showOverlay={false}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        {/* Check icon com animação */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          style={{ marginBottom: '32px' }}
        >
          <CheckCircle2
            size={96}
            color="#10B981"
            strokeWidth={2}
          />
        </motion.div>

        {/* Título */}
        <h1 style={{
          fontFamily: theme.typography.fontFamily.orbitron,
          fontSize: '36px',
          fontWeight: theme.typography.fontWeight.bold,
          color: '#fff',
          marginBottom: '16px',
          letterSpacing: '0.05em',
        }}>
          EVENTO FINALIZADO
        </h1>

        {/* Subtítulo */}
        <p style={{
          fontSize: '18px',
          color: theme.colors.text.secondary,
          maxWidth: '600px',
          marginBottom: '40px',
          lineHeight: '1.6',
        }}>
          A imersão ao vivo foi concluída com sucesso!
          Agora é hora de colocar em prática tudo o que você aprendeu.
        </p>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '40px'
        }}>
          {[1, 2, 3].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: theme.colors.accent.cyan.DEFAULT,
              }}
            />
          ))}
        </div>

        {/* Mensagem de redirecionamento */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 24px',
            background: 'rgba(34, 211, 238, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '12px',
            color: theme.colors.accent.cyan.DEFAULT,
            fontSize: '14px',
            fontWeight: theme.typography.fontWeight.semibold,
          }}
        >
          <span>Redirecionando para Pós-Evento</span>
          <ArrowRight size={18} />
        </motion.div>

        {/* Botão manual (caso não queira esperar) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/pos-evento')}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          Ir agora →
        </motion.button>
      </motion.div>
    </PageWrapper>
  )
}
