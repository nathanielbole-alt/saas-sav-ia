import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
]

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/integrations/gmail/callback`
  )
}

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

  // Generate CSRF nonce and store in httpOnly cookie
  const nonce = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('gmail_oauth_state', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  const oauth2Client = getOAuth2Client()

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: nonce, // CSRF nonce, NOT org_id
  })

  return NextResponse.redirect(authUrl)
}
