import { getTickets } from '@/lib/actions/tickets'
import TicketsClient from './tickets-client'

export default async function TicketsPage() {
  const tickets = await getTickets()

  return <TicketsClient initialTickets={tickets} />
}
