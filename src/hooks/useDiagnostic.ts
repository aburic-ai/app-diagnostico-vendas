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
  event_day: number  // Tabela usa 'event_day', não 'day'
  block_number: number
  inspiracao: number
  motivacao: number
  preparacao: number
  apresentacao: number
  conversao: number
  transformacao: number
  created_at?: string
  updated_at?: string
}

export interface DiagnosticScores {
  inspiracao: number
  motivacao: number
  preparacao: number
  apresentacao: number
  conversao: number
  transformacao: number
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
        .order('event_day', { ascending: true })

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
    return diagnostics.find(d => d.event_day === day) || null
  }

  // Criar ou atualizar diagnóstico
  const saveDiagnostic = async (day: number, scores: DiagnosticScores) => {
    console.log('🔵 [useDiagnostic] saveDiagnostic CHAMADO')
    console.log('   📊 day:', day)
    console.log('   📊 scores:', scores)
    console.log('   👤 user:', user ? user.id : 'NULL')

    if (!user) {
      console.error('❌ [useDiagnostic] User not authenticated!')
      return { error: new Error('User not authenticated') }
    }

    try {
      const existing = getDiagnosticByDay(day)
      console.log('🔍 [useDiagnostic] Existing entry?', existing ? `SIM (id: ${existing.id})` : 'NÃO - Vai INSERT')

      if (existing) {
        // Atualizar
        console.log('🔄 [useDiagnostic] Tentando UPDATE no Supabase...')
        const { data, error } = await supabase
          .from('diagnostic_entries')
          .update({
            ...scores,
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('❌ [useDiagnostic] ERRO no UPDATE:', error)
          throw error
        }

        console.log('✅ [useDiagnostic] UPDATE bem-sucedido!', data)

        // Atualizar lista local
        setDiagnostics(prev => prev.map(d => d.id === existing.id ? data : d))
        return { error: null, data }
      } else {
        // Criar novo
        console.log('➕ [useDiagnostic] Tentando INSERT no Supabase...')
        console.log('   📤 Payload:', { user_id: user.id, day: day, event_day: day, block_number: 1, ...scores })

        const { data, error } = await supabase
          .from('diagnostic_entries')
          .insert({
            user_id: user.id,
            day: day,           // Coluna antiga (unique constraint)
            event_day: day,     // Coluna nova
            block_number: 1,    // Default block number
            ...scores,
          })
          .select()
          .single()

        if (error) {
          console.error('❌ [useDiagnostic] ERRO no INSERT:', error)
          console.error('   Detalhes do erro:', JSON.stringify(error, null, 2))
          throw error
        }

        console.log('✅ [useDiagnostic] INSERT bem-sucedido!', data)

        // Adicionar à lista local
        setDiagnostics(prev => [...prev, data])
        return { error: null, data }
      }
    } catch (err) {
      console.error('❌ [useDiagnostic] EXCEÇÃO capturada:', err)
      return { error: err as Error }
    }
  }

  // Calcular média geral dos scores
  const getAverageScores = (): DiagnosticScores | null => {
    if (diagnostics.length === 0) return null

    const sum = diagnostics.reduce(
      (acc, d) => ({
        inspiracao: acc.inspiracao + d.inspiracao,
        motivacao: acc.motivacao + d.motivacao,
        preparacao: acc.preparacao + d.preparacao,
        apresentacao: acc.apresentacao + d.apresentacao,
        conversao: acc.conversao + d.conversao,
        transformacao: acc.transformacao + d.transformacao,
      }),
      {
        inspiracao: 0,
        motivacao: 0,
        preparacao: 0,
        apresentacao: 0,
        conversao: 0,
        transformacao: 0,
      }
    )

    const count = diagnostics.length
    return {
      inspiracao: sum.inspiracao / count,
      motivacao: sum.motivacao / count,
      preparacao: sum.preparacao / count,
      apresentacao: sum.apresentacao / count,
      conversao: sum.conversao / count,
      transformacao: sum.transformacao / count,
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
