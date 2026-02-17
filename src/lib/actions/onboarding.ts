'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type OnboardingStatus = {
  isOnboarded: boolean
  profile: {
    fullName: string | null
    email: string
    teamSize: string | null
    ticketVolume: string | null
  }
  orgName: string
  refundPolicy: string | null
  savPolicy: string | null
  connectedProviders: string[]
}

export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_onboarded, full_name, email, organization_id, team_size, ticket_volume')
    .eq('id', user.id)
    .single()

  const p = profile as {
    is_onboarded: boolean
    full_name: string | null
    email: string
    organization_id: string
    team_size: string | null
    ticket_volume: string | null
  } | null

  if (!p) return null

  const [orgResult, integrationsResult] = await Promise.all([
    supabase
      .from('organizations')
      .select('name, refund_policy, sav_policy')
      .eq('id', p.organization_id)
      .single(),
    supabase
      .from('integrations')
      .select('provider, status')
      .eq('organization_id', p.organization_id)
      .neq('provider', 'stripe'),
  ])

  const orgName = (orgResult.data as { name: string } | null)?.name ?? ''
  const refundPolicy =
    (orgResult.data as { refund_policy?: string | null } | null)?.refund_policy ?? null
  const savPolicy =
    (orgResult.data as { sav_policy?: string | null } | null)?.sav_policy ?? null
  const integrations = (integrationsResult.data ?? []) as { provider: string; status: string }[]
  const connectedProviders = integrations
    .filter((i) => i.status === 'active')
    .map((i) => i.provider)

  return {
    isOnboarded: p.is_onboarded,
    profile: {
      fullName: p.full_name,
      email: p.email,
      teamSize: p.team_size,
      ticketVolume: p.ticket_volume,
    },
    orgName,
    refundPolicy,
    savPolicy,
    connectedProviders,
  }
}

const step2Schema = z.object({
  fullName: z.string().min(1, 'Le nom est requis').max(200),
  orgName: z.string().min(1, "Le nom de l'entreprise est requis").max(200),
  industry: z.string().max(100).optional(),
  teamSize: z.string().max(20).optional(),
  ticketVolume: z.string().max(20).optional(),
})

export async function completeOnboardingStep2(
  data: z.infer<typeof step2Schema>
): Promise<{ success: boolean; error?: string }> {
  const parsed = step2Schema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const p = profile as { organization_id: string; role: string } | null
  if (!p) return { success: false, error: 'Profil introuvable' }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      industry: parsed.data.industry ?? null,
      team_size: parsed.data.teamSize ?? null,
      ticket_volume: parsed.data.ticketVolume ?? null,
    })
    .eq('id', user.id)

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  if (p.role === 'owner' || p.role === 'admin') {
    const { error: orgError } = await supabase
      .from('organizations')
      .update({ name: parsed.data.orgName })
      .eq('id', p.organization_id)

    if (orgError) {
      return { success: false, error: orgError.message }
    }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function completeOnboarding(): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false }

  const { error } = await supabase
    .from('profiles')
    .update({ is_onboarded: true })
    .eq('id', user.id)

  if (error) {
    console.error('Failed to complete onboarding:', error.message)
    return { success: false }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

const onboardingPoliciesSchema = z.object({
  refundPolicy: z.string().max(5000, 'La politique de remboursement est trop longue').transform((value) => value.trim()),
  savPolicy: z.string().max(5000, 'La politique SAV est trop longue').transform((value) => value.trim()),
})

export async function saveOnboardingPolicies(
  refundPolicy: string,
  savPolicy: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = onboardingPoliciesSchema.safeParse({
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

  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const p = profile as { organization_id: string; role: string } | null
  if (!p) return { success: false, error: 'Profil introuvable' }

  if (p.role !== 'owner' && p.role !== 'admin') {
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
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/onboarding')
  revalidatePath('/dashboard/settings')

  return { success: true }
}

export async function setOnboardingRedirectCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('onboarding_redirect', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
}

export async function resetOnboarding(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const p = profile as { role: string } | null
  if (!p) return { success: false, error: 'Profil introuvable' }

  if (p.role !== 'owner' && p.role !== 'admin') {
    return { success: false, error: 'Seuls les propriétaires et administrateurs peuvent relancer l\'onboarding' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_onboarded: false })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
