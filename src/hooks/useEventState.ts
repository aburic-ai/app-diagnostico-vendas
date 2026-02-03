/**
 * Hook para gerenciar estado global do evento
 *
 * Sincroniza estado entre Admin e todas as páginas via Supabase Realtime
 * Singleton pattern - apenas 1 registro na tabela
 */

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type EventStatus = 'offline' | 'live' | 'paused' | 'activity' | 'finished'

export interface EventState {
  id: string
  status: EventStatus
  current_day: number
  current_module: number
  offer_unlocked: boolean
  offer_visible: boolean
  ai_enabled: boolean
  lunch_active: boolean
  lunch_started_at: string | null
  lunch_duration_minutes: number
  event_started_at: string | null
  event_finished_at: string | null
  event_scheduled_start: string | null
  updated_at: string

  // Tab Access Control
  pre_evento_enabled: boolean
  pre_evento_unlock_date: string | null
  pre_evento_lock_date: string | null

  ao_vivo_enabled: boolean
  ao_vivo_unlock_date: string | null
  ao_vivo_lock_date: string | null

  pos_evento_enabled: boolean
  pos_evento_unlock_date: string | null
  pos_evento_lock_date: string | null
}

export function useEventState() {
  const { user, profile } = useAuth()
  const [eventState, setEventState] = useState<EventState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const isAdmin = profile?.is_admin || false

  // Carregar estado inicial
  useEffect(() => {
    loadEventState()
  }, [])

  // Subscription em tempo real
  useEffect(() => {
    console.log('🎮 [useEventState] Setting up realtime subscription')

    const channel = supabase
      .channel('event_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'event_state',
        },
        (payload) => {
          console.log('🎮 [useEventState] State changed:', payload)

          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setEventState(payload.new as EventState)
          }
        }
      )
      .subscribe((status) => {
        console.log('🎮 [useEventState] Subscription status:', status)
      })

    return () => {
      console.log('🎮 [useEventState] Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [])

  const loadEventState = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('event_state')
        .select('*')
        .limit(1)
        .single()

      if (fetchError) {
        // Se não existe, criar estado inicial (apenas admin pode)
        if (fetchError.code === 'PGRST116' && isAdmin) {
          console.log('🎮 [useEventState] Creating initial state')
          await createInitialState()
          return
        }
        throw fetchError
      }

      console.log('🎮 [useEventState] State loaded:', data)
      setEventState(data)
    } catch (err) {
      console.error('❌ [useEventState] Error loading state:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const createInitialState = async () => {
    const { data, error: insertError } = await supabase
      .from('event_state')
      .insert({
        status: 'offline',
        current_day: 1,
        current_module: 0,
        ai_enabled: true,
      })
      .select()
      .single()

    if (!insertError && data) {
      setEventState(data)
    }
  }

  // Atualizar estado (apenas admin)
  const updateEventState = async (updates: Partial<EventState>) => {
    if (!isAdmin) {
      console.warn('⚠️ [useEventState] Only admins can update state')
      return { error: new Error('Unauthorized') }
    }

    if (!eventState) {
      return { error: new Error('State not loaded') }
    }

    try {
      const { data, error: updateError } = await supabase
        .from('event_state')
        .update({
          ...updates,
          updated_by: user?.id,
        })
        .eq('id', eventState.id)
        .select()
        .single()

      if (updateError) throw updateError

      console.log('✅ [useEventState] State updated:', updates)
      setEventState(data)

      return { error: null, data }
    } catch (err) {
      console.error('❌ [useEventState] Error updating state:', err)
      return { error: err as Error }
    }
  }

  // Helpers específicos para admin
  const startEvent = async () => {
    return updateEventState({
      status: 'live',
      event_started_at: new Date().toISOString(),
    })
  }

  const pauseEvent = async () => {
    return updateEventState({ status: 'paused' })
  }

  const resumeEvent = async () => {
    return updateEventState({ status: 'live' })
  }

  const finishEvent = async () => {
    return updateEventState({
      status: 'finished',
      event_finished_at: new Date().toISOString(),
    })
  }

  const setDay = async (day: 1 | 2) => {
    return updateEventState({ current_day: day })
  }

  const setModule = async (moduleId: number) => {
    return updateEventState({ current_module: moduleId })
  }

  const unlockOffer = async () => {
    return updateEventState({
      offer_unlocked: true,
      offer_visible: true,
    })
  }

  const closeOffer = async () => {
    return updateEventState({
      offer_visible: false,
      offer_unlocked: false,
    })
  }

  const toggleAI = async () => {
    return updateEventState({ ai_enabled: !eventState?.ai_enabled })
  }

  const startLunch = async (durationMinutes: number = 60) => {
    return updateEventState({
      lunch_active: true,
      lunch_started_at: new Date().toISOString(),
      lunch_duration_minutes: durationMinutes,
    })
  }

  const endLunch = async () => {
    return updateEventState({
      lunch_active: false,
      lunch_started_at: null,
    })
  }

  const toggleLunch = async (durationMinutes: number = 60) => {
    if (eventState?.lunch_active) {
      return endLunch()
    } else {
      return startLunch(durationMinutes)
    }
  }

  const startActivity = async () => {
    return updateEventState({ status: 'activity' })
  }

  const endActivity = async () => {
    return updateEventState({ status: 'live' })
  }

  const toggleActivity = async () => {
    if (eventState?.status === 'activity') {
      return endActivity()
    } else {
      return startActivity()
    }
  }

  // ============================================
  // TAB ACCESS CONTROL HELPERS
  // ============================================

  /**
   * Verifica se uma aba está acessível baseado em:
   * 1. Manual toggle (prioridade máxima)
   * 2. Lock date (bloqueia se passou)
   * 3. Unlock date (permite se passou)
   * 4. Default: bloqueado
   */
  const isTabAccessible = (
    enabled: boolean,
    unlockDate: string | null,
    lockDate: string | null
  ): boolean => {
    // Prioridade 1: Manual toggle
    if (!enabled) return false
    if (enabled && !unlockDate && !lockDate) return true

    const now = new Date()

    // Prioridade 2: Lock date (bloqueia se passou)
    if (lockDate) {
      const lock = new Date(lockDate)
      if (now >= lock) return false
    }

    // Prioridade 3: Unlock date (permite se passou)
    if (unlockDate) {
      const unlock = new Date(unlockDate)
      if (now >= unlock) return true
    }

    // Default: bloqueado se tem unlock_date mas ainda não chegou
    return false
  }

  const isPreEventoAccessible = (): boolean => {
    if (!eventState) return false
    return isTabAccessible(
      eventState.pre_evento_enabled,
      eventState.pre_evento_unlock_date,
      eventState.pre_evento_lock_date
    )
  }

  const isAoVivoAccessible = (): boolean => {
    if (!eventState) return false
    return isTabAccessible(
      eventState.ao_vivo_enabled,
      eventState.ao_vivo_unlock_date,
      eventState.ao_vivo_lock_date
    )
  }

  const isPosEventoAccessible = (): boolean => {
    if (!eventState) return false
    return isTabAccessible(
      eventState.pos_evento_enabled,
      eventState.pos_evento_unlock_date,
      eventState.pos_evento_lock_date
    )
  }

  return {
    eventState,
    loading,
    error,
    isAdmin,
    // Admin actions
    updateEventState,
    startEvent,
    pauseEvent,
    resumeEvent,
    finishEvent,
    setDay,
    setModule,
    unlockOffer,
    closeOffer,
    toggleAI,
    startLunch,
    endLunch,
    toggleLunch,
    startActivity,
    endActivity,
    toggleActivity,
    refresh: loadEventState,
    // Tab access control
    isPreEventoAccessible,
    isAoVivoAccessible,
    isPosEventoAccessible,
  }
}
