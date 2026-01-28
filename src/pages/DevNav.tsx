/**
 * DevNav - Página de navegação para desenvolvimento
 *
 * Página oculta com links para todas as páginas do app.
 * Acesse via: /dev
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LogIn,
  Rocket,
  Radio,
  Target,
  FlaskConical,
  ExternalLink,
  Settings,
} from 'lucide-react'

import { PageWrapper } from '../components/ui'
import { theme } from '../styles/theme'

interface PageLink {
  path: string
  label: string
  description: string
  icon: React.ReactNode
  status: 'done' | 'wip' | 'planned'
}

const pages: PageLink[] = [
  {
    path: '/login',
    label: 'Login',
    description: 'Tela de acesso ao cockpit',
    icon: <LogIn size={24} />,
    status: 'done',
  },
  {
    path: '/pre-evento',
    label: 'Pré-Evento',
    description: 'Dashboard de preparação antes do evento',
    icon: <Rocket size={24} />,
    status: 'done',
  },
  {
    path: '/ao-vivo',
    label: 'Ao Vivo',
    description: 'Diagnóstico em tempo real durante o evento',
    icon: <Radio size={24} />,
    status: 'done',
  },
  {
    path: '/pos-evento',
    label: 'Pós-Evento',
    description: 'Consolidação e plano de ação pós-evento',
    icon: <Target size={24} />,
    status: 'done',
  },
  {
    path: '/sandbox',
    label: 'Sandbox',
    description: 'Página de testes e protótipos',
    icon: <FlaskConical size={24} />,
    status: 'wip',
  },
  {
    path: '/admin',
    label: 'Admin',
    description: 'Painel de controle do evento (desktop only)',
    icon: <Settings size={24} />,
    status: 'done',
  },
]

const getStatusColor = (status: PageLink['status']) => {
  switch (status) {
    case 'done':
      return theme.colors.accent.cyan.DEFAULT
    case 'wip':
      return theme.colors.gold.DEFAULT
    case 'planned':
      return theme.colors.text.muted
  }
}

const getStatusLabel = (status: PageLink['status']) => {
  switch (status) {
    case 'done':
      return 'Pronto'
    case 'wip':
      return 'Em progresso'
    case 'planned':
      return 'Planejado'
  }
}

export function DevNav() {
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
          padding: '20px 16px',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ marginBottom: '32px', textAlign: 'center' }}
        >
          <h1
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '24px',
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.accent.purple.light,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
              margin: 0,
            }}
          >
            DEV NAVIGATION
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: theme.colors.text.secondary,
              marginTop: '8px',
            }}
          >
            Acesso rápido a todas as páginas do app
          </p>
        </motion.div>

        {/* Page Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pages.map((page, index) => (
            <motion.div
              key={page.path}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Link
                to={page.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.9) 0%, rgba(20, 25, 35, 0.8) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.accent.purple.light,
                    flexShrink: 0,
                  }}
                >
                  {page.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: theme.typography.fontFamily.orbitron,
                        fontSize: '14px',
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.text.primary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {page.label}
                    </span>
                    <span
                      style={{
                        fontSize: '8px',
                        fontWeight: theme.typography.fontWeight.bold,
                        color: getStatusColor(page.status),
                        background: `${getStatusColor(page.status)}20`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {getStatusLabel(page.status)}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: theme.colors.text.secondary,
                      margin: 0,
                    }}
                  >
                    {page.description}
                  </p>
                  <span
                    style={{
                      fontSize: '10px',
                      color: theme.colors.text.muted,
                      fontFamily: 'monospace',
                    }}
                  >
                    {page.path}
                  </span>
                </div>

                {/* Arrow */}
                <ExternalLink
                  size={18}
                  color={theme.colors.accent.purple.light}
                  style={{ flexShrink: 0 }}
                />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontSize: '10px',
            color: theme.colors.text.muted,
            textAlign: 'center',
            marginTop: '32px',
          }}
        >
          Esta página é oculta e só aparece em desenvolvimento
        </motion.p>
      </div>
    </PageWrapper>
  )
}
