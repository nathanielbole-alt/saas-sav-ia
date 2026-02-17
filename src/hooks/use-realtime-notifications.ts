'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getUnreadNotifications,
  markNotificationRead,
} from '@/lib/actions/notifications'
import type { Notification } from '@/types/database.types'

type UseRealtimeNotificationsResult = {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => Promise<boolean>
  isLoading: boolean
}

export function useRealtimeNotifications(): UseRealtimeNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getUnreadNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const inserted = payload.new as Notification
          if (inserted.read) return

          setNotifications((previous) => {
            if (previous.some((item) => item.id === inserted.id)) {
              return previous
            }
            return [inserted, ...previous]
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const success = await markNotificationRead(notificationId)
      if (!success) return false

      setNotifications((previous) =>
        previous.filter((item) => item.id !== notificationId)
      )
      return true
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  }, [])

  return {
    notifications,
    unreadCount: notifications.length,
    markAsRead,
    isLoading,
  }
}
