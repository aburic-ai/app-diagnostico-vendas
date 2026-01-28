/**
 * TEMPLATE - Use este arquivo como base para criar novas páginas
 *
 * Copie este arquivo, renomeie e modifique conforme necessário.
 * Mantém consistência automática com o Design System.
 */

import { motion } from 'framer-motion'

// SEMPRE importar do tema e componentes centralizados
import { PageWrapper, Input, Button } from '../components/ui'
import { theme } from '../styles/theme'

export function TemplatePage() {
  return (
    <PageWrapper
      // Opções de background:
      backgroundImage="/sua-imagem.jpg"  // ou remova para usar só cor
      backgroundColor={theme.colors.background.void}
      backgroundPosition="center top"

      // Opções de efeitos:
      showAnimatedBackground={true}  // Canvas com partículas
      showOverlay={true}             // Gradiente escuro
      overlayGradient={theme.gradients.overlay}  // Gradiente customizado
    >
      {/* Container de conteúdo */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end', // ou 'center', 'flex-start'
          padding: `0 ${theme.layout.pagePadding.x} ${theme.layout.pagePadding.bottom} ${theme.layout.pagePadding.x}`,
        }}
      >
        {/* Animação de entrada */}
        <motion.div
          initial={theme.animations.variants.slideUp.hidden}
          animate={theme.animations.variants.slideUp.visible}
          transition={theme.animations.transition.smooth}
        >
          {/* ==================== */}
          {/* SEU CONTEÚDO AQUI   */}
          {/* ==================== */}

          {/* Exemplo de título */}
          <h1
            style={{
              fontFamily: theme.typography.fontFamily.display,
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.accent.cyan.DEFAULT,
              marginBottom: theme.spacing.lg,
              textAlign: 'center',
            }}
          >
            Título da Página
          </h1>

          {/* Exemplo de Input */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <Input
              type="text"
              placeholder="Digite algo..."
            />
          </div>

          {/* Exemplo de Botão Primary */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <Button variant="primary" withBeam>
              BOTÃO PRIMÁRIO
            </Button>
          </div>

          {/* Exemplo de Botão Secondary */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <Button variant="secondary">
              BOTÃO SECUNDÁRIO
            </Button>
          </div>

          {/* Exemplo de Botão Ghost */}
          <Button variant="ghost">
            Botão Ghost
          </Button>
        </motion.div>
      </div>
    </PageWrapper>
  )
}

/**
 * CHECKLIST PARA NOVA PÁGINA:
 *
 * [ ] Importou PageWrapper, Input, Button de '../components/ui'
 * [ ] Importou theme de '../styles/theme'
 * [ ] Usou tokens do theme (cores, espaçamentos, tipografia)
 * [ ] Usou animações do theme.animations
 * [ ] Não usou valores hardcoded de cores/tamanhos
 * [ ] Testou no mobile E desktop
 */
