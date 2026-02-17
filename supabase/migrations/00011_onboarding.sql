-- Add onboarding columns to profiles
ALTER TABLE profiles ADD COLUMN is_onboarded boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN industry text;
