import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mockTickets } from '@/lib/mock-data'

export async function POST() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = await createClient()

    // 1. Check auth
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user's organization
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const typedProfile = profile as { organization_id: string; role: string }
    if (!['owner', 'admin'].includes(typedProfile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orgId = typedProfile.organization_id

    try {
        // 3. Insert Customers (deduplicating by email)
        // We extract all unique customers from mockTickets
        const uniqueCustomers = Array.from(
            new Map(mockTickets.map((t) => [t.customer.email, t.customer])).values()
        )

        const customerMap = new Map<string, string>() // email -> uuid

        for (const c of uniqueCustomers) {
            // Try to find existing customer first to avoid Unique constraint error if running seed twice
            const { data: existing } = await supabase
                .from('customers')
                .select('id')
                .eq('organization_id', orgId)
                .eq('email', c.email)
                .single()

            if (existing) {
                customerMap.set(c.email, existing.id)
            } else {
                const { data: newCustomer, error } = await supabase
                    .from('customers')
                    .insert({
                        organization_id: orgId,
                        email: c.email,
                        full_name: c.name,
                    })
                    .select('id')
                    .single()

                if (error) throw error
                if (newCustomer) customerMap.set(c.email, newCustomer.id)
            }
        }

        // 4. Insert Tickets & Messages
        for (const t of mockTickets) {
            const customerId = customerMap.get(t.customer.email)
            if (!customerId) continue

            // Insert Ticket
            const { data: newTicket, error: ticketError } = await supabase
                .from('tickets')
                .insert({
                    organization_id: orgId,
                    customer_id: customerId,
                    subject: t.subject,
                    status: t.status,
                    priority: t.priority,
                    channel: t.channel,
                    assigned_to: t.assignedTo ? user.id : null, // Assign to current user if not null in mock
                    // 'unread' is not in schema yet? Let's check schema.
                    // Schema doesn't have 'unread'. We might need to migrate or ignore for now.
                    // We'll ignore 'unread' for db insertion as it's likely a computed/local state or needs schema update.
                    created_at: t.createdAt,
                })
                .select('id')
                .single()

            if (ticketError) throw ticketError
            if (!newTicket) continue

            // Insert Messages
            const messagesPayload = t.messages.map((m) => ({
                ticket_id: newTicket.id,
                sender_type: m.senderType,
                sender_id: m.senderType === 'agent' ? user.id : customerId, // Simple mapping
                body: m.body,
                created_at: m.createdAt,
            }))

            const { error: msgError } = await supabase
                .from('messages')
                .insert(messagesPayload)

            if (msgError) throw msgError

            // Insert Tags (Optional - handling simplified for now)
            // We would need to create tags in 'tags' table first, then link in 'ticket_tags'
            for (const tagName of t.tags) {
                // Get or create tag
                let tagId: string | null = null

                const { data: existingTag } = await supabase
                    .from('tags')
                    .select('id')
                    .eq('organization_id', orgId)
                    .eq('name', tagName)
                    .single()

                if (existingTag) {
                    tagId = existingTag.id
                } else {
                    const { data: newTag } = await supabase
                        .from('tags')
                        .insert({ organization_id: orgId, name: tagName })
                        .select('id')
                        .single()
                    if (newTag) tagId = newTag.id
                }

                if (tagId) {
                    await supabase.from('ticket_tags').insert({
                        ticket_id: newTicket.id,
                        tag_id: tagId
                    })
                }
            }
        }

        return NextResponse.json({ success: true, message: 'Database seeded successfully' })
    } catch (error: unknown) {
        console.error('Seeding error:', error)
        const message = error instanceof Error ? error.message : 'Unknown seeding error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
