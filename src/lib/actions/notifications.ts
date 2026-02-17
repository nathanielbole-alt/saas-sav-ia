'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Notification } from '@/types/database.types'

const notificationIdSchema = z.string().uuid()

async function getCurrentOrganizationId(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>
  organizationId: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, organizationId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const organizationId = (profile as { organization_id: string } | null)?.organization_id ?? null
  return { supabase, organizationId }
}

export async function getUnreadNotifications(): Promise<Notification[]> {
  const { supabase, organizationId } = await getCurrentOrganizationId()
  if (!organizationId) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Failed to fetch notifications:', error)
    return []
  }

  return (data ?? []) as Notification[]
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const parsed = notificationIdSchema.safeParse(notificationId)
  if (!parsed.success) return false

  const { supabase, organizationId } = await getCurrentOrganizationId()
  if (!organizationId) return false

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', parsed.data)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Failed to mark notification as read:', error)
    return false
  }

  revalidatePath('/dashboard')
  return true
}
