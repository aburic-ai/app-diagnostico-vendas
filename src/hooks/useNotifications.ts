/**
 * Hook para gerenciar notificações em tempo real
 *
 * Subscriptions para receber notificações broadcast do Admin
 * Usado por: Todas as páginas (receber), Admin (enviar)
 */

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  created_at: string
  read_by: string[]

  // Campos de navegação (Avisos Clickables)
  action_type?: 'internal' | 'external' | 'none'
  target_page?: string      // 'pre-evento' | 'ao-vivo' | 'pos-evento' | 'plano-7-dias' | 'impact-offer' | 'nps'
  target_section?: string   // ID da seção para scroll (ex: 'action-plan', 'radar-chart')
  external_url?: string     // URL externa completa
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Carregar notificações
  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  // Subscription em tempo real
  useEffect(() => {
    if (!user) return

    console.log('🔔 [useNotifications] Setting up realtime subscription for user:', user.id)

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('🔔 [useNotifications] Change:', payload.eventType)

          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification
            setNotifications(prev => [newNotif, ...prev])

            if (!newNotif.read_by?.includes(user.id)) {
              setUnreadCount(prev => prev + 1)
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id
            if (deletedId) {
              setNotifications(prev => {
                const updated = prev.filter(n => n.id !== deletedId)
                const unread = updated.filter(n => !n.read_by?.includes(user!.id))
                setUnreadCount(unread.length)
                return updated
              })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 [useNotifications] Subscription status:', status)
      })

    return () => {
      console.log('🔔 [useNotifications] Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [user])

  const loadNotifications = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])

      // Calcular unread count
      const unread = (data || []).filter(n => !n.read_by?.includes(user.id))
      setUnreadCount(unread.length)
    } catch (err) {
      console.error('Error loading notifications:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      const notification = notifications.find(n => n.id === notificationId)
      if (!notification) return { error: new Error('Notification not found') }

      // Se já está na lista read_by, não fazer nada
      if (notification.read_by?.includes(user.id)) {
        return { error: null }
      }

      const updatedReadBy = [...(notification.read_by || []), user.id]

      const { error } = await supabase
        .from('notifications')
        .update({ read_by: updatedReadBy })
        .eq('id', notificationId)

      if (error) throw error

      // Atualizar lista local
      setNotifications(prev => prev.map(n =>
        n.id === notificationId
          ? { ...n, read_by: updatedReadBy }
          : n
      ))

      // Decrementar unread count
      setUnreadCount(prev => Math.max(0, prev - 1))

      return { error: null }
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return { error: err as Error }
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      // Pegar IDs das não lidas
      const unreadNotifications = notifications.filter(n => !n.read_by?.includes(user.id))

      if (unreadNotifications.length === 0) {
        return { error: null }
      }

      console.log(`📬 Marcando ${unreadNotifications.length} notificações como lidas...`)

      // Atualizar todas em paralelo (muito mais rápido que sequencial)
      const updatePromises = unreadNotifications.map(notif => {
        const updatedReadBy = [...(notif.read_by || []), user.id]
        return supabase
          .from('notifications')
          .update({ read_by: updatedReadBy })
          .eq('id', notif.id)
      })

      const results = await Promise.all(updatePromises)

      // Verificar se algum update falhou
      const failed = results.filter(r => r.error)
      if (failed.length > 0) {
        console.error('❌ Alguns updates falharam:', failed)
        throw new Error(`${failed.length} notificações não foram atualizadas`)
      }

      // Atualizar lista local
      setNotifications(prev => prev.map(n => {
        if (!n.read_by?.includes(user.id)) {
          return { ...n, read_by: [...(n.read_by || []), user.id] }
        }
        return n
      }))

      setUnreadCount(0)
      console.log('✅ Todas as notificações marcadas como lidas')

      return { error: null }
    } catch (err) {
      console.error('❌ Error marking all as read:', err)
      return { error: err as Error }
    }
  }

  // Criar notificação (apenas Admin)
  const createNotification = async (
    type: NotificationType,
    title: string,
    message: string,
    navigationConfig?: {
      action_type?: 'internal' | 'external' | 'none'
      target_page?: string
      target_section?: string
      external_url?: string
    }
  ) => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          type,
          title,
          message,
          read_by: [],
          ...navigationConfig,
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Notification sent:', title)

      return { error: null, data }
    } catch (err) {
      console.error('Error creating notification:', err)
      return { error: err as Error }
    }
  }

  // Verificar se está lida
  const isRead = (notificationId: string): boolean => {
    if (!user) return false
    const notif = notifications.find(n => n.id === notificationId)
    return notif?.read_by?.includes(user.id) || false
  }

  // Obter apenas não lidas
  const getUnreadNotifications = (): Notification[] => {
    if (!user) return []
    return notifications.filter(n => !n.read_by?.includes(user.id))
  }

  // Deletar todas as notificações (admin only)
  const deleteAllNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select('id')

      if (error) throw error

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhuma notificação foi deletada - verifique RLS policies no Supabase')
        return { error: new Error('Nenhum aviso foi removido. Verifique as permissões de DELETE na tabela notifications no Supabase.') }
      }

      setNotifications([])
      setUnreadCount(0)
      console.log(`✅ ${data.length} notifications deleted`)
      return { error: null }
    } catch (err) {
      console.error('❌ Error deleting notifications:', err)
      return { error: err as Error }
    }
  }

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteAllNotifications,
    isRead,
    getUnreadNotifications,
    refresh: loadNotifications,
  }
}
