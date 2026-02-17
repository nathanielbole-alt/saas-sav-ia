'use client'

import { Search, Mail, FileText, Star, Pen, Filter, ArrowUp, ArrowDown, Inbox } from 'lucide-react'
import type { MockTicket } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "à l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}j`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const avatarGradients = [
  'bg-violet-500/15 text-violet-400',
  'bg-blue-500/15 text-blue-400',
  'bg-emerald-500/15 text-emerald-400',
  'bg-amber-500/15 text-amber-400',
  'bg-rose-500/15 text-rose-400',
  'bg-cyan-500/15 text-cyan-400',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length] ?? avatarGradients[0] as string
}

const channelIcons: Record<MockTicket['channel'], typeof Mail> = {
  email: Mail,
  form: FileText,
  google_review: Star,
  manual: Pen,
  instagram: Mail,
  messenger: Mail,
}

const priorityConfig: Record<MockTicket['priority'], { style: string; icon?: React.ComponentType<{ className?: string }> }> = {
  urgent: { style: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20', icon: ArrowUp },
  high: { style: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20', icon: ArrowUp },
  medium: { style: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' },
  low: { style: 'bg-zinc-500/10 text-zinc-500 ring-1 ring-zinc-500/20', icon: ArrowDown },
}

// ── Filters ─────────────────────────────────────────────────────────────────

export type TicketFilter = 'all' | 'unread' | 'mine'

const filters: { value: TicketFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'unread', label: 'Non lus' },
  { value: 'mine', label: 'Assignés' },
]

// ── Component ───────────────────────────────────────────────────────────────

export function TicketList({
  tickets,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: {
  tickets: MockTicket[]
  selectedId: string | null
  onSelect: (id: string) => void
  filter: TicketFilter
  onFilterChange: (f: TicketFilter) => void
  search: string
  onSearchChange: (q: string) => void
}) {
  return (
    <div className="flex h-full w-[380px] shrink-0 flex-col border-r border-white/[0.06]">
      {/* Header */}
      <div className="shrink-0 px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Inbox
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/[0.04] text-zinc-600 hover:text-zinc-400 transition-all duration-200">
              <Filter className="h-4 w-4" />
            </button>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-white/[0.04] px-2 font-mono text-[11px] font-bold text-zinc-500 border border-white/[0.06]">
              {tickets.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 transition-colors" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5 pl-10 pr-4 font-mono text-[13px] text-zinc-200 outline-none placeholder:text-zinc-700 focus:border-[#8b5cf6]/30 focus:bg-white/[0.04] transition-all duration-200"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={cn(
                "flex-1 rounded-md py-1.5 font-mono text-[11px] font-medium transition-all duration-200",
                filter === f.value
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {tickets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] mb-4">
              <Inbox className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="text-[13px] font-medium text-zinc-400">Tout est calme</p>
            <p className="font-mono text-[11px] text-zinc-600 mt-1">Aucun ticket à traiter.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const lastMsg = ticket.messages[ticket.messages.length - 1]
            const ChannelIcon = channelIcons[ticket.channel]
            const isSelected = ticket.id === selectedId
            const PriorityIcon = priorityConfig[ticket.priority].icon

            return (
              <button
                key={ticket.id}
                onClick={() => onSelect(ticket.id)}
                className={cn(
                  "group relative w-full rounded-lg p-3.5 text-left transition-all duration-200 border",
                  isSelected
                    ? "bg-white/[0.06] border-white/[0.1]"
                    : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]"
                )}
              >
                {/* Active indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-0.5 rounded-full bg-[#8b5cf6] shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                )}

                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[11px] font-bold transition-all duration-200",
                        getAvatarColor(ticket.customer.name)
                      )}
                    >
                      {getInitials(ticket.customer.name)}
                    </div>
                    {ticket.unread && (
                      <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#8b5cf6] ring-2 ring-[#0c0c10]" />
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded bg-[#0c0c10] ring-1 ring-white/[0.06]">
                      <ChannelIcon className="h-2 w-2 text-zinc-500" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={cn(
                          "truncate text-[13px]",
                          ticket.unread || isSelected
                            ? "font-semibold text-white"
                            : "font-medium text-zinc-400"
                        )}
                      >
                        {ticket.customer.name}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-600">
                        {timeAgo(lastMsg?.createdAt ?? ticket.createdAt)}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "truncate text-[12px] mb-1",
                        ticket.unread ? "font-medium text-zinc-300" : "text-zinc-500"
                      )}
                    >
                      {ticket.subject}
                    </p>

                    <p className="truncate font-mono text-[11px] text-zinc-700">
                      {lastMsg?.body.replace(/\n/g, ' ').slice(0, 55)}...
                    </p>

                    {/* Meta row */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                          priorityConfig[ticket.priority].style
                        )}
                      >
                        {PriorityIcon && <PriorityIcon className="h-2.5 w-2.5" />}
                        {ticket.priority}
                      </span>

                      {ticket.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 border border-white/[0.06]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
