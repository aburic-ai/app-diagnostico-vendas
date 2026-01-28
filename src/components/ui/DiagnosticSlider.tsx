/**
 * DiagnosticSlider - Input tátil para diagnóstico 0-10
 *
 * Slider visual com feedback em tempo real e cores por status
 */

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { theme } from '../../styles/theme'

interface DiagnosticSliderProps {
  /** Label do slider */
  label: string
  /** Letra da dimensão (I, M, P, A, C, T) */
  letter: string
  /** Valor atual (0-10) */
  value: number
  /** Callback ao mudar valor */
  onChange: (value: number) => void
  /** Cor do slider (cyan ou purple) */
  color?: 'cyan' | 'purple'
  /** Descrição do item */
  description?: string
}

export function DiagnosticSlider({
  label,
  letter,
  value,
  onChange,
  color = 'cyan',
  description,
}: DiagnosticSliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const accentColor = color === 'cyan'
    ? theme.colors.accent.cyan.DEFAULT
    : theme.colors.accent.purple.light

  const accentGlow = color === 'cyan'
    ? 'rgba(34, 211, 238, 0.5)'
    : 'rgba(168, 85, 247, 0.5)'

  const getStatusColor = (val: number) => {
    if (val <= 3) return '#EF4444' // Red - Critical
    if (val <= 5) return '#F59E0B' // Orange - Warning
    if (val <= 7) return '#22D3EE' // Cyan - Good
    return '#22C55E' // Green - Excellent
  }

  const getStatusLabel = (val: number) => {
    if (val <= 3) return 'Crítico'
    if (val <= 5) return 'Atenção'
    if (val <= 7) return 'Bom'
    return 'Excelente'
  }

  const handleSliderInteraction = (clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newValue = Math.round(percentage * 10)
    onChange(newValue)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleSliderInteraction(e.clientX)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleSliderInteraction(e.touches[0].clientX)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [isDragging])

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 17, 21, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
        border: `1px solid rgba(${color === 'cyan' ? '34, 211, 238' : '168, 85, 247'}, 0.3)`,
        borderRadius: '12px',
        padding: '14px 16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        {/* Left: Letter + Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Letter Circle */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}11 100%)`,
              border: `2px solid ${accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 15px ${accentGlow}`,
            }}
          >
            <span
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '14px',
                fontWeight: theme.typography.fontWeight.bold,
                color: accentColor,
              }}
            >
              {letter}
            </span>
          </div>

          {/* Label */}
          <div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}
            >
              {label}
            </span>
            {description && (
              <p
                style={{
                  fontSize: '10px',
                  color: theme.colors.text.muted,
                  margin: '2px 0 0 0',
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Value + Status */}
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontFamily: theme.typography.fontFamily.orbitron,
              fontSize: '20px',
              fontWeight: theme.typography.fontWeight.bold,
              color: getStatusColor(value),
              textShadow: `0 0 15px ${getStatusColor(value)}`,
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontSize: '9px',
              color: theme.colors.text.muted,
              marginLeft: '4px',
            }}
          >
            /10
          </span>
          <div
            style={{
              fontSize: '9px',
              color: getStatusColor(value),
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '2px',
            }}
          >
            {getStatusLabel(value)}
          </div>
        </div>
      </div>

      {/* Slider Track */}
      <div
        ref={sliderRef}
        onMouseDown={(e) => {
          setIsDragging(true)
          handleSliderInteraction(e.clientX)
        }}
        onTouchStart={(e) => {
          setIsDragging(true)
          if (e.touches[0]) {
            handleSliderInteraction(e.touches[0].clientX)
          }
        }}
        style={{
          position: 'relative',
          width: '100%',
          height: '32px',
          background: 'rgba(10, 12, 18, 0.8)',
          borderRadius: '8px',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      >
        {/* Filled portion */}
        <motion.div
          animate={{ width: `${value * 10}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: `linear-gradient(90deg, ${getStatusColor(value)}44 0%, ${getStatusColor(value)} 100%)`,
            borderRadius: '8px',
            boxShadow: `0 0 20px ${getStatusColor(value)}66`,
          }}
        />

        {/* Tick marks */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px',
          }}
        >
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '2px',
                height: i % 5 === 0 ? '12px' : '6px',
                background: i <= value
                  ? 'rgba(255, 255, 255, 0.5)'
                  : 'rgba(100, 116, 139, 0.3)',
                borderRadius: '1px',
              }}
            />
          ))}
        </div>

        {/* Thumb */}
        <motion.div
          animate={{ left: `${value * 10}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: getStatusColor(value),
            border: '3px solid rgba(255, 255, 255, 0.9)',
            boxShadow: `0 0 20px ${getStatusColor(value)}, 0 2px 8px rgba(0, 0, 0, 0.3)`,
            cursor: 'grab',
          }}
        />
      </div>

      {/* Scale labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          padding: '0 2px',
        }}
      >
        <span style={{ fontSize: '9px', color: theme.colors.text.muted }}>0</span>
        <span style={{ fontSize: '9px', color: theme.colors.text.muted }}>5</span>
        <span style={{ fontSize: '9px', color: theme.colors.text.muted }}>10</span>
      </div>
    </div>
  )
}
