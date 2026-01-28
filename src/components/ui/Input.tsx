/**
 * Input - Componente de input padronizado
 *
 * Já vem com:
 * - Borda gradiente
 * - Estados de focus
 * - Estilo glassmorphism
 */

import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { theme } from '../../styles/theme'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> {
  /** Ícone ou elemento à direita do input */
  rightElement?: ReactNode
}

export function Input({ rightElement, onFocus, onBlur, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    borderRadius: theme.layout.input.containerRadius,
    padding: theme.layout.input.borderWidth,
    background: isFocused
      ? theme.gradients.inputBorder.focused
      : theme.gradients.inputBorder.normal,
    boxShadow: isFocused
      ? theme.shadows.input.focused
      : theme.shadows.input.normal,
    transition: `all ${theme.animations.duration.normal} ${theme.animations.easing.default}`,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.layout.input.padding,
    paddingRight: rightElement ? '56px' : '20px',
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.text.primary,
    background: theme.colors.background.input,
    border: 'none',
    borderRadius: theme.layout.input.borderRadius,
    outline: 'none',
  }

  const rightElementStyle: React.CSSProperties = {
    position: 'absolute',
    right: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: isFocused ? theme.colors.accent.cyan.DEFAULT : theme.colors.text.muted,
    transition: `color ${theme.animations.duration.normal} ${theme.animations.easing.default}`,
  }

  return (
    <div style={containerStyle}>
      <div style={{ position: 'relative' }}>
        <input
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightElement && (
          <div style={rightElementStyle}>
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}
