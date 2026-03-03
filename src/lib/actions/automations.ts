'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { PLANS, type PlanKey } from '@/lib/plans'
import { getOrgPlan } from '@/lib/feature-gate'
import {
  createCronSummary,
  processAutomation,
  type AutomationRecord,
  type CronSummary,
} from '@/lib/automation-engine'
import type { Json } from '@/types/database.types'

// ── Types ───────────────────────────────────────────────────────────────────

export type Condition = {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'not_equals'
  value: string
}

export type AutomationRow = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  trigger_type: string
  trigger_config: Record<string, unknown>
  conditions: Condition[]
  action_type: string
  action_config: Record<string, unknown>
  execution_count: number
  last_executed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type AutomationLimits = {
  current: number
  max: number
  plan: PlanKey
}

export type AutomationAgent = {
  id: string
  full_name: string | null
  email: string
}

export type AutomationTeam = {
  agents: AutomationAgent[]
  canManage: boolean
}

type SupabaseErrorLike = {
  code?: string
  message?: string
}

// ── Zod schemas ─────────────────────────────────────────────────────────────

const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'not_equals']),
  value: z.string(),
})

const automationInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  trigger_type: z.enum([
    'ticket_created',
    'ticket_updated',
    'no_reply_timeout',
    'keyword_detected',
    'priority_changed',
  ]),
  trigger_config: z.record(z.string(), z.unknown()).optional().default({}),
  conditions: z.array(conditionSchema).optional().default([]),
  action_type: z.enum([
    'assign_agent',
    'change_priority',
    'change_status',
    'send_reply',
    'add_tag',
    'notify_slack',
  ]),
  action_config: z.record(z.string(), z.unknown()).optional().default({}),
})

export type AutomationInput = z.infer<typeof automationInputSchema>

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getOrgContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .maybeSingle()

  const orgId = (profile as { organization_id?: string } | null)?.organization_id
  const role = (profile as { role?: string } | null)?.role
  if (!orgId) throw new Error('Organisation introuvable')

  return { supabase, userId: user.id, orgId, role: role ?? 'agent' }
}

function mapRow(row: Record<string, unknown>): AutomationRow {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    is_active: row.is_active as boolean,
    trigger_type: row.trigger_type as string,
    trigger_config: (row.trigger_config as Record<string, unknown>) ?? {},
    conditions: (row.conditions as Condition[]) ?? [],
    action_type: row.action_type as string,
    action_config: (row.action_config as Record<string, unknown>) ?? {},
    execution_count: (row.execution_count as number) ?? 0,
    last_executed_at: (row.last_executed_at as string) ?? null,
    created_by: (row.created_by as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

function getAutomationsSchemaError(error: SupabaseErrorLike | null | undefined): string | null {
  const message = error?.message ?? ''

  if (
    error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    message.includes("table 'public.automations'") ||
    message.includes('relation "automations" does not exist')
  ) {
    return 'La table "automations" n’existe pas encore dans Supabase. Appliquez la migration SQL 20260302_automations.sql puis rechargez le schema cache.'
  }

  return null
}

async function executeAutomationImmediately(
  automationId: string,
  orgId: string
): Promise<CronSummary | null> {
  const { data, error } = await supabaseAdmin
    .from('automations')
    .select('*')
    .eq('id', automationId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (error || !data) {
    console.error(`Error fetching automation ${automationId} for immediate execution:`, error)
    return null
  }

  const summary = createCronSummary(1)
  await processAutomation(data as AutomationRecord, summary)
  return summary
}

// ── Server Actions ──────────────────────────────────────────────────────────

export async function getAutomations(): Promise<AutomationRow[]> {
  const { supabase } = await getOrgContext()

  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching automations:', error)
    const schemaError = getAutomationsSchemaError(error)
    if (schemaError) {
      console.error(schemaError)
    }
    return []
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapRow)
}

export async function createAutomation(
  input: AutomationInput
): Promise<{
  success: boolean
  automationId?: string
  actionsExecuted?: number
  error?: string
}> {
  const { supabase, userId, orgId, role } = await getOrgContext()

  if (role === 'agent') {
    return { success: false, error: 'Seuls les admins peuvent créer des automatisations' }
  }

  const parsed = automationInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Données invalides' }
  }

  // Check plan limits
  const plan = await getOrgPlan(orgId)
  const limit = PLANS[plan].limits.automations
  const { count } = await supabase
    .from('automations')
    .select('*', { count: 'exact', head: true })

  if ((count ?? 0) >= limit) {
    return {
      success: false,
      error: `Limite atteinte : ${count}/${limit === Infinity ? '∞' : limit} automatisations (plan ${plan}). Passez à un plan supérieur.`,
    }
  }

  const { data, error } = await supabase
    .from('automations')
    .insert({
      organization_id: orgId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      trigger_type: parsed.data.trigger_type,
      trigger_config: parsed.data.trigger_config as unknown as Json,
      conditions: parsed.data.conditions as unknown as Json,
      action_type: parsed.data.action_type,
      action_config: parsed.data.action_config as unknown as Json,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating automation:', error)
    return {
      success: false,
      error: getAutomationsSchemaError(error) ?? 'Erreur lors de la création',
    }
  }

  const automationId = (data as { id: string } | null)?.id
  const summary =
    automationId ? await executeAutomationImmediately(automationId, orgId) : null

  revalidatePath('/dashboard/automations')
  return {
    success: true,
    automationId,
    actionsExecuted: summary?.actionsExecuted ?? 0,
  }
}

export async function updateAutomation(
  id: string,
  input: AutomationInput
): Promise<{ success: boolean; error?: string }> {
  const { supabase, role } = await getOrgContext()

  if (role === 'agent') {
    return { success: false, error: 'Seuls les admins peuvent modifier les automatisations' }
  }

  const parsed = automationInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Données invalides' }
  }

  const { error } = await supabase
    .from('automations')
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      trigger_type: parsed.data.trigger_type,
      trigger_config: parsed.data.trigger_config as unknown as Json,
      conditions: parsed.data.conditions as unknown as Json,
      action_type: parsed.data.action_type,
      action_config: parsed.data.action_config as unknown as Json,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating automation:', error)
    return {
      success: false,
      error: getAutomationsSchemaError(error) ?? 'Erreur lors de la mise à jour',
    }
  }

  revalidatePath('/dashboard/automations')
  return { success: true }
}

export async function toggleAutomation(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; actionsExecuted?: number; error?: string }> {
  const { supabase, orgId, role } = await getOrgContext()

  if (role === 'agent') {
    return { success: false, error: 'Seuls les admins peuvent modifier les automatisations' }
  }

  const { error } = await supabase
    .from('automations')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    console.error('Error toggling automation:', error)
    return {
      success: false,
      error: getAutomationsSchemaError(error) ?? 'Erreur lors du basculement',
    }
  }

  const summary = isActive
    ? await executeAutomationImmediately(id, orgId)
    : null

  revalidatePath('/dashboard/automations')
  return {
    success: true,
    actionsExecuted: summary?.actionsExecuted ?? 0,
  }
}

export async function runAutomationNow(
  automationId: string
): Promise<{ success: boolean; actionsExecuted: number; error?: string }> {
  const { supabase, orgId, role } = await getOrgContext()

  if (role === 'agent') {
    return { success: false, actionsExecuted: 0, error: 'Non autorisé' }
  }

  const { data, error } = await supabase
    .from('automations')
    .select('id')
    .eq('id', automationId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (error || !data) {
    return {
      success: false,
      actionsExecuted: 0,
      error: 'Automatisation introuvable',
    }
  }

  const summary = await executeAutomationImmediately(automationId, orgId)

  revalidatePath('/dashboard/automations')

  return {
    success: true,
    actionsExecuted: summary?.actionsExecuted ?? 0,
  }
}

export async function deleteAutomation(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, role } = await getOrgContext()

  if (role === 'agent') {
    return { success: false, error: 'Seuls les admins peuvent supprimer les automatisations' }
  }

  const { error } = await supabase
    .from('automations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting automation:', error)
    return {
      success: false,
      error: getAutomationsSchemaError(error) ?? 'Erreur lors de la suppression',
    }
  }

  revalidatePath('/dashboard/automations')
  return { success: true }
}

export async function getAutomationLimits(): Promise<AutomationLimits> {
  const { supabase, orgId } = await getOrgContext()
  const plan = await getOrgPlan(orgId)
  const max = PLANS[plan].limits.automations

  const { count, error } = await supabase
    .from('automations')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching automation limits:', error)
    const schemaError = getAutomationsSchemaError(error)
    if (schemaError) {
      console.error(schemaError)
    }
  }

  return {
    current: count ?? 0,
    max,
    plan,
  }
}

export async function getAutomationTeam(): Promise<AutomationTeam> {
  const { supabase, role } = await getOrgContext()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching automation team:', error)
    return {
      agents: [],
      canManage: role !== 'agent',
    }
  }

  return {
    agents: ((data ?? []) as AutomationAgent[]).sort((a, b) => {
      const left = (a.full_name ?? a.email).toLowerCase()
      const right = (b.full_name ?? b.email).toLowerCase()
      return left.localeCompare(right)
    }),
    canManage: role !== 'agent',
  }
}
