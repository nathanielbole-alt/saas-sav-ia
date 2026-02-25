'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Mail,
  FileText,
  Star,
  Pen,
  Filter,
  ChevronDown,
} from 'lucide-react'
import { type MockTicket } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}j`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const channelLabels: Record<MockTicket['channel'], { label: string; icon: typeof Mail }> = {
  email: { label: 'Email', icon: Mail },
  form: { label: 'Formulaire', icon: FileText },
  google_review: { label: 'Avis Google', icon: Star },
  manual: { label: 'Manuel', icon: Pen },
  instagram: { label: 'Instagram', icon: Mail },
  messenger: { label: 'Messenger', icon: Mail },
}

const statusConfig: Record<MockTicket['status'], { label: string; className: string }> = {
  open: { label: 'Ouvert', className: 'bg-[#30d158]/10 text-[#30d158]' },
  pending: { label: 'En attente', className: 'bg-[#ffd60a]/10 text-[#ffd60a]' },
  resolved: { label: 'Résolu', className: 'bg-[#0a84ff]/10 text-[#0a84ff]' },
  closed: { label: 'Fermé', className: 'bg-[rgba(255,255,255,0.04)] text-[#86868b]' },
}

const priorityConfig: Record<MockTicket['priority'], { label: string; className: string; order: number }> = {
  urgent: { label: 'Urgent', className: 'text-[#ff453a]', order: 0 },
  high: { label: 'Haute', className: 'text-[#ff9f0a]', order: 1 },
  medium: { label: 'Moyenne', className: 'text-[#ffd60a]', order: 2 },
  low: { label: 'Basse', className: 'text-[#86868b]', order: 3 },
}

// ── Types ───────────────────────────────────────────────────────────────────

type SortField = 'createdAt' | 'priority' | 'status' | 'subject' | 'customer'
type SortDir = 'asc' | 'desc'
type StatusFilter = MockTicket['status'] | 'all'
type PriorityFilter = MockTicket['priority'] | 'all'
type ChannelFilter = MockTicket['channel'] | 'all'

// ── Component ───────────────────────────────────────────────────────────────

export default function TicketsClient({
  initialTickets,
}: {
  initialTickets: MockTicket[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredAndSorted = useMemo(() => {
    let result = [...initialTickets]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.customer.name.toLowerCase().includes(q) ||
          t.customer.email.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter)
    }
    if (channelFilter !== 'all') {
      result = result.filter((t) => t.channel === channelFilter)
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'priority':
          cmp = priorityConfig[a.priority].order - priorityConfig[b.priority].order
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
        case 'subject':
          cmp = a.subject.localeCompare(b.subject, 'fr')
          break
        case 'customer':
          cmp = a.customer.name.localeCompare(b.customer.name, 'fr')
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [initialTickets, search, sortField, sortDir, statusFilter, priorityFilter, channelFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(field === 'createdAt' ? 'desc' : 'asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 opacity-30" />
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#0a84ff]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#0a84ff]" />
    )
  }

  const activeFilters = [statusFilter, priorityFilter, channelFilter].filter(
    (f) => f !== 'all'
  ).length

  const stats = useMemo(() => {
    const total = initialTickets.length
    const open = initialTickets.filter((t) => t.status === 'open').length
    const pending = initialTickets.filter((t) => t.status === 'pending').length
    const resolved = initialTickets.filter((t) => t.status === 'resolved').length
    return { total, open, pending, resolved }
  }, [initialTickets])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex-none border-b border-[rgba(255,255,255,0.08)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-semibold text-[#f5f5f7]">Tickets</h1>
            <p className="text-[13px] text-[#86868b] mt-0.5">
              Gérez et suivez tous les tickets de support
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3">
            {([
              { label: 'Total', value: stats.total, color: 'text-[#f5f5f7]' },
              { label: 'Ouverts', value: stats.open, color: 'text-[#30d158]' },
              { label: 'En attente', value: stats.pending, color: 'text-[#ffd60a]' },
              { label: 'Résolus', value: stats.resolved, color: 'text-[#0a84ff]' },
            ] as const).map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 rounded-lg bg-[#1c1c1e] px-3 py-1.5"
              >
                <span className={cn('text-sm font-semibold tabular-nums', s.color)}>{s.value}</span>
                <span className="text-[11px] text-[#86868b]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filter toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#48484a]" />
            <input
              type="text"
              placeholder="Rechercher un ticket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-[#2c2c2e] py-2.5 pl-10 pr-4 text-[13px] text-[#f5f5f7] placeholder-[#48484a] transition-all focus:outline-none focus:ring-1 focus:ring-[#0a84ff]/50"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] transition-colors duration-150',
              showFilters || activeFilters > 0
                ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                : 'bg-[#1c1c1e] text-[#86868b] hover:text-[#f5f5f7]'
            )}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFilters > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a84ff] text-[10px] font-medium text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="mt-4 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none rounded-lg bg-[#2c2c2e] px-3 py-2 pr-8 text-[13px] text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0a84ff]/50"
              >
                <option value="all">Tous les statuts</option>
                <option value="open">Ouvert</option>
                <option value="pending">En attente</option>
                <option value="resolved">Résolu</option>
                <option value="closed">Fermé</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868b]" />
            </div>

            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="appearance-none rounded-lg bg-[#2c2c2e] px-3 py-2 pr-8 text-[13px] text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0a84ff]/50"
              >
                <option value="all">Toutes les priorités</option>
                <option value="urgent">Urgent</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868b]" />
            </div>

            <div className="relative">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value as ChannelFilter)}
                className="appearance-none rounded-lg bg-[#2c2c2e] px-3 py-2 pr-8 text-[13px] text-[#f5f5f7] focus:outline-none focus:ring-1 focus:ring-[#0a84ff]/50"
              >
                <option value="all">Tous les canaux</option>
                <option value="email">Email</option>
                <option value="form">Formulaire</option>
                <option value="google_review">Avis Google</option>
                <option value="manual">Manuel</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868b]" />
            </div>

            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setPriorityFilter('all')
                  setChannelFilter('all')
                }}
                className="text-[12px] text-[#86868b] hover:text-[#0a84ff] transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#1c1c1e]">
              {([
                { field: 'subject' as SortField, label: 'Sujet', width: 'w-[30%]' },
                { field: 'customer' as SortField, label: 'Client', width: 'w-[18%]' },
                { field: 'status' as SortField, label: 'Statut', width: 'w-[12%]' },
                { field: 'priority' as SortField, label: 'Priorité', width: 'w-[10%]' },
              ] as const).map((col) => (
                <th
                  key={col.field}
                  className={cn(
                    'px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#86868b]',
                    col.width
                  )}
                >
                  <button
                    onClick={() => handleSort(col.field)}
                    className="flex items-center gap-1.5 hover:text-[#f5f5f7] transition-colors"
                  >
                    {col.label}
                    <SortIcon field={col.field} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#86868b] w-[12%]">
                Canal
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#86868b] w-[10%]">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1.5 hover:text-[#f5f5f7] transition-colors"
                >
                  Date
                  <SortIcon field="createdAt" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[#86868b] w-[8%]">
                Msgs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-[13px] text-[#86868b]">
                  Aucun ticket trouvé
                </td>
              </tr>
            )}
            {filteredAndSorted.map((ticket) => {
              const ChannelIcon = channelLabels[ticket.channel].icon

              return (
                <tr
                  key={ticket.id}
                  onClick={() => router.push(`/dashboard?ticket=${ticket.id}`)}
                  className={cn(
                    'group cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.04)]',
                    ticket.unread && 'bg-[#0a84ff]/[0.02]'
                  )}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {ticket.unread && (
                        <span className="flex-none h-2 w-2 rounded-full bg-[#0a84ff]" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'truncate text-[13px]',
                            ticket.unread
                              ? 'font-semibold text-[#f5f5f7]'
                              : 'font-medium text-[#f5f5f7]'
                          )}
                        >
                          {ticket.subject}
                        </p>
                        {ticket.tags.length > 0 && (
                          <div className="mt-1 flex gap-1.5">
                            {ticket.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-block rounded-md bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[10px] text-[#48484a]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <p className="truncate text-[13px] text-[#f5f5f7]">{ticket.customer.name}</p>
                    <p className="truncate text-[11px] text-[#48484a]">{ticket.customer.email}</p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium',
                        statusConfig[ticket.status].className
                      )}
                    >
                      {statusConfig[ticket.status].label}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'text-[12px] font-medium',
                        priorityConfig[ticket.priority].className
                      )}
                    >
                      {priorityConfig[ticket.priority].label}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <ChannelIcon className="h-3.5 w-3.5 text-[#86868b]" />
                      <span className="text-[12px] text-[#86868b]">
                        {channelLabels[ticket.channel].label}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-[12px] text-[#86868b]" title={formatDate(ticket.createdAt)}>
                      {timeAgo(ticket.createdAt)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-[12px] text-[#86868b] tabular-nums">
                      {ticket.messages.length}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex-none border-t border-[rgba(255,255,255,0.08)] px-6 py-3 flex items-center justify-between">
        <p className="text-[12px] text-[#86868b]">
          {filteredAndSorted.length} ticket{filteredAndSorted.length !== 1 ? 's' : ''}{' '}
          {activeFilters > 0 && `(${initialTickets.length} au total)`}
        </p>
      </div>
    </div>
  )
}
