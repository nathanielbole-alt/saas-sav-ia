'use client'

import { useState, useCallback, useEffect } from 'react'
import { TicketList, type TicketFilter } from '@/components/dashboard/ticket-list'
import { TicketDetail } from '@/components/dashboard/ticket-detail'
import { sendMessage } from '@/lib/actions/tickets'
import { type MockTicket, type MockMessage } from '@/lib/mock-data'
import { useRealtimeTickets } from '@/hooks/use-realtime-tickets'

// ── Client Component ────────────────────────────────────────────────────────

export default function DashboardClient({
    initialTickets,
    organizationId,
    currentUserId,
    initialSelectedId = null,
}: {
    initialTickets: MockTicket[]
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

    // Sync with server data when it changes (after actions)
    useEffect(() => {
        const timeout = setTimeout(() => {
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

    // ── Filtered tickets ────────────────────────────────────────────────────

    const filteredTickets = tickets.filter((t) => {
        if (filter === 'unread' && !t.unread) return false
        if (filter === 'mine' && t.assignedToId !== currentUserId) return false

        if (search.trim()) {
            const q = search.toLowerCase()
            const lastMsg = t.messages[t.messages.length - 1]
            return (
                t.subject.toLowerCase().includes(q) ||
                t.customer.name.toLowerCase().includes(q) ||
                t.customer.email.toLowerCase().includes(q) ||
                (lastMsg?.body.toLowerCase().includes(q) ?? false)
            )
        }

        return true
    })

    const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null

    // ── Select ticket & mark as read ────────────────────────────────────────

    const handleSelect = useCallback((id: string) => {
        setSelectedId(id)
        setTickets((prev) =>
            prev.map((t) => (t.id === id ? { ...t, unread: false } : t))
        )
        // TODO: Call server action to mark as read
    }, [setTickets])

    // ── Send agent message ──────────────────────────────────────────────────

    const handleSendMessage = useCallback(
        async (body: string) => {
            if (!selectedId || !body.trim()) return

            // Optimistic update
            const newMsg: MockMessage = {
                id: `m-temp-${Date.now()}`,
                senderType: 'agent',
                senderName: 'Nathaniel B.', // Ideally get from auth context
                body: body.trim(),
                createdAt: new Date().toISOString(),
            }

            setTickets((prev) =>
              {
                const targetIndex = prev.findIndex((ticket) => ticket.id === selectedId)
                if (targetIndex < 0) return prev

                const target = prev[targetIndex]
                if (!target) return prev

                const updatedTicket: MockTicket = {
                  ...target,
                  unread: false,
                  messages: [...target.messages, newMsg],
                }

                const remaining = prev.filter((_, index) => index !== targetIndex)
                return [updatedTicket, ...remaining]
              })

            try {
                await sendMessage(selectedId, body)
            } catch (error) {
                console.error('Failed to send message', error)
                // Revert or show error toast
            }
        },
        [selectedId, setTickets]
    )

    // ── Render ──────────────────────────────────────────────────────────────

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
