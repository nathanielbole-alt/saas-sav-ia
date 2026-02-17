'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Profile, Organization } from '@/types/database.types'

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as unknown as Profile
}

export async function updateProfile(
  fullName: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getOrganization(): Promise<Organization | null> {
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
  const orgId = (profile as unknown as { organization_id: string }).organization_id

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  return data as unknown as Organization
}

export async function updateOrganization(
  name: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const p = profile as unknown as { role: string; organization_id: string } | null
  if (!p || (p.role !== 'owner' && p.role !== 'admin')) {
    return { success: false, error: 'Seuls les propriétaires et administrateurs peuvent modifier' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({ name })
    .eq('id', p.organization_id)

  if (error) {
    console.error('Error updating organization:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

const companyPoliciesSchema = z.object({
  refundPolicy: z.string().max(5000, 'La politique de remboursement est trop longue').transform((value) => value.trim()),
  savPolicy: z.string().max(5000, 'La politique SAV est trop longue').transform((value) => value.trim()),
})

export async function updateCompanyPolicies(
  refundPolicy: string,
  savPolicy: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = companyPoliciesSchema.safeParse({
    refundPolicy,
    savPolicy,
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Données invalides',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const p = profile as unknown as { role: string; organization_id: string } | null
  if (!p || (p.role !== 'owner' && p.role !== 'admin')) {
    return {
      success: false,
      error: 'Seuls les propriétaires et administrateurs peuvent modifier',
    }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      refund_policy: parsed.data.refundPolicy.length > 0 ? parsed.data.refundPolicy : null,
      sav_policy: parsed.data.savPolicy.length > 0 ? parsed.data.savPolicy : null,
    })
    .eq('id', p.organization_id)

  if (error) {
    console.error('Error updating company policies:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
