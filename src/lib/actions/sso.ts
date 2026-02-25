'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const organizationIdSchema = z.string().uuid()

const ssoPayloadSchema = z
  .object({
    sso_provider: z.enum(['google', 'okta', 'microsoft', 'custom']),
    sso_idp_metadata_url: z.string().url('URL metadata invalide').max(2048),
  })
  .strict()

export async function configureSso(
  orgId: string,
  data: {
    sso_provider: string
    sso_idp_metadata_url: string
  }
): Promise<{ success: boolean; error?: string }> {
  const parsedOrgId = organizationIdSchema.safeParse(orgId)
  if (!parsedOrgId.success) {
    return { success: false, error: 'Organisation invalide' }
  }

  const parsedData = ssoPayloadSchema.safeParse(data)
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

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('plan')
    .eq('id', parsedOrgId.data)
    .single()

  const plan = (org as { plan: string } | null)?.plan
  if (plan !== 'enterprise') {
    return { success: false, error: 'SSO disponible uniquement sur le plan Enterprise' }
  }

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      sso_provider: parsedData.data.sso_provider,
      sso_idp_metadata_url: parsedData.data.sso_idp_metadata_url,
      sso_enabled: true,
    })
    .eq('id', parsedOrgId.data)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')

  return { success: true }
}
