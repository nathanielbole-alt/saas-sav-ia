'use server'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const SHOPIFY_SCOPES = 'read_customers,read_orders'
const SHOPIFY_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get shop domain from query params
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get('shop')?.trim().toLowerCase() ?? ''

  if (!SHOPIFY_DOMAIN_REGEX.test(shop)) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?shopify=error&message=invalid_shop`
    )
  }

  // Verify user has admin/owner role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes((profile as { role: string }).role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Generate CSRF nonce and store in httpOnly cookie
  const nonce = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()

  // Store nonce and shop in cookies
  cookieStore.set('shopify_oauth_state', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  cookieStore.set('shopify_shop', shop, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  const clientId = process.env.SHOPIFY_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/shopify/callback`

  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${clientId}&` +
    `scope=${SHOPIFY_SCOPES}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${nonce}`

  return NextResponse.redirect(authUrl)
}
