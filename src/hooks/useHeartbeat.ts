import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Hook que atualiza last_seen_at do usuário a cada 30 segundos
 * Usado para rastrear quem está online no Admin
 */
export function useHeartbeat() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Função que atualiza last_seen_at
    const sendHeartbeat = async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', user.id)

        if (error) {
          console.error('[Heartbeat] Erro ao atualizar last_seen_at:', error)
        }
      } catch (error) {
        console.error('[Heartbeat] Erro:', error)
      }
    }

    // Enviar heartbeat imediatamente ao montar
    sendHeartbeat()

    // Enviar heartbeat a cada 30 segundos
    const interval = setInterval(sendHeartbeat, 30000)

    // Cleanup
    return () => clearInterval(interval)
  }, [user])
}
