'use server'

import { getPlanFromPriceId, getPriceIdForPlan, PLANS, stripe, type PlanKey } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrgPlan, getOrgUsage } from '@/lib/feature-gate'
import { normalizeSubscriptionStatus } from '@/lib/stripe-utils'

type UserBillingContext = {
    userId: string
    userEmail: string | null
    organizationId: string
    role: 'owner' | 'admin' | 'agent'
}

async function getCurrentUserBillingContext(): Promise<UserBillingContext | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .maybeSingle()

    const organizationId =
        (profile as { organization_id: string } | null)?.organization_id ?? null
    const role = (profile as { role: UserBillingContext['role'] } | null)?.role ?? null

    if (!organizationId || !role) return null

    return {
        userId: user.id,
        userEmail: user.email ?? null,
        organizationId,
        role,
    }
}

/**
 * Create a Stripe Checkout Session for upgrading to a paid plan
 */
export async function createCheckoutSession(planKey: string) {
    const context = await getCurrentUserBillingContext()
    if (!context) {
        return { error: 'Non authentifié' }
    }

    if (context.role !== 'owner') {
        return { error: "Seul le propriétaire peut changer de plan" }
    }

    if (planKey !== 'pro' && planKey !== 'business' && planKey !== 'enterprise') {
        return { error: 'Plan invalide' }
    }

    const plan = PLANS[planKey as PlanKey]
    if (!plan) {
        return { error: 'Plan invalide' }
    }

    const priceId = getPriceIdForPlan(planKey as PlanKey)
    if (!priceId) {
        return {
            error:
                "Ce plan n'est pas encore configuré sur Stripe. Renseigne STRIPE_PRO_PRICE_ID, STRIPE_BUSINESS_PRICE_ID et STRIPE_ENTERPRISE_PRICE_ID.",
        }
    }

    const supabase = await createClient()

    // Check for existing stripe_customer_id in integrations
    const { data: stripeIntegration } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('organization_id', context.organizationId)
        .eq('provider', 'stripe')
        .maybeSingle()

    let customerId = stripeIntegration?.access_token

    if (!customerId) {
        const customer = await stripe.customers.create({
            email: context.userEmail ?? undefined,
            metadata: {
                supabase_user_id: context.userId,
                org_id: context.organizationId,
            },
        })
        customerId = customer.id

        // Save customer ID as stripe integration
        await supabaseAdmin
            .from('integrations')
            .upsert({
                organization_id: context.organizationId,
                provider: 'stripe',
                status: 'active',
                access_token: customerId,
                metadata: { customer_id: customerId },
            }, {
                onConflict: 'organization_id,provider',
            })
    }

    // Create checkout session
    const subscriptionData: {
        metadata: { org_id: string; plan: string }
        trial_period_days?: number
    } = {
        metadata: {
            org_id: context.organizationId,
            plan: planKey,
        },
    }
    if (planKey === 'pro') {
        subscriptionData.trial_period_days = 7
    }

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        subscription_data: subscriptionData,
        success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
        metadata: {
            user_id: context.userId,
            org_id: context.organizationId,
            plan: planKey,
        },
    })

    return { url: session.url }
}

/**
 * Create a Stripe Customer Portal session for managing subscriptions
 */
export async function createPortalSession() {
    const context = await getCurrentUserBillingContext()
    if (!context) {
        return { error: 'Non authentifié' }
    }

    if (context.role !== 'owner') {
        return { error: "Seul le propriétaire peut gérer l'abonnement" }
    }

    const supabase = await createClient()

    const { data: stripeIntegration } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('organization_id', context.organizationId)
        .eq('provider', 'stripe')
        .maybeSingle()

    if (!stripeIntegration?.access_token) {
        return { error: 'Pas d\'abonnement actif' }
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: stripeIntegration.access_token,
        return_url: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
    })

    return { url: session.url }
}

/**
 * Get the current subscription info for the user's organization
 */
export async function getSubscriptionInfo() {
    const context = await getCurrentUserBillingContext()
    if (!context) {
        return null
    }

    const supabase = await createClient()
    const { data: organization } = await supabase
        .from('organizations')
        .select('plan, subscription_status')
        .eq('id', context.organizationId)
        .maybeSingle()

    const organizationPlan = (organization as { plan?: PlanKey } | null)?.plan ?? 'pro'
    const organizationSubscriptionStatus = normalizeSubscriptionStatus(
        (organization as { subscription_status?: string } | null)?.subscription_status ?? 'active'
    )

    const { data: stripeIntegration } = await supabase
        .from('integrations')
        .select('access_token')
        .eq('organization_id', context.organizationId)
        .eq('provider', 'stripe')
        .maybeSingle()

    if (!stripeIntegration?.access_token) {
        return {
            plan: organizationPlan,
            status: organizationSubscriptionStatus,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEnd: null,
        }
    }

    // Get latest subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
        customer: stripeIntegration.access_token,
        status: 'all',
        limit: 1,
    })

    if (subscriptions.data.length === 0) {
        return {
            plan: organizationPlan,
            status: organizationSubscriptionStatus,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEnd: null,
        }
    }

    const sub = subscriptions.data[0]
    if (!sub) {
        return {
            plan: organizationPlan,
            status: organizationSubscriptionStatus,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEnd: null,
        }
    }

    return {
        plan:
            getPlanFromPriceId(sub.items.data[0]?.price.id) ??
            ((sub.metadata.plan as PlanKey | undefined) ?? organizationPlan),
        status: normalizeSubscriptionStatus(sub.status),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        trialEnd: sub.trial_end,
    }
}

export type UsageSummary = {
    tickets: { current: number; limit: number }
    aiResponses: { limit: number }
    integrations: { current: number; limit: number }
    users: { current: number; limit: number }
    plan: PlanKey
}

/**
 * Get usage summary for the current user's organization.
 * Used by the billing page to display usage bars.
 */
export async function getUsageSummary(): Promise<UsageSummary | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    const orgId = (profile as { organization_id: string } | null)?.organization_id
    if (!orgId) return null

    const [plan, usage] = await Promise.all([getOrgPlan(orgId), getOrgUsage(orgId)])
    const limits = PLANS[plan].limits

    return {
        tickets: { current: usage.ticketsThisMonth, limit: limits.tickets },
        aiResponses: { limit: limits.aiResponses },
        integrations: { current: usage.activeIntegrations, limit: limits.integrations },
        users: { current: usage.users, limit: limits.users },
        plan,
    }
}
