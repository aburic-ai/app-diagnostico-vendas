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
import { AppLayout } from './components/ui'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin tem layout próprio - desktop only com split view */}
        <Route path="/admin" element={<Admin />} />

        {/* Demo tem layout próprio - otimizado para captura de vídeo */}
        <Route path="/demo" element={<Demo />} />

        {/* Todas as outras páginas usam AppLayout (mobile-first) */}
        <Route path="/*" element={
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dev" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pre-evento" element={<PreEvento />} />
              <Route path="/ao-vivo" element={<AoVivo />} />
              <Route path="/pos-evento" element={<PosEvento />} />
              <Route path="/dev" element={<DevNav />} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
