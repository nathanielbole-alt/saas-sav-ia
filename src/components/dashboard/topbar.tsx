'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { useState } from 'react'
import {
    Inbox,
    Ticket,
    Users,
    BarChart2,
    Settings,
    CreditCard,
    Bell,
    Search,
    Check,
    Loader2,
    LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainNav = [
    { name: 'Accueil', href: '/dashboard' },
    { name: 'Inbox', href: '/dashboard/inbox' },
    { name: 'Tickets', href: '/dashboard/tickets' },
    { name: 'Clients', href: '/dashboard/customers' },
    { name: 'Automations', href: '/dashboard/automations' },
    { name: 'Analytics', href: '/dashboard/analytics' },
    { name: 'Billing', href: '/dashboard/billing' },
    { name: 'Settings', href: '/dashboard/settings' },
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

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#86868b] transition-colors hover:bg-white/10 hover:text-white"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-[#ff453a] shadow-[0_0_8px_rgba(255,69,58,0.8)]" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-4 w-80 max-h-96 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-2xl backdrop-blur-3xl z-50">
                    <div className="mb-2 px-3 py-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                            Notifications
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-white/50">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="px-2 py-6 text-center text-[12px] text-white/50">
                            Aucune notification non lue.
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="rounded-2xl bg-white/5 p-3 hover:bg-white/10 transition-colors"
                                >
                                    <p className="text-[13px] font-semibold text-white shadow-sm">
                                        {notification.title}
                                    </p>
                                    <p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-[#86868b]">
                                        {notification.body}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-white/40">
                                            {formatNotificationDate(notification.created_at)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/dashboard?ticket=${notification.ticket_id}`}
                                                className="text-[11px] font-medium text-[#0a84ff] hover:text-[#409cff] transition-colors"
                                            >
                                                Voir
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setMarkingId(notification.id)
                                                    markAsRead(notification.id).finally(() => setMarkingId(null))
                                                }}
                                                disabled={markingId === notification.id}
                                                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-white/20"
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
            )}
        </div>
    )
}

export function Topbar({ user, unreadCount }: { user: { email: string }, unreadCount?: number }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="relative z-50 w-full max-w-[1100px] grid grid-cols-[1fr_auto_1fr] items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 shadow-2xl backdrop-blur-3xl transition-all duration-300">
            {/* Left: Logo */}
            <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-[14px] font-bold text-white shadow-sm">S</span>
                </Link>
            </div>

            {/* Center: Main Navigation — always perfectly centered */}
            <nav className="hidden items-center space-x-1 md:flex bg-black/20 rounded-full p-1 border border-white/5 shadow-inner">
                {mainNav.map((item) => {
                    const isActive =
                        item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href)
                    const isInbox = item.name === 'Inbox' || item.name === 'Accueil'

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "relative flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300",
                                isActive
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-[#86868b] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {item.name}
                            {isInbox && unreadCount && unreadCount > 0 ? (
                                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0a84ff] px-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(10,132,255,0.5)]">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </Link>
                    )
                })}
            </nav>

            {/* Right: Actions & Profile */}
            <div className="flex items-center justify-end gap-2">
                {/* Search Trigger */}
                <button className="hidden h-10 w-10 items-center justify-center rounded-full bg-transparent text-[#86868b] transition-colors hover:bg-white/10 hover:text-white md:flex">
                    <Search className="h-4 w-4" />
                </button>

                <NotificationBell />

                <div className="h-4 w-px bg-white/10 mx-1 hidden md:block" />

                <button
                    onClick={handleSignOut}
                    className="group flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/5 transition-all hover:bg-white/10"
                    title={user.email}
                >
                    <span className="text-[12px] font-semibold text-white group-hover:hidden">
                        {user.email.slice(0, 2).toUpperCase()}
                    </span>
                    <LogOut className="hidden h-4 w-4 text-[#ff453a] group-hover:block drop-shadow-[0_0_8px_rgba(255,69,58,0.5)]" />
                </button>
            </div>

            {/* Mobile Navigation Scroll */}
            <div className="absolute left-0 right-0 top-full mt-2 flex md:hidden overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl scrollbar-hide">
                {mainNav.map((item) => {
                    const isActive =
                        item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-[#86868b] hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {item.name}
                        </Link>
                    )
                })}
            </div>
        </header>
    )
}
