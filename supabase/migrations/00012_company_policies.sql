-- Add company-level policies used by AI and support workflows
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS refund_policy text DEFAULT NULL;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS sav_policy text DEFAULT NULL;
