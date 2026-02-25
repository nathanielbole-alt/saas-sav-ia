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

const avatarColors = [
  'bg-[#0a84ff]/15 text-[#0a84ff]',
  'bg-[#30d158]/15 text-[#30d158]',
  'bg-[#ff9f0a]/15 text-[#ff9f0a]',
  'bg-[#ff453a]/15 text-[#ff453a]',
  'bg-[#bf5af2]/15 text-[#bf5af2]',
  'bg-[#64d2ff]/15 text-[#64d2ff]',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length] ?? avatarColors[0] as string
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
  urgent: { style: 'bg-[#ff453a]/10 text-[#ff453a]', icon: ArrowUp },
  high: { style: 'bg-[#ff9f0a]/10 text-[#ff9f0a]', icon: ArrowUp },
  medium: { style: 'bg-[#ffd60a]/10 text-[#ffd60a]' },
  low: { style: 'bg-white/[0.04] text-[#888]', icon: ArrowDown },
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
    <div className="flex h-full w-[380px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0B0B0F]">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[20px] font-semibold text-[#EDEDED] tracking-tight">
            Inbox
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/[0.06] text-[#888] hover:text-[#EDEDED] transition-colors duration-150">
              <Filter className="h-4 w-4" />
            </button>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-white/[0.06] px-2 text-[11px] font-medium text-[#888]">
              {tickets.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="w-full rounded-lg bg-[#131316] border border-white/[0.06] py-2 pl-10 pr-4 text-[13px] text-[#EDEDED] outline-none placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50 transition-all duration-150"
          />
        </div>

        {/* Segmented Control */}
        <div className="flex rounded-lg bg-[#131316] p-0.5 border border-white/[0.06]">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-[12px] font-medium transition-all duration-150",
                filter === f.value
                  ? "bg-white/[0.06] text-[#EDEDED] shadow-sm"
                  : "text-[#888] hover:text-[#EDEDED]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {tickets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#131316] border border-white/[0.06] mb-4">
              <Inbox className="h-6 w-6 text-[#555]" />
            </div>
            <p className="text-[14px] font-medium text-[#888]">Tout est calme</p>
            <p className="text-[12px] text-[#555] mt-1">Aucun ticket à traiter.</p>
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
                  "group w-full rounded-xl p-3.5 text-left transition-colors duration-150",
                  isSelected
                    ? "bg-[#131316] border border-white/[0.06]"
                    : "border border-transparent hover:bg-white/[0.04]"
                )}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold",
                        getAvatarColor(ticket.customer.name)
                      )}
                    >
                      {getInitials(ticket.customer.name)}
                    </div>
                    {ticket.unread && (
                      <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#E8856C] ring-2 ring-[#0B0B0F]" />
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#0B0B0F] ring-1 ring-white/[0.08]">
                      <ChannelIcon className="h-2 w-2 text-[#888]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className={cn(
                          "truncate text-[13px]",
                          ticket.unread || isSelected
                            ? "font-semibold text-[#EDEDED]"
                            : "font-medium text-[#888]"
                        )}
                      >
                        {ticket.customer.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#555]">
                        {timeAgo(lastMsg?.createdAt ?? ticket.createdAt)}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "truncate text-[12px] mb-1",
                        ticket.unread ? "font-medium text-[#EDEDED]" : "text-[#888]"
                      )}
                    >
                      {ticket.subject}
                    </p>

                    <p className="truncate text-[11px] text-[#555]">
                      {lastMsg?.body.replace(/\n/g, ' ').slice(0, 55)}...
                    </p>

                    {/* Meta row */}
                    <div className="mt-2 flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          priorityConfig[ticket.priority].style
                        )}
                      >
                        {PriorityIcon && <PriorityIcon className="h-2.5 w-2.5" />}
                        {ticket.priority}
                      </span>

                      {ticket.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-[#555]"
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
