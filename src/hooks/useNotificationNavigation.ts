/**
 * Hook para navegação de avisos clicáveis
 *
 * Gerencia navegação interna (rotas + scroll) e externa (links) a partir de notificações
 * Usado por: NotificationDrawer, NotificationToast
 */

import { useNavigate } from 'react-router-dom'
import type { Notification } from './useNotifications'

export function useNotificationNavigation() {
  const navigate = useNavigate()

  const handleNotificationClick = (notification: Notification) => {
    // Se não tem ação ou é 'none', não faz nada
    if (!notification.action_type || notification.action_type === 'none') {
      return
    }

    // Links externos: abrir em nova aba
    if (notification.action_type === 'external' && notification.external_url) {
      window.open(notification.external_url, '_blank', 'noopener,noreferrer')
      return
    }

    // Links internos: navegar com scroll
    if (notification.action_type === 'internal') {
      const { target_page, target_section } = notification

      // Mapear target_page para rota real
      const pageMap: Record<string, string> = {
        'plano-7-dias': '/pos-evento',
        'impact-offer': '/pos-evento',
        'nps': '/pos-evento',
        'diagnostico': '/ao-vivo',
        'protocolo': '/pre-evento',
        'pre-evento': '/pre-evento',
        'ao-vivo': '/ao-vivo',
        'pos-evento': '/pos-evento',
      }

      const route = target_page ? pageMap[target_page] || '/' : '/'

      // Navegar com state para scroll
      navigate(route, {
        state: {
          scrollTo: target_section,
          highlight: true, // Destacar seção ao chegar
        },
      })
    }
  }

  // Verificar se notificação é clicável
  const isClickable = (notification: Notification): boolean => {
    if (!notification.action_type || notification.action_type === 'none') {
      return false
    }

    if (notification.action_type === 'external') {
      return !!notification.external_url
    }

    if (notification.action_type === 'internal') {
      return !!notification.target_page
    }

    return false
  }

  return {
    handleNotificationClick,
    isClickable,
  }
}
