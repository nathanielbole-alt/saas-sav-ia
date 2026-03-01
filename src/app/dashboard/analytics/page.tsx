import { getAnalytics } from '@/lib/actions/analytics'
import { getOrgPlan } from '@/lib/feature-gate'
import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './analytics-client'

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let plan: string = 'pro'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .maybeSingle()
    const orgId = (profile as { organization_id?: string } | null)?.organization_id
    if (orgId) plan = await getOrgPlan(orgId)
  }

  return <AnalyticsClient analytics={analytics} plan={plan} />
}
