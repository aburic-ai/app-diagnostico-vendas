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
      console.log('[useAIChat] Initializing conversation for', { user_id: user.id, event_day, module_id })

      try {
        // Try to find the LAST active conversation (ignoring day/module)
        // This allows conversation to persist across modules and days
        const { data: existingList, error: existingError } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('user_id', user.id)
          .is('ended_at', null) // Ainda ativa
          .order('created_at', { ascending: false })
          .limit(1)

        if (existingError) {
          console.error('[useAIChat] Error finding conversation:', existingError)
          throw existingError
        }

        const existing = existingList && existingList.length > 0 ? existingList[0] : null

        if (existing) {
          console.log('[useAIChat] Found existing conversation:', existing.id)
          setConversationId(existing.id)
          // Load messages AFTER setting conversation ID
          console.log('[useAIChat] Loading existing messages...')
          await loadMessages(existing.id)
          console.log('[useAIChat] Messages loaded successfully')
        } else {
          // Create new conversation
          console.log('[useAIChat] Creating new conversation')
          const { data: newConv, error: newConvError } = await supabase
            .from('chat_conversations')
            .insert({
              user_id: user.id,
              event_day,
              module_id,
            })
            .select('id')
            .single()

          if (newConvError) {
            console.error('[useAIChat] Error creating conversation:', newConvError)
            throw newConvError
          }

          if (newConv) {
            console.log('[useAIChat] Created new conversation:', newConv.id)
            setConversationId(newConv.id)
          }
        }
      } catch (err) {
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
    if (!user || !conversationId || !content.trim()) {
      console.warn('[useAIChat] Cannot send message:', {
        hasUser: !!user,
        conversationId,
        hasContent: !!content.trim()
      })
      setError('Erro: usuário ou conversa não inicializada')
      return
    }

    console.log('[useAIChat] Sending message:', content.substring(0, 50) + '...')

    setLoading(true)
    setError(null)

    // Optimistic update - add user message immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      // Call Edge Function via direct fetch (mesmo padrão de useActionPlan)
      console.log('[useAIChat] Calling chat-completion with:', {
        user_id: user.id,
        conversation_id: conversationId,
        event_day,
        module_id,
      })

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-completion`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[useAIChat] Edge Function error:', errorText)
        throw new Error(`Erro ao enviar mensagem: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log('[useAIChat] Received response, tokens:', data.tokens_used)

        // Add assistant response
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          tokens_used: data.tokens_used,
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }
    } catch (err: any) {
      console.error('[useAIChat] Send error:', err)
      const errorMessage = err.message || err.toString() || 'Erro ao enviar mensagem'
      setError(errorMessage)

      // Remove optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
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
