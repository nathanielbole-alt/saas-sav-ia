'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  TrendingDown,
  Inbox,
  CheckCircle2,
  Clock,
  Users,
  Mail,
  FileText,
  Star,
  Pen,
  BarChart2,
  Instagram,
  MessageCircle,
  Timer,
  Bot,
  ThumbsUp,
  Activity,
  RotateCcw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AnalyticsData } from '@/lib/actions/analytics'
import { cn } from '@/lib/utils'

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  trend,
  trendValue,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.04] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl ring-1',
            iconColor ?? 'bg-violet-500/10 ring-violet-500/20'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              iconColor
                ? iconColor.includes('emerald')
                  ? 'text-emerald-400'
                  : iconColor.includes('amber')
                    ? 'text-amber-400'
                    : iconColor.includes('blue')
                      ? 'text-blue-400'
                      : 'text-violet-400'
                : 'text-violet-400'
            )}
          />
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold',
              trend === 'up'
                ? 'bg-emerald-500/10 text-emerald-400'
                : trend === 'down'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-zinc-500/10 text-zinc-400'
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-[12px] font-medium text-zinc-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    </div>
  )
}

// ── Area Chart (Trends) ─────────────────────────────────────────────────────

function AreaChart({
  data,
  title,
}: {
  data: { date: string; count: number }[]
  title: string
}) {
  const height = 200
  const width = 600
  const padding = 20

  const max = Math.max(...data.map((d) => d.count), 5) // Min max of 5

  // Points generation
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.count / max) * (height - padding) // Leave some padding
    return `${x},${y}`
  }).join(' ')

  const fillPath = `M 0,${height} ${points} L ${width},${height} Z`
  const strokePath = `M ${points.split(' ')[0]} ${points}`

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5 col-span-1 lg:col-span-3">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold text-white">{title}</h3>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-violet-500"></span>
          Derniers 30 jours
        </div>
      </div>

      <div className="relative h-[200px] w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={tick}
              x1="0"
              y1={height - tick * (height - padding)}
              x2={width}
              y2={height - tick * (height - padding)}
              stroke="white"
              strokeOpacity="0.05"
              strokeDasharray="4 4"
            />
          ))}

          <path d={fillPath} fill="url(#chartGradient)" />
          <path
            d={strokePath}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Tooltip-like overlay (simplified) */}
        <div className="absolute top-0 right-0 p-2 text-right pointer-events-none">
          <p className="text-[24px] font-bold text-violet-300">
            {data.reduce((acc, curr) => acc + curr.count, 0)}
          </p>
          <p className="text-[11px] text-zinc-500">Total période</p>
        </div>
      </div>
    </div>
  )
}

// ── Bar Chart ───────────────────────────────────────────────────────────────

function BarChart({
  data,
  title,
}: {
  data: { label: string; value: number; color: string; icon?: React.ElementType }[]
  title: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
      <h3 className="text-[14px] font-bold text-white mb-6">{title}</h3>
      <div className="space-y-4">
        {data.map((item) => {
          const pct = (item.value / max) * 100
          const Icon = item.icon

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="h-3.5 w-3.5 text-zinc-500" />}
                  <span className="text-[12px] font-medium text-zinc-400">
                    {item.label}
                  </span>
                </div>
                <span className="text-[13px] font-bold text-white tabular-nums">
                  {item.value}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    item.color
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Donut / Ring Chart ──────────────────────────────────────────────────────

function RingChart({
  data,
  title,
}: {
  data: { label: string; value: number; color: string; textColor: string }[]
  title: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
      <h3 className="text-[14px] font-bold text-white mb-6">{title}</h3>

      {/* Stacked bar */}
      <div className="h-3 rounded-full bg-white/5 overflow-hidden flex mb-6">
        {data.map((item) => (
          <div
            key={item.label}
            className={cn('h-full first:rounded-l-full last:rounded-r-full', item.color)}
            style={{ width: `${(item.value / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
            <span className="text-[12px] text-zinc-400">{item.label}</span>
            <span
              className={cn(
                'ml-auto text-[12px] font-bold tabular-nums',
                item.textColor
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function AnalyticsClient({
  analytics,
}: {
  analytics: AnalyticsData | null
}) {
  const router = useRouter()
  const supabase = createClient()

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  if (!analytics) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <BarChart2 className="h-7 w-7 text-zinc-500" />
          </div>
          <p className="text-[14px] font-medium text-zinc-300">
            Impossible de charger les analytics
          </p>
          <p className="text-[12px] text-zinc-500 mt-1">
            Vérifiez votre connexion
          </p>
        </div>
      </div>
    )
  }

  const { thisMonth, lastMonth } = analytics.recentTrend
  const trendDir =
    thisMonth > lastMonth ? 'up' : thisMonth < lastMonth ? 'down' : 'neutral'
  const trendPct =
    lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : thisMonth > 0
        ? 100
        : 0

  // Format response time
  const formatResponseTime = (minutes: number): string => {
    if (minutes < 1) return '< 1 min'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    const days = Math.floor(hours / 24)
    const remainHours = hours % 24
    return remainHours > 0 ? `${days}j ${remainHours}h` : `${days}j`
  }

  const channelData = [
    { label: 'Email', value: analytics.ticketsByChannel.email, color: 'bg-blue-500', icon: Mail },
    { label: 'Formulaire', value: analytics.ticketsByChannel.form, color: 'bg-emerald-500', icon: FileText },
    { label: 'Instagram', value: analytics.ticketsByChannel.instagram, color: 'bg-fuchsia-500', icon: Instagram },
    { label: 'Messenger', value: analytics.ticketsByChannel.messenger, color: 'bg-sky-500', icon: MessageCircle },
    { label: 'Avis Google', value: analytics.ticketsByChannel.google_review, color: 'bg-amber-500', icon: Star },
    { label: 'Manuel', value: analytics.ticketsByChannel.manual, color: 'bg-violet-500', icon: Pen },
  ].sort((a, b) => b.value - a.value) // Sort by volume

  const priorityData = [
    { label: 'Urgent', value: analytics.ticketsByPriority.urgent, color: 'bg-red-500' },
    { label: 'Haute', value: analytics.ticketsByPriority.high, color: 'bg-orange-500' },
    { label: 'Moyenne', value: analytics.ticketsByPriority.medium, color: 'bg-amber-500' },
    { label: 'Basse', value: analytics.ticketsByPriority.low, color: 'bg-zinc-500' },
  ]

  const statusData = [
    {
      label: 'Ouvert',
      value: analytics.ticketsByStatus.open,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
    },
    {
      label: 'En attente',
      value: analytics.ticketsByStatus.pending,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
    },
    {
      label: 'Résolu',
      value: analytics.ticketsByStatus.resolved,
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
    },
    {
      label: 'Fermé',
      value: analytics.ticketsByStatus.closed,
      color: 'bg-zinc-600',
      textColor: 'text-zinc-400',
    },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight">
              Analytics
            </h1>
            <p className="mt-2 text-[13px] text-zinc-500">
              Vue d&apos;ensemble de vos tickets et performances
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Tickets ce mois"
            value={thisMonth}
            icon={Inbox}
            trend={trendDir}
            trendValue={`${trendPct > 0 ? '+' : ''}${trendPct}%`}
          />
          <StatCard
            label="Tickets ouverts"
            value={analytics.openTickets}
            icon={Clock}
            iconColor="bg-amber-500/10 ring-amber-500/20"
          />
          <StatCard
            label="Tickets résolus"
            value={analytics.resolvedTickets}
            icon={CheckCircle2}
            iconColor="bg-emerald-500/10 ring-emerald-500/20"
          />
          <StatCard
            label="Clients"
            value={analytics.customerCount}
            icon={Users}
            iconColor="bg-blue-500/10 ring-blue-500/20"
          />
        </div>

        {/* Advanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avg First Response Time */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.04] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/20">
                <Timer className="h-5 w-5 text-sky-400" />
              </div>
              {analytics.avgFirstResponseMinutes > 0 && analytics.avgFirstResponseMinutes <= 30 && (
                <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  Rapide
                </div>
              )}
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-1">Temps moyen 1ere reponse</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {analytics.avgFirstResponseMinutes > 0 ? formatResponseTime(analytics.avgFirstResponseMinutes) : '—'}
            </p>
          </div>

          {/* AI Resolution Rate */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.04] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 ring-1 ring-fuchsia-500/20">
                <Bot className="h-5 w-5 text-fuchsia-400" />
              </div>
              <div className="text-[11px] font-bold text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
                {analytics.aiResponseCount} reponses IA
              </div>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-1">Taux de resolution IA</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-white tracking-tight">
                {analytics.aiResolutionRate}%
              </p>
              <div className="flex-1 mb-1.5">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${analytics.aiResolutionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CSAT */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.04] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <ThumbsUp className="h-5 w-5 text-amber-400" />
              </div>
              {analytics.csatCount > 0 && (
                <div className="text-[11px] font-bold text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
                  {analytics.csatCount} avis
                </div>
              )}
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-1">Satisfaction client (CSAT)</p>
            {analytics.avgCsatRating != null ? (
              <div className="flex items-end gap-3">
                <p className="text-2xl font-bold text-white tracking-tight">
                  {analytics.avgCsatRating.toFixed(1)}
                  <span className="text-[14px] text-zinc-500 font-normal"> / 5</span>
                </p>
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'h-4 w-4',
                        s <= Math.round(analytics.avgCsatRating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-zinc-600 tracking-tight">Aucune donnee</p>
            )}
          </div>
        </div>

        {/* Heatmap — Activity by Hour */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                <Activity className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-white">Activite par heure</h3>
                <p className="text-[11px] text-zinc-500">Distribution des tickets sur 24h</p>
              </div>
            </div>
            {(() => {
              const peakHour = analytics.ticketsByHour.reduce((max, h) => h.count > max.count ? h : max, analytics.ticketsByHour[0]!)
              return peakHour.count > 0 ? (
                <div className="text-[11px] font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-lg ring-1 ring-orange-500/20">
                  Pic: {peakHour.hour}h00
                </div>
              ) : null
            })()}
          </div>
          <div className="flex items-end gap-1">
            {analytics.ticketsByHour.map((h) => {
              const maxCount = Math.max(...analytics.ticketsByHour.map((x) => x.count), 1)
              const intensity = h.count / maxCount
              const heightPct = Math.max(intensity * 100, 4)
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[9px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {h.count}
                  </span>
                  <div
                    className={cn(
                      'w-full rounded-t-md transition-all duration-500',
                      intensity > 0.75 ? 'bg-orange-500' :
                      intensity > 0.5 ? 'bg-orange-500/70' :
                      intensity > 0.25 ? 'bg-orange-500/40' :
                      intensity > 0 ? 'bg-orange-500/20' : 'bg-white/5'
                    )}
                    style={{ height: `${heightPct}px`, minHeight: '4px', maxHeight: '80px' }}
                  />
                  <span className="text-[9px] text-zinc-600 tabular-nums">{h.hour}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Performance IA & Resolution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avg Resolution Time */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.04] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                <Timer className="h-5 w-5 text-indigo-400" />
              </div>
              {analytics.avgResolutionHours > 0 && analytics.avgResolutionHours <= 24 && (
                <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  Performant
                </div>
              )}
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-1">Temps moyen de resolution</p>
            <p className="text-2xl font-bold text-white tracking-tight">
              {analytics.avgResolutionHours > 0
                ? analytics.avgResolutionHours < 1
                  ? `${Math.round(analytics.avgResolutionHours * 60)} min`
                  : analytics.avgResolutionHours < 24
                    ? `${analytics.avgResolutionHours}h`
                    : `${Math.round(analytics.avgResolutionHours / 24)}j`
                : '—'}
            </p>
          </div>

          {/* Reopen Rate */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.04] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20">
                <RotateCcw className="h-5 w-5 text-rose-400" />
              </div>
              {analytics.reopenRate <= 5 && (
                <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-400">
                  <TrendingDown className="h-3 w-3" />
                  Faible
                </div>
              )}
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-1">Taux de reouverture</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-white tracking-tight">{analytics.reopenRate}%</p>
              <div className="flex-1 mb-1.5">
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      analytics.reopenRate > 20 ? 'bg-red-500' :
                      analytics.reopenRate > 10 ? 'bg-amber-500' : 'bg-emerald-500'
                    )}
                    style={{ width: `${Math.min(analytics.reopenRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Resolution Gauge */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5 hover:bg-white/[0.04] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                <Bot className="h-5 w-5 text-violet-400" />
              </div>
              <div className="text-[11px] font-bold text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
                {analytics.aiResponseCount} reponses
              </div>
            </div>
            <p className="text-[12px] font-medium text-zinc-500 mb-3">Efficacite IA</p>
            <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${analytics.aiResolutionRate}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[11px] text-zinc-600">0%</span>
              <span className="text-[14px] font-bold text-white">{analytics.aiResolutionRate}%</span>
              <span className="text-[11px] text-zinc-600">100%</span>
            </div>
          </div>
        </div>

        {/* CSAT Distribution */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-white">Distribution CSAT</h3>
                <p className="text-[11px] text-zinc-500">Repartition des notes de satisfaction</p>
              </div>
            </div>
            <div className="text-right">
              {analytics.avgCsatRating != null ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          'h-3.5 w-3.5',
                          s <= Math.round(analytics.avgCsatRating ?? 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-700'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[14px] font-bold text-white">{analytics.avgCsatRating.toFixed(1)}</span>
                  <span className="text-[11px] text-zinc-500">({analytics.csatCount} avis)</span>
                </div>
              ) : (
                <span className="text-[12px] text-zinc-600">Aucune donnee</span>
              )}
            </div>
          </div>

          {analytics.csatCount > 0 ? (
            <div className="space-y-3">
              {analytics.csatDistribution.map((d) => {
                const maxRatingCount = Math.max(...analytics.csatDistribution.map((x) => x.count), 1)
                const pct = (d.count / maxRatingCount) * 100
                const ratingPct = analytics.csatCount > 0 ? Math.round((d.count / analytics.csatCount) * 100) : 0
                return (
                  <div key={d.rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16 shrink-0">
                      {Array.from({ length: d.rating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          d.rating >= 4 ? 'bg-emerald-500' :
                          d.rating === 3 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-bold text-zinc-300 tabular-nums w-8 text-right">{d.count}</span>
                    <span className="text-[10px] text-zinc-600 tabular-nums w-10 text-right">{ratingPct}%</span>
                  </div>
                )
              }).reverse()}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-[13px] text-zinc-500">Aucun feedback recu pour le moment</p>
            </div>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AreaChart data={analytics.ticketsOverTime} title="Volume de tickets" />
          <BarChart data={channelData} title="Par canal" />
          <BarChart data={priorityData} title="Par priorité" />
          <RingChart data={statusData} title="Répartition par statut" />
        </div>
      </div>
    </div>
  )
}
