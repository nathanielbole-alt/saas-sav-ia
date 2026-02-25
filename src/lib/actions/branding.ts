'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const organizationIdSchema = z.string().uuid()

const brandingPayloadSchema = z
  .object({
    brand_logo_url: z.string().url().max(2048).nullable().optional(),
    brand_accent_color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide')
      .nullable()
      .optional(),
    brand_email_footer: z.string().max(200, '200 caractères max').nullable().optional(),
  })
  .strict()

export async function updateBranding(
  orgId: string,
  data: {
    brand_logo_url?: string | null
    brand_accent_color?: string | null
    brand_email_footer?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  const parsedOrgId = organizationIdSchema.safeParse(orgId)
  if (!parsedOrgId.success) {
    return { success: false, error: 'Organisation invalide' }
  }

  const parsedData = brandingPayloadSchema.safeParse(data)
  if (!parsedData.success) {
    return { success: false, error: parsedData.error.issues[0]?.message ?? 'Données invalides' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const p = profile as { organization_id: string; role: string } | null
  if (!p || !['owner', 'admin'].includes(p.role)) {
    return { success: false, error: 'Permissions insuffisantes' }
  }

  if (p.organization_id !== parsedOrgId.data) {
    return { success: false, error: 'Organisation non autorisée' }
  }

  const updates: Record<string, string | null> = {}
  if ('brand_logo_url' in parsedData.data) {
    updates.brand_logo_url = parsedData.data.brand_logo_url ?? null
  }
  if ('brand_accent_color' in parsedData.data) {
    updates.brand_accent_color = parsedData.data.brand_accent_color ?? '#E8856C'
  }
  if ('brand_email_footer' in parsedData.data) {
    updates.brand_email_footer = parsedData.data.brand_email_footer?.trim() || null
  }

  if (Object.keys(updates).length === 0) {
    return { success: true }
  }

  const { error } = await supabaseAdmin
    .from('organizations')
    .update(updates)
    .eq('id', parsedOrgId.data)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')

  return { success: true }
}
