'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Inbox,
  MessageSquare,
} from 'lucide-react'
// DEMO_MODE: overview KPIs still derive from placeholder ticket data until the dashboard overview is fully wired to Supabase analytics.
import type { TicketWithRelations } from '@/types/view-models'
import { ActivityFeed } from '@/components/dashboard/overview/activity-feed'
import { OverviewHeader } from '@/components/dashboard/overview/overview-header'
import { QuickActions } from '@/components/dashboard/overview/quick-actions'
import { StatCard } from '@/components/dashboard/overview/stat-card'

export default function OverviewClient({
  tickets,
  userName,
}: {
  tickets: TicketWithRelations[]
  userName?: string | null
}) {
  const router = useRouter()
  const { stats, urgentTickets, recentUnread } = useMemo(() => {
    const unread = tickets.filter((ticket) => ticket.unread).length
    const urgentTickets = tickets
      .filter((ticket) => ticket.priority === 'urgent' && ticket.status !== 'resolved')
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 3)
    const recentUnread = tickets
      .filter((ticket) => ticket.unread)
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 4)

    return {
      stats: {
        unread,
        urgent: tickets.filter((ticket) => ticket.priority === 'urgent' && !['resolved', 'closed'].includes(ticket.status)).length,
        open: tickets.filter((ticket) => ticket.status === 'open').length,
        resolvedToday: tickets.filter((ticket) => ticket.status === 'resolved' && new Date(ticket.created_at).getTime() > Date.now() - 86400000).length,
      },
      urgentTickets,
      recentUnread,
    }
  }, [tickets])

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <OverviewHeader userName={userName} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Non lus" value={stats.unread} icon={MessageSquare} accent="blue" badge={stats.unread > 0 ? 'À traiter' : undefined} delay={0} />
          <StatCard label="Urgences" value={stats.urgent} icon={AlertCircle} accent="red" badge={stats.urgent > 0 ? 'Priorité max' : undefined} delay={0.05} />
          <StatCard label="Résolus aujourd'hui" value={stats.resolvedToday} icon={CheckCircle2} accent="green" badge="+12%" delay={0.1} />
          <StatCard label="Tickets ouverts" value={stats.open} icon={Activity} accent="yellow" delay={0.15} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityFeed title="Récemment reçus" icon={Inbox} iconClassName="bg-[#E8856C]/10 text-[#E8856C]" tickets={recentUnread} variant="recent" delay={0.3} linkHref="/dashboard/inbox" linkLabel="Voir la boîte" emptyTitle="Tout est à jour" emptyDescription="Aucun nouveau message. Vous êtes à jour !" onSelect={(ticketId) => router.push(`/dashboard/inbox?ticket=${ticketId}`)} />
          <ActivityFeed title="Tickets Urgents" icon={AlertCircle} iconClassName="bg-[#ff453a]/10 text-[#ff453a]" tickets={urgentTickets} variant="urgent" delay={0.4} emptyTitle="Tout est calme !" emptyDescription="Aucun ticket urgent ne requiert votre attention." onSelect={(ticketId) => router.push(`/dashboard/inbox?ticket=${ticketId}`)} />
        </div>
        <QuickActions delay={0.5} />
      </div>
    </div>
  )
}
