'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MockTicket, MockMessage, MockCustomer } from '@/lib/mock-data'
import { sendGmailReply } from '@/lib/actions/gmail'
import { sendMetaReply, extractMetaReplyContext } from '@/lib/actions/meta'

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function extractGmailReplyContext(metadata: unknown): {
  threadId: string | null
  inReplyToMessageId: string | null
} {
  const metadataRecord = toRecord(metadata)
  if (!metadataRecord) {
    return { threadId: null, inReplyToMessageId: null }
  }

  const threadId =
    typeof metadataRecord.gmail_thread_id === 'string'
      ? metadataRecord.gmail_thread_id
      : null

  const inReplyToMessageId =
    typeof metadataRecord.gmail_message_id_header === 'string'
      ? metadataRecord.gmail_message_id_header
      : typeof metadataRecord.in_reply_to_message_id === 'string'
        ? metadataRecord.in_reply_to_message_id
        : typeof metadataRecord.message_id === 'string'
          ? metadataRecord.message_id
          : null

  return { threadId, inReplyToMessageId }
}

export async function getTickets(): Promise<MockTicket[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Get agent profile for sender name resolution
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const profile = profileData as { full_name: string | null } | null
  const agentName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Agent'

  const { data: rawTickets, error } = await supabase
    .from('tickets')
    .select(
      `
      *,
      customer:customers(*),
      messages(*),
      tags:ticket_tags(tag:tags(*))
    `
    )
    .order('created_at', { ascending: false })

  if (error || !rawTickets) {
    console.error('Error fetching tickets:', error)
    return []
  }

  // Map Supabase rows (snake_case, nested) → MockTicket (camelCase, flat)
  return (rawTickets as unknown[]).map((raw): MockTicket => {
    const t = raw as Record<string, unknown>
    const customerRaw = t.customer as Record<string, unknown> | null
    const messagesRaw = (t.messages ?? []) as Record<string, unknown>[]
    const tagsRaw = (t.tags ?? []) as { tag: Record<string, unknown> | null }[]

    // ── Customer ────────────────────────────────────────────────────────
    const customer: MockCustomer = {
      id: (customerRaw?.id as string) ?? (t.customer_id as string),
      name:
        (customerRaw?.full_name as string) ??
        (customerRaw?.email as string) ??
        'Client inconnu',
      email: (customerRaw?.email as string) ?? '',
    }

    // ── Messages (sorted, snake_case → camelCase) ───────────────────────
    const messages: MockMessage[] = messagesRaw
      .sort(
        (a, b) =>
          new Date(a.created_at as string).getTime() -
          new Date(b.created_at as string).getTime()
      )
      .map(
        (m): MockMessage => ({
          id: m.id as string,
          senderType: m.sender_type as MockMessage['senderType'],
          senderName:
            m.sender_type === 'ai'
              ? 'Savly'
              : m.sender_type === 'agent'
                ? agentName
                : customer.name,
          body: m.body as string,
          createdAt: m.created_at as string,
        })
      )

    // ── Tags (nested objects → flat string[]) ───────────────────────────
    const tags: string[] = tagsRaw
      .map((rel) => rel.tag?.name as string | undefined)
      .filter((name): name is string => Boolean(name))

    // ── Unread (computed: open + last msg from customer) ────────────────
    const lastMsg = messages[messages.length - 1]
    const unread =
      (t.status as string) === 'open' &&
      lastMsg?.senderType === 'customer'

    // ── AssignedTo (resolve to name if current user) ────────────────────
    const assignedTo = t.assigned_to
      ? t.assigned_to === user.id
        ? agentName
        : (t.assigned_to as string)
      : null

    return {
      id: t.id as string,
      subject: t.subject as string,
      customer,
      customerMetadata: toRecord(customerRaw?.metadata) ?? null,
      status: t.status as MockTicket['status'],
      priority: t.priority as MockTicket['priority'],
      channel: t.channel as MockTicket['channel'],
      assignedTo,
      assignedToId: (t.assigned_to as string) ?? null,
      unread,
      tags,
      csatRating: (t.csat_rating as number | null) ?? null,
      createdAt: t.created_at as string,
      messages,
    }
  })
}

export async function getMyTickets(): Promise<MockTicket[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const profile = profileData as { full_name: string | null } | null
  const agentName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Agent'

  const { data: rawTickets, error } = await supabase
    .from('tickets')
    .select(
      `
      *,
      customer:customers(*),
      messages(*),
      tags:ticket_tags(tag:tags(*))
    `
    )
    .eq('assigned_to', user.id)
    .order('created_at', { ascending: false })

  if (error || !rawTickets) {
    console.error('Error fetching my tickets:', error)
    return []
  }

  return (rawTickets as unknown[]).map((raw): MockTicket => {
    const t = raw as Record<string, unknown>
    const customerRaw = t.customer as Record<string, unknown> | null
    const messagesRaw = (t.messages ?? []) as Record<string, unknown>[]
    const tagsRaw = (t.tags ?? []) as { tag: Record<string, unknown> | null }[]

    const customer: MockCustomer = {
      id: (customerRaw?.id as string) ?? (t.customer_id as string),
      name:
        (customerRaw?.full_name as string) ??
        (customerRaw?.email as string) ??
        'Client inconnu',
      email: (customerRaw?.email as string) ?? '',
    }

    const messages: MockMessage[] = messagesRaw
      .sort(
        (a, b) =>
          new Date(a.created_at as string).getTime() -
          new Date(b.created_at as string).getTime()
      )
      .map(
        (m): MockMessage => ({
          id: m.id as string,
          senderType: m.sender_type as MockMessage['senderType'],
          senderName:
            m.sender_type === 'ai'
              ? 'Savly'
              : m.sender_type === 'agent'
                ? agentName
                : customer.name,
          body: m.body as string,
          createdAt: m.created_at as string,
        })
      )

    const tags: string[] = tagsRaw
      .map((rel) => rel.tag?.name as string | undefined)
      .filter((name): name is string => Boolean(name))

    const lastMsg = messages[messages.length - 1]
    const unread =
      (t.status as string) === 'open' && lastMsg?.senderType === 'customer'

    return {
      id: t.id as string,
      subject: t.subject as string,
      customer,
      customerMetadata: toRecord(customerRaw?.metadata) ?? null,
      status: t.status as MockTicket['status'],
      priority: t.priority as MockTicket['priority'],
      channel: t.channel as MockTicket['channel'],
      assignedTo: agentName,
      assignedToId: (t.assigned_to as string) ?? null,
      unread,
      tags,
      csatRating: (t.csat_rating as number | null) ?? null,
      createdAt: t.created_at as string,
      messages,
    }
  })
}

const sendMessageSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1).max(10000),
})

export async function sendMessage(ticketId: string, body: string) {
  const parsed = sendMessageSchema.safeParse({ ticketId, body })
  if (!parsed.success) throw new Error('Invalid input')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('messages').insert({
    ticket_id: parsed.data.ticketId,
    sender_type: 'agent' as const,
    sender_id: user.id,
    body: parsed.data.body,
  })

  if (error) {
    console.error('Error sending message:', error)
    throw new Error('Failed to send message')
  }

  const { data: ticketContext } = await supabase
    .from('tickets')
    .select(
      `
      id,
      subject,
      channel,
      organization_id,
      customer:customers(email, full_name)
    `
    )
    .eq('id', parsed.data.ticketId)
    .single()

  const ticketRecord = ticketContext as Record<string, unknown> | null
  const customerRecord = toRecord(ticketRecord?.customer)
  const channel = typeof ticketRecord?.channel === 'string' ? ticketRecord.channel : null
  const organizationId =
    typeof ticketRecord?.organization_id === 'string'
      ? ticketRecord.organization_id
      : null
  const ticketSubject =
    typeof ticketRecord?.subject === 'string' ? ticketRecord.subject : 'Ticket SAV'
  const recipientEmail =
    typeof customerRecord?.email === 'string' ? customerRecord.email : null
  const recipientName =
    typeof customerRecord?.full_name === 'string'
      ? customerRecord.full_name
      : null

  if (channel === 'email' && organizationId && recipientEmail) {
    const { data: latestCustomerMessage } = await supabase
      .from('messages')
      .select('metadata')
      .eq('ticket_id', parsed.data.ticketId)
      .eq('sender_type', 'customer')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const replyContext = extractGmailReplyContext(latestCustomerMessage?.metadata)
    const gmailResult = await sendGmailReply({
      organizationId,
      ticketId: parsed.data.ticketId,
      recipientEmail,
      recipientName,
      subject: ticketSubject,
      body: parsed.data.body,
      threadId: replyContext.threadId,
      inReplyToMessageId: replyContext.inReplyToMessageId,
    })

    if (!gmailResult.success) {
      console.error('Failed to relay agent reply by Gmail:', gmailResult.error)
    }
  }

  // Relay agent message via Meta for Instagram/Messenger channels
  if ((channel === 'instagram' || channel === 'messenger') && organizationId) {
    const { data: ticketForMeta } = await supabase
      .from('tickets')
      .select('metadata')
      .eq('id', parsed.data.ticketId)
      .single()

    const ticketMeta = ticketForMeta as { metadata: unknown } | null
    const metaCtx = await extractMetaReplyContext(ticketMeta?.metadata)
    if (metaCtx.socialUserId) {
      const metaResult = await sendMetaReply({
        organizationId,
        ticketId: parsed.data.ticketId,
        recipientId: metaCtx.socialUserId,
        messageText: parsed.data.body,
      })

      if (!metaResult.success) {
        console.error('Failed to relay agent reply via Meta:', metaResult.error)
      }
    }
  }

  revalidatePath('/dashboard')
}
