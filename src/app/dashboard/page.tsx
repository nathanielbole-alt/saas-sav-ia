import { createClient } from '@/lib/supabase/server'
import { getTicketsList } from '@/lib/actions/tickets'
import OverviewClient from './overview-client'

export default async function DashboardOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tickets = await getTicketsList()

  const { data: profile } = user
    ? await supabase
      .from('profiles')
      .select('full_name, organization_id')
      .eq('id', user.id)
      .maybeSingle()
    : { data: null }

  return (
    <OverviewClient
      tickets={tickets}
      userName={profile?.full_name ?? user?.email}
    />
  )
}
