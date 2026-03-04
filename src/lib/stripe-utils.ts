export type OrgSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled'

export function normalizeSubscriptionStatus(value: string): OrgSubscriptionStatus {
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
