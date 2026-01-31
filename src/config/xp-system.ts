/**
 * Sistema de XP - Configuração Centralizada
 * Total: 1000 XP
 *
 * Distribuição:
 * - Pré-Evento: 200 XP (20%)
 * - Durante Evento: 400 XP (40%)
 * - Pós-Evento: 400 XP (40%)
 *
 * Regra: Todos os valores em múltiplos de 10
 */

export const XP_CONFIG = {
  // PRÉ-EVENTO: 200 XP
  PRE_EVENT: {
    PROTOCOL_SURVEY: 30,         // Protocolo de Iniciação (8 questões de calibragem)
    COMPLETE_PROFILE: 30,        // Completar perfil com foto + dados
    WATCH_BONUS_LESSONS: 60,     // Assistir aulas preparatórias
    PURCHASE_PDF_DIAGNOSIS: 40,  // Compra: Diagnóstico PDF (order bump)
    PURCHASE_EDITED_LESSONS: 40, // Compra: Aulas Editadas (order bump)
    TOTAL: 200,
  },

  // DURANTE EVENTO: 400 XP
  EVENT: {
    MODULE_CHECKIN: 20,          // Cada checkin de módulo (17× = 340 XP)
    NPS_DAY1: 30,                // NPS Dia 1
    NPS_FINAL: 30,               // NPS Final
    TOTAL_MODULES: 17,           // Total de módulos no evento
    TOTAL: 400,
  },

  // PÓS-EVENTO: 400 XP
  POST_EVENT: {
    // Plano de 7 Dias - Progressão Crescente (100 XP total)
    PLAN_7_DAYS: {
      DAY_1: 10,                 // Primeira ação executada
      DAY_2: 10,                 // Segunda ação executada
      DAY_3: 10,                 // Terceira ação executada
      DAY_4: 15,                 // Quarta ação executada
      DAY_5: 15,                 // Quinta ação executada
      DAY_6: 20,                 // Sexta ação executada
      DAY_7: 20,                 // Sétima ação executada (conclusão)
      TOTAL: 100,
    },
    IMPACT_ENROLLMENT: 300,      // Inscrição Imersão IMPACT (compra)
    TOTAL: 400,
  },

  // TOTAL GERAL
  MAX_XP: 1000,
} as const

// Tipos
export type XPPhase = 'pre' | 'event' | 'post'

// Helper: Calcular XP máximo possível por fase
export function getMaxXPByPhase(phase: XPPhase): number {
  switch (phase) {
    case 'pre':
      return XP_CONFIG.PRE_EVENT.TOTAL
    case 'event':
      return XP_CONFIG.EVENT.TOTAL
    case 'post':
      return XP_CONFIG.POST_EVENT.TOTAL
  }
}

// Helper: Calcular progresso (%)
export function calculateProgress(currentXP: number): number {
  return Math.min(100, Math.round((currentXP / XP_CONFIG.MAX_XP) * 100))
}

// Helper: Calcular nível baseado em XP
export function getLevel(xp: number): number {
  if (xp >= 1000) return 5      // Mestre IMPACT
  if (xp >= 600) return 4        // Avançado
  if (xp >= 400) return 3        // Intermediário
  if (xp >= 200) return 2        // Iniciante+
  if (xp >= 100) return 1        // Iniciante
  return 0                       // Novato
}

// Nomes dos níveis
export const LEVEL_NAMES = [
  'Novato',           // 0-99 XP
  'Iniciante',        // 100-199 XP
  'Iniciante+',       // 200-399 XP
  'Intermediário',    // 400-599 XP
  'Avançado',         // 600-999 XP
  'Mestre IMPACT',    // 1000 XP
] as const

// Helper: Obter nome do nível
export function getLevelName(xp: number): string {
  return LEVEL_NAMES[getLevel(xp)]
}

// Helper: XP necessário para próximo nível
export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = getLevel(currentXP)

  if (currentLevel >= 5) return 0 // Já está no nível máximo

  const thresholds = [100, 200, 400, 600, 1000]
  return thresholds[currentLevel] - currentXP
}

// Helper: Progresso dentro do nível atual (%)
export function getLevelProgress(xp: number): number {
  const level = getLevel(xp)

  if (level >= 5) return 100 // Nível máximo

  const thresholds = [0, 100, 200, 400, 600, 1000]
  const currentThreshold = thresholds[level]
  const nextThreshold = thresholds[level + 1]

  const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  return Math.round(progress)
}

// IDs dos steps para usar com completed_steps
export const STEP_IDS = {
  // Pré-Evento
  PROTOCOL_SURVEY: 'protocol-survey',
  COMPLETE_PROFILE: 'complete-profile',
  WATCH_BONUS_LESSONS: 'watch-bonus-lessons',
  PURCHASE_PDF_DIAGNOSIS: 'purchase-pdf-diagnosis',
  PURCHASE_EDITED_LESSONS: 'purchase-edited-lessons',

  // Evento
  MODULE_CHECKIN: (moduleId: number) => `module-checkin-${moduleId}`,
  NPS_DAY1: 'nps-day1',
  NPS_FINAL: 'nps-final',

  // Pós-Evento
  PLAN_7_DAYS: (day: number) => `plan-7-days-day${day}`,
  IMPACT_ENROLLMENT: 'impact-enrollment',

  // Badges
  BADGE: (badgeId: string) => `badge:${badgeId}`,
} as const
