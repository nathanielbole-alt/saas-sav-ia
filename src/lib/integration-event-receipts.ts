import { supabaseAdmin } from '@/lib/supabase/admin'

type ClaimParams = {
  provider: string
  externalId: string
  organizationId: string
  source: 'webhook' | 'sync'
}

type ClaimResult =
  | { acquired: true; receiptId: string }
  | { acquired: false; duplicate: true }

function isDuplicateError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  return (error as { code?: string }).code === '23505'
}

export async function claimIntegrationEventReceipt(
  params: ClaimParams
): Promise<ClaimResult> {
  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('integration_event_receipts')
    .insert({
      provider: params.provider,
      external_id: params.externalId,
      organization_id: params.organizationId,
      source: params.source,
      status: 'processing',
      updated_at: now,
    })
    .select('id')
    .single()

  if (error) {
    if (isDuplicateError(error)) {
      return { acquired: false, duplicate: true }
    }

    throw error
  }

  return { acquired: true, receiptId: (data as { id: string }).id }
}

export async function completeIntegrationEventReceipt(
  receiptId: string
): Promise<void> {
  await supabaseAdmin
    .from('integration_event_receipts')
    .update({
      status: 'processed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', receiptId)
}

export async function releaseIntegrationEventReceipt(
  receiptId: string
): Promise<void> {
  await supabaseAdmin.from('integration_event_receipts').delete().eq('id', receiptId)
}
