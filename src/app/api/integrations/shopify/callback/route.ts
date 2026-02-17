'use server'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureAccess } from '@/lib/feature-gate'
import crypto from 'crypto'

// Validate Shopify HMAC signature
function validateHmac(query: URLSearchParams, secret: string): boolean {
  const hmac = query.get('hmac')
  if (!hmac) return false

  // Create a copy of params without hmac
  const params = new URLSearchParams()
  query.forEach((value, key) => {
    if (key !== 'hmac') {
      params.append(key, value)
    }
  })

  // Sort and create the message
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex')

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(calculatedHmac, 'hex')
    )
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cookieStore = await cookies()

  // Validate CSRF nonce
  const state = searchParams.get('state')
  const storedState = cookieStore.get('shopify_oauth_state')?.value
  const storedShop = cookieStore.get('shopify_shop')?.value

  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=csrf_mismatch`
    )
  }

  // Clear the state cookies
  cookieStore.delete('shopify_oauth_state')
  cookieStore.delete('shopify_shop')

  // Check if user is coming from onboarding wizard
  const fromOnboarding = cookieStore.get('onboarding_redirect')?.value === '1'
  if (fromOnboarding) cookieStore.delete('onboarding_redirect')

  // Validate HMAC
  const secret = process.env.SHOPIFY_CLIENT_SECRET
  if (!secret || !validateHmac(searchParams, secret)) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=invalid_hmac`
    )
  }

  const code = searchParams.get('code')
  const shop = searchParams.get('shop') || storedShop

  if (!code || !shop) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=missing_params`
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json() as { access_token: string; scope: string }
    const accessToken = tokenData.access_token

    // Get Supabase client and user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=unauthorized`
      )
    }

    // Get organization ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=no_org`
      )
    }

    const orgId = (profile as { organization_id: string }).organization_id

    // Check integration limit (only for new integrations, not reconnections)
    const { data: existingShopify } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', orgId)
      .eq('provider', 'shopify')
      .limit(1)

    if (!existingShopify || existingShopify.length === 0) {
      const integrationCheck = await checkFeatureAccess(orgId, 'integrations')
      if (!integrationCheck.allowed) {
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=plan_limit`
        )
      }
    }

    // Upsert integration (Shopify tokens are permanent, no refresh needed)
    const { error: upsertError } = await supabase
      .from('integrations')
      .upsert({
        organization_id: orgId,
        provider: 'shopify',
        status: 'active',
        access_token: accessToken,
        refresh_token: null, // Shopify doesn't use refresh tokens
        token_expires_at: null, // Permanent token
        metadata: { shop, scope: tokenData.scope },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,provider',
      })

    if (upsertError) {
      console.error('Failed to save Shopify integration:', upsertError.message)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=save_failed`
      )
    }

    const successUrl = fromOnboarding
      ? `${process.env.NEXTAUTH_URL}/dashboard/onboarding?step=3&connected=shopify`
      : `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=success`
    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.error('Shopify OAuth error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=exchange_failed`
    )
  }
}
