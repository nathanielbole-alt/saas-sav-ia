-- Migration: integrations table for OAuth connections (Gmail, Google Reviews, etc.)

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,               -- 'gmail', 'google_reviews', 'shopify', etc.
  status text NOT NULL DEFAULT 'inactive', -- 'active', 'inactive', 'error'
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  email text,                            -- connected account email (for Gmail)
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One integration per provider per org
  UNIQUE (organization_id, provider)
);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org integrations"
  ON integrations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage integrations"
  ON integrations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Index for fast lookup
CREATE INDEX idx_integrations_org_provider ON integrations(organization_id, provider);
