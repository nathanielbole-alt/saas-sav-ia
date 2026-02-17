import { redirect } from 'next/navigation'
import { getOnboardingStatus } from '@/lib/actions/onboarding'
import OnboardingClient from './onboarding-client'

export default async function OnboardingPage() {
  const status = await getOnboardingStatus()

  if (!status) redirect('/login')
  if (status.isOnboarded) redirect('/dashboard')

  return <OnboardingClient initialStatus={status} />
}
