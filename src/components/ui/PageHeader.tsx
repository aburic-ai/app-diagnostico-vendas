/**
 * PageHeader - Cabecalho padrao de pagina
 *
 * Estrutura invertida:
 * - Titulo menor em branco (IMERSAO ONLINE)
 * - Subtitulo maior em cyan com glow (DIAGNOSTICO DE VENDAS)
 */

import { motion } from 'framer-motion'
import { theme } from '../../styles/theme'

interface PageHeaderProps {
  /** Titulo superior menor (default: "IMERSAO ONLINE") */
  title?: string
  /** Subtitulo principal com glow (default: "DIAGNOSTICO DE VENDAS") */
  subtitle?: string
  /** Centralizar texto */
  centered?: boolean
  /** Margem inferior */
  marginBottom?: string
}

export function PageHeader({
  title = 'IMERSAO ONLINE',
  subtitle = 'DIAGNOSTICO DE VENDAS',
  centered = true,
  marginBottom = '20px',
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        textAlign: centered ? 'center' : 'left',
        marginBottom,
      }}
    >
      {/* Titulo menor em cinza */}
      <h1
        style={{
          fontFamily: theme.typography.fontFamily.body,
          fontSize: '11px',
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 1,
        }}
      >
        {title}
      </h1>
      {/* Subtitulo maior em cyan com glow */}
      <h2
        style={{
          fontFamily: theme.typography.fontFamily.orbitron,
          fontSize: '22px',
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.accent.cyan.DEFAULT,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textShadow: `
            0 0 20px rgba(34, 211, 238, 0.6),
            0 0 40px rgba(34, 211, 238, 0.4),
            0 0 60px rgba(34, 211, 238, 0.2)
          `,
          margin: 0,
          marginTop: '4px',
          lineHeight: 1.2,
        }}
      >
        {subtitle}
      </h2>
    </motion.div>
  )
}
