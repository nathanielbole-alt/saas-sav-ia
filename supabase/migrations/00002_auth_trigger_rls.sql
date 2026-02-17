-- ============================================================================
-- Migration: 00002_auth_trigger_rls.sql
-- Description: Auto-create profile on signup + RLS policies for all tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TRIGGER: handle_new_user
-- Quand un utilisateur s'inscrit via Supabase Auth :
-- 1. Crée une organisation par défaut
-- 2. Crée un profil lié à cette organisation (role = owner)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_org_id uuid;
  email_prefix text;
BEGIN
  email_prefix := lower(split_part(NEW.email, '@', 1));

  -- Créer une organisation par défaut pour le nouvel utilisateur
  INSERT INTO public.organizations (name, slug)
  VALUES (
    email_prefix || '''s org',
    email_prefix || '-' || substr(gen_random_uuid()::text, 1, 8)
  )
  RETURNING id INTO new_org_id;

  -- Créer le profil lié à cette organisation
  INSERT INTO public.profiles (id, organization_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- RLS POLICIES: organizations
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  USING (
    id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: profiles
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS POLICIES: customers (org-scoped)
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view customers in their org"
  ON public.customers
  FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert customers in their org"
  ON public.customers
  FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update customers in their org"
  ON public.customers
  FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: tickets (org-scoped)
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view tickets in their org"
  ON public.tickets
  FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert tickets in their org"
  ON public.tickets
  FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update tickets in their org"
  ON public.tickets
  FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: messages (via ticket org)
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view messages in their org"
  ON public.messages
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their org"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.tickets
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: tags (org-scoped)
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can manage tags in their org"
  ON public.tags
  FOR ALL
  USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- RLS POLICIES: ticket_tags (via ticket org)
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can manage ticket_tags in their org"
  ON public.ticket_tags
  FOR ALL
  USING (
    ticket_id IN (
      SELECT id FROM public.tickets
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.tickets
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );
