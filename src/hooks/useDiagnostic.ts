/**
 * Hook para gerenciar diagnósticos IMPACT
 *
 * CRUD completo para diagnostic_entries
 * Usado por: AoVivo (criar/atualizar), PosEvento (leitura)
 */

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface DiagnosticEntry {
  id: string
  user_id: string
  day: number
  intention_score: number
  message_score: number
  pain_score: number
  authority_score: number
  commitment_score: number
  transformation_score: number
  created_at: string
  updated_at: string
}

export interface DiagnosticScores {
  intention_score: number
  message_score: number
  pain_score: number
  authority_score: number
  commitment_score: number
  transformation_score: number
}

export function useDiagnostic() {
  const { user } = useAuth()
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Carregar diagnósticos do usuário
  useEffect(() => {
    if (user) {
      loadDiagnostics()
    }
  }, [user])

  const loadDiagnostics = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('diagnostic_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('day', { ascending: true })

      if (error) throw error
      setDiagnostics(data || [])
    } catch (err) {
      console.error('Error loading diagnostics:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Obter diagnóstico de um dia específico
  const getDiagnosticByDay = (day: number): DiagnosticEntry | null => {
    return diagnostics.find(d => d.day === day) || null
  }

  // Criar ou atualizar diagnóstico
  const saveDiagnostic = async (day: number, scores: DiagnosticScores) => {
    if (!user) {
      return { error: new Error('User not authenticated') }
    }

    try {
      const existing = getDiagnosticByDay(day)

      if (existing) {
        // Atualizar
        const { data, error } = await supabase
          .from('diagnostic_entries')
          .update({
            ...scores,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error

        // Atualizar lista local
        setDiagnostics(prev => prev.map(d => d.id === existing.id ? data : d))
        return { error: null, data }
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('diagnostic_entries')
          .insert({
            user_id: user.id,
            day,
            ...scores,
          })
          .select()
          .single()

        if (error) throw error

        // Adicionar à lista local
        setDiagnostics(prev => [...prev, data])
        return { error: null, data }
      }
    } catch (err) {
      console.error('Error saving diagnostic:', err)
      return { error: err as Error }
    }
  }

  // Calcular média geral dos scores
  const getAverageScores = (): DiagnosticScores | null => {
    if (diagnostics.length === 0) return null

    const sum = diagnostics.reduce(
      (acc, d) => ({
        intention_score: acc.intention_score + d.intention_score,
        message_score: acc.message_score + d.message_score,
        pain_score: acc.pain_score + d.pain_score,
        authority_score: acc.authority_score + d.authority_score,
        commitment_score: acc.commitment_score + d.commitment_score,
        transformation_score: acc.transformation_score + d.transformation_score,
      }),
      {
        intention_score: 0,
        message_score: 0,
        pain_score: 0,
        authority_score: 0,
        commitment_score: 0,
        transformation_score: 0,
      }
    )

    const count = diagnostics.length
    return {
      intention_score: sum.intention_score / count,
      message_score: sum.message_score / count,
      pain_score: sum.pain_score / count,
      authority_score: sum.authority_score / count,
      commitment_score: sum.commitment_score / count,
      transformation_score: sum.transformation_score / count,
    }
  }

  return {
    diagnostics,
    loading,
    error,
    getDiagnosticByDay,
    saveDiagnostic,
    getAverageScores,
    refresh: loadDiagnostics,
  }
}
