import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSubscriptionInfo, getUsageSummary } from '@/lib/actions/billing'
import BillingClient from './billing-client'

export default async function BillingPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    const { data: org } = await supabase
        .from('organizations')
        .select('name, plan')
        .eq('id', profile?.organization_id ?? '')
        .single()

    const [subscription, usage] = await Promise.all([
        getSubscriptionInfo(),
        getUsageSummary(),
    ])

    return (
        <BillingClient
            currentPlan={org?.plan ?? 'pro'}
            subscription={subscription}
            usage={usage}
            isOwner={profile?.role === 'owner'}
        />
    )
}
