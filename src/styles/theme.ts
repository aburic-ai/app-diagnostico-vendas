/**
 * DESIGN TOKENS - Definições Centrais do App
 *
 * Todas as páginas devem importar deste arquivo para garantir consistência.
 * NUNCA use valores hardcoded - sempre use os tokens definidos aqui.
 */

// ============================================
// CORES
// ============================================

export const colors = {
  // Backgrounds
  background: {
    void: '#050505',
    pure: '#000000',
    dark: '#020204',
    card: '#0F1115',
    input: 'linear-gradient(135deg, rgba(8, 12, 20, 0.95) 0%, rgba(15, 20, 35, 0.9) 100%)',
    glass: 'rgba(15, 17, 21, 0.6)',
    glassLight: 'rgba(255, 255, 255, 0.03)',
  },

  // Status colors
  status: {
    locked: '#6B7280',
    active: '#22D3EE',
    warning: '#F59E0B',
    danger: '#EF4444',
  },

  // Gold/Yellow (for premium/locked items)
  gold: {
    DEFAULT: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
  },

  // Accent Colors
  accent: {
    purple: {
      DEFAULT: '#7C3AED',
      mid: '#9333EA',
      light: '#A855F7',
    },
    fuchsia: '#C026D3',
    cyan: {
      DEFAULT: '#22D3EE',
      dark: '#06B6D4',
    },
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    muted: '#64748B',
  },

  // Borders
  border: {
    subtle: 'rgba(100, 120, 150, 0.3)',
    normal: 'rgba(100, 120, 150, 0.5)',
    glow: 'rgba(124, 58, 237, 0.3)',
  },
} as const

// ============================================
// GAMIFICATION (Journey Steps, XP, Status)
// ============================================

export const gamification = {
  // Status colors para journey steps
  stepStatus: {
    completed: {
      color: '#22D3EE',
      bg: 'rgba(34, 211, 238, 0.1)',
      bgGradient: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)',
      border: 'rgba(34, 211, 238, 0.4)',
      glow: '0 0 30px rgba(34, 211, 238, 0.5)',
    },
    current: {
      color: '#A855F7',
      bg: 'rgba(168, 85, 247, 0.15)',
      bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
      border: 'rgba(168, 85, 247, 0.4)',
      glow: '0 0 30px rgba(168, 85, 247, 0.5)',
    },
    purchase: {
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.15)',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
      border: 'rgba(245, 158, 11, 0.4)',
      glow: '0 0 20px rgba(245, 158, 11, 0.3)',
    },
    locked: {
      color: '#64748B',
      bg: 'rgba(30, 35, 45, 0.5)',
      bgGradient: 'rgba(15, 17, 21, 0.6)',
      border: 'rgba(100, 116, 139, 0.2)',
      glow: 'none',
    },
  },
  // XP Box
  xpBox: {
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 179, 8, 0.1) 100%)',
    border: 'rgba(245, 158, 11, 0.4)',
    glow: '0 0 20px rgba(245, 158, 11, 0.2)',
  },
  // Progress Bar
  progressBar: {
    bg: 'rgba(10, 12, 18, 0.6)',
    border: 'rgba(245, 158, 11, 0.2)',
    fill: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)',
  },
  // Badges
  badge: {
    live: {
      color: '#FF4444',
      bg: 'rgba(255, 68, 68, 0.15)',
      border: 'rgba(255, 68, 68, 0.4)',
    },
    xp: {
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.3)',
    },
  },
} as const

// ============================================
// GRADIENTES
// ============================================

export const gradients = {
  // Botão principal
  button: 'linear-gradient(135deg, #7C3AED 0%, #9333EA 40%, #C026D3 100%)',

  // Borda de input normal
  inputBorder: {
    normal: 'linear-gradient(135deg, rgba(100,120,150,0.5) 0%, rgba(60,80,100,0.3) 100%)',
    focused: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 50%, #22D3EE 100%)',
  },

  // Overlay para escurecer backgrounds
  overlay: 'linear-gradient(to top, rgba(5,5,5,0.98) 0%, rgba(5,5,5,0.9) 20%, rgba(5,5,5,0.5) 45%, transparent 65%)',

  // Container desktop
  desktopBorder: 'rgba(124, 58, 237, 0.3)',
} as const

// ============================================
// SOMBRAS
// ============================================

export const shadows = {
  input: {
    normal: '0 0 15px rgba(100, 120, 150, 0.1)',
    focused: '0 0 25px rgba(34, 211, 238, 0.4), 0 0 50px rgba(34, 211, 238, 0.2)',
  },
  button: {
    normal: '0 8px 32px rgba(147, 51, 234, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
    hover: '0 0 40px rgba(147, 51, 234, 0.6), 0 0 80px rgba(192, 38, 211, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
  },
  container: {
    desktop: '0 0 60px rgba(124, 58, 237, 0.3)',
  },
  glow: {
    cyan: '0 0 20px rgba(34, 211, 238, 0.5)',
    purple: '0 0 20px rgba(124, 58, 237, 0.5)',
  },
} as const

// ============================================
// TIPOGRAFIA
// ============================================

export const typography = {
  fontFamily: {
    body: "'Inter', system-ui, sans-serif",
    display: "'Rajdhani', system-ui, sans-serif",
    scifi: "'Science Fiction', 'Rajdhani', system-ui, sans-serif",
    orbitron: "'Orbitron', 'Rajdhani', system-ui, sans-serif",
    bankGothic: "'Bank Gothic', 'Rajdhani', system-ui, sans-serif",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.1em',
    wider: '0.15em',
    widest: '0.2em',
  },
} as const

// ============================================
// ESPAÇAMENTOS
// ============================================

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '14px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
} as const

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  sm: '8px',
  md: '14px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
  container: '3rem',
} as const

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
  background: 0,
  animatedBg: 1,
  overlay: 2,
  content: 10,
  modal: 50,
  toast: 100,
} as const

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const

// ============================================
// LAYOUT
// ============================================

export const layout = {
  // Container desktop (simulated phone)
  desktop: {
    maxWidth: '430px',
    height: '92vh',
    maxHeight: '920px',
    borderRadius: '3rem',
    borderWidth: '2px',
  },
  // Padding padrão
  pagePadding: {
    x: '24px',
    bottom: '48px',
  },
  // Input
  input: {
    padding: '18px 20px',
    borderRadius: '14px',
    containerRadius: '16px',
    borderWidth: '2px',
  },
  // Button
  button: {
    padding: '20px 24px',
    borderRadius: '9999px',
  },
} as const

// ============================================
// ANIMAÇÕES
// ============================================

export const animations = {
  // Durações
  duration: {
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.6s',
  },
  // Easings
  easing: {
    default: 'ease',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  // Framer Motion variants
  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slideUp: {
      hidden: { y: 30, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    },
    slideDown: {
      hidden: { y: -30, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    },
    scale: {
      tap: { scale: 0.98 },
      hover: { scale: 1.02 },
    },
  },
  // Transition configs
  transition: {
    spring: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
    smooth: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
} as const

// ============================================
// BOTTOM NAV (Navegação sequencial)
// ============================================

export const bottomNav = {
  container: {
    bg: 'linear-gradient(180deg, rgba(5, 5, 10, 0.98) 0%, rgba(0, 0, 5, 0.99) 100%)',
    border: 'rgba(34, 211, 238, 0.15)',
    padding: '10px 8px env(safe-area-inset-bottom, 24px) 8px',
  },
  step: {
    completed: {
      badgeBg: '#22D3EE',
      badgeBorder: '#22D3EE',
      badgeGlow: '0 0 8px #22D3EE',
      iconColor: '#22D3EE',
      iconBorder: 'rgba(34, 211, 238, 0.3)',
      iconBg: 'rgba(34, 211, 238, 0.1)',
    },
    active: {
      badgeBg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
      badgeBorder: 'rgba(168, 85, 247, 0.6)',
      badgeGlow: '0 0 12px rgba(168, 85, 247, 0.6)',
      buttonBg: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(88, 28, 135, 0.1) 100%)',
      buttonBorder: 'rgba(168, 85, 247, 0.4)',
      iconColor: '#A855F7',
      iconBorder: 'rgba(168, 85, 247, 0.3)',
      iconBg: 'rgba(168, 85, 247, 0.1)',
      iconGlow: 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.5))',
    },
    locked: {
      badgeBg: 'rgba(30, 35, 45, 0.8)',
      badgeBorder: 'rgba(100, 116, 139, 0.3)',
      buttonBg: 'rgba(10, 12, 18, 0.3)',
      buttonBorder: 'rgba(100, 116, 139, 0.1)',
      opacity: 0.5,
    },
  },
  connector: {
    active: '#22D3EE',
    inactive: 'rgba(100, 116, 139, 0.4)',
  },
} as const

// ============================================
// TEMA COMPLETO (export único)
// ============================================

export const theme = {
  colors,
  gamification,
  gradients,
  shadows,
  typography,
  spacing,
  borderRadius,
  zIndex,
  breakpoints,
  layout,
  animations,
  bottomNav,
} as const

export type Theme = typeof theme
