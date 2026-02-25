import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureAccess } from '@/lib/feature-gate'
import crypto from 'crypto'

const PROVIDER_TIMEOUT_MS = 10_000

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/integrations/gmail/callback`
  )
}

class ProviderTimeoutError extends Error {
  constructor(message = 'Provider request timed out') {
    super(message)
    this.name = 'ProviderTimeoutError'
  }
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url))
}

function safeEqual(left: string, right: string) {
  return (
    left.length === right.length &&
    crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right))
  )
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = PROVIDER_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new ProviderTimeoutError()), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      return redirectTo(request, '/dashboard/settings?gmail=error&reason=denied')
    }

    if (!code || !state) {
      return redirectTo(request, '/dashboard/settings?gmail=error&reason=missing_params')
    }

    const cookieStore = await cookies()
    const storedState = cookieStore.get('gmail_oauth_state')?.value
    if (!storedState || !safeEqual(state, storedState)) {
      return redirectTo(
        request,
        '/dashboard/settings?gmail=error&reason=state_mismatch&message=csrf_state_invalid'
      )
    }

    cookieStore.delete('gmail_oauth_state')

    const fromOnboarding = cookieStore.get('onboarding_redirect')?.value === '1'
    if (fromOnboarding) cookieStore.delete('onboarding_redirect')

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Gmail OAuth session error:', userError.message)
      return redirectTo(request, '/dashboard/settings?gmail=error&reason=session')
    }

    if (!user) {
      return redirectTo(request, '/login')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Gmail OAuth profile error:', profileError.message)
      return redirectTo(request, '/dashboard/settings?gmail=error&reason=profile')
    }

    const p = profile as unknown as { organization_id: string; role: string } | null
    if (!p || !['owner', 'admin'].includes(p.role)) {
      return redirectTo(request, '/dashboard/settings?gmail=error&reason=forbidden')
    }

    const { data: existingGmail } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', p.organization_id)
      .eq('provider', 'gmail')
      .limit(1)

    if (!existingGmail || existingGmail.length === 0) {
      const integrationCheck = await checkFeatureAccess(p.organization_id, 'integrations')
      if (!integrationCheck.allowed) {
        return redirectTo(request, '/dashboard/settings?gmail=error&reason=plan_limit')
      }
    }

    const oauth2Client = getOAuth2Client()
    const tokenResult = await withTimeout(oauth2Client.getToken(code))
    const { tokens } = tokenResult

    if (!tokens.access_token) {
      return redirectTo(request, '/dashboard/settings?gmail=error&reason=token_invalid')
    }

    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfoResponse = await withTimeout(oauth2.userinfo.get())
    const userInfo = userInfoResponse.data

    const { error: dbError } = await supabase
      .from('integrations')
      .upsert(
        {
          organization_id: p.organization_id,
          provider: 'gmail',
          status: 'active',
          access_token: tokens.access_token ?? null,
          refresh_token: tokens.refresh_token ?? null,
          token_expires_at: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          email: userInfo.email ?? null,
          metadata: { scope: tokens.scope },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,provider' }
      )

    if (dbError) {
      console.error('Failed to save Gmail integration:', dbError.message)
      return redirectTo(request, '/dashboard/settings?gmail=error&reason=db')
    }

    const successUrl = fromOnboarding
      ? '/dashboard/onboarding?step=3&connected=gmail'
      : '/dashboard/settings?gmail=success'
    return redirectTo(request, successUrl)
  } catch (err) {
    if (err instanceof ProviderTimeoutError) {
      console.error('Gmail OAuth provider timeout:', err.message)
      return redirectTo(
        request,
        '/dashboard/settings?gmail=error&reason=provider_timeout&message=gmail_unavailable'
      )
    }

    console.error('Gmail OAuth callback error:', err instanceof Error ? err.message : 'Unknown error')
    return redirectTo(request, '/dashboard/settings?gmail=error&reason=token_invalid')
  }
}
