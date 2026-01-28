/**
 * AIChatInterface - Interface completa do chat com IA
 *
 * Mostra contexto do usuário, prompts sugeridos, histórico de mensagens
 * Só funciona durante o evento ao vivo
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, User, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react'
import { theme } from '../../styles/theme'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UserContext {
  name: string
  businessType: string
  gargalo: { etapa: string; valor: number }
  diagnostico: {
    inspiracao: number
    motivacao: number
    preparacao: number
    apresentacao: number
    conversao: number
    transformacao: number
  }
}

interface AIChatInterfaceProps {
  /** Contexto do usuário para personalização */
  userContext: UserContext
  /** Se o chat está disponível (só durante evento) */
  isAvailable?: boolean
  /** Callback para voltar */
  onBack?: () => void
  /** Callback para enviar mensagem */
  onSendMessage?: (message: string) => void
}

const suggestedPrompts = [
  { id: '1', label: 'Simular objeção de preço', prompt: 'Simule uma objeção de preço do meu cliente e me ajude a responder' },
  { id: '2', label: 'Analisar meu pitch', prompt: 'Me ajude a analisar e melhorar meu pitch de vendas' },
  { id: '3', label: 'Melhorar apresentação', prompt: 'Como posso melhorar minha apresentação comercial?' },
  { id: '4', label: 'Script de follow-up', prompt: 'Me ajude a criar um script de follow-up para leads frios' },
]

export function AIChatInterface({
  userContext,
  isAvailable = true,
  onBack,
  onSendMessage,
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Olá ${userContext.name.split(' ')[0]}! Sou seu consultor de vendas IA. Baseado no seu diagnóstico, percebi que seu principal gargalo está em **${userContext.gargalo.etapa}** (${userContext.gargalo.valor}/10). Como posso ajudar você a melhorar nessa área?`,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = () => {
    if (!inputValue.trim() || !isAvailable) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Entendo sua pergunta sobre "${inputValue.slice(0, 50)}...". Com base no seu perfil de ${userContext.businessType} e considerando que seu gargalo está em ${userContext.gargalo.etapa}, recomendo focar em...

[Esta é uma simulação. No app final, aqui virá a resposta real da IA contextualizada]`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)

    onSendMessage?.(inputValue.trim())
  }

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme.colors.background.dark,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(168, 85, 247, 0.3)',
          background: 'linear-gradient(180deg, rgba(10, 12, 18, 0.98) 0%, rgba(5, 8, 12, 0.95) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={20} color={theme.colors.text.secondary} />
            </motion.button>
          )}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(124, 58, 237, 0.1) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={24} color={theme.colors.accent.purple.light} />
          </div>
          <div>
            <h3
              style={{
                fontFamily: theme.typography.fontFamily.orbitron,
                fontSize: '14px',
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.accent.purple.light,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              SIMULADOR DE VENDAS IA
            </h3>
            <p
              style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                margin: '2px 0 0 0',
              }}
            >
              Consultor personalizado para seu negócio
            </p>
          </div>
        </div>
      </div>

      {/* Context Card */}
      <div
        style={{
          margin: '16px 16px 0 16px',
          padding: '12px 16px',
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Sparkles size={14} color={theme.colors.accent.purple.light} />
          <span
            style={{
              fontSize: '10px',
              color: theme.colors.accent.purple.light,
              textTransform: 'uppercase',
              fontWeight: theme.typography.fontWeight.bold,
              letterSpacing: '0.05em',
            }}
          >
            Contexto do seu diagnóstico
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: theme.colors.text.secondary,
          }}
        >
          <span>Negócio: {userContext.businessType}</span>
          <span style={{ color: '#EF4444' }}>
            Gargalo: {userContext.gargalo.etapa} ({userContext.gargalo.valor}/10)
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: message.role === 'assistant'
                    ? 'rgba(168, 85, 247, 0.2)'
                    : 'rgba(34, 211, 238, 0.2)',
                  border: `1px solid ${message.role === 'assistant' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(34, 211, 238, 0.4)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {message.role === 'assistant' ? (
                  <Bot size={16} color={theme.colors.accent.purple.light} />
                ) : (
                  <User size={16} color={theme.colors.accent.cyan.DEFAULT} />
                )}
              </div>

              {/* Message bubble */}
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 14px',
                  background: message.role === 'assistant'
                    ? 'rgba(15, 17, 21, 0.8)'
                    : 'rgba(34, 211, 238, 0.15)',
                  border: `1px solid ${message.role === 'assistant' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(34, 211, 238, 0.3)'}`,
                  borderRadius: message.role === 'assistant'
                    ? '4px 14px 14px 14px'
                    : '14px 4px 14px 14px',
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    color: theme.colors.text.primary,
                    margin: 0,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={16} color={theme.colors.accent.purple.light} />
            </div>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                padding: '12px 16px',
                background: 'rgba(15, 17, 21, 0.8)',
                borderRadius: '4px 14px 14px 14px',
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: theme.colors.accent.purple.light,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div
          style={{
            padding: '0 16px 16px 16px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: theme.colors.text.muted,
              marginBottom: '10px',
            }}
          >
            Sugestões rápidas:
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
            }}
          >
            {suggestedPrompts.map((prompt) => (
              <motion.button
                key={prompt.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePromptClick(prompt.prompt)}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '10px',
                  color: theme.colors.text.secondary,
                  fontSize: '11px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {prompt.label}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Not Available Warning */}
      {!isAvailable && (
        <div
          style={{
            margin: '0 16px 16px 16px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={20} color="#EF4444" />
          <p
            style={{
              fontSize: '12px',
              color: '#EF4444',
              margin: 0,
            }}
          >
            Chat disponível apenas durante o evento ao vivo
          </p>
        </div>
      )}

      {/* Input Area */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgba(100, 116, 139, 0.2)',
          background: 'rgba(5, 8, 12, 0.95)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'rgba(15, 17, 21, 0.8)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Digite sua pergunta..."
              disabled={!isAvailable}
              rows={1}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: theme.colors.text.primary,
                fontSize: '14px',
                resize: 'none',
                fontFamily: theme.typography.fontFamily.body,
              }}
            />
          </div>
          <motion.button
            whileHover={isAvailable && inputValue.trim() ? { scale: 1.05 } : {}}
            whileTap={isAvailable && inputValue.trim() ? { scale: 0.95 } : {}}
            onClick={handleSend}
            disabled={!isAvailable || !inputValue.trim()}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: isAvailable && inputValue.trim()
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)'
                : 'rgba(100, 116, 139, 0.2)',
              border: 'none',
              cursor: isAvailable && inputValue.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Send
              size={20}
              color={isAvailable && inputValue.trim() ? '#fff' : theme.colors.text.muted}
            />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
