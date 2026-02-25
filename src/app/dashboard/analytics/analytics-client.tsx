'use client'

import { useEffect, useState } from 'react'
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
  LayoutDashboard,
  BrainCircuit,
  PieChart
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
  className,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}) {
  return (
    <div className={cn("rounded-2xl bg-[#131316] border border-white/[0.04] p-5 transition-all duration-200 hover:border-white/[0.08]", className)}>
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            iconColor ?? 'bg-[#E8856C]/10'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              iconColor
                ? iconColor.includes('30d158')
                  ? 'text-[#30d158]'
                  : iconColor.includes('ffd60a')
                    ? 'text-[#ffd60a]'
                    : iconColor.includes('5e5ce6')
                      ? 'text-[#5e5ce6]'
                      : iconColor.includes('ff453a')
                        ? 'text-[#ff453a]'
                        : iconColor.includes('ff9f0a')
                          ? 'text-[#ff9f0a]'
                          : 'text-[#E8856C]'
                : 'text-[#E8856C]'
            )}
          />
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium',
              trend === 'up'
                ? 'bg-[#30d158]/10 text-[#30d158]'
                : trend === 'down'
                  ? 'bg-[#ff453a]/10 text-[#ff453a]'
                  : 'bg-[white/[0.04]] text-[#888]'
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
      <div>
        <p className="text-[12px] font-medium text-[#888] mb-1">{label}</p>
        <p className="text-[28px] md:text-[32px] font-semibold text-[#EDEDED] tracking-tight">{value}</p>
      </div>
    </div>
  )
}

// ── Area Chart (Trends) ─────────────────────────────────────────────────────

function AreaChart({
  data,
  title,
  className
}: {
  data: { date: string; count: number }[]
  title: string
  className?: string
}) {
  const height = 180
  const width = 600
  const padding = 20

  const max = Math.max(...data.map((d) => d.count), 5)

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.count / max) * (height - padding)
    return `${x},${y}`
  }).join(' ')

  const fillPath = `M 0,${height} ${points} L ${width},${height} Z`
  const strokePath = `M ${points.split(' ')[0]} ${points}`

  return (
    <div className={cn("rounded-2xl bg-[#131316] border border-white/[0.04] p-5 lg:p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[14px] font-semibold text-[#EDEDED]">{title}</h3>
          <p className="text-[12px] text-[#888] mt-0.5">Derniers 30 jours</p>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-semibold text-[#E8856C] leading-none">
            {data.reduce((acc, curr) => acc + curr.count, 0)}
          </p>
          <span className="text-[10px] text-[#555] font-medium uppercase tracking-wider">Total</span>
        </div>
      </div>

      <div className="relative h-[180px] w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8856C" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#E8856C" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={tick}
              x1="0"
              y1={height - tick * (height - padding)}
              x2={width}
              y2={height - tick * (height - padding)}
              stroke="white"
              strokeOpacity="0.04"
              strokeDasharray="4 4"
            />
          ))}

          <path d={fillPath} fill="url(#chartGradient)" />
          <path
            d={strokePath}
            fill="none"
            stroke="#E8856C"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  )
}

// ── Bar Chart ───────────────────────────────────────────────────────────────

function BarChart({
  data,
  title,
  subtitle,
  className
}: {
  data: { label: string; value: number; color: string; icon?: React.ElementType }[]
  title: string
  subtitle?: string
  className?: string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={cn("rounded-2xl bg-[#131316] border border-white/[0.04] p-5 lg:p-6", className)}>
      <div className="mb-6">
        <h3 className="text-[14px] font-semibold text-[#EDEDED]">{title}</h3>
        {subtitle && <p className="text-[12px] text-[#888] mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-4">
        {data.map((item) => {
          const pct = (item.value / max) * 100
          const Icon = item.icon

          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {Icon && <Icon className="h-3.5 w-3.5 text-[#888]" />}
                  <span className="text-[12px] font-medium text-[#888]">
                    {item.label}
                  </span>
                </div>
                <span className="text-[13px] font-semibold text-[#EDEDED] tabular-nums">
                  {item.value}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
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
  subtitle,
  className
}: {
  data: { label: string; value: number; color: string; textColor: string }[]
  title: string
  subtitle?: string
  className?: string
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1

  return (
    <div className={cn("rounded-2xl bg-[#131316] border border-white/[0.04] p-5 lg:p-6 flex flex-col", className)}>
      <div className="mb-6">
        <h3 className="text-[14px] font-semibold text-[#EDEDED]">{title}</h3>
        {subtitle && <p className="text-[12px] text-[#888] mt-0.5">{subtitle}</p>}
      </div>

      <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden flex mb-6">
        {data.map((item) => (
          <div
            key={item.label}
            className={cn('h-full first:rounded-l-full last:rounded-r-full border-r border-[#131316] last:border-0', item.color)}
            style={{ width: `${(item.value / total) * 100}%` }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-auto">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.02]">
            <div className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full', item.color)} />
              <span className="text-[11px] font-medium text-[#888] truncate">{item.label}</span>
            </div>
            <span
              className={cn(
                'text-[12px] font-bold tabular-nums',
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

  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'csat'>('overview')

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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131316] border border-white/[0.04]">
            <BarChart2 className="h-7 w-7 text-[#555]" />
          </div>
          <p className="text-[14px] font-medium text-[#EDEDED]">
            Impossible de charger les statistiques
          </p>
          <p className="text-[12px] text-[#888] mt-1">
            Veuillez vérifier votre connexion
          </p>
        </div>
      </div>
    )
  }

  // Common calculations
  const { thisMonth, lastMonth } = analytics.recentTrend
  const trendDir = thisMonth > lastMonth ? 'up' : thisMonth < lastMonth ? 'down' : 'neutral'
  const trendPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth > 0 ? 100 : 0)

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
    { label: 'Email', value: analytics.ticketsByChannel.email, color: 'bg-[#E8856C]', icon: Mail },
    { label: 'Formulaire', value: analytics.ticketsByChannel.form, color: 'bg-[#30d158]', icon: FileText },
    { label: 'Instagram', value: analytics.ticketsByChannel.instagram, color: 'bg-[#bf5af2]', icon: Instagram },
    { label: 'Messenger', value: analytics.ticketsByChannel.messenger, color: 'bg-[#64d2ff]', icon: MessageCircle },
    { label: 'Avis Google', value: analytics.ticketsByChannel.google_review, color: 'bg-[#ffd60a]', icon: Star },
    { label: 'Manuel', value: analytics.ticketsByChannel.manual, color: 'bg-[#888]', icon: Pen },
  ].sort((a, b) => b.value - a.value).filter(c => c.value > 0) // Only show active channels

  const priorityData = [
    { label: 'Urgent', value: analytics.ticketsByPriority.urgent, color: 'bg-[#ff453a]' },
    { label: 'Haute', value: analytics.ticketsByPriority.high, color: 'bg-[#ff9f0a]' },
    { label: 'Moyenne', value: analytics.ticketsByPriority.medium, color: 'bg-[#ffd60a]' },
    { label: 'Basse', value: analytics.ticketsByPriority.low, color: 'bg-[#555]' },
  ]

  const statusData = [
    { label: 'Ouvert', value: analytics.ticketsByStatus.open, color: 'bg-[#30d158]', textColor: 'text-[#30d158]' },
    { label: 'En attente', value: analytics.ticketsByStatus.pending, color: 'bg-[#ffd60a]', textColor: 'text-[#ffd60a]' },
    { label: 'Résolu', value: analytics.ticketsByStatus.resolved, color: 'bg-[#E8856C]', textColor: 'text-[#E8856C]' },
    { label: 'Fermé', value: analytics.ticketsByStatus.closed, color: 'bg-[#555]', textColor: 'text-[#888]' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-[#0B0B0F]">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">

        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/[0.06]">
          <div>
            <h1 className="text-[22px] font-semibold text-[#EDEDED] tracking-tight">
              Statistiques
            </h1>
            <p className="mt-1 text-[13px] text-[#888]">
              Vue détaillée de vos performances
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#131316] border border-white/[0.04] p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                activeTab === 'overview'
                  ? "bg-white/[0.06] text-[#EDEDED] shadow-sm"
                  : "text-[#888] hover:text-[#EDEDED] hover:bg-white/[0.02]"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Général
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                activeTab === 'ai'
                  ? "bg-white/[0.06] text-[#EDEDED] shadow-sm"
                  : "text-[#888] hover:text-[#EDEDED] hover:bg-white/[0.02]"
              )}
            >
              <BrainCircuit className="h-4 w-4" />
              Intelligence IA
            </button>
            <button
              onClick={() => setActiveTab('csat')}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                activeTab === 'csat'
                  ? "bg-white/[0.06] text-[#EDEDED] shadow-sm"
                  : "text-[#888] hover:text-[#EDEDED] hover:bg-white/[0.02]"
              )}
            >
              <PieChart className="h-4 w-4" />
              Satisfaction & Canaux
            </button>
          </div>
        </div>

        {/* Tab Content: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Nouveaux Tickets" value={thisMonth} icon={Inbox} trend={trendDir} trendValue={`${trendPct > 0 ? '+' : ''}${trendPct}%`} />
              <StatCard label="Tickets Ouverts" value={analytics.openTickets} icon={Clock} iconColor="bg-[#ffd60a]/10" />
              <StatCard label="Tickets Résolus" value={analytics.resolvedTickets} icon={CheckCircle2} iconColor="bg-[#30d158]/10" />
              <StatCard label="Total Clients" value={analytics.customerCount} icon={Users} iconColor="bg-[#E8856C]/10" />
            </div>

            {/* Bento Layout Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <AreaChart
                data={analytics.ticketsOverTime}
                title="Évolution du Volume de Tickets"
                className="lg:col-span-8"
              />
              <RingChart
                data={statusData}
                title="État du Support"
                subtitle="Distribution actuelle"
                className="lg:col-span-4"
              />
            </div>

            {/* Heatmap */}
            <div className="rounded-2xl bg-[#131316] border border-white/[0.04] p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff9f0a]/10 border border-[#ff9f0a]/20">
                    <Activity className="h-6 w-6 text-[#ff9f0a]" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#EDEDED]">Cartographie de l&apos;Activité par Heure</h3>
                    <p className="text-[12px] text-[#888] mt-0.5">Distribution des réceptions de tickets sur 24h</p>
                  </div>
                </div>
                {(() => {
                  const peakHour = analytics.ticketsByHour.reduce((max, h) => h.count > max.count ? h : max, analytics.ticketsByHour[0]!)
                  return peakHour.count > 0 ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#ff9f0a]/10 border border-[#ff9f0a]/20 shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff9f0a] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff9f0a]"></span>
                      </span>
                      <span className="text-[12px] font-semibold text-[#ff9f0a]">Heure de Pointe: {peakHour.hour}h00</span>
                    </div>
                  ) : null
                })()}
              </div>

              <div className="flex items-end gap-[2px] h-[120px] w-full">
                {analytics.ticketsByHour.map((h) => {
                  const maxCount = Math.max(...analytics.ticketsByHour.map((x) => x.count), 1)
                  const intensity = h.count / maxCount
                  const heightPct = Math.max(intensity * 100, 2)
                  return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1A1A1F] text-[#EDEDED] text-[10px] font-medium px-2 py-1 rounded-md border border-white/[0.1] whitespace-nowrap z-10 shadow-xl pointer-events-none">
                        {h.count} tickets à {h.hour}h
                      </div>
                      <div
                        className={cn(
                          'w-full rounded-t-sm transition-all duration-500 hover:brightness-125 border-x border-black/20',
                          intensity > 0.8 ? 'bg-[#E8856C]' :
                            intensity > 0.5 ? 'bg-[#E8856C]/70' :
                              intensity > 0.2 ? 'bg-[#E8856C]/40' :
                                intensity > 0 ? 'bg-[#E8856C]/20' : 'bg-white/[0.02]'
                        )}
                        style={{ height: `${heightPct}%` }}
                      />
                      <div className={cn(
                        "text-[9px] mt-2 font-medium transition-colors",
                        h.hour % 3 === 0 ? "text-[#555]" : "text-transparent"
                      )}>
                        {h.hour}h
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: AI PERFORMANCE */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* AI Hero Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-[#131316] to-[#E8856C]/5 border border-white/[0.04] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 -m-16 opacity-[0.03] pointer-events-none">
                <BrainCircuit className="w-64 h-64 text-[#E8856C]" />
              </div>

              <div className="flex-1 space-y-4 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8856C]/10 border border-[#E8856C]/20 text-[#E8856C] text-[12px] font-semibold">
                  <Bot className="h-4 w-4" />
                  Performance Globale de l&apos;IA
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#EDEDED] tracking-tight">
                  {analytics.aiResolutionRate}% <span className="text-xl md:text-2xl font-normal text-[#888]">de résolution automatique</span>
                </h2>
                <p className="text-[14px] text-[#888] max-w-xl leading-relaxed">
                  L&apos;intelligence artificielle a traité de bout en bout {analytics.aiResponseCount} demandes sans intervention humaine, libérant du temps précieux pour votre équipe.
                </p>
              </div>

              <div className="shrink-0 w-full md:w-1/3 z-10">
                <div className="bg-[#0B0B0F]/50 backdrop-blur-md rounded-xl p-5 border border-white/[0.06]">
                  <div className="flex justify-between text-[13px] font-medium text-[#888] mb-3">
                    <span>Efficacité IA</span>
                    <span className="text-[#EDEDED]">{analytics.aiResponseCount} rép.</span>
                  </div>
                  <div className="relative h-4 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#E8856C]/50 to-[#E8856C] transition-all duration-1000"
                      style={{ width: `${analytics.aiResolutionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Velocity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                label="Temps Moyen 1ère Rép."
                value={analytics.avgFirstResponseMinutes > 0 ? formatResponseTime(analytics.avgFirstResponseMinutes) : '—'}
                icon={Timer}
                iconColor="bg-[#64d2ff]/10"
                trend={analytics.avgFirstResponseMinutes > 0 && analytics.avgFirstResponseMinutes <= 30 ? 'up' : undefined}
                trendValue={analytics.avgFirstResponseMinutes > 0 && analytics.avgFirstResponseMinutes <= 30 ? 'Rapide' : undefined}
              />
              <StatCard
                label="Temps Résolution Global"
                value={analytics.avgResolutionHours > 0 ? (analytics.avgResolutionHours < 1 ? `< 1h` : `${Math.round(analytics.avgResolutionHours)}h`) : '—'}
                icon={CheckCircle2}
                iconColor="bg-[#5e5ce6]/10"
              />
              <StatCard
                label="Taux de Réouverture"
                value={`${analytics.reopenRate}%`}
                icon={RotateCcw}
                iconColor="bg-[#ff453a]/10"
                trend={analytics.reopenRate <= 5 ? 'down' : undefined}
                trendValue={analytics.reopenRate <= 5 ? 'Faible' : undefined}
              />
            </div>
          </div>
        )}

        {/* Tab Content: CSAT & CHANNELS */}
        {activeTab === 'csat' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* CSAT Details Widget */}
              <div className="rounded-2xl bg-[#131316] border border-white/[0.04] p-6 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ffd60a]/10 border border-[#ffd60a]/20">
                    <Star className="h-6 w-6 text-[#ffd60a]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-[#EDEDED]">Qualité du Service (CSAT)</h3>
                    <p className="text-[12px] text-[#888] mt-0.5">Basé sur {analytics.csatCount} retours clients</p>
                  </div>
                  {analytics.avgCsatRating != null && (
                    <div className="text-right">
                      <p className="text-[32px] font-bold text-[#EDEDED] leading-none tracking-tight">
                        {analytics.avgCsatRating.toFixed(1)}<span className="text-[16px] text-[#555] font-medium">/5</span>
                      </p>
                    </div>
                  )}
                </div>

                {analytics.csatCount > 0 ? (
                  <div className="space-y-4 mt-auto">
                    {analytics.csatDistribution.map((d) => {
                      const maxRatingCount = Math.max(...analytics.csatDistribution.map((x) => x.count), 1)
                      const pct = (d.count / maxRatingCount) * 100
                      const ratingPct = Math.round((d.count / analytics.csatCount) * 100)

                      return (
                        <div key={d.rating} className="flex items-center gap-4">
                          <div className="flex items-center gap-1 w-20 shrink-0">
                            <span className="text-[13px] font-medium text-[#EDEDED] mr-1">{d.rating}</span>
                            <Star className="h-3 w-3 text-[#ffd60a] fill-[#ffd60a]" />
                          </div>
                          <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-700',
                                d.rating >= 4 ? 'bg-[#30d158]' :
                                  d.rating === 3 ? 'bg-[#ffd60a]' : 'bg-[#ff453a]'
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-24 text-right flex justify-end gap-2 text-[12px]">
                            <span className="font-semibold text-[#EDEDED]">{d.count}</span>
                            <span className="text-[#555] w-8">({ratingPct}%)</span>
                          </div>
                        </div>
                      )
                    }).reverse()}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                    <ThumbsUp className="h-8 w-8 text-[#555] mb-3" />
                    <p className="text-[13px] font-medium text-[#EDEDED]">Aucun feedback reçu</p>
                    <p className="text-[12px] text-[#888] mt-1 max-w-[200px]">Les notes de satisfaction apparaîtront ici quand vos clients évalueront vos réponses.</p>
                  </div>
                )}
              </div>

              {/* Channels Breakdown */}
              <div className="flex flex-col gap-6">
                <BarChart
                  data={channelData}
                  title="Acquisition par Canal"
                  subtitle="Volume de tickets générés selon la source"
                  className="flex-1"
                />

                {/* Secondary data in a small strip */}
                <div className="rounded-2xl bg-[#131316] border border-white/[0.04] p-5 flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#EDEDED] mb-1">Alertes Prioritaires</h4>
                    <p className="text-[11px] text-[#888]">Tickets marqués urgents / haute priorité</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#ff453a]" />
                      <span className="text-[15px] font-bold text-[#EDEDED]">{analytics.ticketsByPriority.urgent}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/[0.06]" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#ff9f0a]" />
                      <span className="text-[15px] font-bold text-[#EDEDED]">{analytics.ticketsByPriority.high}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
