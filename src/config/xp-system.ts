/**
 * Sistema de XP - Configuracao Centralizada
 * Total: 1000 XP
 *
 * ========================================
 * ARQUITETURA
 * ========================================
 *
 * Fonte de verdade: tabela `xp_ledger` (append-only)
 * Cache: `profiles.xp` e `profiles.completed_steps` (sincronizados por trigger)
 *
 * Fluxo:
 *   1. Usuario completa acao
 *   2. INSERT INTO xp_ledger (user_id, action, xp_amount)
 *   3. UNIQUE(user_id, action) impede duplicata (erro 23505 = silenciosamente ignorado)
 *   4. Trigger sync_profile_from_ledger() atualiza profiles.xp = SUM, profiles.completed_steps = array
 *   5. Realtime subscription no AuthContext detecta mudanca e atualiza UI
 *
 * Quem escreve XP:
 *   - useUserProgress.ts → completeStep() faz INSERT no xp_ledger (usado por PreEvento, AoVivo, PosEvento)
 *   - ThankYou.tsx → INSERT direto no xp_ledger (protocol-survey, porque user pode nao estar autenticado via hook)
 *
 * ========================================
 * MAPA COMPLETO DE ACOES
 * ========================================
 *
 * PRE-EVENTO (200 XP):
 *   action='protocol-survey'       → 30 XP  | Pesquisa de calibragem (8 perguntas)     | ThankYou.tsx:618
 *   action='complete-profile'      → 30 XP  | Perfil completo (foto + dados)            | PreEvento.tsx:521
 *   action='watch-lesson-1'        → 20 XP  | Assistir aula preparatoria 1              | PreEvento.tsx:549
 *   action='watch-lesson-2'        → 20 XP  | Assistir aula preparatoria 2              | PreEvento.tsx:549
 *   action='watch-lesson-3'        → 20 XP  | Assistir aula preparatoria 3              | PreEvento.tsx:549
 *   action='purchase-pdf-diagnosis'→ 40 XP  | Compra PDF Diagnostico (order bump)       | PreEvento.tsx:345
 *   action='purchase-edited-lessons'→40 XP  | Compra Aulas Editadas (order bump)        | PreEvento.tsx:345
 *
 * DURANTE EVENTO (400 XP):
 *   action='module-{N}-checkin'    → 20 XP  | Confirmar presenca no modulo N (1-17)     | AoVivo.tsx:389
 *   action='nps-day1'              → 30 XP  | Responder NPS Dia 1                       | AoVivo.tsx:450
 *   action='nps-final'             → 30 XP  | Responder NPS Final                       | AoVivo.tsx:450
 *
 * POS-EVENTO (400 XP):
 *   action='plan-7-days-day-1'     → 10 XP  | Completar acao dia 1                      | PosEvento.tsx:375
 *   action='plan-7-days-day-2'     → 10 XP  | Completar acao dia 2                      | PosEvento.tsx:375
 *   action='plan-7-days-day-3'     → 10 XP  | Completar acao dia 3                      | PosEvento.tsx:375
 *   action='plan-7-days-day-4'     → 15 XP  | Completar acao dia 4                      | PosEvento.tsx:375
 *   action='plan-7-days-day-5'     → 15 XP  | Completar acao dia 5                      | PosEvento.tsx:375
 *   action='plan-7-days-day-6'     → 20 XP  | Completar acao dia 6                      | PosEvento.tsx:375
 *   action='plan-7-days-day-7'     → 20 XP  | Completar acao dia 7                      | PosEvento.tsx:375
 *   action='impact-enrollment'     → 300 XP | Compra Imersao IMPACT                     | PreEvento.tsx:345
 *
 * NIVEIS:
 *   0 = Novato         (0-99 XP)
 *   1 = Iniciante      (100-199 XP)
 *   2 = Iniciante+     (200-399 XP)
 *   3 = Intermediario  (400-599 XP)
 *   4 = Avancado       (600-999 XP)
 *   5 = Mestre IMPACT  (1000 XP)
 *
 * AUDITORIA SQL:
 *   SELECT action, xp_amount, created_at FROM xp_ledger WHERE user_id = 'UUID' ORDER BY created_at;
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
  MODULE_CHECKIN: (moduleId: number) => `module-${moduleId}-checkin`,
  NPS_DAY1: 'nps-day1',
  NPS_FINAL: 'nps-final',

  // Pós-Evento
  PLAN_7_DAYS: (day: number) => `plan-7-days-day-${day}`,
  IMPACT_ENROLLMENT: 'impact-enrollment',

  // Badges
  BADGE: (badgeId: string) => `badge:${badgeId}`,
} as const
