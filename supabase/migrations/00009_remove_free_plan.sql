-- Migration: remove free plan and default all organizations to pro

-- 1) Existing organizations: free -> pro
UPDATE organizations
SET plan = 'pro'
WHERE plan = 'free';

-- 2) Track Stripe subscription lifecycle state
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active';

ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled'));

-- 3) Remove free from plan constraint and set default plan to pro
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations
  ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('pro', 'business', 'enterprise'));
ALTER TABLE organizations ALTER COLUMN plan SET DEFAULT 'pro';

-- 4) Onboarding: create new organizations directly on pro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_org_id uuid;
  email_prefix text;
BEGIN
  email_prefix := lower(split_part(NEW.email, '@', 1));

  INSERT INTO public.organizations (name, slug, plan, subscription_status)
  VALUES (
    email_prefix || '''s org',
    email_prefix || '-' || substr(gen_random_uuid()::text, 1, 8),
    'pro',
    'active'
  )
  RETURNING id INTO new_org_id;

  INSERT INTO public.profiles (id, organization_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
