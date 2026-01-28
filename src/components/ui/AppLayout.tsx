/**
 * AppLayout - Layout wrapper para todas as páginas
 *
 * Garante automaticamente:
 * - Mobile: fullscreen
 * - Desktop: container centralizado simulando celular
 */

import { ReactNode } from 'react'
import { theme } from '../../styles/theme'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: theme.colors.background.pure,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Container responsivo */}
      <div
        className="app-container"
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {/* Estilos responsivos via CSS */}
      <style>{`
        .app-container {
          height: 100vh;
          height: 100dvh;
        }
        @media (min-width: ${theme.breakpoints.md}) {
          .app-container {
            max-width: ${theme.layout.desktop.maxWidth} !important;
            height: ${theme.layout.desktop.height} !important;
            max-height: ${theme.layout.desktop.maxHeight} !important;
            border-radius: ${theme.layout.desktop.borderRadius} !important;
            border: ${theme.layout.desktop.borderWidth} solid ${theme.gradients.desktopBorder} !important;
            box-shadow: ${theme.shadows.container.desktop} !important;
          }
        }
      `}</style>
    </div>
  )
}
