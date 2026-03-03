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

async function getTicketViewerContext() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const profile = profileData as { full_name: string | null } | null
  const agentName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Agent'

  return { supabase, user, agentName }
}

function mapCustomer(
  ticket: Record<string, unknown>,
  customerRaw: Record<string, unknown> | null
): MockCustomer {
  return {
    id: (customerRaw?.id as string) ?? (ticket.customer_id as string),
    name:
      (customerRaw?.full_name as string) ??
      (customerRaw?.email as string) ??
      'Client inconnu',
    email: (customerRaw?.email as string) ?? '',
  }
}

function mapMessages(
  messagesRaw: Record<string, unknown>[],
  customerName: string,
  agentName: string
): MockMessage[] {
  return messagesRaw
    .slice()
    .sort(
      (a, b) =>
        new Date(a.created_at as string).getTime() -
        new Date(b.created_at as string).getTime()
    )
    .map(
      (message): MockMessage => {
        const senderType =
          message.sender_type === 'system'
            ? 'ai'
            : (message.sender_type as MockMessage['senderType'])

        return {
          id: message.id as string,
          senderType,
          senderName:
            senderType === 'ai'
              ? 'Savly'
              : senderType === 'agent'
                ? agentName
                : customerName,
          body: message.body as string,
          createdAt: message.created_at as string,
        }
      }
    )
}

function mapTags(
  tagsRaw: { tag: Record<string, unknown> | null }[]
): string[] {
  return tagsRaw
    .map((rel) => rel.tag?.name as string | undefined)
    .filter((name): name is string => Boolean(name))
}

function buildTicket(
  ticket: Record<string, unknown>,
  customer: MockCustomer,
  customerMetadata: Record<string, unknown> | null,
  tags: string[],
  messages: MockMessage[],
  userId: string,
  agentName: string,
  latestMessage: MockMessage | null = messages[messages.length - 1] ?? null
): MockTicket {
  const unread =
    (ticket.status as string) === 'open' &&
    latestMessage?.senderType === 'customer'

  const assignedTo = ticket.assigned_to
    ? ticket.assigned_to === userId
      ? agentName
      : (ticket.assigned_to as string)
    : null

  return {
    id: ticket.id as string,
    subject: ticket.subject as string,
    customer,
    customerMetadata,
    status: ticket.status as MockTicket['status'],
    priority: ticket.priority as MockTicket['priority'],
    channel: ticket.channel as MockTicket['channel'],
    assignedTo,
    assignedToId: (ticket.assigned_to as string) ?? null,
    unread,
    tags,
    csatRating: (ticket.csat_rating as number | null) ?? null,
    createdAt: ticket.created_at as string,
    lastMessagePreview: latestMessage?.body ?? null,
    lastMessageAt: latestMessage?.createdAt ?? null,
    lastMessageSenderType: latestMessage?.senderType ?? null,
    messages,
  }
}

export async function getTickets(): Promise<MockTicket[]> {
  const context = await getTicketViewerContext()
  if (!context) return []

  const { supabase, user, agentName } = context

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

    const customer = mapCustomer(t, customerRaw)
    const messages = mapMessages(messagesRaw, customer.name, agentName)
    const tags = mapTags(tagsRaw)

    return buildTicket(
      t,
      customer,
      toRecord(customerRaw?.metadata) ?? null,
      tags,
      messages,
      user.id,
      agentName
    )
  })
}

export async function getTicketsList(): Promise<MockTicket[]> {
  const context = await getTicketViewerContext()
  if (!context) return []

  const { supabase, user, agentName } = context

  const { data: rawTickets, error } = await supabase
    .from('tickets')
    .select(
      `
      id,
      subject,
      status,
      priority,
      channel,
      assigned_to,
      csat_rating,
      created_at,
      customer_id,
      customer:customers(id, full_name, email, metadata),
      messages(id, sender_type, body, created_at),
      tags:ticket_tags(tag:tags(name))
    `
    )
    .order('created_at', { ascending: false })
    .order('created_at', { ascending: false, foreignTable: 'messages' })
    .limit(1, { foreignTable: 'messages' })

  if (error || !rawTickets) {
    console.error('Error fetching tickets list:', error)
    return []
  }

  return (rawTickets as unknown[]).map((raw): MockTicket => {
    const ticket = raw as Record<string, unknown>
    const customerRaw = ticket.customer as Record<string, unknown> | null
    const previewMessagesRaw = (ticket.messages ?? []) as Record<string, unknown>[]
    const tagsRaw = (ticket.tags ?? []) as { tag: Record<string, unknown> | null }[]

    const customer = mapCustomer(ticket, customerRaw)
    const previewMessages = mapMessages(previewMessagesRaw, customer.name, agentName)
    const latestMessage = previewMessages[previewMessages.length - 1] ?? null

    return buildTicket(
      ticket,
      customer,
      toRecord(customerRaw?.metadata) ?? null,
      mapTags(tagsRaw),
      [],
      user.id,
      agentName,
      latestMessage
    )
  })
}

export async function getTicketMessages(ticketId: string): Promise<MockMessage[]> {
  const parsed = z.string().uuid().safeParse(ticketId)
  if (!parsed.success) return []

  const context = await getTicketViewerContext()
  if (!context) return []

  const { supabase, agentName } = context

  const { data: ticketData } = await supabase
    .from('tickets')
    .select('id, customer:customers(full_name, email)')
    .eq('id', parsed.data)
    .maybeSingle()

  if (!ticketData) return []

  const ticket = ticketData as Record<string, unknown>
  const customerRaw = ticket.customer as Record<string, unknown> | null
  const customerName =
    (customerRaw?.full_name as string) ??
    (customerRaw?.email as string) ??
    'Client inconnu'

  const { data: rawMessages, error } = await supabase
    .from('messages')
    .select('id, sender_type, body, created_at')
    .eq('ticket_id', parsed.data)
    .order('created_at', { ascending: true })

  if (error || !rawMessages) {
    console.error('Error fetching ticket messages:', error)
    return []
  }

  return mapMessages(
    rawMessages as Record<string, unknown>[],
    customerName,
    agentName
  )
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

    const customer = mapCustomer(t, customerRaw)
    const messages = mapMessages(messagesRaw, customer.name, agentName)
    const mappedTicket = buildTicket(
      t,
      customer,
      toRecord(customerRaw?.metadata) ?? null,
      mapTags(tagsRaw),
      messages,
      user.id,
      agentName
    )

    return {
      ...mappedTicket,
      assignedTo: agentName,
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
