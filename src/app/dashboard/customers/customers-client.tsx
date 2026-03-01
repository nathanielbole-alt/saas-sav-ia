'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Mail,
  Phone,
  Ticket,
  Clock,
  Users,
} from 'lucide-react'
import type { CustomerWithStats } from '@/lib/actions/customers'
import { cn } from '@/lib/utils'

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  'bg-[#E8856C]/15 text-[#E8856C]',
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
  return (
    avatarColors[Math.abs(hash) % avatarColors.length] ??
    (avatarColors[0] as string)
  )
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  )
  if (seconds < 60) return "A l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}j`
}

type SortKey = 'name' | 'email' | 'ticket_count' | 'last_contact'

export default function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: CustomerWithStats[]
}) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('last_contact')

  const customers = useMemo(() => {
    let filtered = initialCustomers

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
      )
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name ?? a.email).localeCompare(
            b.full_name ?? b.email
          )
        case 'email':
          return a.email.localeCompare(b.email)
        case 'ticket_count':
          return b.ticket_count - a.ticket_count
        case 'last_contact':
        default:
          if (!a.last_contact) return 1
          if (!b.last_contact) return -1
          return (
            new Date(b.last_contact).getTime() -
            new Date(a.last_contact).getTime()
          )
      }
    })
  }, [initialCustomers, search, sortBy])

  return (
    <div className="flex h-full flex-col overflow-hidden mt-2 mb-4 mx-4 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-white tracking-tight shadow-sm">
              Clients
            </h1>
            <p className="mt-1 text-[13px] text-[#86868b]">
              {initialCustomers.length} client
              {initialCustomers.length > 1 ? 's' : ''} au total
            </p>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-full bg-black/20 border border-white/5 px-4 py-2 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#0a84ff]/50 transition-all cursor-pointer shadow-inner appearance-none pr-8 relative bg-no-repeat bg-[right_12px_center] bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2386868b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]"
          >
            <option value="last_contact">Dernier contact</option>
            <option value="ticket_count">Nombre de tickets</option>
            <option value="name">Nom</option>
            <option value="email">Email</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="w-full rounded-2xl bg-black/20 border border-white/5 py-3 pl-11 pr-4 text-[14px] text-white outline-none placeholder:text-[#86868b] focus:ring-1 focus:ring-[#0a84ff]/50 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        {customers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 shadow-sm mb-5">
              {search ? (
                <Search className="h-6 w-6 text-[#86868b]" />
              ) : (
                <Users className="h-6 w-6 text-[#86868b]" />
              )}
            </div>
            <h3 className="text-[17px] font-semibold text-white tracking-tight shadow-sm">
              {search ? 'Aucun résultat' : 'Aucun client'}
            </h3>
            <p className="text-[13px] text-[#86868b] mt-1">
              {search
                ? 'Essayez une autre recherche'
                : 'Les clients apparaitront ici'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {customers.map((customer) => {
              const displayName = customer.full_name ?? customer.email

              return (
                <div
                  key={customer.id}
                  className="rounded-3xl bg-white/[0.03] border border-white/5 p-6 shadow-xl hover:bg-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold shadow-inner border border-white/5',
                        getAvatarColor(displayName)
                      )}
                    >
                      {getInitials(displayName)}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <h3 className="text-[15px] font-semibold text-white truncate shadow-sm">
                        {displayName}
                      </h3>
                      {customer.full_name && (
                        <p className="text-[13px] text-[#86868b] truncate mt-0.5">
                          {customer.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-2xl bg-black/20 border border-white/5 shadow-inner">
                    {!customer.full_name && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/5">
                          <Mail className="h-3.5 w-3.5 text-[#86868b] group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[#86868b] font-medium truncate">
                          {customer.email}
                        </span>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center gap-3 text-[13px]">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/5">
                          <Phone className="h-3.5 w-3.5 text-[#86868b] group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[#86868b] font-medium">{customer.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[13px]">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0a84ff]/10 border border-[#0a84ff]/20">
                        <Ticket className="h-3.5 w-3.5 text-[#0a84ff]" />
                      </div>
                      <span className="text-white font-medium">
                        {customer.ticket_count} ticket{customer.ticket_count > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[13px]">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 border border-white/5">
                        <Clock className="h-3.5 w-3.5 text-[#86868b] group-hover:text-[#ff9f0a] transition-colors" />
                      </div>
                      <span className="text-[#86868b] font-medium">
                        {customer.last_contact
                          ? `Il y a ${timeAgo(customer.last_contact)}`
                          : 'Aucun contact'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
