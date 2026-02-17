'use server'

import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/rate-limit'
import type { Integration } from '@/types/database.types'
import { triggerAutoReply } from '@/lib/ai/auto-reply'
import { checkFeatureAccess } from '@/lib/feature-gate'
import { z } from 'zod'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/integrations/gmail/callback`
  )
}

async function getAuthedClient(integration: Integration) {
  const oauth2Client = getOAuth2Client()

  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.token_expires_at
      ? new Date(integration.token_expires_at).getTime()
      : undefined,
  })

  // Auto-refresh if expired
  const tokenInfo = await oauth2Client.getAccessToken()
  if (tokenInfo.token && tokenInfo.token !== integration.access_token) {
    // Token was refreshed, update in DB
    await supabaseAdmin
      .from('integrations')
      .update({
        access_token: tokenInfo.token,
        token_expires_at: oauth2Client.credentials.expiry_date
          ? new Date(oauth2Client.credentials.expiry_date).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id)
  }

  return oauth2Client
}

const sendGmailReplyParamsSchema = z.object({
  organizationId: z.string().uuid(),
  ticketId: z.string().uuid(),
  recipientEmail: z.string().email(),
  recipientName: z.string().nullable(),
  subject: z.string().min(1),
  body: z.string().min(1),
  threadId: z.string().nullable(),
  inReplyToMessageId: z.string().nullable(),
})

function toBase64Url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function normalizeMessageIdHeader(value: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) return trimmed
  return `<${trimmed}>`
}

function formatRecipientAddress(email: string, name: string | null): string {
  if (!name || !name.trim()) return email
  const safeName = name.replace(/"/g, "'").trim()
  return `"${safeName}" <${email}>`
}

export async function sendGmailReply(params: {
  organizationId: string
  ticketId: string
  recipientEmail: string
  recipientName: string | null
  subject: string
  body: string
  threadId: string | null
  inReplyToMessageId: string | null
}): Promise<{ success: boolean; error?: string }> {
  const parsed = sendGmailReplyParamsSchema.safeParse(params)
  if (!parsed.success) {
    return { success: false, error: 'Invalid email reply payload' }
  }

  const {
    organizationId,
    recipientEmail,
    recipientName,
    subject,
    body,
    threadId,
    inReplyToMessageId,
  } = parsed.data

  const { data: integration, error: integrationError } = await supabaseAdmin
    .from('integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('provider', 'gmail')
    .eq('status', 'active')
    .single()

  if (integrationError || !integration) {
    return { success: false, error: 'Gmail integration not connected' }
  }

  try {
    const auth = await getAuthedClient(integration as Integration)
    const gmail = google.gmail({ version: 'v1', auth })

    let effectiveInReplyToMessageId = inReplyToMessageId

    if (!effectiveInReplyToMessageId && threadId) {
      const { data: thread } = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'metadata',
        metadataHeaders: ['Message-ID'],
      })

      const lastThreadMessage = thread.messages?.[thread.messages.length - 1]
      const messageIdHeader =
        lastThreadMessage?.payload?.headers?.find(
          (header) => header.name?.toLowerCase() === 'message-id'
        )?.value ?? null
      effectiveInReplyToMessageId = messageIdHeader
    }

    const normalizedSubject = subject.replace(/\r?\n/g, ' ').trim()
    const resolvedSubject = normalizedSubject || `Ticket ${parsed.data.ticketId}`
    const emailSubject = /^re:/i.test(resolvedSubject)
      ? resolvedSubject
      : `Re: ${resolvedSubject}`
    const normalizedBodyText = body.replace(/\r?\n/g, '\r\n')
    const normalizedBody = normalizedBodyText.trim() || normalizedBodyText
    const replyMessageIdHeader = normalizeMessageIdHeader(
      effectiveInReplyToMessageId
    )

    const headers = [
      `To: ${formatRecipientAddress(recipientEmail, recipientName)}`,
      `Subject: ${emailSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
    ]

    if (replyMessageIdHeader) {
      headers.push(`In-Reply-To: ${replyMessageIdHeader}`)
      headers.push(`References: ${replyMessageIdHeader}`)
    }

    const rawMessage = `${headers.join('\r\n')}\r\n\r\n${normalizedBody}`
    const raw = toBase64Url(rawMessage)

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId: threadId ?? undefined,
      },
    })

    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Gmail reply send failed'

    if (
      message.includes('invalid_grant') ||
      message.includes('Token has been expired') ||
      message.includes('invalid_client')
    ) {
      await supabaseAdmin
        .from('integrations')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('id', (integration as Integration).id)
    }

    console.error('Failed to send Gmail reply:', message)
    return { success: false, error: 'Failed to send Gmail reply' }
  }
}

export async function syncGmailMessages(): Promise<{
  success: boolean
  count: number
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, count: 0, error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { success: false, count: 0, error: 'No profile' }

  // Rate limit: max 1 sync per 5 minutes per org
  const orgId = (profile as unknown as { organization_id: string }).organization_id
  const { success: withinLimit } = await rateLimit(
    `gmail-sync:${orgId}`,
    1,
    5 * 60 * 1000
  )
  if (!withinLimit) return { success: false, count: 0, error: 'Rate limit — wait 5 minutes' }

  // Get Gmail integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('provider', 'gmail')
    .eq('status', 'active')
    .single()

  if (!integration) {
    return { success: false, count: 0, error: 'Gmail not connected' }
  }

  // Check ticket quota before syncing emails (each email creates a ticket)
  const ticketCheck = await checkFeatureAccess(orgId, 'tickets')
  if (!ticketCheck.allowed) {
    return { success: false, count: 0, error: `Limite tickets atteinte (${ticketCheck.current}/${ticketCheck.limit}). Passez à un plan supérieur.` }
  }

  try {
    const auth = await getAuthedClient(integration as Integration)
    const gmail = google.gmail({ version: 'v1', auth })

    // Fetch recent unread messages from inbox
    const { data: listData } = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      q: 'in:inbox is:unread',
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

      const headers = msg.payload?.headers ?? []
      const from = headers.find((h) => h.name === 'From')?.value ?? ''
      const subject = headers.find((h) => h.name === 'Subject')?.value ?? '(sans sujet)'
      const messageIdHeader =
        headers.find((h) => h.name?.toLowerCase() === 'message-id')?.value ?? null

      // Extract email from "Name <email>" format
      const emailMatch = from.match(/<([^>]+)>/)
      const senderEmail = emailMatch?.[1] ?? from
      const senderName = emailMatch
        ? from.replace(/<[^>]+>/, '').trim()
        : from.split('@')[0] ?? ''

      // Extract body (plain text preferred)
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

      if (!body.trim()) continue

      if (!senderEmail) continue

      // Find or create customer
      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('email', senderEmail)
        .limit(1)

      let customerId: string

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = (existingCustomers[0] as { id: string }).id
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            organization_id: profile.organization_id,
            email: senderEmail,
            full_name: senderName || null,
          })
          .select('id')
          .single()
        if (!newCustomer) continue
        customerId = (newCustomer as { id: string }).id
      }

      // Check if ticket already exists for this gmail message
      const gmailMessageId = msg.id ?? ''
      const { data: existingMsg } = await supabase
        .from('messages')
        .select('id')
        .eq('metadata->>gmail_id', gmailMessageId)
        .limit(1)

      if (existingMsg && existingMsg.length > 0) continue

      // Create ticket
      const { data: ticket } = await supabase
        .from('tickets')
        .insert({
          organization_id: profile.organization_id,
          customer_id: customerId,
          subject,
          status: 'open',
          priority: 'medium',
          channel: 'email',
        })
        .select('id')
        .single()

      if (!ticket) continue

      // Create message
      await supabase.from('messages').insert({
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

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')

    return { success: true, count: importedCount }
  } catch (err) {
    console.error('Gmail sync error:', err)

    // Mark integration as error if auth failed
    if (
      err instanceof Error &&
      (err.message.includes('invalid_grant') ||
        err.message.includes('Token has been expired'))
    ) {
      await supabase
        .from('integrations')
        .update({ status: 'error', updated_at: new Date().toISOString() })
        .eq('id', (integration as Integration).id)
    }

    return { success: false, count: 0, error: 'Sync failed' }
  }
}
