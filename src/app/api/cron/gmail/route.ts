import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { checkFeatureAccess } from '@/lib/feature-gate'
import { triggerAutoReply } from '@/lib/ai/auto-reply'
import { decrypt, encrypt } from '@/lib/encryption'
import type { Integration } from '@/types/database.types'

export const runtime = 'nodejs'
export const maxDuration = 300

type GmailHeader = {
  name?: string | null
  value?: string | null
}

// ---------------------------------------------------------------------------
// Gmail OAuth helpers (mirrors gmail.ts but uses supabaseAdmin)
// ---------------------------------------------------------------------------

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/integrations/gmail/callback`
  )
}

async function getAuthedClient(integration: Integration) {
  const oauth2Client = getOAuth2Client()
  const accessToken = integration.access_token
    ? decrypt(integration.access_token)
    : undefined
  const refreshToken = integration.refresh_token
    ? decrypt(integration.refresh_token)
    : undefined

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: integration.token_expires_at
      ? new Date(integration.token_expires_at).getTime()
      : undefined,
  })

  const tokenInfo = await oauth2Client.getAccessToken()
  if (tokenInfo.token && tokenInfo.token !== accessToken) {
    await supabaseAdmin
      .from('integrations')
      .update({
        access_token: encrypt(tokenInfo.token),
        token_expires_at: oauth2Client.credentials.expiry_date
          ? new Date(oauth2Client.credentials.expiry_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id)
  }

  return oauth2Client
}

function isNewsletter(
  headers: GmailHeader[],
  from: string,
  body: string,
  subject: string
): boolean {
  const normalizedFrom = from.toLowerCase()
  const normalizedBody = body.toLowerCase()
  const normalizedSubject = subject.toLowerCase()

  const listUnsubscribe = headers.find(
    (header) => header.name?.toLowerCase() === 'list-unsubscribe'
  )
  if (listUnsubscribe?.value) return true

  const precedence = headers
    .find((header) => header.name?.toLowerCase() === 'precedence')
    ?.value?.toLowerCase()

  if (precedence === 'bulk' || precedence === 'list' || precedence === 'junk') {
    return true
  }

  const noReplyPatterns = [
    /no[-_]?reply@/i,
    /donotreply@/i,
    /ne-pas-repondre@/i,
    /notifications?@/i,
    /newsletter@/i,
    /marketing@/i,
    /promo(tions?)?@/i,
    /updates?@/i,
    /news@/i,
    /bounces?@/i,
    /daemon@/i,
    /alerts?@/i,
    /support-robot@/i,
    /info@.*\.(com|fr|io|net|org)$/i,
  ]

  if (noReplyPatterns.some((pattern) => pattern.test(normalizedFrom))) {
    return true
  }

  const spammySubjects = [
    /newsletter/i,
    /alerte de sécurité/i,
    /offre( exclusive)?/i,
    /promotion/i,
    /votre récapitulatif/i,
    /nouveau message de/i,
    /nouvelle connexion/i,
  ]

  if (spammySubjects.some((pattern) => pattern.test(normalizedSubject))) {
    return true
  }

  const unsubscribePatterns = [
    /se\s+d[ée]sinscrire/i,
    /me\s+d[ée]sinscrire/i,
    /unsubscribe/i,
    /vous\s+d[ée]sabonner/i,
    /gérer\s+vos\s+préférences/i,
    /manage\s+preferences/i,
    /view\s+in\s+browser/i,
    /voir\s+dans\s+le\s+navigateur/i,
    /ne\s+plus\s+recevoir/i,
    /cet\s+email\s+est\s+généré\s+automatiquement/i,
    /cet\s+e-mail\s+automatique/i,
    /merci\s+de\s+ne\s+pas\s+répondre/i,
    /do\s+not\s+reply/i,
  ]

  if (unsubscribePatterns.some((pattern) => pattern.test(normalizedBody))) {
    return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Sync a single org's Gmail inbox
// ---------------------------------------------------------------------------

async function syncOrgGmail(integration: Integration): Promise<{
  organizationId: string
  imported: number
  error?: string
}> {
  const orgId = integration.organization_id

  const ticketCheck = await checkFeatureAccess(orgId, 'tickets')
  if (!ticketCheck.allowed) {
    return { organizationId: orgId, imported: 0, error: 'Ticket quota exceeded' }
  }

  const auth = await getAuthedClient(integration)
  const gmail = google.gmail({ version: 'v1', auth })

  const { data: listData } = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 20,
    q: 'in:inbox is:unread -category:promotions -category:social -category:updates -category:forums -label:unsubscribe',
  })

  const messages = listData.messages ?? []
  let importedCount = 0

  for (const msgRef of messages) {
    if (!msgRef.id) continue

    const { data: msg } = await gmail.users.messages.get({
      userId: 'me',
      id: msgRef.id,
      format: 'full',
    })

    const headers = (msg.payload?.headers ?? []) as GmailHeader[]
    const from = headers.find((h) => h.name === 'From')?.value ?? ''
    const subject =
      headers.find((h) => h.name === 'Subject')?.value ?? '(sans sujet)'
    const messageIdHeader =
      headers.find((h) => h.name?.toLowerCase() === 'message-id')?.value ??
      null

    const emailMatch = from.match(/<([^>]+)>/)
    const senderEmail = emailMatch?.[1] ?? from
    const senderName = emailMatch
      ? from.replace(/<[^>]+>/, '').trim()
      : (from.split('@')[0] ?? '')

    let body = ''
    if (msg.payload?.parts) {
      const textPart = msg.payload.parts.find(
        (p) => p.mimeType === 'text/plain'
      )
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
      }
    } else if (msg.payload?.body?.data) {
      body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8')
    }

    if (!body.trim() || !senderEmail) continue
    if (isNewsletter(headers, from, body, subject)) continue

    // Find or create customer
    const { data: existingCustomers } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('organization_id', orgId)
      .eq('email', senderEmail)
      .limit(1)

    let customerId: string

    if (existingCustomers && existingCustomers.length > 0) {
      customerId = (existingCustomers[0] as { id: string }).id
    } else {
      const { data: newCustomer } = await supabaseAdmin
        .from('customers')
        .insert({
          organization_id: orgId,
          email: senderEmail,
          full_name: senderName || null,
        })
        .select('id')
        .single()
      if (!newCustomer) continue
      customerId = (newCustomer as { id: string }).id
    }

    // Skip if already imported
    const gmailMessageId = msg.id ?? ''
    const { data: existingMsg } = await supabaseAdmin
      .from('messages')
      .select('id')
      .eq('metadata->>gmail_id', gmailMessageId)
      .limit(1)

    if (existingMsg && existingMsg.length > 0) continue

    // Create ticket
    const { data: ticket } = await supabaseAdmin
      .from('tickets')
      .insert({
        organization_id: orgId,
        customer_id: customerId,
        subject,
        status: 'open',
        priority: 'medium',
        channel: 'email',
      })
      .select('id')
      .single()

    if (!ticket) continue

    await supabaseAdmin.from('messages').insert({
      ticket_id: (ticket as { id: string }).id,
      sender_type: 'customer',
      sender_id: customerId,
      body,
      metadata: {
        gmail_id: gmailMessageId,
        gmail_thread_id: msg.threadId,
        gmail_message_id_header: messageIdHeader,
        from,
      },
    })

    triggerAutoReply((ticket as { id: string }).id)
    importedCount++
  }

  return { organizationId: orgId, imported: importedCount }
}

// ---------------------------------------------------------------------------
// GET /api/cron/gmail
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  // Verify cron secret — fail-closed: reject immediately if secret is not configured
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured — rejecting cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all orgs with active Gmail integrations
  const { data: integrations, error } = await supabaseAdmin
    .from('integrations')
    .select('*')
    .eq('provider', 'gmail')
    .eq('status', 'active')

  if (error || !integrations) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }

  if (integrations.length === 0) {
    return NextResponse.json({
      success: true,
      synced: 0,
      totalImported: 0,
      results: [],
    })
  }

  const results: {
    organizationId: string
    imported: number
    error?: string
  }[] = []

  for (const integration of integrations as Integration[]) {
    try {
      const result = await syncOrgGmail(integration)
      results.push(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'

      if (
        message.includes('invalid_grant') ||
        message.includes('Token has been expired') ||
        message.includes('invalid_client')
      ) {
        await supabaseAdmin
          .from('integrations')
          .update({ status: 'error', updated_at: new Date().toISOString() })
          .eq('id', integration.id)
      }

      console.error(
        `Gmail cron sync failed for org ${integration.organization_id}:`,
        message
      )
      results.push({
        organizationId: integration.organization_id,
        imported: 0,
        error: message,
      })
    }
  }

  const totalImported = results.reduce((sum, r) => sum + r.imported, 0)

  return NextResponse.json({
    success: true,
    synced: integrations.length,
    totalImported,
    results,
  })
}
