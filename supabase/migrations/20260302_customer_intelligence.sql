-- Customer intelligence columns
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS segment TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_satisfaction_score NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS first_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lifetime_tickets INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_health_score ON public.customers(health_score);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON public.customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_org_segment ON public.customers(organization_id, segment);
