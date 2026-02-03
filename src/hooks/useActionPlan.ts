/**
 * useActionPlan Hook
 *
 * Gera plano de ação personalizado de 7 dias via IA
 * - Cache de 7 dias no Supabase
 * - Fallback para plano hardcoded se falhar
 * - Baseado em gargalo IMPACT + survey
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { ActionItem } from '../components/ui/ActionPlan'

interface ActionPlanResponse {
  success: boolean
  cached?: boolean
  plan: {
    day_1: { title: string; description: string }
    day_2: { title: string; description: string }
    day_3: { title: string; description: string }
    day_4: { title: string; description: string }
    day_5: { title: string; description: string }
    day_6: { title: string; description: string }
    day_7: { title: string; description: string }
  }
  tokens_used?: number
  error?: string
}

// Plano hardcoded como fallback
const DEFAULT_ACTIONS: ActionItem[] = [
  {
    id: '1',
    day: 1,
    title: 'Revisar anotações do evento',
    description: 'Consolide os principais insights em 3 bullets.',
    completed: false,
  },
  {
    id: '2',
    day: 2,
    title: 'Reunião de alinhamento',
    description: 'Compartilhe o diagnóstico com sócios ou equipe.',
    completed: false,
  },
  {
    id: '3',
    day: 3,
    title: 'Mapear gargalo identificado',
    description: 'Analise onde o processo trava especificamente.',
    completed: false,
  },
  {
    id: '4',
    day: 4,
    title: 'Listar 3 ações imediatas',
    description: 'Defina micro-correções que podem ser feitas esta semana.',
    completed: false,
  },
  {
    id: '5',
    day: 5,
    title: 'Implementar primeira correção',
    description: 'Execute a ação de menor esforço com maior impacto.',
    completed: false,
  },
  {
    id: '6',
    day: 6,
    title: 'Medir resultado inicial',
    description: 'Compare métricas antes vs depois da correção aplicada.',
    completed: false,
  },
  {
    id: '7',
    day: 7,
    title: 'Decidir próximo passo',
    description: 'Continuar sozinho ou ativar o Protocolo IMPACT presencial?',
    completed: false,
  },
]

export function useActionPlan() {
  const { user } = useAuth()
  const [actions, setActions] = useState<ActionItem[]>(DEFAULT_ACTIONS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)
  const [isPersonalized, setIsPersonalized] = useState(false)

  useEffect(() => {
    if (!user) return

    generatePlan()
  }, [user])

  const generatePlan = async (forceRegenerate = false) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      console.log('[useActionPlan] Calling generate-action-plan Edge Function...')

      // Verificar sessão
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      // Chamar Edge Function via fetch direto (para evitar problemas de autenticação)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-action-plan`,
        {
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
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[useActionPlan] Edge Function error:', errorText)
        throw new Error(`Erro ao gerar plano: ${response.status}`)
      }

      const data: ActionPlanResponse = await response.json()

      if (data.success && data.plan) {
        console.log('[useActionPlan] Plano recebido:', {
          cached: data.cached,
          tokens: data.tokens_used,
        })

        // Converter de day_1...day_7 para array de ActionItem
        const generatedActions: ActionItem[] = [
          { id: '1', day: 1, ...data.plan.day_1, completed: false },
          { id: '2', day: 2, ...data.plan.day_2, completed: false },
          { id: '3', day: 3, ...data.plan.day_3, completed: false },
          { id: '4', day: 4, ...data.plan.day_4, completed: false },
          { id: '5', day: 5, ...data.plan.day_5, completed: false },
          { id: '6', day: 6, ...data.plan.day_6, completed: false },
          { id: '7', day: 7, ...data.plan.day_7, completed: false },
        ]

        setActions(generatedActions)
        setCached(data.cached || false)
        setIsPersonalized(true)
      } else {
        throw new Error(data.error || 'Resposta inválida da Edge Function')
      }
    } catch (err: any) {
      console.error('[useActionPlan] Erro ao gerar plano:', err)
      setError(err.message)

      // FALLBACK: usar plano hardcoded padrão
      console.log('[useActionPlan] Usando plano padrão como fallback')
      setActions(DEFAULT_ACTIONS)
      setIsPersonalized(false)
    } finally {
      setLoading(false)
    }
  }

  const regenerate = async () => {
    await generatePlan(true)
  }

  return {
    actions,
    loading,
    error,
    cached,
    isPersonalized,
    regenerate,
  }
}
