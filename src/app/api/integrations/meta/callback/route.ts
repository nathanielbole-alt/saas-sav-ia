import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureAccess } from '@/lib/feature-gate'
import { encrypt } from '@/lib/encryption'
import crypto from 'crypto'

const GRAPH_API = 'https://graph.facebook.com/v21.0'
const PROVIDER_TIMEOUT_MS = 10_000

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

async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = PROVIDER_TIMEOUT_MS
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProviderTimeoutError()
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      return redirectTo(request, '/dashboard/settings?meta=error&reason=denied')
    }

    if (!code || !state) {
      return redirectTo(request, '/dashboard/settings?meta=error&reason=missing_params')
    }

    const cookieStore = await cookies()
    const storedState = cookieStore.get('meta_oauth_state')?.value
    if (!storedState || !safeEqual(state, storedState)) {
      return redirectTo(
        request,
        '/dashboard/settings?meta=error&reason=state_mismatch&message=csrf_state_invalid'
      )
    }

    cookieStore.delete('meta_oauth_state')

    const fromOnboarding = cookieStore.get('onboarding_redirect')?.value === '1'
    if (fromOnboarding) cookieStore.delete('onboarding_redirect')

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Meta OAuth session error:', userError.message)
      return redirectTo(request, '/dashboard/settings?meta=error&reason=session')
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
      console.error('Meta OAuth profile error:', profileError.message)
      return redirectTo(request, '/dashboard/settings?meta=error&reason=profile')
    }

    const p = profile as unknown as { organization_id: string; role: string } | null
    if (!p || !['owner', 'admin'].includes(p.role)) {
      return redirectTo(request, '/dashboard/settings?meta=error&reason=forbidden')
    }

    const { data: existingMeta } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', p.organization_id)
      .eq('provider', 'meta')
      .limit(1)

    if (!existingMeta || existingMeta.length === 0) {
      const integrationCheck = await checkFeatureAccess(p.organization_id, 'integrations')
      if (!integrationCheck.allowed) {
        return redirectTo(request, '/dashboard/settings?meta=error&reason=plan_limit')
      }
    }

    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const appBaseUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin
    const redirectUri = `${appBaseUrl}/api/integrations/meta/callback`

    if (!appId || !appSecret) {
      return redirectTo(request, '/dashboard/settings?meta=error&reason=config')
    }

    const tokenUrl = new URL(`${GRAPH_API}/oauth/access_token`)
    tokenUrl.searchParams.set('client_id', appId)
    tokenUrl.searchParams.set('client_secret', appSecret)
    tokenUrl.searchParams.set('redirect_uri', redirectUri)
    tokenUrl.searchParams.set('code', code)

    const tokenRes = await fetchWithTimeout(tokenUrl.toString())
    if (!tokenRes.ok) {
      console.error('Meta token exchange failed — HTTP', tokenRes.status)
      return redirectTo(request, '/dashboard/settings?meta=error&reason=token_invalid')
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string }
    if (!tokenData.access_token) {
      return redirectTo(request, '/dashboard/settings?meta=error&reason=token_invalid')
    }

    const longLivedUrl = new URL(`${GRAPH_API}/oauth/access_token`)
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longLivedUrl.searchParams.set('client_id', appId)
    longLivedUrl.searchParams.set('client_secret', appSecret)
    longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token)

    const longLivedRes = await fetchWithTimeout(longLivedUrl.toString())
    const longLivedData = longLivedRes.ok
      ? ((await longLivedRes.json()) as { access_token: string; expires_in?: number })
      : { access_token: tokenData.access_token, expires_in: undefined }
    const userAccessToken = longLivedData.access_token

    const pagesRes = await fetchWithTimeout(
      `${GRAPH_API}/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token`
    )
    if (!pagesRes.ok) {
      console.error('Meta pages fetch failed — HTTP', pagesRes.status)
      return redirectTo(request, '/dashboard/settings?meta=error&reason=provider_error')
    }

    const pagesData = (await pagesRes.json()) as {
      data: Array<{ id: string; name: string; access_token: string }>
    }
    if (!pagesData.data || pagesData.data.length === 0) {
      return redirectTo(request, '/dashboard/settings?meta=error&reason=no_page')
    }

    const page = pagesData.data[0]!
    let instagramAccountId: string | null = null
    let instagramUsername: string | null = null

    const igRes = await fetchWithTimeout(
      `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    )
    if (igRes.ok) {
      const igData = (await igRes.json()) as {
        instagram_business_account?: { id: string }
      }

      if (igData.instagram_business_account?.id) {
        instagramAccountId = igData.instagram_business_account.id

        const igProfileRes = await fetchWithTimeout(
          `${GRAPH_API}/${instagramAccountId}?fields=username&access_token=${page.access_token}`
        )
        if (igProfileRes.ok) {
          const igProfile = (await igProfileRes.json()) as { username?: string }
          instagramUsername = igProfile.username ?? null
        }
      }
    }

    const tokenExpiresAt = longLivedData.expires_in
      ? new Date(Date.now() + longLivedData.expires_in * 1000).toISOString()
      : null

    const { error: dbError } = await supabase
      .from('integrations')
      .upsert(
        {
          organization_id: p.organization_id,
          provider: 'meta',
          status: 'active',
          access_token: encrypt(page.access_token),
          refresh_token: encrypt(userAccessToken),
          token_expires_at: tokenExpiresAt,
          email: null,
          metadata: {
            page_id: page.id,
            page_name: page.name,
            instagram_account_id: instagramAccountId,
            instagram_username: instagramUsername,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,provider' }
      )

    if (dbError) {
      console.error('Failed to save Meta integration:', dbError.message)
      return redirectTo(request, '/dashboard/settings?meta=error&reason=db')
    }

    const successUrl = fromOnboarding
      ? '/dashboard/onboarding?step=3&connected=meta'
      : '/dashboard/settings?meta=success'
    return redirectTo(request, successUrl)
  } catch (err) {
    if (err instanceof ProviderTimeoutError) {
      console.error('Meta OAuth provider timeout:', err.message)
      return redirectTo(
        request,
        '/dashboard/settings?meta=error&reason=provider_timeout&message=meta_unavailable'
      )
    }

    console.error('Meta OAuth callback error:', err instanceof Error ? err.message : 'Unknown error')
    return redirectTo(request, '/dashboard/settings?meta=error&reason=provider_error')
  }
}
