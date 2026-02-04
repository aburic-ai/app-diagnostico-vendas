/**
 * Hook useAIChat
 *
 * Gerencia chat IA durante o evento
 * - Cria/carrega conversation_id
 * - Envia mensagens → Edge Function
 * - Recebe respostas em tempo real
 * - Salva tudo no Supabase
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokens_used?: number
}

// UUID v4 generator compatible with iOS Safari
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for browsers without crypto.randomUUID (iOS Safari < 15.4)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface UseAIChatProps {
  event_day: number
  module_id: number
}

export function useAIChat({ event_day, module_id }: UseAIChatProps) {
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================
  // INITIALIZE CONVERSATION
  // ============================================

  useEffect(() => {
    if (!user) {
      console.log('[useAIChat] No user, skipping initialization')
      return
    }

    const initConversation = async () => {
      console.log('[useAIChat] ===== INIT START =====')
      console.log('[useAIChat] User ID:', user.id)
      console.log('[useAIChat] Event Day:', event_day)
      console.log('[useAIChat] Module ID:', module_id)

      try {
        // Try to find the LAST active conversation (ignoring day/module)
        // This allows conversation to persist across modules and days
        console.log('[useAIChat] STEP 1: Searching for existing conversation...')
        const { data: existingList, error: existingError } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('user_id', user.id)
          .is('ended_at', null) // Ainda ativa
          .order('created_at', { ascending: false })
          .limit(1)

        console.log('[useAIChat] STEP 1 RESULT:', {
          existingList,
          hasError: !!existingError,
          errorDetails: existingError
        })

        if (existingError) {
          console.error('[useAIChat] ❌ Error finding conversation:', existingError)
          throw existingError
        }

        const existing = existingList && existingList.length > 0 ? existingList[0] : null
        console.log('[useAIChat] Existing conversation?', existing ? `YES (${existing.id})` : 'NO')

        if (existing) {
          console.log('[useAIChat] ✅ Found existing conversation:', existing.id)
          setConversationId(existing.id)
          console.log('[useAIChat] STEP 2: Loading messages for conversation:', existing.id)
          await loadMessages(existing.id)
          console.log('[useAIChat] ✅ Messages loaded successfully')
        } else {
          // Create new conversation
          console.log('[useAIChat] STEP 2: Creating NEW conversation...')
          const { data: newConv, error: newConvError } = await supabase
            .from('chat_conversations')
            .insert({
              user_id: user.id,
              event_day,
              module_id,
            })
            .select('id')
            .single()

          console.log('[useAIChat] STEP 2 RESULT:', {
            newConv,
            hasError: !!newConvError,
            errorDetails: newConvError
          })

          if (newConvError) {
            console.error('[useAIChat] ❌ Error creating conversation:', newConvError)
            throw newConvError
          }

          if (newConv) {
            console.log('[useAIChat] ✅ Created new conversation:', newConv.id)
            setConversationId(newConv.id)
          } else {
            console.error('[useAIChat] ❌ CRITICAL: newConv is null/undefined!')
            throw new Error('Failed to create conversation: no data returned')
          }
        }

        console.log('[useAIChat] ===== INIT SUCCESS =====')
      } catch (err) {
        console.error('[useAIChat] ===== INIT FAILED =====')
        console.error('[useAIChat] Init error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Erro ao inicializar chat'
        setError(errorMessage)
      }
    }

    initConversation()
  }, [user, event_day, module_id])

  // ============================================
  // LOAD MESSAGE HISTORY
  // ============================================

  const loadMessages = async (convId: string) => {
    console.log('[useAIChat] Loading messages for conversation:', convId)

    try {
      const { data, error: loadError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (loadError) {
        console.error('[useAIChat] Error loading messages:', loadError)
        throw loadError
      }

      console.log('[useAIChat] Raw data from DB:', data)

      const loadedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        tokens_used: msg.tokens_used,
      }))

      console.log('[useAIChat] Loaded', loadedMessages.length, 'messages:', loadedMessages)
      setMessages(loadedMessages)
    } catch (err) {
      console.error('[useAIChat] Load error:', err)
    }
  }

  // ============================================
  // SEND MESSAGE
  // ============================================

  const sendMessage = async (content: string) => {
    console.log('[useAIChat] ===== SEND MESSAGE ATTEMPT =====')
    console.log('[useAIChat] User:', user?.id)
    console.log('[useAIChat] ConversationId:', conversationId)
    console.log('[useAIChat] Content length:', content.trim().length)

    if (!user || !conversationId || !content.trim()) {
      console.error('[useAIChat] ❌ Cannot send message:', {
        hasUser: !!user,
        conversationId,
        hasContent: !!content.trim()
      })

      let errorMsg = 'Erro: '
      if (!user) errorMsg += 'usuário não autenticado'
      else if (!conversationId) errorMsg += 'conversa não inicializada (conversationId é null). Recarregue a página.'
      else errorMsg += 'mensagem vazia'

      setError(errorMsg)
      return
    }

    console.log('[useAIChat] ✅ All checks passed, sending message:', content.substring(0, 50) + '...')

    setLoading(true)
    setError(null)

    // Optimistic update - add user message immediately
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Verificar autenticação
      console.log('[useAIChat] 🔐 Step 1: Getting session...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[useAIChat] ✅ Step 1: Session obtained:', !!session)

      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      // Call Edge Function via direct fetch (mesmo padrão de useActionPlan)
      console.log('[useAIChat] 🚀 Step 2: Calling chat-completion with:', {
        user_id: user.id,
        conversation_id: conversationId,
        event_day,
        module_id,
      })

      console.log('[useAIChat] 📡 Step 3: Fetching:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-completion`)

      // iOS Safari-compatible timeout using Promise.race
      console.log('[useAIChat] 🏁 Step 4: Creating fetch promise...')
      const fetchPromise = fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-completion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            conversation_id: conversationId,
            message: content.trim(),
            event_day,
            module_id,
          }),
        }
      )

      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => {
          console.error('[useAIChat] Request timeout after 30s')
          reject(new Error('TIMEOUT'))
        }, 30000) // 30 segundos
      })

      console.log('[useAIChat] ⏳ Step 5: Waiting for response (max 30s)...')
      const response = await Promise.race([fetchPromise, timeoutPromise])
      console.log('[useAIChat] ✅ Step 6: Response received!')

      console.log('[useAIChat] Response status:', response.status)
      console.log('[useAIChat] Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[useAIChat] Edge Function error response:', errorText)
        console.error('[useAIChat] Response headers:', Object.fromEntries(response.headers.entries()))
        throw new Error(`Erro ao enviar mensagem: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('[useAIChat] Response data:', data)

      if (data.success) {
        console.log('[useAIChat] Received response, tokens:', data.tokens_used)

        // Add assistant response
        const assistantMessage: Message = {
          id: generateUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          tokens_used: data.tokens_used,
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        console.error('[useAIChat] Response not successful:', data)
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }
    } catch (err: any) {
      console.error('[useAIChat] Send error details:', {
        name: err.name,
        message: err.message,
        type: typeof err,
        constructor: err.constructor?.name,
        fullError: err
      })

      // Tratamento específico para timeout
      let errorMessage = err.message || err.toString() || 'Erro ao enviar mensagem'

      if (errorMessage.includes('TIMEOUT')) {
        errorMessage = 'TIMEOUT (30s): A requisição demorou muito.\n\nPossíveis causas:\n• OpenAI API está lenta\n• Edge Function travou\n• Conexão de rede instável\n\nTente novamente ou recarregue a página.'
        console.error('[useAIChat] TIMEOUT DETECTED')
      }

      console.error('[useAIChat] Final error message:', errorMessage)
      setError(errorMessage)

      // Remove optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      console.log('[useAIChat] Finally block - setting loading to false')
      setLoading(false)
    }
  }

  // ============================================
  // END CONVERSATION
  // ============================================

  const endConversation = async () => {
    if (!conversationId) return

    console.log('[useAIChat] Ending conversation:', conversationId)

    const { error: endError } = await supabase
      .from('chat_conversations')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', conversationId)

    if (endError) {
      console.error('[useAIChat] Error ending conversation:', endError)
    }
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    endConversation,
    conversationId,
    hasMessages: messages.length > 0,
  }
}
