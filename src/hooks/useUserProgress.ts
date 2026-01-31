/**
 * Hook para gerenciar progresso do usuário (XP, badges, completed_steps)
 *
 * Atualiza a tabela profiles com XP e completed_steps
 * Usado por: PreEvento, AoVivo, PosEvento
 */

import { useEffect, useState } from 'react'
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

  // Adicionar XP ao usuário
  const addXP = async (amount: number, reason?: string) => {
    if (!user || !profile) {
      return { error: new Error('User not authenticated') }
    }

    try {
      setLoading(true)
      const newXP = (profile.xp || 0) + amount

      const { error } = await supabase
        .from('profiles')
        .update({ xp: newXP })
        .eq('id', user.id)

      if (error) throw error

      console.log(`✨ +${amount} XP${reason ? ` (${reason})` : ''}`)

      // Refresh profile to get updated XP
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

      // Verificar se já completou
      const currentSteps = profile.completed_steps || []
      if (currentSteps.includes(stepId)) {
        console.log(`Step ${stepId} already completed`)
        return { error: null, alreadyCompleted: true }
      }

      const updatedSteps = [...currentSteps, stepId]
      const newXP = (profile.xp || 0) + xpReward

      const { error } = await supabase
        .from('profiles')
        .update({
          completed_steps: updatedSteps,
          xp: newXP,
        })
        .eq('id', user.id)

      if (error) throw error

      if (xpReward > 0) {
        console.log(`✅ Completed: ${stepId} (+${xpReward} XP)`)
      } else {
        console.log(`✅ Completed: ${stepId}`)
      }

      // Refresh profile to get updated data
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

      // Verificar se já tem o badge
      const currentBadges = (profile.completed_steps || []).filter(s => s.startsWith('badge:'))
      if (currentBadges.includes(`badge:${badgeId}`)) {
        console.log(`Badge ${badgeId} already earned`)
        return { error: null, alreadyHas: true }
      }

      const updatedSteps = [...(profile.completed_steps || []), `badge:${badgeId}`]

      const { error } = await supabase
        .from('profiles')
        .update({ completed_steps: updatedSteps })
        .eq('id', user.id)

      if (error) throw error

      console.log(`🏆 Badge earned: ${badgeId}`)

      // Refresh profile to get updated data
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
