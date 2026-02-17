-- Migration: Add 'business' to the plan CHECK constraint
-- The original constraint (00001) only allows 'free', 'pro', 'enterprise'.
-- We need 'business' to match the Stripe PLANS config.

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('free', 'pro', 'business', 'enterprise'));
