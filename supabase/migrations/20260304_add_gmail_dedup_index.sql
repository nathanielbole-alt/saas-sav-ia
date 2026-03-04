-- Unique index on messages.metadata->>'gmail_id' to prevent duplicate Gmail imports.
-- Partial index: only applies to non-null gmail_id values.
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_gmail_id_unique
  ON messages ((metadata->>'gmail_id'))
  WHERE metadata->>'gmail_id' IS NOT NULL;
