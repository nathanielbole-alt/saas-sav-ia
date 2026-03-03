-- Automations table for if/then rules
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}' NOT NULL,
  conditions JSONB DEFAULT '[]' NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}' NOT NULL,
  execution_count INTEGER DEFAULT 0 NOT NULL,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automations_org_id ON public.automations(organization_id);
CREATE INDEX IF NOT EXISTS idx_automations_active ON public.automations(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON public.automations(trigger_type);

-- RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view automations of their org" ON public.automations;
DROP POLICY IF EXISTS "Admins can insert automations" ON public.automations;
DROP POLICY IF EXISTS "Admins can update automations" ON public.automations;
DROP POLICY IF EXISTS "Admins can delete automations" ON public.automations;

CREATE POLICY "Users can view automations of their org"
  ON public.automations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert automations"
  ON public.automations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update automations"
  ON public.automations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete automations"
  ON public.automations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_automations_updated_at ON public.automations;

CREATE TRIGGER trigger_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION update_automations_updated_at();
