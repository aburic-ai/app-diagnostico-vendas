/**
 * ResetPassword - Página para resetar senha
 * Detecta token de recovery na URL e permite criar nova senha
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageWrapper, Input, Button } from '../components/ui'
import { theme } from '../styles/theme'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Verificar se há token de recovery na URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const type = hashParams.get('type')

    if (type !== 'recovery') {
      // Se não é um link de recovery, redirecionar para login
      navigate('/login')
    }
  }, [navigate])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      // Atualizar senha do usuário
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/pre-evento')
      }, 2000)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError('Erro ao resetar senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(10, 12, 18, 0.95) 0%, rgba(15, 20, 30, 0.98) 100%)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {/* Logo / Title */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Lock size={48} color={theme.colors.primary.cyan} style={{ margin: '0 auto 16px' }} />
            <h1
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '24px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: '8px',
              }}
            >
              CRIAR NOVA SENHA
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
              }}
            >
              Digite sua nova senha abaixo
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div
              style={{
                padding: '16px',
                background: 'rgba(34, 211, 238, 0.1)',
                border: `1px solid ${theme.colors.primary.cyan}`,
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <CheckCircle size={20} color={theme.colors.primary.cyan} />
              <div>
                <p
                  style={{
                    fontSize: '14px',
                    color: theme.colors.primary.cyan,
                    fontWeight: theme.typography.fontWeight.semibold,
                    margin: 0,
                  }}
                >
                  Senha alterada com sucesso!
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: theme.colors.text.secondary,
                    margin: '4px 0 0',
                  }}
                >
                  Redirecionando...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertCircle size={20} color="#EF4444" />
              <p
                style={{
                  fontSize: '14px',
                  color: '#EF4444',
                  margin: 0,
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Nova Senha
                </label>
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Confirmar Senha
                </label>
                <Input
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'ALTERANDO...' : 'ALTERAR SENHA'}
              </Button>
            </form>
          )}

          {/* Back to Login */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.colors.primary.cyan,
                fontSize: '13px',
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Voltar para Login
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
