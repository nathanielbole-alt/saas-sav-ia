import { createClient } from '@/lib/supabase/server'
import { getTickets } from '@/lib/actions/tickets'
import DashboardClient from './client-page'
import type { MockTicket } from '@/lib/mock-data'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { ticket?: string | string[] }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tickets: MockTicket[] = await getTickets()
  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null }

  const organizationId =
    (profile as { organization_id: string } | null)?.organization_id ?? null

  const ticketParam = searchParams?.ticket
  const initialSelectedId =
    typeof ticketParam === 'string' ? ticketParam : ticketParam?.[0] ?? null

  return (
    <DashboardClient
      initialTickets={tickets}
      organizationId={organizationId}
      currentUserId={user?.id ?? null}
      initialSelectedId={initialSelectedId}
    />
  )
}
