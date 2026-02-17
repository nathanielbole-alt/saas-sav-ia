import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureAccess } from '@/lib/feature-gate'
import crypto from 'crypto'

const GRAPH_API = 'https://graph.facebook.com/v21.0'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.redirect(
            new URL('/dashboard/settings?meta=error&reason=denied', request.url)
        )
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/dashboard/settings?meta=error&reason=missing_params', request.url)
        )
    }

    // Validate CSRF state against httpOnly cookie
    const cookieStore = await cookies()
    const storedState = cookieStore.get('meta_oauth_state')?.value

    if (
        !storedState ||
        state.length !== storedState.length ||
        !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(storedState))
    ) {
        return NextResponse.redirect(
            new URL('/dashboard/settings?meta=error&reason=csrf', request.url)
        )
    }

    // Clear the state cookie
    cookieStore.delete('meta_oauth_state')

    // Check if user is coming from onboarding wizard
    const fromOnboarding = cookieStore.get('onboarding_redirect')?.value === '1'
    if (fromOnboarding) cookieStore.delete('onboarding_redirect')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get org from session
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    const p = profile as unknown as { organization_id: string; role: string } | null
    if (!p || !['owner', 'admin'].includes(p.role)) {
        return NextResponse.redirect(
            new URL('/dashboard/settings?meta=error&reason=forbidden', request.url)
        )
    }

    // Check integration limit (only for new integrations)
    const { data: existingMeta } = await supabase
        .from('integrations')
        .select('id')
        .eq('organization_id', p.organization_id)
        .eq('provider', 'meta')
        .limit(1)

    if (!existingMeta || existingMeta.length === 0) {
        const integrationCheck = await checkFeatureAccess(p.organization_id, 'integrations')
        if (!integrationCheck.allowed) {
            return NextResponse.redirect(
                new URL('/dashboard/settings?meta=error&reason=plan_limit', request.url)
            )
        }
    }

    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/meta/callback`

    if (!appId || !appSecret) {
        return NextResponse.redirect(
            new URL('/dashboard/settings?meta=error&reason=config', request.url)
        )
    }

    try {
        // Step 1: Exchange code for short-lived token
        const tokenUrl = new URL(`${GRAPH_API}/oauth/access_token`)
        tokenUrl.searchParams.set('client_id', appId)
        tokenUrl.searchParams.set('client_secret', appSecret)
        tokenUrl.searchParams.set('redirect_uri', redirectUri)
        tokenUrl.searchParams.set('code', code)

        const tokenRes = await fetch(tokenUrl.toString())
        if (!tokenRes.ok) {
            console.error('Meta token exchange failed:', await tokenRes.text())
            return NextResponse.redirect(
                new URL('/dashboard/settings?meta=error&reason=token', request.url)
            )
        }
        const tokenData = (await tokenRes.json()) as { access_token: string }

        // Step 2: Exchange for long-lived token (60 days)
        const longLivedUrl = new URL(`${GRAPH_API}/oauth/access_token`)
        longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token')
        longLivedUrl.searchParams.set('client_id', appId)
        longLivedUrl.searchParams.set('client_secret', appSecret)
        longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token)

        const longLivedRes = await fetch(longLivedUrl.toString())
        const longLivedData = longLivedRes.ok
            ? ((await longLivedRes.json()) as { access_token: string; expires_in?: number })
            : { access_token: tokenData.access_token, expires_in: undefined }

        const userAccessToken = longLivedData.access_token

        // Step 3: Get user's Pages (with page access tokens)
        const pagesRes = await fetch(
            `${GRAPH_API}/me/accounts?access_token=${userAccessToken}&fields=id,name,access_token`
        )

        if (!pagesRes.ok) {
            console.error('Meta pages fetch failed:', await pagesRes.text())
            return NextResponse.redirect(
                new URL('/dashboard/settings?meta=error&reason=pages', request.url)
            )
        }

        const pagesData = (await pagesRes.json()) as {
            data: Array<{ id: string; name: string; access_token: string }>
        }

        if (!pagesData.data || pagesData.data.length === 0) {
            return NextResponse.redirect(
                new URL('/dashboard/settings?meta=error&reason=no_page', request.url)
            )
        }

        // Use the first page (user can change later)
        const page = pagesData.data[0]!

        // Step 4: Check if page has Instagram Business Account
        const igRes = await fetch(
            `${GRAPH_API}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        )

        let instagramAccountId: string | null = null
        let instagramUsername: string | null = null

        if (igRes.ok) {
            const igData = (await igRes.json()) as {
                instagram_business_account?: { id: string }
            }

            if (igData.instagram_business_account?.id) {
                instagramAccountId = igData.instagram_business_account.id

                // Get Instagram username
                const igProfileRes = await fetch(
                    `${GRAPH_API}/${instagramAccountId}?fields=username&access_token=${page.access_token}`
                )
                if (igProfileRes.ok) {
                    const igProfile = (await igProfileRes.json()) as { username?: string }
                    instagramUsername = igProfile.username ?? null
                }
            }
        }

        // Calculate token expiry
        const tokenExpiresAt = longLivedData.expires_in
            ? new Date(Date.now() + longLivedData.expires_in * 1000).toISOString()
            : null

        // Step 5: Upsert integration record
        const { error: dbError } = await supabase
            .from('integrations')
            .upsert(
                {
                    organization_id: p.organization_id,
                    provider: 'meta',
                    status: 'active',
                    access_token: page.access_token, // Page access token (permanent if page token)
                    refresh_token: userAccessToken, // Long-lived user token (for refresh)
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
            return NextResponse.redirect(
                new URL('/dashboard/settings?meta=error&reason=db', request.url)
            )
        }

        const successUrl = fromOnboarding
            ? '/dashboard/onboarding?step=3&connected=meta'
            : '/dashboard/settings?meta=success'
        return NextResponse.redirect(
            new URL(successUrl, request.url)
        )
    } catch (err) {
        console.error(
            'Meta OAuth callback error:',
            err instanceof Error ? err.message : 'Unknown error'
        )
        return NextResponse.redirect(
            new URL('/dashboard/settings?meta=error&reason=token', request.url)
        )
    }
}
