import { createClient } from '@/lib/supabase/server'
import { getTicketsList } from '@/lib/actions/tickets'
import InboxClient from './inbox-client'
// DEMO_MODE: inbox page still types its payload with placeholder ticket data.
import type { TicketWithRelations } from '@/types/view-models'

export default async function InboxPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tickets: TicketWithRelations[] = await getTicketsList()
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
    <InboxClient
      initialTickets={tickets}
      organizationId={organizationId}
      currentUserId={user?.id ?? null}
      initialSelectedId={initialSelectedId}
    />
  )
}
