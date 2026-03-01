import { getProfile, getOrganization } from '@/lib/actions/settings'
import { getAllIntegrations } from '@/lib/actions/integrations'
import { getTeamMembers, getInvitations } from '@/lib/actions/invitations'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const profile = await getProfile()

  const [organization, integrations, teamMembers, invitations] = await Promise.all([
    getOrganization(),
    getAllIntegrations(),
    profile?.role === 'owner' || profile?.role === 'admin' ? getTeamMembers() : Promise.resolve([]),
    profile?.role === 'owner' || profile?.role === 'admin' ? getInvitations() : Promise.resolve([]),
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
