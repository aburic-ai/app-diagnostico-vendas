/**
 * PageWrapper - Wrapper de página com layers padrão
 *
 * Inclui automaticamente:
 * - Background (imagem ou cor)
 * - AnimatedBackground (Canvas)
 * - Gradient overlay
 * - Container de conteúdo
 */

import type { ReactNode } from 'react'
import { AnimatedBackground } from '../AnimatedBackground'
import { theme } from '../../styles/theme'

interface PageWrapperProps {
  children: ReactNode
  /** URL da imagem de background */
  backgroundImage?: string
  /** Cor de background (usado se não tiver imagem) */
  backgroundColor?: string
  /** Posição do background image */
  backgroundPosition?: string
  /** Mostrar canvas animado */
  showAnimatedBackground?: boolean
  /** Gradiente de overlay customizado */
  overlayGradient?: string
  /** Mostrar overlay */
  showOverlay?: boolean
}

export function PageWrapper({
  children,
  backgroundImage,
  backgroundColor = theme.colors.background.void,
  backgroundPosition = 'center top',
  showAnimatedBackground = true,
  overlayGradient = theme.gradients.overlay,
  showOverlay = true,
}: PageWrapperProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor,
      }}
    >
      {/* Layer 1: Background Image */}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition,
            backgroundRepeat: 'no-repeat',
            zIndex: theme.zIndex.background,
          }}
        />
      )}

      {/* Layer 2: Animated Canvas */}
      {showAnimatedBackground && <AnimatedBackground />}

      {/* Layer 3: Gradient Overlay */}
      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: overlayGradient,
            zIndex: theme.zIndex.overlay,
          }}
        />
      )}

      {/* Layer 4: Content */}
      <div
        style={{
          position: 'relative',
          zIndex: theme.zIndex.content,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  )
}
