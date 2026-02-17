-- ============================================================================
-- Migration: 00010_add_social_channels.sql
-- Description: Add Instagram and Messenger channels for social DM integration
-- ============================================================================

-- Add new values to the ticket_channel ENUM type
-- ALTER TYPE ... ADD VALUE is safe and cannot be wrapped in a transaction
ALTER TYPE ticket_channel ADD VALUE IF NOT EXISTS 'instagram';
ALTER TYPE ticket_channel ADD VALUE IF NOT EXISTS 'messenger';

-- Add metadata JSONB column to tickets for social context (social_user_id, etc.)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Index for looking up tickets by social user ID (used by webhook handler)
CREATE INDEX IF NOT EXISTS idx_tickets_social_user_id
  ON tickets ((metadata->>'social_user_id'))
  WHERE metadata->>'social_user_id' IS NOT NULL;

-- Index for looking up messages by meta_mid (dedup for webhook idempotency)
CREATE INDEX IF NOT EXISTS idx_messages_meta_mid
  ON messages ((metadata->>'meta_mid'))
  WHERE metadata->>'meta_mid' IS NOT NULL;
