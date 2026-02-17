-- 00014_user_invitations.sql
-- Systeme d'invitation d'utilisateurs par email

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role user_role NOT NULL DEFAULT 'agent',
  invited_by uuid NOT NULL REFERENCES profiles(id),
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour lookup par token et par org
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_org ON invitations(organization_id);

-- RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invitations" ON invitations
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can manage invitations" ON invitations
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
  ));
