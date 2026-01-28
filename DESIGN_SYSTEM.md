# Design System - App Imersao Diagnostico de Vendas

> **"ISSO NAO E UM APP. E UMA MAQUINA DE COMPROMETIMENTO."**

Este documento define todas as especificacoes visuais, comportamentos e padroes de codigo para garantir consistencia absoluta em todas as paginas.

---

## Arquitetura Centralizada

### Principio Fundamental
**NUNCA use valores hardcoded. Sempre importe do theme:**

```tsx
import { theme } from '../styles/theme'

// ERRADO
<div style={{ color: '#22D3EE' }}>

// CERTO
<div style={{ color: theme.colors.accent.cyan.DEFAULT }}>
```

### Arquivos de Definicao Central

| Arquivo | Conteudo |
|---------|----------|
| `src/styles/theme.ts` | Tokens de design (cores, tipografia, espacamentos, animacoes, gamification) |
| `src/components/ui/index.ts` | Componentes base exportados |

### Estrutura de Arquivos

```
src/
├── styles/
│   └── theme.ts          # DESIGN TOKENS (fonte unica da verdade)
├── components/
│   └── ui/
│       ├── index.ts      # Exports centralizados
│       ├── AppLayout.tsx # Layout responsivo (mobile/desktop)
│       ├── PageWrapper.tsx # Wrapper com background layers
│       ├── Card.tsx      # Container glassmorphism
│       ├── Button.tsx    # Botao com beam animation
│       ├── Input.tsx     # Input com borda gradiente
│       ├── Countdown.tsx # Timer regressivo
│       ├── ProgressBar.tsx # Barra de progresso
│       └── BottomNav.tsx # Navegacao sequencial
└── pages/
    ├── Login.tsx
    ├── PreEvento.tsx
    ├── DevNav.tsx
    └── Sandbox.tsx
```

---

## Paleta de Cores

### Backgrounds
| Token | Valor | Uso |
|-------|-------|-----|
| `theme.colors.background.void` | `#050505` | Fundo principal |
| `theme.colors.background.pure` | `#000000` | Preto absoluto |
| `theme.colors.background.dark` | `#020204` | Paginas internas |
| `theme.colors.background.card` | `#0F1115` | Cards |
| `theme.colors.background.glass` | `rgba(15, 17, 21, 0.6)` | Glassmorphism |

### Accent Colors
| Token | Valor | Uso |
|-------|-------|-----|
| `theme.colors.accent.purple.DEFAULT` | `#7C3AED` | Primaria |
| `theme.colors.accent.purple.light` | `#A855F7` | Destaque ativo |
| `theme.colors.accent.cyan.DEFAULT` | `#22D3EE` | Secundaria/Completo |
| `theme.colors.gold.DEFAULT` | `#F59E0B` | XP/Premium |

### Text
| Token | Valor | Uso |
|-------|-------|-----|
| `theme.colors.text.primary` | `#FFFFFF` | Principal |
| `theme.colors.text.secondary` | `#94A3B8` | Secundario |
| `theme.colors.text.muted` | `#64748B` | Desabilitado |

---

## Tipografia

### Font Families
```tsx
theme.typography.fontFamily.body      // Inter - Texto corpo
theme.typography.fontFamily.display   // Rajdhani - Titulos tech
theme.typography.fontFamily.orbitron  // Orbitron - Numeros/Timer
theme.typography.fontFamily.bankGothic // Bank Gothic - Countdown
```

### Hierarquia
| Elemento | Font | Tamanho | Peso | Letra Spacing |
|----------|------|---------|------|---------------|
| Titulo Principal | Orbitron | 24px | Bold | 0.1em |
| Subtitulo | Inter | 13px | Medium | 0.2em |
| Label | Inter | 10px | Bold | 0.1em |
| Body | Inter | 14px | Normal | 0 |
| Caption | Inter | 12px | Normal | 0 |

---

## Sistema de Gamification

### Status dos Steps (Journey)

Acesse via `theme.gamification.stepStatus`:

```tsx
// Completo (Cyan)
theme.gamification.stepStatus.completed.color    // '#22D3EE'
theme.gamification.stepStatus.completed.border   // 'rgba(34, 211, 238, 0.4)'
theme.gamification.stepStatus.completed.glow     // '0 0 30px rgba(34, 211, 238, 0.5)'
theme.gamification.stepStatus.completed.bgGradient // Gradiente para o icone

// Ativo (Purple)
theme.gamification.stepStatus.current.color      // '#A855F7'
theme.gamification.stepStatus.current.border     // 'rgba(168, 85, 247, 0.4)'
theme.gamification.stepStatus.current.glow       // '0 0 30px rgba(168, 85, 247, 0.5)'

// Compra (Gold)
theme.gamification.stepStatus.purchase.color     // '#F59E0B'
theme.gamification.stepStatus.purchase.border    // 'rgba(245, 158, 11, 0.4)'

// Bloqueado (Gray)
theme.gamification.stepStatus.locked.color       // '#64748B'
theme.gamification.stepStatus.locked.border      // 'rgba(100, 116, 139, 0.2)'
```

### XP Box
```tsx
<div style={{
  background: theme.gamification.xpBox.bg,
  border: `1px solid ${theme.gamification.xpBox.border}`,
  boxShadow: theme.gamification.xpBox.glow,
  borderRadius: '12px',
  padding: '16px 20px',
}}>
```

### Progress Bar
```tsx
theme.gamification.progressBar.bg    // Background da barra
theme.gamification.progressBar.fill  // Gradiente do preenchimento
theme.gamification.progressBar.border
```

---

## BottomNav Sequencial

### Estrutura Visual
```
    1          🔒          🔒
    ↓           →           →
[Preparacao] [Ao Vivo] [Pos Evento]
```

### Tokens (theme.bottomNav)

```tsx
// Container
theme.bottomNav.container.bg      // Gradiente do fundo
theme.bottomNav.container.border  // Borda superior
theme.bottomNav.container.padding // Padding com safe-area

// Step Completed (Cyan)
theme.bottomNav.step.completed.badgeBg
theme.bottomNav.step.completed.iconColor

// Step Active (Purple)
theme.bottomNav.step.active.badgeBg
theme.bottomNav.step.active.buttonBg
theme.bottomNav.step.active.iconGlow

// Step Locked (Gray)
theme.bottomNav.step.locked.opacity  // 0.5
```

### Uso
```tsx
const navItems = [
  { id: 'preparacao', label: 'Preparacao', icon: <Rocket size={20} />, status: 'Liberado' },
  { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} />, badge: 'LIVE', status: 'Libera 14/03' },
  { id: 'posevento', label: 'Pos Evento', icon: <Target size={20} />, status: 'Libera 16/03' },
]

<BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
```

---

## Layout Responsivo

### Mobile vs Desktop

```tsx
// AppLayout.tsx gerencia automaticamente

// Mobile: Fullscreen
height: 100dvh  // dynamic viewport height (compativel com Safari iOS)

// Desktop: Container centralizado
maxWidth: 430px
height: 92vh
maxHeight: 920px
borderRadius: 3rem
border: 2px solid rgba(124, 58, 237, 0.3)
```

### Safe Area (iPhone)
```tsx
// BottomNav ja inclui automaticamente
padding: '10px 8px env(safe-area-inset-bottom, 24px) 8px'
```

### Breakpoints
```tsx
theme.breakpoints.sm  // 640px
theme.breakpoints.md  // 768px - Trigger para desktop mode
theme.breakpoints.lg  // 1024px
theme.breakpoints.xl  // 1280px
```

---

## Componentes UI

### Como importar
```tsx
import {
  AppLayout,
  PageWrapper,
  Card,
  Button,
  Input,
  Countdown,
  ProgressBar,
  BottomNav
} from '../components/ui'
```

### PageWrapper
```tsx
<PageWrapper
  backgroundColor={theme.colors.background.dark}
  showAnimatedBackground={true}  // Canvas com particulas
  showOverlay={false}            // Overlay gradiente
>
  {/* Conteudo */}
</PageWrapper>
```

### Card
```tsx
<Card
  variant="purple"  // default | purple | cyan | gold
  padding="20px"
  hoverable={true}
  onClick={() => {}}
>
  {/* Conteudo */}
</Card>
```

### Button
```tsx
<Button
  variant="primary"  // primary | secondary | ghost
  withBeam={true}
  fullWidth={true}
>
  ACESSAR COCKPIT
</Button>
```

### Input
```tsx
<Input
  placeholder="E-mail"
  rightElement={<Mail size={20} />}
/>
```

### Countdown
```tsx
<Countdown
  targetDate={new Date('2026-02-28T09:30:00')}
  label="INICIO DA OPERACAO"
/>
```

---

## Padroes de Animacao (Framer Motion)

### Container com staggerChildren
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
}

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.div variants={itemVariants}>Item 1</motion.div>
  <motion.div variants={itemVariants}>Item 2</motion.div>
</motion.div>
```

### Pulse Animation (item ativo)
```tsx
<motion.div
  animate={{
    scale: [1, 1.4, 1],
    opacity: [0.5, 0.2, 0.5],
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
/>
```

### Tap/Hover (pre-definidos no theme)
```tsx
<motion.button
  whileTap={theme.animations.variants.scale.tap}   // { scale: 0.98 }
  whileHover={theme.animations.variants.scale.hover} // { scale: 1.02 }
/>
```

### Transitions pre-definidas
```tsx
theme.animations.transition.spring  // { type: 'spring', stiffness: 100, damping: 15 }
theme.animations.transition.smooth  // { duration: 0.6, ease: 'easeOut' }
```

---

## Z-Index Scale

```tsx
theme.zIndex.background  // 0  - Background image
theme.zIndex.animatedBg  // 1  - Canvas particles
theme.zIndex.overlay     // 2  - Gradient overlay
theme.zIndex.content     // 10 - Main content
theme.zIndex.modal       // 50 - Modals/Overlays
theme.zIndex.toast       // 100 - Notifications
```

---

## Estrutura de Pagina Padrao

```tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageWrapper, BottomNav } from '../components/ui'
import { theme } from '../styles/theme'

export function NomeDaPagina() {
  const [activeNav, setActiveNav] = useState('id-inicial')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  }

  const navItems = [
    { id: 'preparacao', label: 'Preparacao', icon: <Rocket size={20} /> },
    { id: 'aovivo', label: 'Ao Vivo', icon: <Radio size={20} /> },
    { id: 'posevento', label: 'Pos Evento', icon: <Target size={20} /> },
  ]

  return (
    <PageWrapper
      backgroundColor={theme.colors.background.dark}
      showAnimatedBackground={true}
    >
      {/* Scroll Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: '140px', // Espaco para BottomNav
      }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ padding: '24px 20px' }}
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            {/* ... */}
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants}>
            {/* ... */}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
    </PageWrapper>
  )
}
```

---

## Checklist para Novas Paginas

- [ ] Importar `theme` de `../styles/theme`
- [ ] Usar `PageWrapper` como container principal
- [ ] Adicionar `paddingBottom: '140px'` no scroll container
- [ ] Implementar animation variants (container + items)
- [ ] Usar tokens de cor (NUNCA hardcoded)
- [ ] Usar tokens de tipografia
- [ ] Adicionar `BottomNav` se aplicavel
- [ ] Testar em mobile (Safari iOS)
- [ ] Testar em desktop (container centralizado)
- [ ] Verificar safe-area no iPhone

---

## Convencoes de Codigo

### Nomes de Arquivos
- Componentes: `PascalCase.tsx` (ex: `BottomNav.tsx`)
- Paginas: `PascalCase.tsx` (ex: `PreEvento.tsx`)
- Estilos: `camelCase.ts` (ex: `theme.ts`)

### Exports
- Componentes UI: export via `components/ui/index.ts`
- Paginas: export nomeado (ex: `export function PreEvento()`)

### Comentarios
```tsx
/**
 * NomeDoComponente - Descricao breve
 *
 * Detalhes adicionais se necessario.
 */
```

---

## Filosofia Visual

1. **Dark Mode Only** - Nao ha light mode
2. **Glassmorphism** - Transparencias + blur em superficies
3. **Neon Glows** - Cyan e Purple como destaques
4. **Tech/Sci-Fi** - Fontes como Orbitron, efeitos de scan line
5. **Micro-interactions** - Tudo responde ao toque
6. **Progressive Disclosure** - Nao mostrar tudo de uma vez

---

## Tokens Completos Disponiveis

```tsx
import { theme } from '../styles/theme'

// Cores
theme.colors.background.*
theme.colors.accent.purple.*
theme.colors.accent.cyan.*
theme.colors.gold.*
theme.colors.text.*
theme.colors.border.*
theme.colors.status.*

// Gamification
theme.gamification.stepStatus.*
theme.gamification.xpBox.*
theme.gamification.progressBar.*
theme.gamification.badge.*

// Gradientes
theme.gradients.button
theme.gradients.inputBorder.*
theme.gradients.overlay

// Sombras
theme.shadows.input.*
theme.shadows.button.*
theme.shadows.glow.*

// Tipografia
theme.typography.fontFamily.*
theme.typography.fontSize.*
theme.typography.fontWeight.*
theme.typography.letterSpacing.*

// Espacamentos
theme.spacing.*

// Border Radius
theme.borderRadius.*

// Layout
theme.layout.desktop.*
theme.layout.pagePadding.*
theme.layout.input.*
theme.layout.button.*

// Animacoes
theme.animations.duration.*
theme.animations.easing.*
theme.animations.variants.*
theme.animations.transition.*

// BottomNav
theme.bottomNav.container.*
theme.bottomNav.step.*
theme.bottomNav.connector.*

// Z-Index
theme.zIndex.*

// Breakpoints
theme.breakpoints.*
```
