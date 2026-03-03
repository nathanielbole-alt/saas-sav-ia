-- ============================================================================
-- Migration: 20260302_integration_event_receipts.sql
-- Description: Distributed idempotency receipts for inbound webhooks and sync jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.integration_event_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'webhook',
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_integration_event_receipts_org
  ON public.integration_event_receipts (organization_id, provider, created_at DESC);

ALTER TABLE public.integration_event_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_manage_integration_event_receipts" ON public.integration_event_receipts;
CREATE POLICY "org_members_manage_integration_event_receipts"
  ON public.integration_event_receipts
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_integration_event_receipts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_integration_event_receipts_updated_at ON public.integration_event_receipts;
CREATE TRIGGER set_integration_event_receipts_updated_at
  BEFORE UPDATE ON public.integration_event_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_event_receipts_updated_at();
