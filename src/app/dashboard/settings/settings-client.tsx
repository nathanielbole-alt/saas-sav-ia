'use client'

import { useSearchParams } from 'next/navigation'
import type { Profile, Organization } from '@/types/database.types'
import type { IntegrationInfo } from '@/lib/actions/integrations'
import type {
  TeamMember,
  InvitationWithInviter,
} from '@/lib/actions/invitations'

import { ProfileSection } from './components/profile-section'
import { OrganizationSection } from './components/organization-section'
import { PremiumFeaturesSection } from './components/premium-features-section'
import { TeamSection } from './components/team-section'
import { PoliciesSection } from './components/policies-section'
import { IntegrationsSection } from './components/integrations-section'
import { DeveloperSection } from './components/developer-section'

export default function SettingsClient({
  profile,
  organization,
  integrations,
  teamMembers,
  invitations,
}: {
  profile: Profile | null
  organization: Organization | null
  integrations: IntegrationInfo[]
  teamMembers: TeamMember[]
  invitations: InvitationWithInviter[]
}) {
  const searchParams = useSearchParams()
  const gmailResult = searchParams.get('gmail')
  const shopifyResult = searchParams.get('shopify')
  const metaResult = searchParams.get('meta')

  // ── Linear-Style Settings Container ───────────────────────────────────────────

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        {/* Header */}
        <div className="mb-10 lg:mb-12">
          <h1 className="text-[28px] font-semibold tracking-tight text-white mb-2">
            Paramètres
          </h1>
          <p className="text-[14px] text-[#86868b]">
            Gérez votre profil, vos préférences et les intégrations de votre organisation.
          </p>
        </div>

        {/* Single Column Layout */}
        <div className="space-y-12">
          <ProfileSection profile={profile} />

          <OrganizationSection
            profile={profile}
            organization={organization}
          />

          <PremiumFeaturesSection organization={organization} />

          <TeamSection
            profile={profile}
            organization={organization}
            teamMembers={teamMembers}
            invitations={invitations}
          />

          <IntegrationsSection
            profile={profile}
            integrations={integrations}
            gmailResult={gmailResult}
            shopifyResult={shopifyResult}
            metaResult={metaResult}
          />

          <PoliciesSection
            profile={profile}
            organization={organization}
          />

          <DeveloperSection organization={organization} />
        </div>
      </div>
    </div>
  )
}
