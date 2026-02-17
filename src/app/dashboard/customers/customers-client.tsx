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

const avatarGradients = [
  'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700',
  'bg-gradient-to-br from-blue-100 to-sky-100 text-blue-700',
  'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700',
  'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700',
  'bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700',
  'bg-gradient-to-br from-cyan-100 to-sky-100 text-cyan-700',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return (
    avatarGradients[Math.abs(hash) % avatarGradients.length] ??
    (avatarGradients[0] as string)
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight">
              Clients
            </h1>
            <p className="mt-1 text-[13px] text-zinc-500">
              {initialCustomers.length} client
              {initialCustomers.length > 1 ? 's' : ''} au total
            </p>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[12px] text-zinc-300 outline-none focus:border-violet-500/30 focus:bg-white/10 transition-all cursor-pointer"
          >
            <option value="last_contact">Dernier contact</option>
            <option value="ticket_count">Nombre de tickets</option>
            <option value="name">Nom</option>
            <option value="email">Email</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-violet-400 transition-colors z-10" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, telephone..."
            className="relative z-10 w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/30 focus:bg-white/10 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {customers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white/5 border border-white/10">
                {search ? (
                  <Search className="h-6 w-6 text-zinc-500" />
                ) : (
                  <Users className="h-6 w-6 text-zinc-500" />
                )}
              </div>
            </div>
            <p className="text-[14px] font-medium text-zinc-300">
              {search ? 'Aucun resultat' : 'Aucun client'}
            </p>
            <p className="text-[12px] text-zinc-500 mt-1">
              {search
                ? 'Essayez une autre recherche'
                : 'Les clients apparaitront ici'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {customers.map((customer) => {
              const displayName = customer.full_name ?? customer.email

              return (
                <div
                  key={customer.id}
                  className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/5 hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold shadow-lg ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110',
                        getAvatarColor(displayName)
                      )}
                    >
                      {getInitials(displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-bold text-white truncate">
                        {displayName}
                      </h3>
                      {customer.full_name && (
                        <p className="text-[12px] text-zinc-500 truncate">
                          {customer.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {!customer.full_name && (
                      <div className="flex items-center gap-2.5 text-[12px]">
                        <Mail className="h-3.5 w-3.5 text-zinc-600" />
                        <span className="text-zinc-400 truncate">
                          {customer.email}
                        </span>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center gap-2.5 text-[12px]">
                        <Phone className="h-3.5 w-3.5 text-zinc-600" />
                        <span className="text-zinc-400">{customer.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 text-[12px]">
                      <Ticket className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-zinc-400">
                        {customer.ticket_count} ticket
                        {customer.ticket_count > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[12px]">
                      <Clock className="h-3.5 w-3.5 text-zinc-600" />
                      <span className="text-zinc-400">
                        {customer.last_contact
                          ? `Dernier contact ${timeAgo(customer.last_contact)}`
                          : 'Aucun ticket'}
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
