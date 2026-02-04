/**
 * Hook para gerenciar progresso do usuário (XP, badges, completed_steps)
 *
 * WRITES to xp_ledger table (source of truth)
 * Database trigger syncs profiles.xp and profiles.completed_steps automatically
 * READS from profiles table (denormalized cache, updated by trigger + realtime)
 */

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface UserProgress {
  xp: number
  completed_steps: string[]
  badges: string[]
}

export function useUserProgress() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Adicionar XP ao usuário (para XP avulso, não vinculado a step)
  const addXP = async (amount: number, reason?: string) => {
    if (!user || !profile) {
      return { error: new Error('User not authenticated') }
    }

    const action = reason || `manual-xp-${Date.now()}`

    try {
      setLoading(true)

      const { error: insertError } = await supabase
        .from('xp_ledger')
        .insert({
          user_id: user.id,
          action,
          xp_amount: amount,
          description: reason || 'Manual XP addition',
          metadata: { source: 'addXP' },
        })

      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`XP action "${action}" already recorded`)
          return { error: null }
        }
        throw insertError
      }

      console.log(`+${amount} XP${reason ? ` (${reason})` : ''}`)
      await refreshProfile()
      return { error: null }
    } catch (err) {
      console.error('Error adding XP:', err)
      setError(err as Error)
      return { error: err as Error }
    } finally {
      setLoading(false)
    }
  }

  // Marcar step como completo
  const completeStep = async (stepId: string, xpReward: number = 0) => {
    if (!user || !profile) {
      return { error: new Error('User not authenticated') }
    }

    try {
      setLoading(true)

      const { error: insertError } = await supabase
        .from('xp_ledger')
        .insert({
          user_id: user.id,
          action: stepId,
          xp_amount: xpReward,
          description: `Step completed: ${stepId}`,
          metadata: { source: 'completeStep' },
        })

      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`Step ${stepId} already completed`)
          return { error: null, alreadyCompleted: true }
        }
        throw insertError
      }

      if (xpReward > 0) {
        console.log(`Completed: ${stepId} (+${xpReward} XP)`)
      } else {
        console.log(`Completed: ${stepId}`)
      }

      await refreshProfile()
      return { error: null, alreadyCompleted: false }
    } catch (err) {
      console.error('Error completing step:', err)
      setError(err as Error)
      return { error: err as Error, alreadyCompleted: false }
    } finally {
      setLoading(false)
    }
  }

  // Verificar se step está completo
  const isStepCompleted = (stepId: string): boolean => {
    return (profile?.completed_steps || []).includes(stepId)
  }

  // Obter XP atual
  const getCurrentXP = (): number => {
    return profile?.xp || 0
  }

  // Obter todos os steps completos
  const getCompletedSteps = (): string[] => {
    return profile?.completed_steps || []
  }

  // Adicionar badge
  const addBadge = async (badgeId: string) => {
    if (!user || !profile) {
      return { error: new Error('User not authenticated') }
    }

    try {
      setLoading(true)

      const action = `badge:${badgeId}`

      const { error: insertError } = await supabase
        .from('xp_ledger')
        .insert({
          user_id: user.id,
          action,
          xp_amount: 0,
          description: `Badge earned: ${badgeId}`,
          metadata: { source: 'addBadge', badge_id: badgeId },
        })

      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`Badge ${badgeId} already earned`)
          return { error: null, alreadyHas: true }
        }
        throw insertError
      }

      console.log(`Badge earned: ${badgeId}`)
      await refreshProfile()
      return { error: null, alreadyHas: false }
    } catch (err) {
      console.error('Error adding badge:', err)
      setError(err as Error)
      return { error: err as Error, alreadyHas: false }
    } finally {
      setLoading(false)
    }
  }

  // Obter badges
  const getBadges = (): string[] => {
    return (profile?.completed_steps || [])
      .filter(s => s.startsWith('badge:'))
      .map(s => s.replace('badge:', ''))
  }

  return {
    loading,
    error,
    xp: getCurrentXP(),
    completedSteps: getCompletedSteps(),
    badges: getBadges(),
    addXP,
    completeStep,
    isStepCompleted,
    addBadge,
  }
}
