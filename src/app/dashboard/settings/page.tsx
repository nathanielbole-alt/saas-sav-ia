import { getProfile, getOrganization } from '@/lib/actions/settings'
import { getAllIntegrations } from '@/lib/actions/integrations'
import { getTeamMembers, getInvitations } from '@/lib/actions/invitations'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const [profile, organization, integrations, teamMembers, invitations] = await Promise.all([
    getProfile(),
    getOrganization(),
    getAllIntegrations(),
    getTeamMembers(),
    getInvitations(),
  ])

  return (
    <SettingsClient
      profile={profile}
      organization={organization}
      integrations={integrations}
      teamMembers={teamMembers}
      invitations={invitations}
    />
  )
}
