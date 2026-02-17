-- Migration: notifications table for escalation alerts

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'escalation',
  title text NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications in their org"
  ON notifications
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can insert notifications in their org"
  ON notifications
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update notifications in their org"
  ON notifications
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE INDEX idx_notifications_org_read_created_at
  ON notifications(organization_id, read, created_at DESC);

CREATE INDEX idx_notifications_ticket_id ON notifications(ticket_id);
