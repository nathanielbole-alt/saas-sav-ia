import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { triggerAutoReply } from '@/lib/ai/auto-reply'
import {
  claimIntegrationEventReceipt,
  completeIntegrationEventReceipt,
  releaseIntegrationEventReceipt,
} from '@/lib/integration-event-receipts'
import type { Integration } from '@/types/database.types'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 30
const RECENT_MID_TTL_MS = 15 * 60 * 1000
const recentMetaMessageIds = new Map<string, number>()

// ── GET: Webhook verification ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const mode = req.nextUrl.searchParams.get('hub.mode')
    const token = req.nextUrl.searchParams.get('hub.verify_token')
    const challenge = req.nextUrl.searchParams.get('hub.challenge')

    if (
        mode === 'subscribe' &&
        token === process.env.META_WEBHOOK_VERIFY_TOKEN
    ) {
        return new Response(challenge ?? '', { status: 200 })
    }

    return new Response('Forbidden', { status: 403 })
}

// ── POST: Receive messages ───────────────────────────────────────────────────

interface MetaMessagingEvent {
    sender: { id: string }
    recipient: { id: string }
    timestamp: number
    message?: {
        mid?: string
        text?: string
        is_echo?: boolean
    }
    delivery?: Record<string, unknown>
    read?: Record<string, unknown>
    reaction?: Record<string, unknown>
    postback?: Record<string, unknown>
}

interface MetaEntry {
    id: string
    time: number
    messaging?: MetaMessagingEvent[]
}

interface MetaWebhookPayload {
    object: string
    entry: MetaEntry[]
}

function verifySignature(body: string, signature: string | null): boolean {
    const appSecret = process.env.META_APP_SECRET
    if (!appSecret || !signature) return false

    const expectedSig =
        'sha256=' +
        crypto
            .createHmac('sha256', appSecret)
            .update(body, 'utf8')
            .digest('hex')

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSig)
        )
    } catch {
        return false
    }
}

function toRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null
    }
    return value as Record<string, unknown>
}

function isReactionOnlyMessage(text: string): boolean {
    return /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\s\u200d\uFE0F]+$/u.test(
        text
    )
}

function shouldSkipMessagingEvent(event: MetaMessagingEvent): boolean {
    if (event.delivery || event.read || event.reaction || event.postback) {
        return true
    }

    if (event.message?.is_echo) {
        return true
    }

    const text = event.message?.text?.trim()
    if (!text) return true

    return isReactionOnlyMessage(text)
}

function purgeRecentMetaMessageIds() {
    const now = Date.now()
    for (const [mid, expiresAt] of recentMetaMessageIds.entries()) {
        if (expiresAt <= now) {
            recentMetaMessageIds.delete(mid)
        }
    }
}

function hasRecentMetaMessageId(mid: string): boolean {
    purgeRecentMetaMessageIds()
    const expiresAt = recentMetaMessageIds.get(mid)
    return typeof expiresAt === 'number' && expiresAt > Date.now()
}

function rememberMetaMessageId(mid: string) {
    recentMetaMessageIds.set(mid, Date.now() + RECENT_MID_TTL_MS)
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text()

    // Verify HMAC signature
    const signature = request.headers.get('x-hub-signature-256')
    if (!verifySignature(rawBody, signature)) {
        console.error('Meta webhook: invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let payload: MetaWebhookPayload
    try {
        payload = JSON.parse(rawBody) as MetaWebhookPayload
    } catch {
        return NextResponse.json({ status: 'ok' })
    }

    // Only process messaging-related events
    if (payload.object !== 'instagram' && payload.object !== 'page') {
        return NextResponse.json({ status: 'ok' })
    }

    const channel: 'instagram' | 'messenger' =
        payload.object === 'instagram' ? 'instagram' : 'messenger'

    const tasks: Array<Promise<void>> = []

    for (const entry of payload.entry) {
        if (!entry.messaging) continue

        for (const event of entry.messaging) {
            if (shouldSkipMessagingEvent(event)) continue

            // Skip echo messages (sent by us)
            if (event.sender.id === event.recipient.id) continue

            const mid = event.message?.mid?.trim()
            const messageText = event.message?.text?.trim()
            if (!mid || !messageText) continue
            if (hasRecentMetaMessageId(mid)) continue

            const senderId = event.sender.id
            const pageOrIgId = entry.id
            tasks.push(
              processIncomingMessage({
                    senderId,
                    pageOrIgId,
                    messageText,
                    channel,
                    mid,
                })
                .then(() => {
                    rememberMetaMessageId(mid)
                })
                .catch((err) => {
                    console.error('Meta webhook: error processing message:', err)
                })
            )
        }
    }

    await Promise.allSettled(tasks)

    // Always return 200 (Meta retries for 24h otherwise)
    return NextResponse.json({ status: 'ok' })
}

async function processIncomingMessage(params: {
    senderId: string
    pageOrIgId: string
    messageText: string
    channel: 'instagram' | 'messenger'
    mid: string
}) {
    const { senderId, pageOrIgId, messageText, channel, mid } = params

    // 1. Find the Meta integration by page_id or instagram_account_id
    const { data: integrations } = await supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('provider', 'meta')
        .eq('status', 'active')

    if (!integrations || integrations.length === 0) return

    // Find matching integration
    const integration = (integrations as unknown as Integration[]).find((row) => {
        const meta = toRecord(row.metadata)
        if (!meta) return false
        return meta.page_id === pageOrIgId || meta.instagram_account_id === pageOrIgId
    })

    if (!integration) {
        console.error(`Meta webhook: no integration found for pageOrIgId=${pageOrIgId}`)
        return
    }

    const orgId = integration.organization_id
    const integrationMeta = toRecord(integration.metadata)
    const pageName = (integrationMeta?.page_name as string) ?? 'Page'
    const igUsername = (integrationMeta?.instagram_username as string) ?? null
    const receipt = await claimIntegrationEventReceipt({
        provider: 'meta',
        externalId: mid,
        organizationId: orgId,
        source: 'webhook',
    })

    if (!receipt.acquired) return

    try {
        // 2. Check if we already processed this message (idempotency)
        const { data: existingMsg } = await supabaseAdmin
            .from('messages')
            .select('id')
            .eq('metadata->>meta_mid', mid)
            .limit(1)

        if (existingMsg && existingMsg.length > 0) {
            await completeIntegrationEventReceipt(receipt.receiptId)
            return
        }

        // 3. Find existing ticket for this sender on this channel
        const { data: existingTickets } = await supabaseAdmin
            .from('tickets')
            .select('id, status')
            .eq('organization_id', orgId)
            .eq('channel', channel)
            .filter('metadata->>social_user_id', 'eq', senderId)
            .in('status', ['open', 'pending'])
            .order('created_at', { ascending: false })
            .limit(1)

        let ticketId: string

        if (existingTickets && existingTickets.length > 0) {
            // Add message to existing ticket
            ticketId = (existingTickets[0] as { id: string }).id
        } else {
            // 4. Create/find customer
            const customerIdentifier = `${channel}_${senderId}`

            const { data: existingCustomers } = await supabaseAdmin
                .from('customers')
                .select('id')
                .eq('organization_id', orgId)
                .eq('email', customerIdentifier)
                .limit(1)

            let customerId: string

            if (existingCustomers && existingCustomers.length > 0) {
                customerId = (existingCustomers[0] as { id: string }).id
            } else {
                const displayName =
                    channel === 'instagram'
                        ? `Instagram User ${senderId.slice(-6)}`
                        : `Messenger User ${senderId.slice(-6)}`

                const { data: newCustomer } = await supabaseAdmin
                    .from('customers')
                    .insert({
                        organization_id: orgId,
                        email: customerIdentifier, // Use platform_userId as identifier
                        full_name: displayName,
                    })
                    .select('id')
                    .single()

                if (!newCustomer) {
                    await releaseIntegrationEventReceipt(receipt.receiptId)
                    return
                }
                customerId = (newCustomer as { id: string }).id
            }

            // 5. Create new ticket
            const subjectPrefix =
                channel === 'instagram'
                    ? `DM Instagram${igUsername ? ` via @${igUsername}` : ''}`
                    : `Message Messenger via ${pageName}`

            const { data: ticket } = await supabaseAdmin
                .from('tickets')
                .insert({
                    organization_id: orgId,
                    customer_id: customerId,
                    subject: subjectPrefix,
                    status: 'open',
                    priority: 'medium',
                    channel,
                    metadata: {
                        social_user_id: senderId,
                        social_platform: channel,
                        page_id: pageOrIgId,
                    },
                })
                .select('id')
                .single()

            if (!ticket) {
                await releaseIntegrationEventReceipt(receipt.receiptId)
                return
            }
            ticketId = (ticket as { id: string }).id
        }

        // 6. Insert message
        const { error: insertError } = await supabaseAdmin.from('messages').insert({
            ticket_id: ticketId,
            sender_type: 'customer',
            sender_id: null,
            body: messageText,
            metadata: {
                meta_mid: mid,
                social_user_id: senderId,
                social_platform: channel,
            },
        })

        if (insertError) {
            throw insertError
        }

        await completeIntegrationEventReceipt(receipt.receiptId)

        // 7. Trigger auto-reply
        triggerAutoReply(ticketId)
    } catch (error) {
        await releaseIntegrationEventReceipt(receipt.receiptId)
        throw error
    }
}
