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
  open: { label: 'Ouvert', className: 'bg-[#30d158]/15 text-[#30d158] border border-[#30d158]/20 shadow-[0_0_8px_rgba(48,209,88,0.15)]' },
  pending: { label: 'En attente', className: 'bg-[#ffd60a]/15 text-[#ffd60a] border border-[#ffd60a]/20 shadow-[0_0_8px_rgba(255,214,10,0.15)]' },
  resolved: { label: 'Résolu', className: 'bg-[#0a84ff]/15 text-[#0a84ff] border border-[#0a84ff]/20 shadow-[0_0_8px_rgba(10,132,255,0.15)]' },
  closed: { label: 'Fermé', className: 'bg-white/5 text-[#86868b] border border-white/5' },
}

const priorityConfig: Record<MockTicket['priority'], { label: string; className: string; dot: string; order: number }> = {
  urgent: { label: 'Urgent', className: 'text-[#ff453a] font-semibold', dot: 'bg-[#ff453a] shadow-[0_0_6px_rgba(255,69,58,0.7)]', order: 0 },
  high: { label: 'Haute', className: 'text-[#ff9f0a] font-semibold', dot: 'bg-[#ff9f0a] shadow-[0_0_6px_rgba(255,159,10,0.7)]', order: 1 },
  medium: { label: 'Moyenne', className: 'text-[#ffd60a]', dot: 'bg-[#ffd60a] shadow-[0_0_6px_rgba(255,214,10,0.5)]', order: 2 },
  low: { label: 'Basse', className: 'text-[#86868b]', dot: 'bg-[#86868b]', order: 3 },
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
      return <ArrowUpDown className="h-3 w-3 opacity-25" />
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
    <div className="flex h-full flex-col overflow-hidden mt-2 mb-4 mx-4 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="flex-none border-b border-white/5 p-6 pb-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[22px] font-semibold text-white tracking-tight shadow-sm">Tickets</h1>
            <p className="text-[13px] text-[#86868b] mt-0.5">
              Gérez et suivez tous les tickets de support
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-2.5">
            {([
              { label: 'Total', value: stats.total, color: 'text-white', bg: 'bg-white/5 border-white/10' },
              { label: 'Ouverts', value: stats.open, color: 'text-[#30d158]', bg: 'bg-[#30d158]/10 border-[#30d158]/15 shadow-[0_0_10px_rgba(48,209,88,0.1)]' },
              { label: 'En attente', value: stats.pending, color: 'text-[#ffd60a]', bg: 'bg-[#ffd60a]/10 border-[#ffd60a]/15 shadow-[0_0_10px_rgba(255,214,10,0.1)]' },
              { label: 'Résolus', value: stats.resolved, color: 'text-[#0a84ff]', bg: 'bg-[#0a84ff]/10 border-[#0a84ff]/15 shadow-[0_0_10px_rgba(10,132,255,0.1)]' },
            ] as const).map((s) => (
              <div
                key={s.label}
                className={cn('flex items-center gap-2 rounded-full border px-3.5 py-1.5', s.bg)}
              >
                <span className={cn('text-[14px] font-bold tabular-nums', s.color)}>{s.value}</span>
                <span className="text-[11px] font-medium text-[#86868b]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filter toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#48484a]" />
            <input
              type="text"
              placeholder="Rechercher un ticket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-white/5 border border-white/5 py-2.5 pl-10 pr-4 text-[13px] text-white placeholder-[#48484a] transition-all focus:outline-none focus:ring-1 focus:ring-[#0a84ff]/40 focus:border-[#0a84ff]/30"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13px] font-medium transition-all duration-150',
              showFilters || activeFilters > 0
                ? 'bg-[#0a84ff]/15 border-[#0a84ff]/30 text-[#0a84ff] shadow-[0_0_12px_rgba(10,132,255,0.2)]'
                : 'bg-white/5 border-white/5 text-[#86868b] hover:text-white hover:bg-white/10'
            )}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFilters > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a84ff] text-[10px] font-bold text-white shadow-[0_0_8px_rgba(10,132,255,0.5)]">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="mt-4 flex items-center gap-3 animate-in slide-in-from-top-1 duration-200">
            {[
              {
                value: statusFilter,
                onChange: (v: string) => setStatusFilter(v as StatusFilter),
                options: [
                  { value: 'all', label: 'Tous les statuts' },
                  { value: 'open', label: 'Ouvert' },
                  { value: 'pending', label: 'En attente' },
                  { value: 'resolved', label: 'Résolu' },
                  { value: 'closed', label: 'Fermé' },
                ],
              },
              {
                value: priorityFilter,
                onChange: (v: string) => setPriorityFilter(v as PriorityFilter),
                options: [
                  { value: 'all', label: 'Toutes les priorités' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'Haute' },
                  { value: 'medium', label: 'Moyenne' },
                  { value: 'low', label: 'Basse' },
                ],
              },
              {
                value: channelFilter,
                onChange: (v: string) => setChannelFilter(v as ChannelFilter),
                options: [
                  { value: 'all', label: 'Tous les canaux' },
                  { value: 'email', label: 'Email' },
                  { value: 'form', label: 'Formulaire' },
                  { value: 'google_review', label: 'Avis Google' },
                  { value: 'manual', label: 'Manuel' },
                ],
              },
            ].map((filter, i) => (
              <div key={i} className="relative">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="appearance-none rounded-full bg-white/5 border border-white/10 px-4 py-2 pr-8 text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-[#0a84ff]/40"
                >
                  {filter.options.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-[#1c1c1e]">{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868b]" />
              </div>
            ))}

            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setPriorityFilter('all')
                  setChannelFilter('all')
                }}
                className="text-[12px] font-medium text-[#86868b] hover:text-[#0a84ff] transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-white/5 bg-black/40 backdrop-blur-xl">
              {([
                { field: 'subject' as SortField, label: 'Sujet', width: 'w-[30%]' },
                { field: 'customer' as SortField, label: 'Client', width: 'w-[18%]' },
                { field: 'status' as SortField, label: 'Statut', width: 'w-[12%]' },
                { field: 'priority' as SortField, label: 'Priorité', width: 'w-[11%]' },
              ] as const).map((col) => (
                <th
                  key={col.field}
                  className={cn(
                    'px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-[#86868b]',
                    col.width
                  )}
                >
                  <button
                    onClick={() => handleSort(col.field)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    {col.label}
                    <SortIcon field={col.field} />
                  </button>
                </th>
              ))}
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-[#86868b] w-[12%]">
                Canal
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-[#86868b] w-[9%]">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  Date
                  <SortIcon field="createdAt" />
                </button>
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-[#86868b] w-[8%]">
                Msgs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {filteredAndSorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Search className="h-5 w-5 text-[#86868b]" />
                    </div>
                    <p className="text-[14px] font-medium text-white">Aucun ticket trouvé</p>
                    <p className="text-[13px] text-[#86868b]">Essayez de modifier vos filtres</p>
                  </div>
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
                    'group cursor-pointer transition-all duration-150 hover:bg-white/[0.04]',
                    ticket.unread && 'bg-[#0a84ff]/[0.03]'
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {ticket.unread && (
                        <span className="flex-none h-2 w-2 rounded-full bg-[#0a84ff] shadow-[0_0_6px_rgba(10,132,255,0.7)]" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'truncate text-[13px]',
                            ticket.unread
                              ? 'font-semibold text-white'
                              : 'font-medium text-[#d1d1d6]'
                          )}
                        >
                          {ticket.subject}
                        </p>
                        {ticket.tags.length > 0 && (
                          <div className="mt-1.5 flex gap-1.5">
                            {ticket.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-block rounded-full bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-[#86868b]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="truncate text-[13px] font-medium text-[#d1d1d6]">{ticket.customer.name}</p>
                    <p className="truncate text-[11px] text-[#86868b] mt-0.5">{ticket.customer.email}</p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                        statusConfig[ticket.status].className
                      )}
                    >
                      {statusConfig[ticket.status].label}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-1.5 w-1.5 rounded-full flex-none', priorityConfig[ticket.priority].dot)} />
                      <span className={cn('text-[12px]', priorityConfig[ticket.priority].className)}>
                        {priorityConfig[ticket.priority].label}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <ChannelIcon className="h-3.5 w-3.5 text-[#86868b]" />
                      <span className="text-[12px] text-[#86868b]">
                        {channelLabels[ticket.channel].label}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-[12px] text-[#86868b]" title={formatDate(ticket.createdAt)}>
                      {timeAgo(ticket.createdAt)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
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
      <div className="flex-none border-t border-white/5 px-6 py-3 flex items-center justify-between bg-black/20 backdrop-blur-xl">
        <p className="text-[12px] text-[#86868b]">
          <span className="font-semibold text-white">{filteredAndSorted.length}</span> ticket{filteredAndSorted.length !== 1 ? 's' : ''}{' '}
          {activeFilters > 0 && <span className="text-[#86868b]">({initialTickets.length} au total)</span>}
        </p>
      </div>
    </div>
  )
}
