import { describe, it, expect } from 'vitest'
import { PLANS, type PlanKey } from '@/lib/plans'

describe('PLANS configuration', () => {
  it('has exactly 3 plans: pro, business, enterprise', () => {
    const planKeys = Object.keys(PLANS)
    expect(planKeys).toEqual(['pro', 'business', 'enterprise'])
  })

  it('pro plan has correct limits', () => {
    expect(PLANS.pro.limits).toEqual({
      tickets: Infinity,
      users: 5,
      integrations: Infinity,
      aiResponses: 50,
      automations: 2,
    })
  })

  it('business plan has correct limits', () => {
    expect(PLANS.business.limits).toEqual({
      tickets: Infinity,
      users: Infinity,
      integrations: Infinity,
      aiResponses: 250,
      automations: 10,
    })
  })

  it('enterprise plan has correct limits', () => {
    expect(PLANS.enterprise.limits).toEqual({
      tickets: Infinity,
      users: Infinity,
      integrations: Infinity,
      aiResponses: 750,
      automations: Infinity,
    })
  })

  it('each plan tier increases or matches previous tier limits', () => {
    const tiers: PlanKey[] = ['pro', 'business', 'enterprise']
    for (let i = 1; i < tiers.length; i++) {
      const prev = PLANS[tiers[i - 1]!].limits
      const curr = PLANS[tiers[i]!].limits

      expect(curr.tickets).toBeGreaterThanOrEqual(prev.tickets)
      expect(curr.users).toBeGreaterThanOrEqual(prev.users)
      expect(curr.integrations).toBeGreaterThanOrEqual(prev.integrations)
      expect(curr.aiResponses).toBeGreaterThanOrEqual(prev.aiResponses)
      expect(curr.automations).toBeGreaterThanOrEqual(prev.automations)
    }
  })

  it('all plans have prices > 0', () => {
    Object.values(PLANS).forEach((plan) => {
      expect(plan.price).toBeGreaterThan(0)
    })
  })

  it('prices increase with tier', () => {
    expect(PLANS.business.price).toBeGreaterThan(PLANS.pro.price)
    expect(PLANS.enterprise.price).toBeGreaterThan(PLANS.business.price)
  })

  it('CLAUDE.md mentions 50 AI responses for pro but plans.ts says 50 — consistent', () => {
    expect(PLANS.pro.limits.aiResponses).toBe(50)
  })

  it('features list is non-empty for all plans', () => {
    Object.values(PLANS).forEach((plan) => {
      expect(plan.features.length).toBeGreaterThan(0)
    })
  })
})
