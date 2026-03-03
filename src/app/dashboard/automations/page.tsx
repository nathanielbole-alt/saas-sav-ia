import {
  getAutomations,
  getAutomationLimits,
  getAutomationTeam,
} from '@/lib/actions/automations'
import AutomationsClient from './automations-client'

export default async function AutomationsPage() {
  const [automations, limits, team] = await Promise.all([
    getAutomations(),
    getAutomationLimits(),
    getAutomationTeam(),
  ])

  return (
    <AutomationsClient
      initialAutomations={automations}
      limits={limits}
      agents={team.agents}
      canManage={team.canManage}
    />
  )
}
