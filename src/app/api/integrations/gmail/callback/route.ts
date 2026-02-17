import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureAccess } from '@/lib/feature-gate'
import crypto from 'crypto'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/integrations/gmail/callback`
  )
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail=error&reason=denied', request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail=error&reason=missing_params', request.url)
    )
  }

  // Validate CSRF state against httpOnly cookie
  const cookieStore = await cookies()
  const storedState = cookieStore.get('gmail_oauth_state')?.value

  if (
    !storedState ||
    state.length !== storedState.length ||
    !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(storedState))
  ) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail=error&reason=csrf', request.url)
    )
  }

  // Clear the state cookie
  cookieStore.delete('gmail_oauth_state')

  // Check if user is coming from onboarding wizard
  const fromOnboarding = cookieStore.get('onboarding_redirect')?.value === '1'
  if (fromOnboarding) cookieStore.delete('onboarding_redirect')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    )
  }

  // Get org from session (NOT from state param)
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  const p = profile as unknown as { organization_id: string; role: string } | null
  if (!p || !['owner', 'admin'].includes(p.role)) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail=error&reason=forbidden', request.url)
    )
  }

  // Check integration limit (only for new integrations, not reconnections)
  const { data: existingGmail } = await supabase
    .from('integrations')
    .select('id')
    .eq('organization_id', p.organization_id)
    .eq('provider', 'gmail')
    .limit(1)

  if (!existingGmail || existingGmail.length === 0) {
    const integrationCheck = await checkFeatureAccess(p.organization_id, 'integrations')
    if (!integrationCheck.allowed) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?gmail=error&reason=plan_limit', request.url)
      )
    }
  }

  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get the connected Gmail address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: userInfo } = await oauth2.userinfo.get()

    // Upsert integration record
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
      return NextResponse.redirect(
        new URL('/dashboard/settings?gmail=error&reason=db', request.url)
      )
    }

    const successUrl = fromOnboarding
      ? '/dashboard/onboarding?step=3&connected=gmail'
      : '/dashboard/settings?gmail=success'
    return NextResponse.redirect(new URL(successUrl, request.url))
  } catch (err) {
    console.error('Gmail OAuth callback error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.redirect(
      new URL('/dashboard/settings?gmail=error&reason=token', request.url)
    )
  }
}
