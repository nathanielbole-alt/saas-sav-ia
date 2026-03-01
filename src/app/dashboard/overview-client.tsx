'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Inbox,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowRight,
    MessageSquare,
    TrendingUp,
    Activity
} from 'lucide-react'
import type { MockTicket } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

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

export default function OverviewClient({
    tickets,
    userName,
}: {
    tickets: MockTicket[]
    userName?: string | null
}) {
    const router = useRouter()

    const stats = useMemo(() => {
        const unread = tickets.filter(t => t.unread).length
        const urgent = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length
        const open = tickets.filter(t => t.status === 'open').length
        const resolvedToday = tickets.filter(t => {
            if (t.status !== 'resolved') return false
            // In a real app, check resolution date. Here we just fake it for the mock
            return new Date(t.createdAt).getTime() > Date.now() - 86400000
        }).length

        return { unread, urgent, open, resolvedToday }
    }, [tickets])

    const urgentTickets = useMemo(() => {
        return tickets
            .filter(t => t.priority === 'urgent' && t.status !== 'resolved')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)
    }, [tickets])

    const recentUnread = useMemo(() => {
        return tickets
            .filter(t => t.unread)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 4)
    }, [tickets])

    const greeting = useMemo(() => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Bonjour'
        if (hour < 18) return 'Bon après-midi'
        return 'Bonsoir'
    }, [])

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    }

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-10">
            <div className="mx-auto max-w-5xl space-y-10">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2"
                >
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        {greeting}, <span className="text-[#E8856C]">{userName?.split(' ')[0] ?? 'Agent'}</span>
                    </h1>
                    <p className="text-[#86868b] text-base">
                        Voici un résumé de l'activité de votre support client aujourd'hui.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {/* Stat Cards */}
                    <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:border-white/20">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#0a84ff]/10 blur-2xl group-hover:bg-[#0a84ff]/20 transition-all" />
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a84ff]/10 text-[#0a84ff]">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-[#86868b]">Non lus</h3>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white tracking-tight">{stats.unread}</span>
                            {stats.unread > 0 && <span className="text-xs font-medium text-[#0a84ff]">À traiter</span>}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:border-white/20">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#ff453a]/10 blur-2xl group-hover:bg-[#ff453a]/20 transition-all" />
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff453a]/10 text-[#ff453a]">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-[#86868b]">Urgences</h3>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white tracking-tight">{stats.urgent}</span>
                            {stats.urgent > 0 && <span className="text-xs font-medium text-[#ff453a]">Priorité max</span>}
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:border-white/20">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#30d158]/10 blur-2xl group-hover:bg-[#30d158]/20 transition-all" />
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#30d158]/10 text-[#30d158]">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-[#86868b]">Résolus aujourd'hui</h3>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white tracking-tight">{stats.resolvedToday}</span>
                            <span className="text-xs font-medium text-[#30d158] flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +12%</span>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:bg-white/[0.05] hover:border-white/20">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#ffd60a]/10 blur-2xl group-hover:bg-[#ffd60a]/20 transition-all" />
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffd60a]/10 text-[#ffd60a]">
                                <Activity className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-medium text-[#86868b]">Tickets ouverts</h3>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white tracking-tight">{stats.open}</span>
                        </div>
                    </motion.div>
                </motion.div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Action Required Board */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8856C]/10 text-[#E8856C]">
                                    <Inbox className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Récemment reçus</h2>
                            </div>
                            <Link
                                href="/dashboard/inbox"
                                className="text-sm font-medium text-[#86868b] hover:text-white transition-colors flex items-center gap-1"
                            >
                                Voir la boîte <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-white/5 flex-1">
                            {recentUnread.length > 0 ? (
                                recentUnread.map((ticket) => (
                                    <button
                                        key={ticket.id}
                                        onClick={() => router.push(`/dashboard/inbox?ticket=${ticket.id}`)}
                                        className="w-full text-left flex items-start justify-between gap-4 p-5 hover:bg-white/[0.04] transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="h-2 w-2 rounded-full bg-[#0a84ff] shadow-[0_0_8px_rgba(10,132,255,0.8)] flex-none" />
                                                <p className="text-sm font-semibold text-white truncate">{ticket.subject}</p>
                                            </div>
                                            <p className="text-sm text-[#86868b] truncate">{ticket.customer.name}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-[#86868b] whitespace-nowrap flex-none mt-0.5">
                                            <Clock className="h-3 w-3" />
                                            {timeAgo(ticket.createdAt)}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-[#86868b] text-sm">Aucun nouveau message. Vous êtes à jour ! 🎉</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Urgent Board */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden relative"
                    >
                        {/* Subtle red glow for urgent section */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff453a]/5 blur-[80px] pointer-events-none rounded-full" />

                        <div className="flex items-center justify-between border-b border-white/5 p-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff453a]/10 text-[#ff453a]">
                                    <AlertCircle className="h-4 w-4" />
                                </div>
                                <h2 className="text-lg font-semibold text-white">Tickets Urgents</h2>
                            </div>
                        </div>
                        <div className="divide-y divide-white/5 flex-1 relative z-10">
                            {urgentTickets.length > 0 ? (
                                urgentTickets.map((ticket) => (
                                    <button
                                        key={ticket.id}
                                        onClick={() => router.push(`/dashboard/inbox?ticket=${ticket.id}`)}
                                        className="w-full text-left flex items-start justify-between gap-4 p-5 hover:bg-white/[0.04] transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate mb-1">{ticket.subject}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#ff453a]/10 text-[#ff453a] border border-[#ff453a]/20">
                                                    Urgent
                                                </span>
                                                <p className="text-sm text-[#86868b] truncate">{ticket.customer.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-[#86868b] whitespace-nowrap flex-none mt-0.5">
                                            <Clock className="h-3 w-3" />
                                            {timeAgo(ticket.createdAt)}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                                    <div className="h-12 w-12 rounded-full bg-[#30d158]/10 text-[#30d158] flex items-center justify-center mb-3">
                                        <CheckCircle2 className="h-6 w-6" />
                                    </div>
                                    <p className="text-white font-medium">Tout est calme !</p>
                                    <p className="text-[#86868b] text-sm mt-1">Aucun ticket urgent ne requiert votre attention.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Quick Links / Resources */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
                >
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Configurez vos intégrations</h3>
                        <p className="text-sm text-[#86868b] max-w-xl">
                            Connectez Savly à Shopify, Gmail, ou Instagram pour centraliser vos demandes clients et laisser l'IA y répondre.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/settings?tab=integrations"
                        className="flex-none rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition-all hover:bg-zinc-200"
                    >
                        Gérer les intégrations
                    </Link>
                </motion.div>

            </div>
        </div>
    )
}
