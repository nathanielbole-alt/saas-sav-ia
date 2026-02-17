'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Safe subset — NEVER expose access_token or refresh_token to the frontend
export type IntegrationInfo = {
  id: string
  provider: string
  status: string
  email: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

const SAFE_COLUMNS = 'id, provider, status, email, metadata, created_at, updated_at' as const

export async function getIntegrationStatus(
  provider: string
): Promise<IntegrationInfo | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const { data } = await supabase
    .from('integrations')
    .select(SAFE_COLUMNS)
    .eq('organization_id', (profile as unknown as { organization_id: string }).organization_id)
    .eq('provider', provider)
    .single()

  return (data as IntegrationInfo) ?? null
}

export async function getAllIntegrations(): Promise<IntegrationInfo[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return []

  const { data } = await supabase
    .from('integrations')
    .select(SAFE_COLUMNS)
    .eq('organization_id', (profile as unknown as { organization_id: string }).organization_id)

  return (data as IntegrationInfo[] | null) ?? []
}

const disconnectSchema = z.string().min(1).max(50)

export async function disconnectIntegration(
  provider: string
): Promise<{ success: boolean }> {
  const parsed = disconnectSchema.safeParse(provider)
  if (!parsed.success) return { success: false }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const p = profile as unknown as { organization_id: string; role: string } | null
  if (!p || !['owner', 'admin'].includes(p.role)) {
    return { success: false }
  }

  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('organization_id', p.organization_id)
    .eq('provider', parsed.data)

  if (error) {
    console.error('Failed to disconnect integration:', error.message)
    return { success: false }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
