/**
 * Página de Login - Cockpit Access
 *
 * Exemplo de página usando os componentes centralizados.
 * Todas as outras páginas devem seguir esta estrutura.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'

// Componentes centralizados
import { PageWrapper, Input, Button } from '../components/ui'
import { theme } from '../styles/theme'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementar autenticação real
    console.log('Login attempt:', { email, password })
    navigate('/pre-evento')
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

          {/* Submit Button */}
          <Button type="submit" variant="primary" withBeam>
            ACESSAR COCKPIT
          </Button>
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
