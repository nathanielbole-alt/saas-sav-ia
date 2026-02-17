import { NextRequest, NextResponse } from 'next/server'
import { getPlanFromPriceId, stripe, type PlanKey } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Stripe as StripeType } from 'stripe'

// Local webhook setup:
// 1) stripe login
// 2) stripe listen --forward-to localhost:3000/api/stripe/webhook
// 3) Copy the generated whsec_... into STRIPE_WEBHOOK_SECRET in .env.local

export const runtime = 'nodejs'

function isPlanKey(value: string | undefined): value is PlanKey {
    return value === 'pro' || value === 'business' || value === 'enterprise'
}

type OrgSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

function normalizeSubscriptionStatus(value: string): OrgSubscriptionStatus {
    if (value === 'active') return 'active'
    if (value === 'trialing') return 'trialing'
    if (
        value === 'past_due' ||
        value === 'unpaid' ||
        value === 'incomplete' ||
        value === 'incomplete_expired'
    ) {
        return 'past_due'
    }
    if (value === 'canceled') return 'canceled'
    return 'active'
}

function resolvePlanFromSubscription(
    subscription: StripeType.Subscription
): PlanKey {
    const priceId = subscription.items.data[0]?.price.id
    const byPrice = getPlanFromPriceId(priceId)
    if (byPrice) return byPrice

    const metadataPlan = subscription.metadata?.plan
    if (isPlanKey(metadataPlan)) return metadataPlan

    return 'pro'
}

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret || !sig) {
        console.error('Missing STRIPE_WEBHOOK_SECRET or stripe-signature header')
        return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 })
    }

    let event: StripeType.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
        console.error('Webhook signature verification failed', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as StripeType.Checkout.Session
            const customerId = session.customer as string | null
            const orgId = session.metadata?.org_id
            let plan: PlanKey = isPlanKey(session.metadata?.plan)
                ? session.metadata.plan
                : 'pro'
            let subscriptionStatus: OrgSubscriptionStatus = 'active'

            if (typeof session.subscription === 'string') {
                const subscription = await stripe.subscriptions.retrieve(
                    session.subscription
                )
                plan = resolvePlanFromSubscription(subscription)
                subscriptionStatus = normalizeSubscriptionStatus(subscription.status)
            }

            if (orgId) {
                // Update organization plan
                await supabaseAdmin
                    .from('organizations')
                    .update({ plan, subscription_status: subscriptionStatus })
                    .eq('id', orgId)

                // Ensure stripe integration record exists
                if (customerId) {
                    await supabaseAdmin
                        .from('integrations')
                        .upsert({
                            organization_id: orgId,
                            provider: 'stripe',
                            status: 'active',
                            access_token: customerId,
                            metadata: { customer_id: customerId },
                        }, {
                            onConflict: 'organization_id,provider',
                        })
                }
            }

            break
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object as StripeType.Subscription
            const customerId = subscription.customer as string

            // Find org by stripe customer ID in integrations
            const { data: integration } = await supabaseAdmin
                .from('integrations')
                .select('organization_id')
                .eq('provider', 'stripe')
                .eq('access_token', customerId)
                .single()

            if (integration?.organization_id) {
                if (
                    subscription.status === 'active' ||
                    subscription.status === 'trialing'
                ) {
                    const plan = resolvePlanFromSubscription(subscription)
                    const subscriptionStatus = normalizeSubscriptionStatus(subscription.status)
                    await supabaseAdmin
                        .from('organizations')
                        .update({ plan, subscription_status: subscriptionStatus })
                        .eq('id', integration.organization_id)
                } else if (
                    subscription.status === 'past_due' ||
                    subscription.status === 'unpaid' ||
                    subscription.status === 'incomplete' ||
                    subscription.status === 'incomplete_expired'
                ) {
                    await supabaseAdmin
                        .from('organizations')
                        .update({ plan: 'pro', subscription_status: 'past_due' })
                        .eq('id', integration.organization_id)
                } else if (subscription.status === 'canceled') {
                    await supabaseAdmin
                        .from('organizations')
                        .update({ plan: 'pro', subscription_status: 'canceled' })
                        .eq('id', integration.organization_id)
                }
            }

            break
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as StripeType.Subscription
            const customerId = subscription.customer as string

            const { data: integration } = await supabaseAdmin
                .from('integrations')
                .select('organization_id')
                .eq('provider', 'stripe')
                .eq('access_token', customerId)
                .single()

            if (integration?.organization_id) {
                await supabaseAdmin
                    .from('organizations')
                    .update({ plan: 'pro', subscription_status: 'canceled' })
                    .eq('id', integration.organization_id)
            }

            break
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as StripeType.Invoice
            const customerId = invoice.customer as string
            console.warn(`Payment failed for customer ${customerId}`)

            const { data: integration } = await supabaseAdmin
                .from('integrations')
                .select('organization_id')
                .eq('provider', 'stripe')
                .eq('access_token', customerId)
                .single()

            if (integration?.organization_id) {
                await supabaseAdmin
                    .from('organizations')
                    .update({ plan: 'pro', subscription_status: 'past_due' })
                    .eq('id', integration.organization_id)
            }
            break
        }

        default:
            break
    }

    return NextResponse.json({ received: true })
}
