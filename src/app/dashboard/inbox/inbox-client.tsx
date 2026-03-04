'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { getTicketMessages, sendMessage } from '@/lib/actions/tickets'
import { TicketDetail } from '@/components/dashboard/ticket-detail'
import { TicketList, type TicketFilter } from '@/components/dashboard/ticket-list'
// DEMO_MODE: inbox client state still uses placeholder ticket/message data until the real domain types are introduced.
import { useRealtimeTickets } from '@/hooks/use-realtime-tickets'
import type { TicketMessage, TicketWithRelations } from '@/types/view-models'
import { getCustomerName } from '@/lib/utils'

export default function DashboardClient({
  initialTickets,
  organizationId,
  currentUserId,
  initialSelectedId = null,
}: {
  initialTickets: TicketWithRelations[]
  organizationId: string | null
  currentUserId: string | null
  initialSelectedId?: string | null
}) {
  const initialSelection =
    initialSelectedId && initialTickets.some((ticket) => ticket.id === initialSelectedId)
      ? initialSelectedId
      : (initialTickets[0]?.id ?? null)

  const { tickets, setTickets } = useRealtimeTickets(initialTickets, organizationId)
  const [selectedId, setSelectedId] = useState<string | null>(initialSelection)
  const [filter, setFilter] = useState<TicketFilter>('all')
  const [search, setSearch] = useState('')
  const loadedMessagesRef = useRef(
    new Set(
      initialTickets
        .filter((ticket) => ticket.messages.length > 0)
        .map((ticket) => ticket.id)
    )
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadedMessagesRef.current = new Set(
        initialTickets
          .filter((ticket) => ticket.messages.length > 0)
          .map((ticket) => ticket.id)
      )
      setTickets(initialTickets)
      setSelectedId((previousSelectedId) => {
        if (
          previousSelectedId &&
          initialTickets.some((ticket) => ticket.id === previousSelectedId)
        ) {
          return previousSelectedId
        }

        if (
          initialSelectedId &&
          initialTickets.some((ticket) => ticket.id === initialSelectedId)
        ) {
          return initialSelectedId
        }

        return initialTickets[0]?.id ?? null
      })
    }, 0)

    return () => clearTimeout(timeout)
  }, [initialTickets, initialSelectedId, setTickets])

  useEffect(() => {
    if (!selectedId || loadedMessagesRef.current.has(selectedId)) return

    const selectedTicket = tickets.find((ticket) => ticket.id === selectedId)
    if (!selectedTicket) return

    let isActive = true

    void getTicketMessages(selectedId).then((messages) => {
      if (!isActive) return

      loadedMessagesRef.current.add(selectedId)

      setTickets((previousTickets) =>
        previousTickets.map((ticket) => {
          if (ticket.id !== selectedId) return ticket

          const tempMessages = ticket.messages.filter((message) =>
            message.id.startsWith('m-temp-')
          )
          const mergedMessages = [...messages]

          for (const tempMessage of tempMessages) {
            if (!mergedMessages.some((message) => message.id === tempMessage.id)) {
              mergedMessages.push(tempMessage)
            }
          }

          mergedMessages.sort(
            (left, right) =>
              new Date(left.created_at).getTime() -
              new Date(right.created_at).getTime()
          )

          const lastMessage = mergedMessages[mergedMessages.length - 1]

          return {
            ...ticket,
            unread:
              ticket.status === 'open' &&
              lastMessage?.sender_type === 'customer',
            last_message_preview:
              lastMessage?.body.slice(0, 120) ?? ticket.last_message_preview ?? null,
            last_message_at:
              lastMessage?.created_at ?? ticket.last_message_at ?? null,
            last_message_sender_type:
              lastMessage?.sender_type ?? ticket.last_message_sender_type ?? null,
            messages: mergedMessages,
          }
        })
      )
    })

    return () => {
      isActive = false
    }
  }, [selectedId, tickets, setTickets])

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === 'unread' && !ticket.unread) return false
    if (filter === 'mine' && ticket.assigned_to !== currentUserId) return false

    if (search.trim()) {
      const query = search.toLowerCase()
      const lastMessageBody =
        ticket.messages[ticket.messages.length - 1]?.body ??
        ticket.last_message_preview ??
        ''

      return (
        ticket.subject.toLowerCase().includes(query) ||
        getCustomerName(ticket.customer).toLowerCase().includes(query) ||
        ticket.customer.email.toLowerCase().includes(query) ||
        lastMessageBody.toLowerCase().includes(query)
      )
    }

    return true
  })

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? null

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id)
      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === id ? { ...ticket, unread: false } : ticket
        )
      )
    },
    [setTickets]
  )

  const handleSendMessage = useCallback(
    async (body: string) => {
      if (!selectedId || !body.trim()) return

      const newMessage: TicketMessage = {
        id: `m-temp-${Date.now()}`,
        sender_type: 'agent',
        sender_id: currentUserId,
        body: body.trim(),
        created_at: new Date().toISOString(),
        metadata: null,
      }

      setTickets((previousTickets) => {
        const targetIndex = previousTickets.findIndex(
          (ticket) => ticket.id === selectedId
        )
        if (targetIndex < 0) return previousTickets

        const targetTicket = previousTickets[targetIndex]
        if (!targetTicket) return previousTickets

        const updatedTicket: TicketWithRelations = {
          ...targetTicket,
          unread: false,
          last_message_preview: newMessage.body.slice(0, 120),
          last_message_at: newMessage.created_at,
          last_message_sender_type: newMessage.sender_type,
          messages: [...targetTicket.messages, newMessage],
        }

        const remainingTickets = previousTickets.filter(
          (_, index) => index !== targetIndex
        )
        return [updatedTicket, ...remainingTickets]
      })

      try {
        await sendMessage(selectedId, body)
      } catch (error) {
        console.error('Failed to send message', error)
      }
    },
    [currentUserId, selectedId, setTickets]
  )

  return (
    <div className="flex h-full">
      <TicketList
        tickets={filteredTickets}
        selectedId={selectedId}
        onSelect={handleSelect}
        filter={filter}
        onFilterChange={setFilter}
        search={search}
        onSearchChange={setSearch}
      />
      <TicketDetail
        key={selectedTicket?.id ?? 'empty-ticket'}
        ticket={selectedTicket}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}
