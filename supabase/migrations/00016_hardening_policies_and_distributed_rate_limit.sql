-- 00016_hardening_policies_and_distributed_rate_limit.sql
-- 1) Harden existing RLS policies (notifications, invitations)
-- 2) Add distributed DB-backed rate limiting

-- ============================================================================
-- Notifications: only owner/admin can insert or update
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert notifications in their org"
  ON public.notifications;
DROP POLICY IF EXISTS "Users can update notifications in their org"
  ON public.notifications;
DROP POLICY IF EXISTS "Owners and admins can insert notifications in their org"
  ON public.notifications;
DROP POLICY IF EXISTS "Owners and admins can update notifications in their org"
  ON public.notifications;

CREATE POLICY "Owners and admins can insert notifications in their org"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update notifications in their org"
  ON public.notifications
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- Invitations: only owner/admin can select invitation rows
-- ============================================================================

DROP POLICY IF EXISTS "Org members can view invitations"
  ON public.invitations;
DROP POLICY IF EXISTS "Admins can view invitations"
  ON public.invitations;

CREATE POLICY "Admins can view invitations"
  ON public.invitations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- Distributed rate limit (shared across instances)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  limit_key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at
  ON public.rate_limits(reset_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_ms bigint
)
RETURNS TABLE(success boolean, remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  now_ts timestamptz := now();
  window_interval interval := (p_window_ms::text || ' milliseconds')::interval;
  current_count integer;
  current_reset_at timestamptz;
BEGIN
  IF p_key IS NULL OR p_key = '' OR p_max_requests <= 0 OR p_window_ms <= 0 THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  LOOP
    SELECT count, reset_at
    INTO current_count, current_reset_at
    FROM public.rate_limits
    WHERE limit_key = p_key
    FOR UPDATE;

    IF NOT FOUND THEN
      BEGIN
        INSERT INTO public.rate_limits (limit_key, count, reset_at, created_at, updated_at)
        VALUES (p_key, 1, now_ts + window_interval, now_ts, now_ts);

        RETURN QUERY SELECT true, GREATEST(p_max_requests - 1, 0);
        RETURN;
      EXCEPTION
        WHEN unique_violation THEN
          -- concurrent insert, retry
      END;
    ELSE
      IF now_ts > current_reset_at THEN
        UPDATE public.rate_limits
        SET
          count = 1,
          reset_at = now_ts + window_interval,
          updated_at = now_ts
        WHERE limit_key = p_key;

        RETURN QUERY SELECT true, GREATEST(p_max_requests - 1, 0);
        RETURN;
      END IF;

      IF current_count >= p_max_requests THEN
        RETURN QUERY SELECT false, 0;
        RETURN;
      END IF;

      UPDATE public.rate_limits
      SET
        count = current_count + 1,
        updated_at = now_ts
      WHERE limit_key = p_key;

      RETURN QUERY SELECT true, GREATEST(p_max_requests - (current_count + 1), 0);
      RETURN;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, bigint) TO service_role;

