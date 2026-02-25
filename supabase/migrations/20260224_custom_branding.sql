ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS brand_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_accent_color TEXT DEFAULT '#E8856C',
  ADD COLUMN IF NOT EXISTS brand_email_footer TEXT;
