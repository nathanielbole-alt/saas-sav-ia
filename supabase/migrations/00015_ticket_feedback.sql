-- 00015_ticket_feedback.sql
-- Ajout des colonnes CSAT (Customer Satisfaction) sur les tickets

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS csat_rating smallint CHECK (csat_rating BETWEEN 1 AND 5);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS csat_comment text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS csat_at timestamptz;
