'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  Inbox,
  Clock,
  Timer,
  Bot,
  BarChart2,
  Mail,
  FileText,
  MessageCircle,
  Star,
  Pen,
  Instagram,
  CheckCircle2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AnalyticsData } from '@/lib/actions/analytics'
import { cn } from '@/lib/utils'
import {
  Area,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart as RechartsBarChart,
  Bar,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts'

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatResponseTime = (minutes: number): string => {
  if (minutes < 1) return '< 1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `${days}j ${remainHours}h` : `${days}j`
}

function CustomTooltip({ active, payload, label, formatter }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-3 shadow-2xl">
        <p className="text-[12px] font-medium text-[#86868b] mb-1">{label}</p>
        <p className="text-[14px] font-semibold text-white">
          {formatter ? formatter(payload[0].value) : payload[0].value}
        </p>
      </div>
    )
  }
  return null
}

// ── Components ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  highlight,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  highlight?: boolean
}) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border p-5 transition-all duration-300",
      highlight
        ? "bg-[#0a84ff]/[0.03] border-[#0a84ff]/20 shadow-[0_4px_24px_rgba(10,132,255,0.1)]"
        : "bg-white/[0.02] border-white/5 shadow-lg hover:bg-white/[0.04]"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border",
          highlight
            ? "bg-[#0a84ff]/10 border-[#0a84ff]/20 text-[#0a84ff]"
            : "bg-white/5 border-white/10 text-[#86868b]"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && trendValue && (
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            trend === 'up'
              ? highlight ? "bg-[#0a84ff]/10 text-[#0a84ff]" : "bg-[#30d158]/10 text-[#30d158]"
              : trend === 'down'
                ? "bg-[#ff453a]/10 text-[#ff453a]"
                : "bg-white/10 text-[#86868b]"
          )}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className={cn("text-[13px] font-medium mb-1", highlight ? "text-[#0a84ff]/80" : "text-[#86868b]")}>
          {label}
        </p>
        <p className={cn("text-[32px] font-semibold tracking-tight", highlight ? "text-white" : "text-[#f5f5f7]")}>
          {value}
        </p>
      </div>
    </div>
  )
}

function TrendsChart({ data }: { data: { date: string; count: number }[] }) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }))
  }, [data])

  if (chartData.length === 0) return null

  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 shadow-lg h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-[15px] font-semibold text-white">Tickets créés (30 derniers jours)</h3>
        <p className="text-[13px] text-[#86868b] mt-1">Évolution du volume de support quotidien</p>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0a84ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#86868b' }}
              dy={10}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#86868b' }}
            />
            <Tooltip content={<CustomTooltip formatter={(val: number) => `${val} tickets`} />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#0a84ff"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCount)"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function SourcesChart({ data }: { data: { label: string; value: number }[] }) {
  const COLORS = ['#0a84ff', '#30d158', '#5e5ce6', '#ff9f0a', '#ff453a', '#86868b']

  const icons: Record<string, React.ElementType> = {
    'Email': Mail,
    'Formulaire': FileText,
    'Instagram': Instagram,
    'Messenger': MessageCircle,
    'Avis Google': Star,
    'Manuel': Pen
  }

  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 shadow-lg h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-[15px] font-semibold text-white">Canaux d'acquisition</h3>
        <p className="text-[13px] text-[#86868b] mt-1">Origine des demandes d'assistance</p>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={(val: number) => `${val} tickets`} />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {data.map((item, i) => {
            const Icon = icons[item.label] || Mail
            return (
              <div key={item.label} className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${COLORS[i % COLORS.length]}20` }}>
                  <Icon className="h-3 w-3" style={{ color: COLORS[i % COLORS.length] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[#86868b] truncate">{item.label}</p>
                </div>
                <span className="text-[12px] font-semibold text-white tabular-nums">{item.value}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PrioritiesChart({
  data,
  reopenRate
}: {
  data: { urgent: number; high: number; medium: number; low: number }
  reopenRate: number
}) {
  const chartData = [
    { name: 'Urgent', value: data.urgent, fill: '#ff453a' },
    { name: 'Haute', value: data.high, fill: '#ff9f0a' },
    { name: 'Moyenne', value: data.medium, fill: '#ffd60a' },
    { name: 'Basse', value: data.low, fill: '#86868b' },
  ].filter(d => d.value > 0)

  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/5 p-6 shadow-lg h-[400px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-[15px] font-semibold text-white">Analyse des Priorités</h3>
        <p className="text-[13px] text-[#86868b] mt-1">Répartition de la criticité</p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#86868b', fontWeight: 500 }}
              width={70}
            />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-[#86868b]" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-white">Taux de réouverture</p>
            <p className="text-[11px] text-[#86868b]">Objectif: &lt; 5%</p>
          </div>
        </div>
        <span className={cn(
          "text-[14px] font-bold px-3 py-1 rounded-full border",
          reopenRate > 5
            ? "bg-[#ff453a]/10 text-[#ff453a] border-[#ff453a]/20"
            : "bg-[#30d158]/10 text-[#30d158] border-[#30d158]/20"
        )}>
          {reopenRate}%
        </span>
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

  useEffect(() => {
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => router.refresh()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, router])

  if (!analytics) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="flex flex-col items-center">
          <BarChart2 className="h-8 w-8 text-[#86868b] mb-4" />
          <p className="text-[14px] font-medium text-white">Impossible de charger les statistiques</p>
        </div>
      </div>
    )
  }

  const { thisMonth, lastMonth } = analytics.recentTrend
  const trendDir = thisMonth > lastMonth ? 'up' : thisMonth < lastMonth ? 'down' : 'neutral'
  const trendPct = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : (thisMonth > 0 ? 100 : 0)

  const channelData = [
    { label: 'Email', value: analytics.ticketsByChannel.email },
    { label: 'Formulaire', value: analytics.ticketsByChannel.form },
    { label: 'Instagram', value: analytics.ticketsByChannel.instagram },
    { label: 'Messenger', value: analytics.ticketsByChannel.messenger },
    { label: 'Avis Google', value: analytics.ticketsByChannel.google_review },
    { label: 'Manuel', value: analytics.ticketsByChannel.manual },
  ].sort((a, b) => b.value - a.value).filter(c => c.value > 0)

  return (
    <div className="h-full overflow-y-auto bg-transparent custom-scrollbar pb-8">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-8 mt-4">

        {/* Header */}
        <div>
          <h1 className="text-[24px] font-semibold text-white tracking-tight">Vue d'ensemble</h1>
          <p className="text-[14px] text-[#86868b] mt-1">Analysez les performances de votre support client</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Nouveaux Tickets"
            value={thisMonth}
            icon={Inbox}
            trend={trendDir}
            trendValue={`${trendPct > 0 ? '+' : ''}${trendPct}%`}
          />
          <StatCard
            label="Résolution IA"
            value={`${analytics.aiResolutionRate}%`}
            icon={Bot}
            trend="up"
            trendValue={`+${Math.round(analytics.aiResponseCount * 5 / 60)}h gagnées`}
            highlight
          />
          <StatCard
            label="Temps de Réponse Moyen"
            value={formatResponseTime(analytics.avgFirstResponseMinutes)}
            icon={Timer}
          />
          <StatCard
            label="Satisfaction Client"
            value={`${analytics.avgCsatRating ? analytics.avgCsatRating.toFixed(1) : '—'}/5`}
            icon={Star}
            trend="up"
            trendValue="Excellent"
          />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <TrendsChart data={analytics.ticketsOverTime} />
          </div>
          <div className="lg:col-span-1">
            <SourcesChart data={channelData} />
          </div>
          <div className="lg:col-span-1">
            <PrioritiesChart data={analytics.ticketsByPriority} reopenRate={analytics.reopenRate} />
          </div>
        </div>

      </div>
    </div>
  )
}
