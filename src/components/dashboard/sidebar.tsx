'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import {
  Inbox,
  Ticket,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Search,
  CreditCard,
  Bell,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Inbox', href: '/dashboard', icon: Inbox },
  { name: 'Tickets', href: '/dashboard/tickets', icon: Ticket },
  { name: 'Clients', href: '/dashboard/customers', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

function formatNotificationDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const { notifications, unreadCount, markAsRead, isLoading } =
    useRealtimeNotifications()

  const handleOpen = () => {
    setIsOpen((previous) => !previous)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingId(notificationId)
    try {
      const success = await markAsRead(notificationId)
      if (!success) return
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <div className="relative mb-1">
      <button
        type="button"
        onClick={() => {
          handleOpen()
        }}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-white/[0.04]"
      >
        <Bell className="h-[18px] w-[18px] text-[#888] group-hover:text-[#EDEDED] transition-colors" />
        <span className="text-[13px] text-[#888] group-hover:text-[#EDEDED] transition-colors">
          Notifications
        </span>
        {unreadCount > 0 ? (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ff453a] px-1.5 text-[11px] font-medium text-[#0B0B0F]">
            {unreadCount}
          </span>
        ) : (
          <span className="ml-auto text-[11px] text-[#555]">0</span>
        )}
      </button>

      {isOpen ? (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-80 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#131316] p-2 shadow-2xl">
          <div className="mb-2 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-[#888]">
            Alertes
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-[#888]">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-[12px] text-[#888]">
              Aucune notification non lue.
            </p>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg bg-[#1A1A1F] p-3"
                >
                  <p className="text-[13px] font-medium text-[#EDEDED]">
                    {notification.title}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-[#888]">
                    {notification.body}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#555]">
                      {formatNotificationDate(notification.created_at)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard?ticket=${notification.ticket_id}`}
                        className="text-[11px] font-medium text-[#E8856C] hover:text-[#E8856C]/80 transition-colors"
                      >
                        Voir
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          void handleMarkAsRead(notification.id)
                        }}
                        disabled={markingId === notification.id}
                        className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] text-[#888] transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {markingId === notification.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Lu
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export function Sidebar({
  user,
  unreadCount,
}: {
  user: { email: string }
  unreadCount?: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-full w-[260px] flex-col bg-[#131316] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8856C]/20">
            <span className="text-[10px] font-black text-[#E8856C]">S</span>
          </div>
          <div>
            <span className="block text-[14px] font-semibold tracking-tight text-[#EDEDED]">Savly</span>
            <span className="block text-[10px] text-[#555] uppercase tracking-widest">Workspace</span>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 pt-4">
        {navigation.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          const isInbox = item.name === 'Inbox'

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 transition-colors duration-150",
                isActive
                  ? "bg-white/[0.06] text-[#EDEDED]"
                  : "text-[#888] hover:bg-white/[0.02] hover:text-[#EDEDED]"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors duration-150",
                    isActive ? "text-[#E8856C]" : "text-[#888] group-hover:text-[#EDEDED]"
                  )}
                />
                <span className="text-[13px] font-medium">{item.name}</span>
              </div>

              {isInbox && unreadCount && unreadCount > 0 ? (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E8856C] px-1.5 text-[11px] font-medium text-[#0B0B0F]">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3">
        <NotificationBell />

        {/* Search */}
        <button className="group mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-white/[0.04]">
          <Search className="h-[18px] w-[18px] text-[#888] group-hover:text-[#EDEDED] transition-colors" />
          <span className="text-[13px] text-[#888] group-hover:text-[#EDEDED] transition-colors">Rechercher...</span>
          <div className="ml-auto flex items-center gap-0.5 rounded-md bg-white/[0.04] px-1.5 py-0.5">
            <span className="text-[10px] text-[#555]">⌘K</span>
          </div>
        </button>

        {/* Separator */}
        <div className="mx-1 mb-1 h-px bg-white/[0.06]" />

        {/* Profile */}
        <div className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors duration-150 hover:bg-white/[0.02]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8856C]/15">
            <span className="text-[11px] font-semibold text-[#E8856C]">
              {user.email.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-[#EDEDED]">
              {user.email}
            </p>
            <p className="truncate text-[11px] text-[#555]">Pro</p>
          </div>
          <button
            onClick={handleSignOut}
            aria-label="Se déconnecter"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#555] transition-all hover:bg-white/[0.04] hover:text-[#ff453a] opacity-0 group-hover:opacity-100"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
