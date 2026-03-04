import Stripe from 'stripe'

// Re-export plan definitions so server-side consumers can still do
// `import { PLANS, type PlanKey } from '@/lib/stripe'`
export { PLANS, type PlanKey } from './plans'
import type { PlanKey } from './plans'

let _stripe: Stripe | null = null

/**
 * Lazily initialise the Stripe SDK.
 * Throws only when billing code is actually invoked, not at module-import time.
 */
export function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY
        if (!key) {
            throw new Error(
                'STRIPE_SECRET_KEY is required for billing operations. ' +
                'Set it in .env.local or disable billing features.'
            )
        }
        _stripe = new Stripe(key, { typescript: true })
    }
    return _stripe
}

/**
 * Backward-compatible export.
 * Every property access is forwarded to the lazily-created Stripe instance.
 */
export const stripe = new Proxy({} as Stripe, {
    get(_, prop) {
        return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
    },
})

const proPriceId = process.env.STRIPE_PRO_PRICE_ID ?? null
const businessPriceId = process.env.STRIPE_BUSINESS_PRICE_ID ?? null
const enterprisePriceId = process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null

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
