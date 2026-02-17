'use server'

import { createClient } from '@/lib/supabase/server'

export type CustomerWithStats = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  ticket_count: number
  last_contact: string | null
}

export async function getCustomers(
  search?: string,
  sortBy: 'name' | 'email' | 'ticket_count' | 'last_contact' = 'last_contact'
): Promise<CustomerWithStats[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('customers')
    .select('*, tickets(id, created_at)')

  if (error || !data) {
    console.error('Error fetching customers:', error)
    return []
  }

  let customers = (data as unknown[]).map((raw): CustomerWithStats => {
    const c = raw as Record<string, unknown>
    const tickets = (c.tickets as { id: string; created_at: string }[]) ?? []

    const sorted = [...tickets].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return {
      id: c.id as string,
      email: c.email as string,
      full_name: c.full_name as string | null,
      phone: c.phone as string | null,
      created_at: c.created_at as string,
      ticket_count: tickets.length,
      last_contact: sorted[0]?.created_at ?? null,
    }
  })

  if (search?.trim()) {
    const q = search.toLowerCase()
    customers = customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    )
  }

  customers.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email)
      case 'email':
        return a.email.localeCompare(b.email)
      case 'ticket_count':
        return b.ticket_count - a.ticket_count
      case 'last_contact':
      default:
        if (!a.last_contact) return 1
        if (!b.last_contact) return -1
        return new Date(b.last_contact).getTime() - new Date(a.last_contact).getTime()
    }
  })

  return customers
}
