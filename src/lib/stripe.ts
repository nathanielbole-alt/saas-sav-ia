import Stripe from 'stripe'

// Re-export plan definitions so server-side consumers can still do
// `import { PLANS, type PlanKey } from '@/lib/stripe'`
export { PLANS, type PlanKey } from './plans'
import type { PlanKey } from './plans'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

const proPriceId = process.env.STRIPE_PRO_PRICE_ID ?? null
const businessPriceId = process.env.STRIPE_BUSINESS_PRICE_ID ?? null
const enterprisePriceId = process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
})

/**
 * Maps a Stripe priceId → a plan key, or null if unknown.
 * priceId values come from env vars set by `npm run stripe:setup`.
 */
export function getPlanFromPriceId(priceId: string | null | undefined): PlanKey | null {
    if (!priceId) return null
    if (priceId === proPriceId) return 'pro'
    if (priceId === businessPriceId) return 'business'
    if (priceId === enterprisePriceId) return 'enterprise'
    return null
}

/** Returns the Stripe priceId for a paid plan, or null if env var is missing. */
export function getPriceIdForPlan(planKey: PlanKey): string | null {
    if (planKey === 'pro') return proPriceId
    if (planKey === 'business') return businessPriceId
    if (planKey === 'enterprise') return enterprisePriceId
    return null
}
