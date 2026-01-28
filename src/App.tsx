/**
 * App Principal
 *
 * Usa React Router para navegação entre páginas.
 * Usa AppLayout para garantir layout consistente em todas as páginas.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { PreEvento } from './pages/PreEvento'
import { AoVivo } from './pages/AoVivo'
import { PosEvento } from './pages/PosEvento'
import { Sandbox } from './pages/Sandbox'
import { DevNav } from './pages/DevNav'
import { AppLayout } from './components/ui'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dev" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pre-evento" element={<PreEvento />} />
          <Route path="/ao-vivo" element={<AoVivo />} />
          <Route path="/pos-evento" element={<PosEvento />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/dev" element={<DevNav />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
