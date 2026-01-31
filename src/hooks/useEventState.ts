/**
 * Hook para gerenciar o estado do evento em tempo real
 *
 * Sincroniza com a tabela event_state via real-time subscription
 * Usado por: Admin (controle) e todas as páginas (leitura)
 */

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type EventStatus = 'pre_event' | 'live' | 'paused' | 'activity' | 'lunch' | 'post_event'

export interface EventState {
  id: string
  status: EventStatus
  current_day: number
  current_module: number
  updated_at: string
}

export function useEventState() {
  const [eventState, setEventState] = useState<EventState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Carregar estado inicial
  useEffect(() => {
    loadEventState()
  }, [])

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('event_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_state'
        },
        (payload) => {
          console.log('Event state changed:', payload)
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setEventState(payload.new as EventState)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadEventState = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('event_state')
        .select('*')
        .single()

      if (error) throw error
      setEventState(data)
    } catch (err) {
      console.error('Error loading event state:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar o estado (apenas Admin)
  const updateEventState = async (updates: Partial<Omit<EventState, 'id' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('event_state')
        .update(updates)
        .eq('id', eventState?.id || '00000000-0000-0000-0000-000000000001')
        .select()
        .single()

      if (error) throw error
      setEventState(data)
      return { error: null }
    } catch (err) {
      console.error('Error updating event state:', err)
      return { error: err as Error }
    }
  }

  return {
    eventState,
    loading,
    error,
    updateEventState,
    refresh: loadEventState,
  }
}
