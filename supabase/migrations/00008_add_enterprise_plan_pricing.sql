-- Migration: Ensure organizations.plan CHECK constraint includes enterprise.
-- 00007 already includes it, but this migration keeps environments aligned.

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('free', 'pro', 'business', 'enterprise'));
