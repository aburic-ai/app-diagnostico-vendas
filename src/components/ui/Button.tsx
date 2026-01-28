/**
 * Button - Componente de botão padronizado
 *
 * Variantes:
 * - primary: Gradiente roxo com beam animation
 * - secondary: Outline com glow
 * - ghost: Transparente
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { theme } from '../../styles/theme'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  /** Ativa o efeito de beam no hover */
  withBeam?: boolean
  /** Full width */
  fullWidth?: boolean
  /** Desabilitar botão */
  disabled?: boolean
  /** Callback ao clicar */
  onClick?: () => void
  /** Tipo do botão */
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  children,
  variant = 'primary',
  withBeam = true,
  fullWidth = true,
  disabled,
  onClick,
  type = 'button',
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: theme.gradients.button,
          color: theme.colors.text.primary,
          boxShadow: isHovered ? theme.shadows.button.hover : theme.shadows.button.normal,
        }
      case 'secondary':
        return {
          background: 'transparent',
          color: theme.colors.accent.cyan.DEFAULT,
          border: `2px solid ${theme.colors.accent.cyan.DEFAULT}`,
          boxShadow: isHovered ? theme.shadows.glow.cyan : 'none',
        }
      case 'ghost':
        return {
          background: 'transparent',
          color: theme.colors.text.secondary,
        }
      default:
        return {}
    }
  }

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    width: fullWidth ? '100%' : 'auto',
    padding: theme.layout.button.padding,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: theme.typography.fontFamily.body,
    textTransform: 'uppercase',
    letterSpacing: theme.typography.letterSpacing.widest,
    border: 'none',
    borderRadius: theme.layout.button.borderRadius,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    overflow: 'visible',
    transition: `all ${theme.animations.duration.normal} ${theme.animations.easing.default}`,
    ...getVariantStyles(),
  }

  return (
    <motion.button
      type={type}
      style={baseStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 500)}
      whileTap={theme.animations.variants.scale.tap}
      disabled={disabled}
      onClick={onClick}
    >
      {/* Beam animation para variant primary */}
      {variant === 'primary' && withBeam && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: '-3px',
              borderRadius: theme.layout.button.borderRadius,
              padding: '3px',
              background: isHovered
                ? 'linear-gradient(var(--beam-angle, 0deg), transparent 40%, #22D3EE 48%, #ffffff 50%, #22D3EE 52%, transparent 60%)'
                : 'transparent',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              animation: isHovered ? 'beam-spin 1s linear infinite' : 'none',
              opacity: isHovered ? 1 : 0,
              transition: `opacity ${theme.animations.duration.normal}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '-6px',
              borderRadius: theme.layout.button.borderRadius,
              border: isHovered ? `1px solid rgba(34, 211, 238, 0.5)` : '1px solid transparent',
              boxShadow: isHovered ? '0 0 20px rgba(34, 211, 238, 0.3)' : 'none',
              transition: `all ${theme.animations.duration.normal}`,
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      {/* Inner highlight */}
      {variant === 'primary' && (
        <div
          style={{
            position: 'absolute',
            inset: '1px',
            borderRadius: theme.layout.button.borderRadius,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Text */}
      <span style={{
        position: 'relative',
        zIndex: 10,
        textShadow: variant === 'primary' ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'
      }}>
        {children}
      </span>

      <style>{`
        @property --beam-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes beam-spin {
          from { --beam-angle: 0deg; }
          to { --beam-angle: 360deg; }
        }
      `}</style>
    </motion.button>
  )
}
