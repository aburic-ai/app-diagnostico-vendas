/**
 * Hooks centralizados - Exports
 *
 * Uso:
 * import { useAuth, useEventState, useDiagnostic } from '../hooks'
 */

export { useAuth } from './useAuth'
export { useEventState } from './useEventState'
export type { EventStatus, EventState } from './useEventState'
export { useDiagnostic } from './useDiagnostic'
export type { DiagnosticEntry, DiagnosticScores } from './useDiagnostic'
export { useUserProgress } from './useUserProgress'
export type { UserProgress } from './useUserProgress'
export { useNotifications } from './useNotifications'
export type { Notification, NotificationType } from './useNotifications'
