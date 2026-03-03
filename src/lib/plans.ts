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
            '2 automatisations',
            'Fiche client basique',
            'Analytics détaillés',
            'Support prioritaire',
        ],
        limits: {
            tickets: Infinity,
            users: 5,
            integrations: Infinity,
            aiResponses: 50,
            automations: 2,
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
            '10 automatisations',
            'Intelligence Client 360°',
            'SLA garanti 99.9%',
            'Account manager dédié',
            'Custom branding',
        ],
        limits: {
            tickets: Infinity,
            users: Infinity,
            integrations: Infinity,
            aiResponses: 250,
            automations: 10,
        },
    },
    enterprise: {
        name: 'Enterprise',
        description: 'Pour les grandes équipes',
        price: 149,
        features: [
            'Tout dans Business',
            'IA avancée (750 réponses / jour)',
            'Automatisations illimitées',
            'IA segmentation client',
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
            automations: Infinity,
        },
    },
} as const

export type PlanKey = keyof typeof PLANS
