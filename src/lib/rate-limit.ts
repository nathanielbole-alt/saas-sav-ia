import { supabaseAdmin } from '@/lib/supabase/admin'

type RateLimitResult = { success: boolean; remaining: number }

function parseRateLimitResult(data: unknown): RateLimitResult | null {
  const rowCandidate = Array.isArray(data) ? data[0] : data
  if (typeof rowCandidate !== 'object' || rowCandidate === null) return null

  const row = rowCandidate as Record<string, unknown>
  if (typeof row.success !== 'boolean') return null

  return {
    success: row.success,
    remaining:
      typeof row.remaining === 'number' && Number.isFinite(row.remaining)
        ? Math.max(0, Math.floor(row.remaining))
        : 0,
  }
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
    p_key: key,
    p_max_requests: maxRequests,
    p_window_ms: windowMs,
  })

  if (error) {
    console.error('Rate limit check failed:', error.message)
    return { success: false, remaining: 0 }
  }

  const parsed = parseRateLimitResult(data)
  if (!parsed) {
    return { success: false, remaining: 0 }
  }

  return parsed
}
