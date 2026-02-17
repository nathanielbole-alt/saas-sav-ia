-- Migration: Security fixes
-- 1. JSONB index on messages.metadata->>'gmail_id' for dedup lookups
-- 2. RLS UPDATE policy on organizations (owner/admin only)

-- Index for fast Gmail message deduplication
CREATE INDEX IF NOT EXISTS idx_messages_gmail_id
  ON messages ((metadata->>'gmail_id'))
  WHERE metadata->>'gmail_id' IS NOT NULL;

-- Allow owner/admin to update their organization
CREATE POLICY "Owners and admins can update their organization"
  ON public.organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
