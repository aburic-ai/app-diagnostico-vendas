/**
 * App Principal
 *
 * Usa React Router para navegação entre páginas.
 * Usa AppLayout para garantir layout consistente em todas as páginas.
 * Admin tem layout próprio (desktop-only) e fica fora do AppLayout.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { PreEvento } from './pages/PreEvento'
import { AoVivo } from './pages/AoVivo'
import { PosEvento } from './pages/PosEvento'
import { DevNav } from './pages/DevNav'
import { Admin } from './pages/Admin'
import { Demo } from './pages/Demo'
import { Sandbox } from './pages/Sandbox'
import { ThankYou } from './pages/ThankYou'
import { AppLayout, ProtectedRoute } from './components/ui'
import { AuthProvider } from './context/AuthContext'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin tem layout próprio - desktop only com split view - PROTEGIDO (requer admin) */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          } />

          {/* Demo tem layout próprio - otimizado para captura de vídeo */}
          <Route path="/demo" element={<Demo />} />

          {/* Sandbox tem layout próprio - para prints e forms */}
          <Route path="/sandbox" element={<Sandbox />} />

          {/* ThankYou page - pós-compra Hotmart - PÚBLICO */}
          <Route path="/obrigado" element={<ThankYou />} />

          {/* Todas as outras páginas usam AppLayout (mobile-first) */}
          <Route path="/*" element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />

                {/* Rotas protegidas - requerem autenticação */}
                <Route path="/pre-evento" element={
                  <ProtectedRoute>
                    <PreEvento />
                  </ProtectedRoute>
                } />
                <Route path="/ao-vivo" element={
                  <ProtectedRoute>
                    <AoVivo />
                  </ProtectedRoute>
                } />
                <Route path="/pos-evento" element={
                  <ProtectedRoute>
                    <PosEvento />
                  </ProtectedRoute>
                } />

                <Route path="/dev" element={<DevNav />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
