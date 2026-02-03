/**
 * Hook useScenarioProjection
 *
 * Gera projeções personalizadas 30-60-90 dias
 * - Só gera após evento finalizado (status='finished')
 * - Usa cache de 24h
 * - Busca TODOS os dados (survey + diagnóstico + chat)
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useEventState } from './useEventState'

export interface Projection {
  days: 30 | 60 | 90
  label: string
  description: string
  severity: 'warning' | 'danger' | 'critical'
  financialImpact?: number
}

export function useScenarioProjection() {
  const { user } = useAuth()
  const { eventState } = useEventState()
  const [projections, setProjections] = useState<Projection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)

  useEffect(() => {
    if (!user) return

    // SÓ gera se evento já finalizou
    if (eventState?.status === 'finished') {
      console.log('[useScenarioProjection] Event finished, generating projections...')

      // Aguardar um pouco para garantir que a autenticação está completa
      const timer = setTimeout(() => {
        generateProjections()
      }, 500)

      return () => clearTimeout(timer)
    } else {
      console.log('[useScenarioProjection] Event not finished yet, status:', eventState?.status)
    }
  }, [user, eventState?.status])

  const generateProjections = async (forceRegenerate = false) => {
    if (!user) {
      console.error('[useScenarioProjection] No user found')
      return
    }

    // VERIFICAR AUTENTICAÇÃO ANTES DE CHAMAR
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('[useScenarioProjection] Not authenticated:', sessionError)
      setError('Não autenticado. Faça login novamente.')
      return
    }

    console.log('[useScenarioProjection] Authenticated, session:', session.user.id)
    console.log('[useScenarioProjection] Generating projections for user:', user.id)

    setLoading(true)
    setError(null)

    try {
      // TENTAR FETCH DIRETO em vez de supabase.functions.invoke()
      console.log('[useScenarioProjection] Calling via direct fetch...')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const functionUrl = `${supabaseUrl}/functions/v1/generate-scenario`

      console.log('[useScenarioProjection] URL:', functionUrl)

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          force_regenerate: forceRegenerate,
        }),
      })

      console.log('[useScenarioProjection] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[useScenarioProjection] Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log('[useScenarioProjection] Projections received:', {
          cached: data.cached,
          tokens: data.tokens_used,
        })

        setProjections(data.projections)
        setCached(data.cached)
      } else {
        throw new Error(data.error || 'Erro ao gerar projeções')
      }
    } catch (err: any) {
      console.error('[useScenarioProjection] Error:', err)
      console.error('[useScenarioProjection] Error details:', JSON.stringify(err, null, 2))
      const errorMsg = err?.message || err?.error || err?.msg || 'Erro ao gerar projeções'
      setError(`Erro ao gerar projeção personalizada: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const regenerate = async () => {
    console.log('[useScenarioProjection] Force regenerating projections...')
    await generateProjections(true)
  }

  return {
    projections,
    loading,
    error,
    cached,
    regenerate,
    hasProjections: projections.length > 0,
    isEventFinished: eventState?.status === 'finished',
  }
}
