'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { sendGmailReply } from '@/lib/actions/gmail'
import { extractMetaReplyContext, sendMetaReply } from '@/lib/actions/meta'
// DEMO_MODE: ticket/customer/message data still uses placeholder content until real app models replace it.
import type { TicketCustomer, TicketMessage, TicketWithRelations } from '@/types/view-models'
import { createClient } from '@/lib/supabase/server'
import { extractGmailReplyContext, toRecord } from '@/lib/utils'

async function getTicketViewerContext() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  return { supabase, user }
}

function mapCustomer(
  ticket: Record<string, unknown>,
  customerRaw: Record<string, unknown> | null
): TicketCustomer {
  return {
    id: (customerRaw?.id as string) ?? (ticket.customer_id as string),
    email: (customerRaw?.email as string) ?? '',
    full_name: (customerRaw?.full_name as string | null) ?? null,
    metadata: (customerRaw?.metadata as TicketCustomer['metadata']) ?? null,
  }
}

function mapMessages(messagesRaw: Record<string, unknown>[]): TicketMessage[] {
  return messagesRaw
    .slice()
    .sort(
      (left, right) =>
        new Date(left.created_at as string).getTime() -
        new Date(right.created_at as string).getTime()
    )
    .map(
      (message): TicketMessage => ({
        id: message.id as string,
        body: message.body as string,
        sender_type: message.sender_type as TicketMessage['sender_type'],
        sender_id: (message.sender_id as string | null) ?? null,
        created_at: message.created_at as string,
        metadata: (message.metadata as TicketMessage['metadata']) ?? null,
      })
    )
}

function mapTags(tagsRaw: { tag: Record<string, unknown> | null }[]): string[] {
  return tagsRaw
    .map((relation) => relation.tag?.name as string | undefined)
    .filter((name): name is string => Boolean(name))
}

function buildTicket(
  ticket: Record<string, unknown>,
  customer: TicketCustomer,
  tags: string[],
  messages: TicketMessage[],
  latestMessage: TicketMessage | null = messages[messages.length - 1] ?? null
): TicketWithRelations {
  return {
    id: ticket.id as string,
    organization_id: ticket.organization_id as string,
    customer_id: ticket.customer_id as string,
    assigned_to: (ticket.assigned_to as string | null) ?? null,
    subject: ticket.subject as string,
    status: ticket.status as TicketWithRelations['status'],
    priority: ticket.priority as TicketWithRelations['priority'],
    channel: ticket.channel as TicketWithRelations['channel'],
    metadata: (ticket.metadata as TicketWithRelations['metadata']) ?? null,
    ai_summary: (ticket.ai_summary as string | null) ?? null,
    csat_rating: (ticket.csat_rating as number | null) ?? null,
    csat_comment: (ticket.csat_comment as string | null) ?? null,
    csat_at: (ticket.csat_at as string | null) ?? null,
    created_at: ticket.created_at as string,
    updated_at: ticket.updated_at as string,
    customer,
    messages,
    unread:
      (ticket.status as string) === 'open' &&
      latestMessage?.sender_type === 'customer',
    last_message_preview: latestMessage?.body.slice(0, 120) ?? null,
    last_message_at: latestMessage?.created_at ?? null,
    last_message_sender_type: latestMessage?.sender_type ?? null,
    tags,
  }
}

export async function getTickets(): Promise<TicketWithRelations[]> {
  const context = await getTicketViewerContext()
  if (!context) return []

  const { supabase } = context

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

  return (rawTickets as unknown[]).map((raw): TicketWithRelations => {
    const ticket = raw as Record<string, unknown>
    const customerRaw = ticket.customer as Record<string, unknown> | null
    const messagesRaw = (ticket.messages ?? []) as Record<string, unknown>[]
    const tagsRaw = (ticket.tags ?? []) as { tag: Record<string, unknown> | null }[]

    return buildTicket(
      ticket,
      mapCustomer(ticket, customerRaw),
      mapTags(tagsRaw),
      mapMessages(messagesRaw)
    )
  })
}

export async function getTicketsList(): Promise<TicketWithRelations[]> {
  const context = await getTicketViewerContext()
  if (!context) return []

  const { supabase } = context

  const { data: rawTickets, error } = await supabase
    .from('tickets')
    .select(
      `
      id,
      organization_id,
      customer_id,
      assigned_to,
      subject,
      status,
      priority,
      channel,
      metadata,
      ai_summary,
      csat_rating,
      csat_comment,
      csat_at,
      created_at,
      updated_at,
      customer:customers(id, full_name, email, metadata),
      messages(id, sender_type, sender_id, body, created_at, metadata),
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

  return (rawTickets as unknown[]).map((raw): TicketWithRelations => {
    const ticket = raw as Record<string, unknown>
    const customerRaw = ticket.customer as Record<string, unknown> | null
    const previewMessagesRaw = (ticket.messages ?? []) as Record<string, unknown>[]
    const tagsRaw = (ticket.tags ?? []) as { tag: Record<string, unknown> | null }[]
    const previewMessages = mapMessages(previewMessagesRaw)
    const latestMessage = previewMessages[previewMessages.length - 1] ?? null

    return buildTicket(
      ticket,
      mapCustomer(ticket, customerRaw),
      mapTags(tagsRaw),
      [],
      latestMessage
    )
  })
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const parsed = z.string().uuid().safeParse(ticketId)
  if (!parsed.success) return []

  const context = await getTicketViewerContext()
  if (!context) return []

  const { supabase } = context

  const { data: rawMessages, error } = await supabase
    .from('messages')
    .select('id, sender_type, sender_id, body, created_at, metadata')
    .eq('ticket_id', parsed.data)
    .order('created_at', { ascending: true })

  if (error || !rawMessages) {
    console.error('Error fetching ticket messages:', error)
    return []
  }

  return mapMessages(rawMessages as Record<string, unknown>[])
}

export async function getMyTickets(): Promise<TicketWithRelations[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

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

  return (rawTickets as unknown[]).map((raw): TicketWithRelations => {
    const ticket = raw as Record<string, unknown>
    const customerRaw = ticket.customer as Record<string, unknown> | null
    const messagesRaw = (ticket.messages ?? []) as Record<string, unknown>[]
    const tagsRaw = (ticket.tags ?? []) as { tag: Record<string, unknown> | null }[]

    return buildTicket(
      ticket,
      mapCustomer(ticket, customerRaw),
      mapTags(tagsRaw),
      mapMessages(messagesRaw)
    )
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
