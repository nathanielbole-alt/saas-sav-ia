'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MockMessage, MockTicket } from '@/lib/mock-data'
import type { Database } from '@/types/database.types'

type UseRealtimeTicketsResult = {
  tickets: MockTicket[]
  setTickets: Dispatch<SetStateAction<MockTicket[]>>
}

type TicketRow = Database['public']['Tables']['tickets']['Row']
type CustomerRow = Database['public']['Tables']['customers']['Row']
type MessageRow = Database['public']['Tables']['messages']['Row']
type TagRow = Database['public']['Tables']['tags']['Row']

type TicketWithRelations = TicketRow & {
  customer: CustomerRow | null
  messages: MessageRow[] | null
  tags: Array<{ tag: TagRow | null }> | null
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function toTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function getAgentDisplayName(messages: MockMessage[]): string {
  return messages.find((message) => message.senderType === 'agent')?.senderName ?? 'Agent'
}

function mapMessageRow(
  message: MessageRow,
  customerName: string,
  agentDisplayName: string
): MockMessage {
  return {
    id: message.id,
    senderType: message.sender_type,
    senderName:
      message.sender_type === 'ai'
        ? 'Savly'
        : message.sender_type === 'agent'
          ? agentDisplayName
          : customerName,
    body: message.body,
    createdAt: message.created_at,
  }
}

function mapTicketRow(raw: TicketWithRelations): MockTicket {
  const customerName =
    raw.customer?.full_name ?? raw.customer?.email ?? 'Client inconnu'
  const customerEmail = raw.customer?.email ?? ''
  const agentDisplayName = 'Agent'

  const messages = (raw.messages ?? [])
    .slice()
    .sort((a, b) => toTimestamp(a.created_at) - toTimestamp(b.created_at))
    .map((message) => mapMessageRow(message, customerName, agentDisplayName))

  const lastMessage = messages[messages.length - 1]

  return {
    id: raw.id,
    subject: raw.subject,
    customer: {
      id: raw.customer?.id ?? raw.customer_id,
      name: customerName,
      email: customerEmail,
    },
    customerMetadata: toRecord(raw.customer?.metadata) ?? null,
    status: raw.status,
    priority: raw.priority,
    channel: raw.channel,
    assignedTo: raw.assigned_to ?? null,
    assignedToId: raw.assigned_to ?? null,
    unread: raw.status === 'open' && lastMessage?.senderType === 'customer',
    tags: (raw.tags ?? [])
      .map((tagRelation) => tagRelation.tag?.name)
      .filter((name): name is string => Boolean(name)),
    csatRating: (raw as Record<string, unknown>).csat_rating as number | null ?? null,
    createdAt: raw.created_at,
    lastMessagePreview: lastMessage?.body ?? null,
    lastMessageAt: lastMessage?.createdAt ?? null,
    lastMessageSenderType: lastMessage?.senderType ?? null,
    messages,
  }
}

export function useRealtimeTickets(
  initialTickets: MockTicket[],
  organizationId: string | null
): UseRealtimeTicketsResult {
  const [tickets, setTickets] = useState<MockTicket[]>(initialTickets)

  useEffect(() => {
    if (!organizationId) return

    const supabase = createClient()

    const upsertMessage = (messageRow: MessageRow) => {
      setTickets((previousTickets) => {
        const ticketIndex = previousTickets.findIndex(
          (ticket) => ticket.id === messageRow.ticket_id
        )
        if (ticketIndex < 0) return previousTickets

        const targetTicket = previousTickets[ticketIndex]
        if (!targetTicket) return previousTickets

        if (targetTicket.messages.some((message) => message.id === messageRow.id)) {
          return previousTickets
        }

        const incomingMessage = mapMessageRow(
          messageRow,
          targetTicket.customer.name,
          getAgentDisplayName(targetTicket.messages)
        )

        const messagesWithoutTempDuplicate = targetTicket.messages.filter((message) => {
          if (!message.id.startsWith('m-temp-')) return true
          if (message.senderType !== incomingMessage.senderType) return true
          if (message.body.trim() !== incomingMessage.body.trim()) return true

          const messageTime = toTimestamp(message.createdAt)
          const incomingTime = toTimestamp(incomingMessage.createdAt)
          return Math.abs(messageTime - incomingTime) > 2 * 60 * 1000
        })

        const updatedTicket: MockTicket = {
          ...targetTicket,
          unread:
            incomingMessage.senderType === 'agent' ? targetTicket.unread : true,
          lastMessagePreview: incomingMessage.body,
          lastMessageAt: incomingMessage.createdAt,
          lastMessageSenderType: incomingMessage.senderType,
          messages: [...messagesWithoutTempDuplicate, incomingMessage].sort(
            (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
          ),
        }

        const remainingTickets = previousTickets.filter(
          (_, index) => index !== ticketIndex
        )

        return [updatedTicket, ...remainingTickets]
      })
    }

    const upsertTicketFromDatabase = async (ticketId: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .select(
          `
          *,
          customer:customers(*),
          messages(*),
          tags:ticket_tags(tag:tags(*))
        `
        )
        .eq('id', ticketId)
        .maybeSingle()

      if (error || !data) return

      const mappedTicket = mapTicketRow(data as unknown as TicketWithRelations)
      setTickets((previousTickets) => {
        const withoutCurrent = previousTickets.filter(
          (ticket) => ticket.id !== mappedTicket.id
        )
        return [mappedTicket, ...withoutCurrent]
      })
    }

    const updateTicket = (updatedRow: TicketRow) => {
      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === updatedRow.id
            ? {
                ...ticket,
                subject: updatedRow.subject,
                status: updatedRow.status,
                priority: updatedRow.priority,
                channel: updatedRow.channel,
                assignedTo: updatedRow.assigned_to ?? null,
                assignedToId: updatedRow.assigned_to ?? null,
                createdAt: updatedRow.created_at,
              }
            : ticket
        )
      )
    }

    const messagesChannel = supabase
      .channel(`messages-realtime-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const messageRow = payload.new as MessageRow
          upsertMessage(messageRow)
        }
      )
      .subscribe()

    const ticketsChannel = supabase
      .channel(`tickets-realtime-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const insertedRow = payload.new as TicketRow
            void upsertTicketFromDatabase(insertedRow.id)
            return
          }

          if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as TicketRow
            updateTicket(updatedRow)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(messagesChannel)
      void supabase.removeChannel(ticketsChannel)
    }
  }, [organizationId])

  return { tickets, setTickets }
}
