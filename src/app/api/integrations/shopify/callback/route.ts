import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { checkFeatureAccess } from '@/lib/feature-gate'
import { encrypt } from '@/lib/encryption'
import {
  SHOPIFY_API_VERSION,
  SHOPIFY_DOMAIN_REGEX,
  SHOPIFY_WEBHOOK_TOPICS,
} from '@/lib/shopify-context'
import crypto from 'crypto'

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
  init: RequestInit,
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

async function registerShopifyWebhooks(params: {
  shop: string
  accessToken: string
  baseUrl: string
}) {
  const address = `${params.baseUrl}/api/webhooks/shopify`

  const existingRes = await fetchWithTimeout(
    `https://${params.shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
    {
      headers: {
        'X-Shopify-Access-Token': params.accessToken,
        'Content-Type': 'application/json',
      },
    },
    PROVIDER_TIMEOUT_MS
  )

  if (!existingRes.ok) {
    throw new Error(`shopify_webhooks_list_${existingRes.status}`)
  }

  const existingPayload = (await existingRes.json()) as {
    webhooks?: Array<{ address?: string; topic?: string }>
  }
  const existing = existingPayload.webhooks ?? []

  for (const topic of SHOPIFY_WEBHOOK_TOPICS) {
    const alreadyRegistered = existing.some(
      (webhook) => webhook.topic === topic && webhook.address === address
    )

    if (alreadyRegistered) continue

    const createRes = await fetchWithTimeout(
      `https://${params.shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': params.accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address,
            format: 'json',
          },
        }),
      },
      PROVIDER_TIMEOUT_MS
    )

    if (!createRes.ok) {
      throw new Error(`shopify_webhook_create_${topic}_${createRes.status}`)
    }
  }

  return {
    address,
    topics: [...SHOPIFY_WEBHOOK_TOPICS],
  }
}

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cookieStore = await cookies()
    const state = searchParams.get('state')
    const storedState = cookieStore.get('shopify_oauth_state')?.value
    const storedShop = cookieStore.get('shopify_shop')?.value

    if (!state || !storedState || !safeEqual(state, storedState)) {
      return redirectTo(
        request,
        '/dashboard/settings?shopify=error&message=state_mismatch&reason=csrf_state_invalid'
      )
    }

    cookieStore.delete('shopify_oauth_state')
    cookieStore.delete('shopify_shop')

    const fromOnboarding = cookieStore.get('onboarding_redirect')?.value === '1'
    if (fromOnboarding) cookieStore.delete('onboarding_redirect')

    const secret = process.env.SHOPIFY_CLIENT_SECRET
    if (!secret || !validateHmac(searchParams, secret)) {
      return redirectTo(request, '/dashboard/settings?shopify=error&message=invalid_hmac')
    }

    const code = searchParams.get('code')
    const shop = (searchParams.get('shop') || storedShop || '').trim().toLowerCase()
    if (!code || !shop) {
      return redirectTo(request, '/dashboard/settings?shopify=error&message=missing_params')
    }

    if (!SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return redirectTo(request, '/dashboard/settings?shopify=error&message=invalid_shop')
    }

    const tokenResponse = await fetchWithTimeout(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_CLIENT_ID,
          client_secret: process.env.SHOPIFY_CLIENT_SECRET,
          code,
        }),
      },
      PROVIDER_TIMEOUT_MS
    )

    if (!tokenResponse.ok) {
      console.error('Shopify token exchange failed — HTTP', tokenResponse.status)
      const looksLikeTokenError = tokenResponse.status === 400 || tokenResponse.status === 401
      return redirectTo(
        request,
        `/dashboard/settings?shopify=error&message=${looksLikeTokenError ? 'token_invalid' : 'token_exchange_failed'
        }`
      )
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string
      scope?: string
      refresh_token?: string
      expires_in?: number
    }
    const accessToken = tokenData.access_token
    if (!accessToken) {
      return redirectTo(request, '/dashboard/settings?shopify=error&message=token_invalid')
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Shopify OAuth session error:', userError.message)
      return redirectTo(request, '/dashboard/settings?shopify=error&message=session')
    }

    if (!user) {
      return redirectTo(request, '/dashboard/settings?shopify=error&message=unauthorized')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      if (profileError) console.error('Shopify OAuth profile error:', profileError.message)
      return redirectTo(request, '/dashboard/settings?shopify=error&message=no_org')
    }

    const typedProfile = profile as { organization_id: string; role?: string }
    if (!['owner', 'admin'].includes(typedProfile.role ?? '')) {
      return redirectTo(request, '/dashboard/settings?shopify=error&message=forbidden')
    }

    const orgId = typedProfile.organization_id
    const tokenExpiresAt =
      typeof tokenData.expires_in === 'number'
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null

    const { data: existingShopify } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', orgId)
      .eq('provider', 'shopify')
      .limit(1)

    if (!existingShopify || existingShopify.length === 0) {
      const integrationCheck = await checkFeatureAccess(orgId, 'integrations')
      if (!integrationCheck.allowed) {
        return redirectTo(request, '/dashboard/settings?shopify=error&message=plan_limit')
      }
    }

    let webhookRegistration: { address: string; topics: string[] }
    try {
      webhookRegistration = await registerShopifyWebhooks({
        shop,
        accessToken,
        baseUrl: process.env.NEXTAUTH_URL ?? request.nextUrl.origin,
      })
    } catch (error) {
      console.error(
        'Shopify webhook registration failed:',
        error instanceof Error ? error.message : 'Unknown error'
      )
      return redirectTo(request, '/dashboard/settings?shopify=error&message=webhooks_failed')
    }

    const { error: upsertError } = await supabase
      .from('integrations')
      .upsert(
        {
          organization_id: orgId,
          provider: 'shopify',
          status: 'active',
          access_token: encrypt(accessToken),
          refresh_token: tokenData.refresh_token
            ? encrypt(tokenData.refresh_token)
            : null,
          token_expires_at: tokenExpiresAt,
          metadata: {
            shop,
            scope: tokenData.scope ?? null,
            webhook_address: webhookRegistration.address,
            webhook_topics: webhookRegistration.topics,
            webhooks_registered_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'organization_id,provider',
        }
      )

    if (upsertError) {
      console.error('Failed to save Shopify integration:', upsertError.message)
      return redirectTo(request, '/dashboard/settings?shopify=error&message=save_failed')
    }

    const successUrl = fromOnboarding
      ? '/dashboard/onboarding?step=3&connected=shopify'
      : '/dashboard/settings?shopify=success'
    return redirectTo(request, successUrl)
  } catch (error) {
    if (error instanceof ProviderTimeoutError) {
      console.error('Shopify OAuth provider timeout:', error.message)
      return redirectTo(
        request,
        '/dashboard/settings?shopify=error&message=provider_timeout&reason=shopify_unavailable'
      )
    }

    console.error('Shopify OAuth error:', error instanceof Error ? error.message : 'Unknown error')
    return redirectTo(request, '/dashboard/settings?shopify=error&message=exchange_failed')
  }
}
