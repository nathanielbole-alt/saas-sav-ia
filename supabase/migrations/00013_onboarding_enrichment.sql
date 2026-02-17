-- 00013_onboarding_enrichment.sql
-- Ajoute team_size et ticket_volume au profil pour l'onboarding enrichi

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS team_size text,
  ADD COLUMN IF NOT EXISTS ticket_volume text;

COMMENT ON COLUMN profiles.team_size IS 'Taille equipe: 1-5, 6-20, 21-50, 50+';
COMMENT ON COLUMN profiles.ticket_volume IS 'Volume tickets/mois: <100, 100-500, 500-2000, 2000+';
