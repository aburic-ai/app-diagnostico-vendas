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

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('New notification:', payload)
          const newNotif = payload.new as Notification
          setNotifications(prev => [newNotif, ...prev])

          // Incrementar unread count se não estiver na lista read_by
          if (!newNotif.read_by?.includes(user.id)) {
            setUnreadCount(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
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

      // Atualizar todas
      for (const notif of unreadNotifications) {
        const updatedReadBy = [...(notif.read_by || []), user.id]
        await supabase
          .from('notifications')
          .update({ read_by: updatedReadBy })
          .eq('id', notif.id)
      }

      // Atualizar lista local
      setNotifications(prev => prev.map(n => {
        if (!n.read_by?.includes(user.id)) {
          return { ...n, read_by: [...(n.read_by || []), user.id] }
        }
        return n
      }))

      setUnreadCount(0)

      return { error: null }
    } catch (err) {
      console.error('Error marking all as read:', err)
      return { error: err as Error }
    }
  }

  // Criar notificação (apenas Admin)
  const createNotification = async (
    type: NotificationType,
    title: string,
    message: string
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

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    isRead,
    getUnreadNotifications,
    refresh: loadNotifications,
  }
}
