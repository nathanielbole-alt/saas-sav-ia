ALTER TYPE public.sender_type ADD VALUE IF NOT EXISTS 'system';

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(automation_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_auto
  ON public.automation_logs(automation_id);

CREATE INDEX IF NOT EXISTS idx_automation_logs_ticket
  ON public.automation_logs(ticket_id);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_view_logs" ON public.automation_logs;

CREATE POLICY "org_members_view_logs"
  ON public.automation_logs
  FOR ALL
  USING (
    automation_id IN (
      SELECT a.id
      FROM public.automations a
      JOIN public.profiles p
        ON p.organization_id = a.organization_id
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    automation_id IN (
      SELECT a.id
      FROM public.automations a
      JOIN public.profiles p
        ON p.organization_id = a.organization_id
      WHERE p.id = auth.uid()
    )
  );
