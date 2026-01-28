/**
 * AnimatedBackground - Canvas animado com partículas e efeitos
 *
 * Features:
 * - Partículas flutuantes (cyan + purple)
 * - Conexões entre partículas próximas
 * - Scan line horizontal
 * - Grid sutil
 * - Elementos de canto decorativos
 */

import { useEffect, useRef } from 'react'
import { theme } from '../styles/theme'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  pulse: number
  pulseSpeed: number
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let particles: Particle[] = []
    let scanY = 0

    const colors = {
      cyan: theme.colors.accent.cyan.DEFAULT,
      purple: theme.colors.accent.purple.light,
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initParticles()
    }

    const initParticles = () => {
      particles = []
      const count = Math.floor((canvas.width * canvas.height) / 8000)

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          color: Math.random() > 0.4 ? colors.cyan : colors.purple,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.05 + 0.02,
        })
      }
    }

    const drawParticles = () => {
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.pulse += p.pulseSpeed

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        const pulseOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse))

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = pulseOpacity
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = pulseOpacity * 0.3
        ctx.fill()
      })

      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 100) {
            const opacity = (1 - dist / 100) * 0.15
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = colors.cyan
            ctx.globalAlpha = opacity
            ctx.stroke()
          }
        }
      }
    }

    const drawScanLine = () => {
      scanY += 1.5
      if (scanY > canvas.height + 50) scanY = -50

      const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      gradient.addColorStop(0, 'transparent')
      gradient.addColorStop(0.4, 'rgba(34, 211, 238, 0.1)')
      gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.4)')
      gradient.addColorStop(0.6, 'rgba(34, 211, 238, 0.1)')
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.globalAlpha = 1
      ctx.fillRect(0, scanY - 20, canvas.width, 40)

      ctx.beginPath()
      ctx.moveTo(0, scanY)
      ctx.lineTo(canvas.width, scanY)
      ctx.strokeStyle = colors.cyan
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6
      ctx.stroke()
    }

    const drawGrid = () => {
      ctx.globalAlpha = 0.05
      ctx.strokeStyle = colors.cyan
      ctx.lineWidth = 1

      const gridSize = 50

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      ctx.fillStyle = colors.cyan
      ctx.globalAlpha = 0.15
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const drawCornerElements = () => {
      ctx.strokeStyle = colors.cyan
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.3

      const cornerSize = 30
      const margin = 20

      // Top left
      ctx.beginPath()
      ctx.moveTo(margin, margin + cornerSize)
      ctx.lineTo(margin, margin)
      ctx.lineTo(margin + cornerSize, margin)
      ctx.stroke()

      // Top right
      ctx.beginPath()
      ctx.moveTo(canvas.width - margin - cornerSize, margin)
      ctx.lineTo(canvas.width - margin, margin)
      ctx.lineTo(canvas.width - margin, margin + cornerSize)
      ctx.stroke()

      // Bottom left
      ctx.beginPath()
      ctx.moveTo(margin, canvas.height - margin - cornerSize)
      ctx.lineTo(margin, canvas.height - margin)
      ctx.lineTo(margin + cornerSize, canvas.height - margin)
      ctx.stroke()

      // Bottom right
      ctx.beginPath()
      ctx.moveTo(canvas.width - margin - cornerSize, canvas.height - margin)
      ctx.lineTo(canvas.width - margin, canvas.height - margin)
      ctx.lineTo(canvas.width - margin, canvas.height - margin - cornerSize)
      ctx.stroke()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      drawGrid()
      drawParticles()
      drawScanLine()
      drawCornerElements()

      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: theme.zIndex.animatedBg,
      }}
    />
  )
}
