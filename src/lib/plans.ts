/**
 * Plan definitions — safe to import from client components.
 * For the Stripe SDK instance and priceId helpers, use '@/lib/stripe' (server-only).
 */

export const PLANS = {
    pro: {
        name: 'Pro',
        description: 'Pour les équipes en croissance',
        price: 29,
        features: [
            'Tickets illimités',
            '5 utilisateurs',
            'Toutes les intégrations',
            'IA avancée (50 réponses / jour)',
            'Analytics détaillés',
            'Support prioritaire',
        ],
        limits: {
            tickets: Infinity,
            users: 5,
            integrations: Infinity,
            aiResponses: 50,
        },
    },
    business: {
        name: 'Business',
        description: 'Pour les entreprises',
        price: 79,
        features: [
            'Tout dans Pro',
            'Utilisateurs illimités',
            'API access',
            'IA avancée (250 réponses / jour)',
            'SLA garanti 99.9%',
            'Account manager dédié',
            'Custom branding',
        ],
        limits: {
            tickets: Infinity,
            users: Infinity,
            integrations: Infinity,
            aiResponses: 250,
        },
    },
    enterprise: {
        name: 'Enterprise',
        description: 'Pour les grandes équipes',
        price: 149,
        features: [
            'Tout dans Business',
            'IA avancée (750 réponses / jour)',
            'SLA garanti 99.9%',
            'Account manager dédié',
            'Custom branding',
            'API & webhooks',
            'SSO / SAML',
        ],
        limits: {
            tickets: Infinity,
            users: Infinity,
            integrations: Infinity,
            aiResponses: 750,
        },
    },
} as const

export type PlanKey = keyof typeof PLANS
