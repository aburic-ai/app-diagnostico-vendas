import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // Mostra loading enquanto verifica auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0f',
        color: '#fff',
      }}>
        Carregando...
      </div>
    )
  }

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se requer admin mas o usuário não é admin
  if (requireAdmin && !profile?.is_admin) {
    return <Navigate to="/pre-evento" replace />
  }

  return <>{children}</>
}
