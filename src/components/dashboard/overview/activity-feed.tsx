'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, type LucideIcon } from 'lucide-react'
import type { TicketWithRelations } from '@/types/view-models'
import { getCustomerName, timeAgo } from '@/lib/utils'

type ActivityFeedProps = {
  title: string
  icon: LucideIcon
  iconClassName: string
  tickets: TicketWithRelations[]
  variant: 'recent' | 'urgent'
  delay?: number
  linkHref?: string
  linkLabel?: string
  emptyTitle: string
  emptyDescription: string
  onSelect: (ticketId: string) => void
}

export function ActivityFeed({
  title,
  icon: Icon,
  iconClassName,
  tickets,
  variant,
  delay = 0,
  linkHref,
  linkLabel,
  emptyTitle,
  emptyDescription,
  onSelect,
}: ActivityFeedProps) {
  const isUrgent = variant === 'urgent'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
    >
      {isUrgent ? (
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#ff453a]/5 blur-[80px]" />
      ) : null}
      <div className="relative z-10 flex items-center justify-between border-b border-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClassName}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        {linkHref && linkLabel ? (
          <Link
            href={linkHref}
            className="flex items-center gap-1 text-sm font-medium text-[#86868b] transition-colors hover:text-white"
          >
            {linkLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="relative z-10 flex-1 divide-y divide-white/5">
        {tickets.length > 0 ? (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onSelect(ticket.id)}
              className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.04]"
            >
              <div className="min-w-0 flex-1">
                {isUrgent ? (
                  <>
                    <p className="mb-1 truncate text-sm font-semibold text-white">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="rounded border border-[#ff453a]/20 bg-[#ff453a]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff453a]">
                        Urgent
                      </span>
                      <p className="truncate text-sm text-[#86868b]">{getCustomerName(ticket.customer)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="h-2 w-2 flex-none rounded-full bg-[#0a84ff] shadow-[0_0_8px_rgba(10,132,255,0.8)]" />
                      <p className="truncate text-sm font-semibold text-white">{ticket.subject}</p>
                    </div>
                    <p className="truncate text-sm text-[#86868b]">{getCustomerName(ticket.customer)}</p>
                  </>
                )}
              </div>
              <div className="mt-0.5 flex flex-none items-center gap-1.5 whitespace-nowrap text-xs text-[#86868b]">
                <Clock className="h-3 w-3" />
                {timeAgo(ticket.created_at)}
              </div>
            </button>
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <p className="font-medium text-white">{emptyTitle}</p>
            <p className="mt-1 text-sm text-[#86868b]">{emptyDescription}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
