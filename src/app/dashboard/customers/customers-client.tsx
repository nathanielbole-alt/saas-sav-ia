'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Mail,
  Phone,
  Clock,
  Users,
  X,
  Plus,
  Tag,
  MessageSquare,
  Ticket,
  Star,
  Heart,
  AlertTriangle,
  Crown,
  UserX,
  UserPlus,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react'
import type { CustomerWithStats, CustomerDetail, TimelineEvent } from '@/lib/actions/customers'
import {
  getCustomerDetail,
  getCustomerTimeline,
  updateCustomerNotes,
  addCustomerTag,
  removeCustomerTag,
  updateCustomerSegment,
  recalculateCustomerHealth,
} from '@/lib/actions/customers'

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const avatarColors = [
  'bg-[#0a84ff]/15 text-[#0a84ff]',
  'bg-[#30d158]/15 text-[#30d158]',
  'bg-[#ff9f0a]/15 text-[#ff9f0a]',
  'bg-[#ff453a]/15 text-[#ff453a]',
  'bg-[#bf5af2]/15 text-[#bf5af2]',
  'bg-[#64d2ff]/15 text-[#64d2ff]',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return avatarColors[Math.abs(hash) % avatarColors.length] ?? (avatarColors[0] as string)
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "À l'instant"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}j`
  return `${Math.floor(days / 30)} mois`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SEGMENT_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  vip: { label: 'VIP', color: '#0a84ff', icon: Crown },
  at_risk: { label: 'À risque', color: '#ff453a', icon: AlertTriangle },
  new: { label: 'Nouveau', color: '#30d158', icon: UserPlus },
  standard: { label: 'Standard', color: '#86868b', icon: Users },
  churned: { label: 'Churné', color: '#ff9f0a', icon: UserX },
}

function getHealthColor(score: number): string {
  if (score >= 70) return '#30d158'
  if (score >= 40) return '#ff9f0a'
  return '#ff453a'
}

type SortKey = 'name' | 'email' | 'ticket_count' | 'last_contact' | 'health_score'
type SegmentFilter = 'all' | 'vip' | 'at_risk' | 'new' | 'standard' | 'churned'

// ── Main Component ──────────────────────────────────────────────────────────

export default function CustomersClient({
  initialCustomers,
  plan = 'pro',
}: {
  initialCustomers: CustomerWithStats[]
  plan?: string
}) {
  const router = useRouter()
  const isBusiness = plan === 'business' || plan === 'enterprise'

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('last_contact')
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all')

  // Detail panel
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [detailTab, setDetailTab] = useState<'activity' | 'tickets' | 'notes'>('activity')
  const [detailLoading, setDetailLoading] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [newTag, setNewTag] = useState('')
  const [recalculating, setRecalculating] = useState(false)

  const customers = useMemo(() => {
    let filtered = initialCustomers

    if (segmentFilter !== 'all') {
      filtered = filtered.filter(c => c.segment === segmentFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(c =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email)
        case 'email': return a.email.localeCompare(b.email)
        case 'ticket_count': return b.ticket_count - a.ticket_count
        case 'health_score': return b.health_score - a.health_score
        case 'last_contact':
        default:
          if (!a.last_contact) return 1
          if (!b.last_contact) return -1
          return new Date(b.last_contact).getTime() - new Date(a.last_contact).getTime()
      }
    })
  }, [initialCustomers, search, sortBy, segmentFilter])

  // Segment counts
  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialCustomers.length, vip: 0, at_risk: 0, new: 0, standard: 0, churned: 0 }
    for (const c of initialCustomers) {
      if (c.segment in counts) counts[c.segment]!++
    }
    return counts
  }, [initialCustomers])

  // KPIs
  const kpis = useMemo(() => {
    const total = initialCustomers.length
    const avgHealth = total > 0 ? Math.round(initialCustomers.reduce((a, c) => a + c.health_score, 0) / total) : 0
    const atRisk = initialCustomers.filter(c => c.health_score < 40).length
    const csatScores = initialCustomers.filter(c => c.last_satisfaction_score != null).map(c => c.last_satisfaction_score as number)
    const avgSat = csatScores.length > 0 ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10 : null
    return { total, avgHealth, atRisk, avgSat }
  }, [initialCustomers])

  const openDetail = useCallback(async (customerId: string) => {
    if (!isBusiness) return
    setSelectedCustomerId(customerId)
    setDetailLoading(true)
    setDetailTab('activity')

    const [d, t] = await Promise.all([
      getCustomerDetail(customerId),
      getCustomerTimeline(customerId),
    ])
    setDetail(d)
    setTimeline(t)
    setNotesValue(d?.notes ?? '')
    setDetailLoading(false)
  }, [isBusiness])

  const handleSaveNotes = async () => {
    if (!selectedCustomerId) return
    await updateCustomerNotes(selectedCustomerId, notesValue)
    router.refresh()
  }

  const handleAddTag = async () => {
    if (!selectedCustomerId || !newTag.trim()) return
    await addCustomerTag(selectedCustomerId, newTag)
    setNewTag('')
    // Re-fetch detail
    const d = await getCustomerDetail(selectedCustomerId)
    setDetail(d)
    router.refresh()
  }

  const handleRemoveTag = async (tag: string) => {
    if (!selectedCustomerId) return
    await removeCustomerTag(selectedCustomerId, tag)
    const d = await getCustomerDetail(selectedCustomerId)
    setDetail(d)
    router.refresh()
  }

  const handleSegmentChange = async (segment: string) => {
    if (!selectedCustomerId) return
    await updateCustomerSegment(selectedCustomerId, segment)
    const d = await getCustomerDetail(selectedCustomerId)
    setDetail(d)
    router.refresh()
  }

  const handleRecalculate = async () => {
    if (!selectedCustomerId) return
    setRecalculating(true)
    await recalculateCustomerHealth(selectedCustomerId)
    const d = await getCustomerDetail(selectedCustomerId)
    setDetail(d)
    setRecalculating(false)
    router.refresh()
  }

  return (
    <div className="h-full overflow-y-auto bg-transparent custom-scrollbar pb-8">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 mt-4 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-semibold text-white tracking-tight">Clients</h1>
            <p className="text-[14px] text-[#86868b] mt-1">{initialCustomers.length} client{initialCustomers.length > 1 ? 's' : ''} au total</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="rounded-lg bg-[#2c2c2e] px-3 py-2 text-[13px] text-[#f5f5f7] outline-none focus:ring-1 focus:ring-[#0a84ff]/50"
            >
              <option value="last_contact">Dernier contact</option>
              <option value="ticket_count">Tickets</option>
              {isBusiness && <option value="health_score">Score santé</option>}
              <option value="name">Nom</option>
            </select>
          </div>
        </div>

        {/* KPI Strip (Business+) */}
        {isBusiness && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#1c1c1e] p-4">
              <p className="text-[12px] font-medium text-[#86868b] mb-1">Clients totaux</p>
              <p className="text-[28px] font-semibold text-[#f5f5f7]" style={{ fontVariantNumeric: 'tabular-nums' }}>{kpis.total}</p>
            </div>
            <div className="rounded-2xl bg-[#1c1c1e] p-4">
              <p className="text-[12px] font-medium text-[#86868b] mb-1">Score santé moyen</p>
              <p className="text-[28px] font-semibold" style={{ color: getHealthColor(kpis.avgHealth), fontVariantNumeric: 'tabular-nums' }}>{kpis.avgHealth}</p>
            </div>
            <div className="rounded-2xl bg-[#1c1c1e] p-4">
              <p className="text-[12px] font-medium text-[#86868b] mb-1">Clients à risque</p>
              <p className="text-[28px] font-semibold text-[#ff453a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{kpis.atRisk}</p>
            </div>
            <div className="rounded-2xl bg-[#1c1c1e] p-4">
              <p className="text-[12px] font-medium text-[#86868b] mb-1">Satisfaction</p>
              <p className="text-[28px] font-semibold text-[#ffd60a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{kpis.avgSat ?? '—'}<span className="text-[16px] text-[#86868b]">/5</span></p>
            </div>
          </div>
        )}

        {/* Segment Tabs (Business+) */}
        {isBusiness && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['all', 'vip', 'at_risk', 'new', 'standard', 'churned'] as SegmentFilter[]).map(seg => {
              const config = seg === 'all' ? { label: 'Tous', color: '#f5f5f7', icon: Users } : SEGMENT_CONFIG[seg]!
              const count = segmentCounts[seg] ?? 0
              const active = segmentFilter === seg
              return (
                <button
                  key={seg}
                  onClick={() => setSegmentFilter(seg)}
                  className={`
                    flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap
                    ${active ? 'bg-[#2c2c2e] text-[#f5f5f7]' : 'text-[#86868b] hover:bg-[#2c2c2e]/50 hover:text-[#f5f5f7]'}
                  `}
                >
                  {config!.label}
                  <span className="text-[10px] opacity-60" style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="w-full rounded-lg bg-[#2c2c2e] py-2.5 pl-10 pr-4 text-[14px] text-[#f5f5f7] outline-none placeholder:text-[#48484a] focus:ring-1 focus:ring-[#0a84ff]/50"
          />
        </div>

        {/* Customer List */}
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1c1c1e] mb-5">
              {search ? <Search className="h-8 w-8 text-[#86868b]" /> : <Users className="h-8 w-8 text-[#86868b]" />}
            </div>
            <h3 className="text-[18px] font-semibold text-white mb-2">{search ? 'Aucun résultat' : 'Aucun client'}</h3>
            <p className="text-[14px] text-[#86868b]">{search ? 'Essayez une autre recherche' : 'Les clients apparaîtront ici'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customers.map(customer => {
              const displayName = customer.full_name ?? customer.email
              const segConfig = SEGMENT_CONFIG[customer.segment] ?? SEGMENT_CONFIG.standard!
              const SegIcon = segConfig.icon

              return (
                <button
                  key={customer.id}
                  onClick={() => openDetail(customer.id)}
                  className={`
                    w-full text-left rounded-2xl bg-[#1c1c1e] p-4 transition-colors
                    ${isBusiness ? 'hover:bg-[#2c2c2e] cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${getAvatarColor(displayName)}`}>
                      {getInitials(displayName)}
                    </div>

                    {/* Name + Email */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-[#f5f5f7] truncate">{displayName}</p>
                        {isBusiness && (
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ backgroundColor: `${segConfig.color}15`, color: segConfig.color }}
                          >
                            <SegIcon className="h-2.5 w-2.5" />
                            {segConfig.label}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#86868b] truncate">{customer.email}</p>
                    </div>

                    {/* Health Score (Business+) */}
                    {isBusiness && (
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 rounded-full bg-[#2c2c2e] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${customer.health_score}%`, backgroundColor: getHealthColor(customer.health_score) }}
                          />
                        </div>
                        <span className="text-[12px] font-medium w-7 text-right" style={{ color: getHealthColor(customer.health_score), fontVariantNumeric: 'tabular-nums' }}>
                          {customer.health_score}
                        </span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-4 shrink-0 text-[12px]">
                      <span className="text-[#86868b]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {customer.ticket_count} ticket{customer.ticket_count !== 1 ? 's' : ''}
                      </span>
                      {customer.last_satisfaction_score != null && isBusiness && (
                        <span className="flex items-center gap-1 text-[#ffd60a]">
                          <Star className="h-3 w-3" />
                          {customer.last_satisfaction_score}
                        </span>
                      )}
                      <span className="text-[#48484a]">{timeAgo(customer.last_contact)}</span>
                    </div>

                    {isBusiness && <ChevronRight className="h-4 w-4 text-[#48484a] shrink-0" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Detail Panel (Business+) ───────────────────────────────────── */}
      {selectedCustomerId && isBusiness && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedCustomerId(null)} />
          <div className="relative w-full max-w-[520px] h-full overflow-y-auto bg-[#1c1c1e] shadow-2xl custom-scrollbar">
            {detailLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-[#0a84ff] border-t-transparent rounded-full" />
              </div>
            ) : detail ? (
              <div>
                {/* Panel Header */}
                <div className="sticky top-0 z-10 bg-[#1c1c1e] border-b border-[rgba(255,255,255,0.08)] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold ${getAvatarColor(detail.full_name ?? detail.email)}`}>
                        {getInitials(detail.full_name ?? detail.email)}
                      </div>
                      <div>
                        <p className="text-[16px] font-semibold text-white">{detail.full_name ?? detail.email}</p>
                        <p className="text-[12px] text-[#86868b]">{detail.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCustomerId(null)}
                      className="rounded-lg p-1.5 text-[#86868b] hover:bg-[#2c2c2e] hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Health + Segment */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[12px] font-medium text-[#86868b] mb-2">Score santé</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-[#2c2c2e] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${detail.health_score}%`, backgroundColor: getHealthColor(detail.health_score) }}
                          />
                        </div>
                        <span className="text-[16px] font-semibold" style={{ color: getHealthColor(detail.health_score), fontVariantNumeric: 'tabular-nums' }}>
                          {detail.health_score}
                        </span>
                        <button
                          onClick={handleRecalculate}
                          disabled={recalculating}
                          className="rounded-lg p-1.5 text-[#86868b] hover:bg-[#2c2c2e] hover:text-white transition-colors disabled:opacity-50"
                          title="Recalculer"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Segment selector */}
                  <div>
                    <p className="text-[12px] font-medium text-[#86868b] mb-2">Segment</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(SEGMENT_CONFIG).map(([key, config]) => {
                        const active = detail.segment === key
                        const Icon = config.icon
                        return (
                          <button
                            key={key}
                            onClick={() => handleSegmentChange(key)}
                            className={`
                              flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors
                              ${active ? 'text-white' : 'text-[#86868b] hover:text-[#f5f5f7]'}
                            `}
                            style={active ? { backgroundColor: `${config.color}20`, color: config.color } : { backgroundColor: '#2c2c2e' }}
                          >
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#2c2c2e] p-3">
                      <p className="text-[11px] text-[#86868b] mb-1">Tickets totaux</p>
                      <p className="text-[18px] font-semibold text-[#f5f5f7]" style={{ fontVariantNumeric: 'tabular-nums' }}>{detail.ticket_count}</p>
                    </div>
                    <div className="rounded-xl bg-[#2c2c2e] p-3">
                      <p className="text-[11px] text-[#86868b] mb-1">Tickets ouverts</p>
                      <p className="text-[18px] font-semibold text-[#ff9f0a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{detail.open_tickets}</p>
                    </div>
                    <div className="rounded-xl bg-[#2c2c2e] p-3">
                      <p className="text-[11px] text-[#86868b] mb-1">Satisfaction</p>
                      <p className="text-[18px] font-semibold text-[#ffd60a]" style={{ fontVariantNumeric: 'tabular-nums' }}>{detail.last_satisfaction_score ?? '—'}<span className="text-[12px] text-[#86868b]">/5</span></p>
                    </div>
                    <div className="rounded-xl bg-[#2c2c2e] p-3">
                      <p className="text-[11px] text-[#86868b] mb-1">Client depuis</p>
                      <p className="text-[13px] font-medium text-[#f5f5f7]">{formatDate(detail.created_at)}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="text-[12px] font-medium text-[#86868b] mb-2">Tags</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {detail.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-[#2c2c2e] px-2 py-1 text-[12px] text-[#f5f5f7]">
                          <Tag className="h-2.5 w-2.5 text-[#86868b]" />
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 text-[#48484a] hover:text-[#ff453a]">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newTag}
                          onChange={e => setNewTag(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                          placeholder="Ajouter..."
                          className="w-20 rounded-md bg-[#2c2c2e] px-2 py-1 text-[12px] text-[#f5f5f7] outline-none placeholder:text-[#48484a]"
                        />
                        {newTag && (
                          <button onClick={handleAddTag} className="rounded p-0.5 text-[#0a84ff] hover:bg-[#0a84ff]/10">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1 border-b border-[rgba(255,255,255,0.08)]">
                    {(['activity', 'tickets', 'notes'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`
                          px-3 py-2 text-[13px] font-medium transition-colors border-b-2
                          ${detailTab === tab
                            ? 'text-[#0a84ff] border-[#0a84ff]'
                            : 'text-[#86868b] border-transparent hover:text-[#f5f5f7]'
                          }
                        `}
                      >
                        {tab === 'activity' ? 'Activité' : tab === 'tickets' ? 'Tickets' : 'Notes'}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {detailTab === 'activity' && (
                    <div className="space-y-3">
                      {timeline.length === 0 ? (
                        <p className="text-[13px] text-[#86868b] text-center py-8">Aucune activité</p>
                      ) : (
                        timeline.slice(0, 20).map(event => (
                          <div key={event.id} className="flex gap-3">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${event.type === 'ticket' ? 'bg-[#0a84ff]/10' : 'bg-[#2c2c2e]'}`}>
                              {event.type === 'ticket' ? <Ticket className="h-3.5 w-3.5 text-[#0a84ff]" /> : <MessageSquare className="h-3.5 w-3.5 text-[#86868b]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-[#f5f5f7] truncate">{event.title}</p>
                              {event.description && (
                                <p className="text-[12px] text-[#86868b] line-clamp-2 mt-0.5">{event.description}</p>
                              )}
                              <p className="text-[11px] text-[#48484a] mt-1">{timeAgo(event.date)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'tickets' && (
                    <div className="space-y-2">
                      {detail.recent_tickets.length === 0 ? (
                        <p className="text-[13px] text-[#86868b] text-center py-8">Aucun ticket</p>
                      ) : (
                        detail.recent_tickets.map(ticket => {
                          const statusColors: Record<string, string> = { open: '#0a84ff', pending: '#ff9f0a', resolved: '#30d158', closed: '#86868b' }
                          return (
                            <div key={ticket.id} className="rounded-xl bg-[#2c2c2e] p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-medium text-[#f5f5f7] truncate">{ticket.subject}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className="inline-block h-1.5 w-1.5 rounded-full"
                                      style={{ backgroundColor: statusColors[ticket.status] ?? '#86868b' }}
                                    />
                                    <span className="text-[11px] text-[#86868b] capitalize">{ticket.status}</span>
                                    <span className="text-[11px] text-[#48484a]">{ticket.channel}</span>
                                  </div>
                                </div>
                                <span className="text-[11px] text-[#48484a] shrink-0">{timeAgo(ticket.created_at)}</span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}

                  {detailTab === 'notes' && (
                    <div className="space-y-3">
                      <textarea
                        value={notesValue}
                        onChange={e => setNotesValue(e.target.value)}
                        rows={6}
                        placeholder="Ajoutez des notes sur ce client..."
                        className="w-full rounded-xl bg-[#2c2c2e] px-4 py-3 text-[14px] text-[#f5f5f7] outline-none placeholder:text-[#48484a] resize-none focus:ring-1 focus:ring-[#0a84ff]/50"
                      />
                      <button
                        onClick={handleSaveNotes}
                        className="rounded-xl bg-[#0a84ff] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#409cff] active:scale-[0.97]"
                      >
                        Enregistrer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[14px] text-[#86868b]">Client introuvable</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
