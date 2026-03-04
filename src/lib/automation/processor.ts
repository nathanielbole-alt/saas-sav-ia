import { supabaseAdmin } from '@/lib/supabase/admin'
import { executeAction, getExistingLogTicketIds } from './executor'
import { findEligibleTickets } from './triggers'
import type { AutomationLogInsert, AutomationRecord, CronSummary } from './types'

export async function processAutomation(
  automation: AutomationRecord,
  summary: CronSummary
): Promise<void> {
  const startedAt = new Date().toISOString()
  const eligibleTickets = await findEligibleTickets(automation)

  summary.automationsEvaluated += 1
  summary.ticketsMatched += eligibleTickets.length

  const loggedTicketIds = await getExistingLogTicketIds(
    automation.id,
    eligibleTickets.map((ticket) => ticket.id)
  )

  let executedCount = 0

  for (const ticket of eligibleTickets) {
    if (loggedTicketIds.has(ticket.id)) {
      summary.duplicateSkips += 1
      continue
    }

    try {
      const executed = await executeAction(ticket, automation)
      if (!executed) continue

      const logPayload: AutomationLogInsert = {
        automation_id: automation.id,
        ticket_id: ticket.id,
      }

      const logResult = await supabaseAdmin
        .from('automation_logs')
        .upsert(logPayload, {
          onConflict: 'automation_id,ticket_id',
          ignoreDuplicates: true,
        })

      if (logResult.error) {
        console.error(
          `Failed to persist automation log for ${automation.id}/${ticket.id}:`,
          logResult.error
        )
      }

      executedCount += 1
      summary.actionsExecuted += 1
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown automation execution error'
      console.error(`Automation ${automation.id} failed on ticket ${ticket.id}:`, message)
      summary.errors.push({ automationId: automation.id, message })
    }
  }

  const { error: updateError } = await supabaseAdmin
    .from('automations')
    .update({
      execution_count: automation.execution_count + executedCount,
      last_executed_at: startedAt,
      updated_at: startedAt,
    })
    .eq('id', automation.id)

  if (updateError) {
    console.error(`Failed to update automation counters for ${automation.id}:`, updateError)
    summary.errors.push({
      automationId: automation.id,
      message: 'Failed to update execution counters',
    })
  }
}
