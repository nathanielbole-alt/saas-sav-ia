import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const META_SCOPES = [
    'pages_messaging',
    'pages_manage_metadata',
    'pages_read_engagement',
    'instagram_basic',
    'instagram_manage_messages',
].join(',')

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has admin/owner role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['owner', 'admin'].includes((profile as unknown as { role: string }).role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const appId = process.env.META_APP_ID
    if (!appId) {
        return NextResponse.json({ error: 'META_APP_ID not configured' }, { status: 500 })
    }

    // Generate CSRF nonce and store in httpOnly cookie
    const nonce = crypto.randomBytes(32).toString('hex')
    const cookieStore = await cookies()
    cookieStore.set('meta_oauth_state', nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
    })

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/meta/callback`

    const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth')
    authUrl.searchParams.set('client_id', appId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', META_SCOPES)
    authUrl.searchParams.set('state', nonce)
    authUrl.searchParams.set('response_type', 'code')

    return NextResponse.redirect(authUrl.toString())
}
