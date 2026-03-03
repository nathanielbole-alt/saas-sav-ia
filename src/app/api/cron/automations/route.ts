import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  createCronSummary,
  processAutomation,
  type AutomationRecord,
} from '@/lib/automation-engine'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured — rejecting cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('automations')
    .select('*')
    .eq('is_active', true)
    .order('organization_id', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('Failed to fetch active automations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active automations' },
      { status: 500 }
    )
  }

  const automations = data as AutomationRecord[]
  const summary = createCronSummary(
    new Set(automations.map((automation) => automation.organization_id)).size
  )

  for (const automation of automations) {
    await processAutomation(automation, summary)
  }

  return NextResponse.json({
    success: true,
    ...summary,
  })
}
