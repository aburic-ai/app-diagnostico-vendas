/**
 * AIChatInterface - Interface completa do chat com IA
 *
 * Mostra contexto do usuário, prompts sugeridos, histórico de mensagens
 * Só funciona durante o evento ao vivo
 * INTEGRADO COM OPENAI GPT-4o-mini
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, User, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react'
import { theme } from '../../styles/theme'
import { useAIChat } from '../../hooks/useAIChat'

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
  /** Dia do evento (1 ou 2) */
  event_day: number
  /** ID do módulo atual */
  module_id: number
}

const suggestedPrompts = [
  { id: '1', label: 'Simular objeção de preço', prompt: 'Simule uma objeção de preço do meu cliente e me ajude a responder' },
  { id: '2', label: 'Analisar meu pitch', prompt: 'Me ajude a analisar e melhorar meu pitch de vendas' },
  { id: '3', label: 'Melhorar apresentação', prompt: 'Como posso melhorar minha apresentação comercial?' },
  { id: '4', label: 'Script de follow-up', prompt: 'Me ajude a criar um script de follow-up para leads frios' },
]

export function AIChatInterface({
  userContext: _userContext,
  isAvailable = true,
  onBack,
  event_day,
  module_id,
}: AIChatInterfaceProps) {
  // Use real AI chat hook
  const { messages, loading, error, sendMessage, conversationId } = useAIChat({
    event_day,
    module_id,
  })

  const [inputValue, setInputValue] = useState('')
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const DEBUG_MODE = false // Debug desativado - chat funcionando!

  const addDebugLog = (log: string) => {
    if (DEBUG_MODE) {
      setDebugLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${log}`])
    }
  }

  const handleSend = async () => {
    addDebugLog('🎯 handleSend called')
    if (!inputValue.trim() || !isAvailable || loading) {
      addDebugLog(`❌ Early return: input=${!!inputValue.trim()}, available=${isAvailable}, loading=${loading}`)
      return
    }
    addDebugLog('✅ Calling sendMessage')

    try {
      await sendMessage(inputValue.trim())
      addDebugLog('✅ sendMessage completed')
    } catch (err) {
      addDebugLog(`❌ sendMessage error: ${err}`)
    }

    setInputValue('')
  }

  const handlePromptClick = (prompt: string) => {
    addDebugLog(`📝 Prompt clicked: ${prompt.substring(0, 30)}...`)
    setInputValue(prompt)
  }

  // Monitor hook state changes
  useEffect(() => {
    addDebugLog(`🔄 loading changed: ${loading}`)
  }, [loading])

  useEffect(() => {
    if (error) addDebugLog(`❌ error changed: ${error}`)
  }, [error])

  useEffect(() => {
    addDebugLog(`💬 messages count: ${messages.length}`)
  }, [messages.length])

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
            Contexto do seu negócio
          </span>
        </div>
        <p
          style={{
            fontSize: '11px',
            color: theme.colors.text.secondary,
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Usando sua pesquisa de boas-vindas, seu radar IMPACT e as respostas anteriores deste chat
        </p>
      </div>

      {/* DEBUG LOGS - Visível na tela */}
      {DEBUG_MODE && debugLogs.length > 0 && (
        <div
          style={{
            margin: '16px 16px 0 16px',
            padding: '8px 12px',
            background: 'rgba(0, 255, 0, 0.1)',
            border: '1px solid rgba(0, 255, 0, 0.3)',
            borderRadius: '8px',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          <p
            style={{
              fontSize: '9px',
              color: '#0F0',
              fontFamily: 'monospace',
              margin: '0 0 4px 0',
              fontWeight: 'bold',
            }}
          >
            🐛 DEBUG LOGS:
          </p>
          {debugLogs.map((log, i) => (
            <p
              key={i}
              style={{
                fontSize: '8px',
                color: '#0F0',
                fontFamily: 'monospace',
                margin: '2px 0',
                lineHeight: 1.2,
              }}
            >
              {log}
            </p>
          ))}
        </div>
      )}

      {/* Initialization Error Warning */}
      {!conversationId && !loading && (
        <div
          style={{
            margin: '16px 16px 0 16px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#EF4444',
                margin: '0 0 6px 0',
              }}
            >
              Erro ao inicializar chat
            </p>
            <p
              style={{
                fontSize: '11px',
                color: '#EF4444',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              A conversa não foi inicializada. Por favor, recarregue a página. Se o problema persistir, tire um print e envie para o suporte.
            </p>
          </div>
        </div>
      )}

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

        {/* Typing indicator (loading) */}
        {loading && (
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

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertCircle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#EF4444',
                    margin: '0 0 6px 0',
                  }}
                >
                  Erro ao enviar mensagem
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#EF4444',
                    margin: 0,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    opacity: 0.9,
                  }}
                >
                  {error}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: 'rgba(239, 68, 68, 0.7)',
                    margin: '6px 0 0 0',
                    fontStyle: 'italic',
                  }}
                >
                  Por favor, tire um print desta mensagem e envie para o suporte.
                </p>
              </div>
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
              disabled={!isAvailable || loading}
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
            whileHover={isAvailable && inputValue.trim() && !loading ? { scale: 1.05 } : {}}
            whileTap={isAvailable && inputValue.trim() && !loading ? { scale: 0.95 } : {}}
            onClick={handleSend}
            disabled={!isAvailable || !inputValue.trim() || loading}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: isAvailable && inputValue.trim() && !loading
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)'
                : 'rgba(100, 116, 139, 0.2)',
              border: 'none',
              cursor: isAvailable && inputValue.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Send
              size={20}
              color={isAvailable && inputValue.trim() && !loading ? '#fff' : theme.colors.text.muted}
            />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
