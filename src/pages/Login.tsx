/**
 * Página de Login - Cockpit Access
 *
 * Exemplo de página usando os componentes centralizados.
 * Todas as outras páginas devem seguir esta estrutura.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail } from 'lucide-react'

// Componentes centralizados
import { PageWrapper, Input, Button } from '../components/ui'
import { theme } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showMagicLinkOption, setShowMagicLinkOption] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      // Mensagens amigáveis para o usuário
      let friendlyMessage = 'Erro ao fazer login'

      if (signInError.message.includes('Email not confirmed')) {
        friendlyMessage = 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada.'
      } else if (signInError.message.includes('Invalid login credentials')) {
        friendlyMessage = 'Email ou senha incorretos'
      } else if (signInError.message.includes('Email')) {
        friendlyMessage = 'Email inválido'
      }

      setError(friendlyMessage)
      setShowMagicLinkOption(true) // Mostrar opção de magic link após erro
      setLoading(false)
    } else {
      // AuthContext vai redirecionar automaticamente via ProtectedRoute
      navigate('/pre-evento')
    }
  }

  const handleMagicLink = async () => {
    if (!email || !email.includes('@')) {
      setError('Digite um email válido primeiro')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/pre-evento`,
        },
      })

      if (error) throw error

      setMagicLinkSent(true)
      setError('')
    } catch (err: any) {
      setError('Erro ao enviar link. Tente novamente.')
      console.error('Magic link error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper
      backgroundImage="/01_login page_v1.jpg"
      showAnimatedBackground={true}
      showOverlay={true}
    >
      {/* Content Container - posicionado na parte inferior */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: `0 ${theme.layout.pagePadding.x} ${theme.layout.pagePadding.bottom} ${theme.layout.pagePadding.x}`,
        }}
      >
        <motion.form
          onSubmit={handleSubmit}
          initial={theme.animations.variants.slideUp.hidden}
          animate={theme.animations.variants.slideUp.visible}
          transition={theme.animations.transition.smooth}
        >
          {/* Email Input */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu E-mail"
              required
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: theme.spacing.lg }}>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua Senha"
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'inherit',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              }
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.sm,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Magic Link Success Message */}
          {magicLinkSent && (
            <div style={{
              marginBottom: theme.spacing.md,
              padding: theme.spacing.sm,
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '8px',
              color: '#22D3EE',
              fontSize: '14px',
              textAlign: 'center',
            }}>
              ✓ Link enviado! Verifique seu email {email}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" variant="primary" withBeam disabled={loading || magicLinkSent}>
            {loading ? 'ENTRANDO...' : 'ACESSAR COCKPIT'}
          </Button>

          {/* Magic Link Button - só aparece após erro de login */}
          {showMagicLinkOption && (
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading || magicLinkSent}
              style={{
                width: '100%',
                marginTop: theme.spacing.md,
                padding: '14px',
                background: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: '12px',
                color: '#22D3EE',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading || magicLinkSent ? 'not-allowed' : 'pointer',
                opacity: loading || magicLinkSent ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <Mail size={18} />
              {magicLinkSent ? 'LINK ENVIADO' : 'RECEBER LINK DE ACESSO VIA EMAIL'}
            </button>
          )}
        </motion.form>

        {/* Decoração inferior */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            marginTop: theme.spacing['2xl'],
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
              fill={theme.colors.accent.purple.light}
              fillOpacity="0.8"
            />
          </svg>
        </motion.div>
      </div>
    </PageWrapper>
  )
}
