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
    <div className="h-full flex flex-col overflow-hidden bg-[#0B0B0F]">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-6 border-b border-[white/[0.06]]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-[#EDEDED] tracking-tight">
              Clients
            </h1>
            <p className="mt-1 text-[13px] text-[#888]">
              {initialCustomers.length} client
              {initialCustomers.length > 1 ? 's' : ''} au total
            </p>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg bg-[#1A1A1F] px-3 py-2 text-[13px] text-[#EDEDED] outline-none focus:ring-1 focus:ring-[#E8856C]/50 transition-all cursor-pointer"
          >
            <option value="last_contact">Dernier contact</option>
            <option value="ticket_count">Nombre de tickets</option>
            <option value="name">Nom</option>
            <option value="email">Email</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, telephone..."
            className="w-full rounded-lg bg-[#1A1A1F] py-3 pl-11 pr-4 text-[13px] text-[#EDEDED] outline-none placeholder:text-[#555] focus:ring-1 focus:ring-[#E8856C]/50 transition-all"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {customers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131316] mb-4">
              {search ? (
                <Search className="h-6 w-6 text-[#555]" />
              ) : (
                <Users className="h-6 w-6 text-[#555]" />
              )}
            </div>
            <p className="text-[14px] font-medium text-[#EDEDED]">
              {search ? 'Aucun resultat' : 'Aucun client'}
            </p>
            <p className="text-[12px] text-[#888] mt-1">
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
                  className="rounded-2xl bg-[#131316] p-5 hover:bg-[#1A1A1F] transition-colors duration-150"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold',
                        getAvatarColor(displayName)
                      )}
                    >
                      {getInitials(displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-semibold text-[#EDEDED] truncate">
                        {displayName}
                      </h3>
                      {customer.full_name && (
                        <p className="text-[12px] text-[#888] truncate">
                          {customer.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {!customer.full_name && (
                      <div className="flex items-center gap-2.5 text-[12px]">
                        <Mail className="h-3.5 w-3.5 text-[#555]" />
                        <span className="text-[#888] truncate">
                          {customer.email}
                        </span>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center gap-2.5 text-[12px]">
                        <Phone className="h-3.5 w-3.5 text-[#555]" />
                        <span className="text-[#888]">{customer.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 text-[12px]">
                      <Ticket className="h-3.5 w-3.5 text-[#555]" />
                      <span className="text-[#888]">
                        {customer.ticket_count} ticket
                        {customer.ticket_count > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[12px]">
                      <Clock className="h-3.5 w-3.5 text-[#555]" />
                      <span className="text-[#888]">
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
