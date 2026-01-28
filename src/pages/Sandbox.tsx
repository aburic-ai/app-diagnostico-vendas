/**
 * Página Sandbox - Preview para Prints e Form Embed
 *
 * Página ilustrativa para:
 * 1. Pós-compra: form embed de pesquisa + preview do cockpit
 * 2. Prints promocionais: versões estáticas das telas principais
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket,
  Zap,
  Play,
  Check,
  Radio,
  Target,
  Lock,
  FileText,
  Camera,
  BookOpen,
  ShoppingCart,
  Info,
  AlertTriangle,
} from 'lucide-react'

import { PageWrapper, RadarChart, PageHeader } from '../components/ui'
import type { IMPACTData } from '../components/ui'
import { theme } from '../styles/theme'

// Dados mockados para os prints
const MOCK_DIAGNOSTIC: IMPACTData = {
  inspiracao: 8,
  motivacao: 7,
  preparacao: 6,
  apresentacao: 5,
  conversao: 3,
  transformacao: 7,
}

const IMPACT_LABELS = ['I', 'M', 'P', 'A', 'C', 'T']
const IMPACT_NAMES = ['Inspiração', 'Motivação', 'Preparação', 'Apresentação', 'Conversão', 'Transformação']
const SLIDER_VALUES = [8, 7, 6, 5, 3, 7]

type PreviewMode = 'form' | 'login' | 'pre-evento' | 'ao-vivo'

export function Sandbox() {
  const [activePreview, setActivePreview] = useState<PreviewMode>('form')

  const previews: { id: PreviewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'form', label: 'Pós-Compra', icon: <FileText size={16} /> },
    { id: 'login', label: 'Login', icon: <Lock size={16} /> },
    { id: 'pre-evento', label: 'Pré-Evento', icon: <Rocket size={16} /> },
    { id: 'ao-vivo', label: 'Ao Vivo', icon: <Radio size={16} /> },
  ]

  return (
    <PageWrapper
      backgroundColor={theme.colors.background.dark}
      showAnimatedBackground={true}
      showOverlay={false}
    >
      {/* Preview Selector */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'linear-gradient(180deg, rgba(5, 5, 5, 0.98) 0%, rgba(5, 5, 5, 0.9) 80%, transparent 100%)',
          padding: '12px 16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
          <Camera size={14} color={theme.colors.accent.purple.light} />
          <span style={{ fontSize: '10px', color: theme.colors.accent.purple.light, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            SANDBOX - PRINTS & FORMS
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {previews.map((preview) => (
            <motion.button
              key={preview.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivePreview(preview.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: activePreview === preview.id
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(124, 58, 237, 0.2) 100%)'
                  : 'rgba(100, 116, 139, 0.15)',
                border: `1px solid ${activePreview === preview.id ? 'rgba(168, 85, 247, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: activePreview === preview.id ? theme.colors.accent.purple.light : theme.colors.text.muted }}>
                {preview.icon}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: activePreview === preview.id ? theme.colors.text.primary : theme.colors.text.muted,
              }}>
                {preview.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 16px 40px',
        }}
      >
        {activePreview === 'form' && <PostPurchaseForm />}
        {activePreview === 'login' && <LoginPreview />}
        {activePreview === 'pre-evento' && <PreEventoPreview />}
        {activePreview === 'ao-vivo' && <AoVivoPreview />}
      </div>
    </PageWrapper>
  )
}

// ==================== PÓS-COMPRA FORM ====================
function PostPurchaseForm() {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '24px' }}
      >
        <div
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
            border: '2px solid rgba(34, 211, 238, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(34, 211, 238, 0.3)',
          }}
        >
          <FileText size={32} color={theme.colors.accent.cyan.DEFAULT} />
        </div>
        <h1 style={{
          fontFamily: theme.typography.fontFamily.orbitron,
          fontSize: '18px',
          fontWeight: 'bold',
          color: theme.colors.text.primary,
          textTransform: 'uppercase',
          margin: '0 0 8px 0',
        }}>
          PARABÉNS PELA SUA INSCRIÇÃO!
        </h1>
        <p style={{
          fontSize: '13px',
          color: theme.colors.text.secondary,
          lineHeight: 1.6,
          margin: 0,
        }}>
          Preencha o formulário abaixo para receber acesso ao seu <span style={{ color: theme.colors.accent.cyan.DEFAULT, fontWeight: 'bold' }}>Cockpit de Diagnóstico</span>
        </p>
      </motion.div>

      {/* Form Embed Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: 'rgba(10, 12, 18, 0.6)',
          border: '2px dashed rgba(34, 211, 238, 0.3)',
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        <Info size={32} color={theme.colors.text.muted} style={{ marginBottom: '12px' }} />
        <p style={{ fontSize: '12px', color: theme.colors.text.muted, margin: 0 }}>
          FORMULÁRIO DE PESQUISA EMBED
        </p>
        <p style={{ fontSize: '10px', color: theme.colors.text.muted, marginTop: '8px' }}>
          (Insira o iframe do Typeform/Google Forms aqui)
        </p>
        {/* Exemplo de como seria o iframe:
        <iframe
          src="https://seu-formulario.typeform.com/to/xxxxx"
          style={{ width: '100%', height: '500px', border: 'none' }}
        />
        */}
      </motion.div>

      {/* Cockpit Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h3 style={{
          fontSize: '12px',
          fontWeight: 'bold',
          color: theme.colors.accent.cyan.DEFAULT,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '16px',
        }}>
          SEU COCKPIT DE DIAGNÓSTICO
        </h3>

        {/* Mini previews side by side */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Login Mini */}
          <div style={{
            width: '90px',
            height: '160px',
            background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{ padding: '8px', textAlign: 'center' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(34, 211, 238, 0.2)',
                margin: '8px auto',
              }} />
              <div style={{ width: '50px', height: '4px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '2px', margin: '6px auto' }} />
              <div style={{ width: '50px', height: '4px', background: 'rgba(100, 116, 139, 0.3)', borderRadius: '2px', margin: '6px auto' }} />
              <div style={{ width: '40px', height: '10px', background: 'rgba(168, 85, 247, 0.4)', borderRadius: '4px', margin: '12px auto' }} />
            </div>
            <div style={{ position: 'absolute', bottom: '4px', left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ fontSize: '6px', color: theme.colors.text.muted }}>LOGIN</span>
            </div>
          </div>

          {/* PreEvento Mini */}
          <div style={{
            width: '90px',
            height: '160px',
            background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{ padding: '6px', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginBottom: '4px' }}>
                {['XX', ':', 'XX'].map((n, i) => (
                  <div key={i} style={{
                    width: i === 1 ? '6px' : '16px',
                    height: '14px',
                    background: 'rgba(34, 211, 238, 0.2)',
                    borderRadius: '2px',
                    fontSize: '6px',
                    color: theme.colors.accent.cyan.DEFAULT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>{n}</div>
                ))}
              </div>
              <div style={{ width: '60px', height: '3px', background: 'rgba(245, 158, 11, 0.4)', borderRadius: '1px', margin: '4px auto' }} />
              {[1,2,3].map(i => (
                <div key={i} style={{
                  width: '60px',
                  height: '20px',
                  background: 'rgba(100, 116, 139, 0.15)',
                  borderRadius: '3px',
                  margin: '4px auto',
                }} />
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: '4px', left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ fontSize: '6px', color: theme.colors.text.muted }}>PRÉ-EVENTO</span>
            </div>
          </div>

          {/* AoVivo Mini */}
          <div style={{
            width: '90px',
            height: '160px',
            background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{ padding: '6px', textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                margin: '4px auto',
                position: 'relative',
              }}>
                {/* Mini radar placeholder */}
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'conic-gradient(rgba(34, 211, 238, 0.3) 0deg, rgba(168, 85, 247, 0.3) 360deg)',
                  opacity: 0.5,
                }} />
              </div>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '3px 6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(34, 211, 238, 0.3)' }} />
                  <div style={{ flex: 1, height: '4px', background: i === 3 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 211, 238, 0.3)', borderRadius: '2px' }} />
                </div>
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: '4px', left: 0, right: 0, textAlign: 'center' }}>
              <span style={{ fontSize: '6px', color: theme.colors.text.muted }}>AO VIVO</span>
            </div>
          </div>
        </div>

        <p style={{
          fontSize: '10px',
          color: theme.colors.text.secondary,
          marginTop: '16px',
          lineHeight: 1.5,
        }}>
          Após preencher a pesquisa, você receberá acesso ao seu cockpit personalizado para acompanhar o evento.
        </p>
      </motion.div>
    </div>
  )
}

// ==================== LOGIN PREVIEW (para print) ====================
function LoginPreview() {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.98) 0%, rgba(10, 12, 18, 0.99) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '24px',
          padding: '40px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Brain/Logo placeholder */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '2px solid rgba(34, 211, 238, 0.4)',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 60px rgba(34, 211, 238, 0.3), 0 0 100px rgba(168, 85, 247, 0.2)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #22D3EE 0%, #A855F7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🧠
          </span>
        </motion.div>

        {/* Title */}
        <h1 style={{
          fontFamily: theme.typography.fontFamily.body,
          fontSize: '11px',
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          margin: '0 0 4px 0',
          position: 'relative',
          zIndex: 1,
        }}>
          IMERSÃO ONLINE
        </h1>
        <h2 style={{
          fontFamily: theme.typography.fontFamily.orbitron,
          fontSize: '20px',
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.accent.cyan.DEFAULT,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
          margin: '0 0 32px 0',
          position: 'relative',
          zIndex: 1,
        }}>
          DIAGNÓSTICO DE VENDAS
        </h2>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
          <input
            type="email"
            placeholder="E-mail"
            disabled
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(10, 12, 18, 0.8)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '12px',
              color: theme.colors.text.muted,
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <input
            type="password"
            placeholder="Senha"
            disabled
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(10, 12, 18, 0.8)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '12px',
              color: theme.colors.text.muted,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(124, 58, 237, 0.3) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.5)',
            borderRadius: '12px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: '13px',
            fontWeight: 'bold',
            color: theme.colors.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            ACESSAR COCKPIT
          </span>
        </motion.button>
      </div>

      <p style={{ fontSize: '10px', color: theme.colors.text.muted, textAlign: 'center', marginTop: '16px' }}>
        Preview para captura de tela - Login
      </p>
    </div>
  )
}

// ==================== PRÉ-EVENTO PREVIEW (para print) ====================
function PreEventoPreview() {
  const journeySteps = [
    { id: 'imersao', label: 'Imersão Diagnóstico de Vendas', xp: 50, status: 'completed' as const },
    { id: 'protocolo', label: 'Protocolo de Iniciação', xp: 100, status: 'completed' as const },
    { id: 'perfil', label: 'Complete seu Perfil', xp: 75, status: 'current' as const },
    { id: 'dossie', label: 'Dossiê do Negócio', status: 'purchase' as const },
    { id: 'aulas-editadas', label: 'Aulas Editadas', status: 'purchase' as const },
    { id: 'bonus', label: 'Assistir Aulas Bônus', xp: 50, status: 'current' as const },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.colors.accent.cyan.DEFAULT
      case 'current': return theme.colors.accent.purple.light
      case 'purchase': return theme.colors.gold.DEFAULT
      default: return theme.colors.text.muted
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check size={14} />
      case 'current': return null
      case 'purchase': return <ShoppingCart size={14} />
      default: return <Lock size={14} />
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.98) 0%, rgba(10, 12, 18, 0.99) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '24px',
          padding: '20px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{
            fontFamily: theme.typography.fontFamily.body,
            fontSize: '10px',
            color: theme.colors.text.secondary,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            margin: '0 0 4px 0',
          }}>
            IMERSÃO ONLINE
          </h1>
          <h2 style={{
            fontFamily: theme.typography.fontFamily.orbitron,
            fontSize: '16px',
            fontWeight: 'bold',
            color: theme.colors.accent.cyan.DEFAULT,
            textShadow: '0 0 20px rgba(34, 211, 238, 0.5)',
            margin: 0,
          }}>
            DIAGNÓSTICO DE VENDAS
          </h2>
        </div>

        {/* Countdown with XX DIAS */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '10px', color: theme.colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            COMEÇA EM
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
            {['XX', 'XX', 'XX', 'XX'].map((val, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'rgba(34, 211, 238, 0.15)',
                  border: '1px solid rgba(34, 211, 238, 0.4)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: theme.typography.fontFamily.orbitron,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: theme.colors.accent.cyan.DEFAULT,
                  }}>
                    {val}
                  </span>
                </div>
                <span style={{ fontSize: '8px', color: theme.colors.text.muted, marginTop: '4px' }}>
                  {['DIAS', 'HORAS', 'MIN', 'SEG'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* XP Box - Nível de Prontidão */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color={theme.colors.gold.DEFAULT} />
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT }}>
                NÍVEL DE PRONTIDÃO
              </span>
            </div>
            <span style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '14px', fontWeight: 'bold', color: theme.colors.gold.DEFAULT }}>
              150 / 200 XP
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'rgba(30, 35, 45, 0.8)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: '75%',
              height: '100%',
              background: `linear-gradient(90deg, ${theme.colors.gold.DEFAULT} 0%, ${theme.colors.gold.light} 100%)`,
              borderRadius: '4px',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
            }} />
          </div>
          <span style={{ fontSize: '9px', color: theme.colors.text.muted, marginTop: '6px', display: 'block' }}>
            75% DO SISTEMA PREPARADO
          </span>
        </div>

        {/* Journey Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {journeySteps.map((step) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: step.status === 'current'
                  ? 'rgba(168, 85, 247, 0.1)'
                  : 'rgba(10, 12, 18, 0.6)',
                border: `1px solid ${step.status === 'current' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(100, 116, 139, 0.2)'}`,
                borderRadius: '10px',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `${getStatusColor(step.status)}20`,
                border: `1px solid ${getStatusColor(step.status)}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getStatusColor(step.status),
              }}>
                {getStatusIcon(step.status) || <Rocket size={14} />}
              </div>
              <span style={{
                flex: 1,
                fontSize: '11px',
                fontWeight: step.status === 'current' ? 'bold' : 'normal',
                color: step.status === 'completed' ? theme.colors.text.secondary : theme.colors.text.primary,
              }}>
                {step.label}
              </span>
              {step.xp && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  background: `${getStatusColor(step.status)}15`,
                  borderRadius: '6px',
                }}>
                  <Zap size={10} color={getStatusColor(step.status)} />
                  <span style={{ fontSize: '9px', color: getStatusColor(step.status), fontWeight: 'bold' }}>
                    +{step.xp} XP
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Aulas Bônus Grid */}
        <div style={{
          background: 'rgba(10, 12, 18, 0.6)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '12px',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <BookOpen size={14} color={theme.colors.accent.cyan.DEFAULT} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, textTransform: 'uppercase' }}>
              AULAS BÔNUS
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                padding: '10px',
                background: 'linear-gradient(135deg, rgba(10, 15, 20, 0.8) 0%, rgba(5, 10, 18, 0.9) 100%)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(34, 211, 238, 0.15)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 6px',
                }}>
                  <Play size={14} color={theme.colors.accent.cyan.DEFAULT} fill={theme.colors.accent.cyan.DEFAULT} />
                </div>
                <span style={{ fontSize: '9px', color: theme.colors.text.primary, fontWeight: 'bold' }}>
                  Aula {i}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '10px', color: theme.colors.text.muted, textAlign: 'center', marginTop: '16px' }}>
        Preview para captura de tela - Pré-Evento (countdown XX DIAS)
      </p>
    </div>
  )
}

// ==================== AO VIVO PREVIEW (para print - sem botão estou assistindo) ====================
function AoVivoPreview() {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.98) 0%, rgba(10, 12, 18, 0.99) 100%)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '24px',
          padding: '20px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <PageHeader
          title="IMERSÃO ONLINE"
          subtitle="DIAGNÓSTICO DE VENDAS"
          marginBottom="16px"
          centered={true}
        />

        {/* Live Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <motion.div
            animate={{ boxShadow: ['0 0 10px rgba(239, 68, 68, 0.3)', '0 0 20px rgba(239, 68, 68, 0.5)', '0 0 10px rgba(239, 68, 68, 0.3)'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#EF4444',
                boxShadow: '0 0 8px #EF4444',
              }}
            />
            <Radio size={14} color="#EF4444" />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              AO VIVO
            </span>
          </motion.div>
        </div>

        {/* Day Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
          {[1, 2].map(day => (
            <div
              key={day}
              style={{
                padding: '8px 20px',
                background: day === 1 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(100, 116, 139, 0.1)',
                border: `1px solid ${day === 1 ? 'rgba(168, 85, 247, 0.5)' : 'rgba(100, 116, 139, 0.2)'}`,
                borderRadius: '8px',
              }}
            >
              <span style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: day === 1 ? theme.colors.accent.purple.light : theme.colors.text.muted,
              }}>
                DIA {day}
              </span>
            </div>
          ))}
        </div>

        {/* Radar Chart */}
        <div style={{
          background: 'rgba(10, 12, 18, 0.6)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <RadarChart data1={MOCK_DIAGNOSTIC} selectedDay={1} size={200} />
        </div>

        {/* Sliders */}
        <div style={{
          background: 'rgba(10, 12, 18, 0.6)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Target size={16} color={theme.colors.accent.cyan.DEFAULT} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.colors.accent.cyan.DEFAULT, textTransform: 'uppercase' }}>
              DIAGNÓSTICO IMPACT
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {IMPACT_LABELS.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: SLIDER_VALUES[i] > 0 ? 'rgba(34, 211, 238, 0.2)' : 'rgba(100, 116, 139, 0.15)',
                  border: `1px solid ${SLIDER_VALUES[i] > 0 ? 'rgba(34, 211, 238, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: SLIDER_VALUES[i] > 0 ? theme.colors.accent.cyan.DEFAULT : theme.colors.text.muted,
                }}>
                  {label}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', color: theme.colors.text.muted, marginBottom: '3px' }}>{IMPACT_NAMES[i]}</div>
                  <div style={{ position: 'relative', height: '6px', background: 'rgba(30, 35, 45, 0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${SLIDER_VALUES[i] * 10}%`,
                      height: '100%',
                      background: SLIDER_VALUES[i] <= 4
                        ? 'linear-gradient(90deg, #EF4444 0%, #F87171 100%)'
                        : SLIDER_VALUES[i] <= 6
                          ? 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)'
                          : 'linear-gradient(90deg, #22D3EE 0%, #67E8F9 100%)',
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>
                <span style={{
                  width: '24px',
                  textAlign: 'center',
                  fontFamily: theme.typography.fontFamily.orbitron,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: SLIDER_VALUES[i] <= 4 ? '#EF4444' : SLIDER_VALUES[i] <= 6 ? theme.colors.gold.DEFAULT : theme.colors.accent.cyan.DEFAULT,
                }}>
                  {SLIDER_VALUES[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gargalo Alert */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#EF4444" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '9px', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                GARGALO IDENTIFICADO
              </span>
              <h3 style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '14px', fontWeight: 'bold', color: '#EF4444', margin: 0 }}>
                CONVERSÃO
              </h3>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontFamily: theme.typography.fontFamily.orbitron, fontSize: '16px', fontWeight: 'bold', color: '#EF4444' }}>3</span>
            </div>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '10px', color: theme.colors.text.muted, textAlign: 'center', marginTop: '16px' }}>
        Preview para captura de tela - Ao Vivo (sem botão "estou assistindo")
      </p>
    </div>
  )
}
