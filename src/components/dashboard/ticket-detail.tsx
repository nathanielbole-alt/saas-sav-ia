'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Mail,
  FileText,
  Star,
  Pen,
  Sparkles,
  Send,
  Clock,
  User,
  Inbox,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Phone,
  Paperclip,
  Smile,
  Bot,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import type { MockTicket } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { submitTicketFeedback } from '@/lib/actions/feedback'

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const time = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isToday) return `Aujourd'hui ${time}`
  if (isYesterday) return `Hier ${time}`
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${time}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

type RefundPreview = {
  id: string
  orderName: string
  refundedAmount: number | null
  refundedAt: string | null
  status: 'partiel' | 'total'
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function parseNumberish(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/[^0-9.-]/g, '')
    const parsed = Number.parseFloat(normalized)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function formatCurrencyAmount(value: number | null): string {
  if (value === null) return 'Montant inconnu'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatRefundDate(value: string | null): string {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date inconnue'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getRefundsPreview(
  customerMetadata: Record<string, unknown> | null
): { count: number; refunds: RefundPreview[] } | null {
  if (!customerMetadata) return null

  const orders = Array.isArray(customerMetadata.orders)
    ? customerMetadata.orders
    : []
  const refunds: RefundPreview[] = []

  for (const order of orders) {
    const orderRecord = toRecord(order)
    if (!orderRecord) continue

    const orderName =
      typeof orderRecord.name === 'string'
        ? orderRecord.name
        : 'Commande inconnue'
    const orderTotal = parseNumberish(orderRecord.total_price)
    const financialStatus =
      typeof orderRecord.financial_status === 'string'
        ? orderRecord.financial_status.toLowerCase()
        : ''

    const orderRefunds = Array.isArray(orderRecord.refunds)
      ? orderRecord.refunds
      : []

    for (const refund of orderRefunds) {
      const refundRecord = toRecord(refund)
      if (!refundRecord) continue

      const refundLineItems = Array.isArray(refundRecord.refund_line_items)
        ? refundRecord.refund_line_items
        : []

      const refundedAmount = refundLineItems.reduce((sum, lineItem) => {
        const lineItemRecord = toRecord(lineItem)
        if (!lineItemRecord) return sum

        const quantityValue = parseNumberish(lineItemRecord.quantity)
        const quantity = quantityValue ? Math.max(0, Math.floor(quantityValue)) : 0
        if (quantity <= 0) return sum

        const lineItemMeta = toRecord(lineItemRecord.line_item)
        const unitPrice = parseNumberish(lineItemMeta?.price)
        if (unitPrice === null) return sum

        return sum + unitPrice * quantity
      }, 0)

      const isTotalRefund =
        financialStatus === 'refunded' ||
        (orderTotal !== null && refundedAmount >= orderTotal - 0.01)

      refunds.push({
        id:
          typeof refundRecord.id === 'string' || typeof refundRecord.id === 'number'
            ? String(refundRecord.id)
            : `${orderName}-${refunds.length + 1}`,
        orderName,
        refundedAmount: refundedAmount > 0 ? refundedAmount : null,
        refundedAt:
          typeof refundRecord.created_at === 'string'
            ? refundRecord.created_at
            : null,
        status: isTotalRefund ? 'total' : 'partiel',
      })
    }
  }

  if (refunds.length === 0) return null

  const countFromMetadata = parseNumberish(customerMetadata.total_refunds_count)
  const count =
    countFromMetadata !== null ? Math.max(0, Math.floor(countFromMetadata)) : refunds.length

  const sortedRefunds = refunds.sort((a, b) => {
    const aTime = a.refundedAt ? new Date(a.refundedAt).getTime() : 0
    const bTime = b.refundedAt ? new Date(b.refundedAt).getTime() : 0
    return bTime - aTime
  })

  return {
    count,
    refunds: sortedRefunds.slice(0, 5),
  }
}

const statusConfig: Record<
  MockTicket['status'],
  { bg: string; text: string; icon: typeof AlertCircle; label: string }
> = {
  open: { bg: 'bg-[#30d158]/20 border border-[#30d158]/30 shadow-[0_0_10px_rgba(48,209,88,0.2)]', text: 'text-[#30d158]', icon: AlertCircle, label: 'Ouvert' },
  pending: { bg: 'bg-[#ff9f0a]/20 border border-[#ff9f0a]/30 shadow-[0_0_10px_rgba(255,159,10,0.2)]', text: 'text-[#ff9f0a]', icon: Clock, label: 'En attente' },
  resolved: { bg: 'bg-[#0a84ff]/20 border border-[#0a84ff]/30 shadow-[0_0_10px_rgba(10,132,255,0.2)]', text: 'text-[#0a84ff]', icon: CheckCircle2, label: 'Résolu' },
  closed: { bg: 'bg-white/10 border border-white/10', text: 'text-[#86868b]', icon: CheckCircle2, label: 'Fermé' },
}

const channelLabels: Record<MockTicket['channel'], { icon: typeof Mail; label: string }> = {
  email: { icon: Mail, label: 'Email' },
  form: { icon: FileText, label: 'Formulaire' },
  google_review: { icon: Star, label: 'Avis Google' },
  manual: { icon: Pen, label: 'Manuel' },
  instagram: { icon: Mail, label: 'Instagram DM' },
  messenger: { icon: Mail, label: 'Messenger' },
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center text-center mt-2 mb-4 mr-4 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 mb-5 shadow-sm">
        <Inbox className="h-7 w-7 text-[#86868b]" />
      </div>
      <h3 className="text-[17px] font-semibold text-white tracking-tight shadow-sm">Aucun ticket sélectionné</h3>
      <p className="mt-2 text-[13px] text-[#86868b] max-w-xs leading-relaxed">
        Sélectionnez une conversation dans la liste pour commencer.
      </p>
    </div>
  )
}

// ── Component ───────────────────────────────────────────────────────────────

export function TicketDetail({
  ticket,
  onSendMessage,
}: {
  ticket: MockTicket | null
  onSendMessage: (body: string) => void
}) {
  const [reply, setReply] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Feedback state
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages.length])

  if (!ticket) return <EmptyState />

  const status = statusConfig[ticket.status]
  const channel = channelLabels[ticket.channel]
  const ChannelIcon = channel.icon
  const StatusIcon = status.icon
  const refundsPreview = getRefundsPreview(ticket.customerMetadata)

  const handleSend = () => {
    if (!reply.trim()) return
    onSendMessage(reply)
    setReply('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFeedbackSubmit = async () => {
    if (selectedRating < 1 || !ticket) return
    setFeedbackSubmitting(true)
    const result = await submitTicketFeedback(ticket.id, selectedRating, feedbackComment || undefined)
    setFeedbackSubmitting(false)
    if (result.success) {
      setFeedbackSubmitted(true)
    }
  }

  const showFeedback =
    (ticket.status === 'resolved' || ticket.status === 'closed') &&
    ticket.csatRating == null &&
    !feedbackSubmitted

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden mt-2 mb-4 mr-4 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
      {/* Header */}
      <div className="shrink-0 border-b border-white/5 px-6 py-4 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-[17px] font-semibold text-white tracking-tight leading-none shadow-sm">
                {ticket.subject}
              </h2>
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wider",
                status.bg,
                status.text
              )}>
                <StatusIcon className="h-3.5 w-3.5 shadow-sm" />
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shadow-sm">
                  <User className="h-3.5 w-3.5 text-[#86868b]" />
                </div>
                <span className="text-[13px] font-medium text-white shadow-sm">{ticket.customer.name}</span>
                <span className="text-[12px] text-[#86868b]">{ticket.customer.email}</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-1.5 text-[12px] text-[#86868b]">
                <ChannelIcon className="h-3.5 w-3.5" />
                <span>via {channel.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button aria-label="Appeler" className="p-2.5 rounded-full bg-white/5 border border-white/5 text-[#86868b] hover:text-white hover:bg-white/10 shadow-sm transition-all duration-300">
              <Phone className="h-4 w-4" />
            </button>
            <button aria-label="Options" className="p-2.5 rounded-full bg-white/5 border border-white/5 text-[#86868b] hover:text-white hover:bg-white/10 shadow-sm transition-all duration-300">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {ticket.tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {ticket.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/20 border border-white/5 shadow-sm px-2.5 py-1 text-[11px] font-medium text-[#86868b]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages + Sidebar */}
      <div className="flex-1 overflow-hidden px-6 py-5">
        <div className="mx-auto flex h-full w-full max-w-[1320px] gap-5">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto space-y-5 scroll-smooth"
          >
            <div className="mx-auto max-w-3xl space-y-5">
              {ticket.messages.map((msg) => {
                const isMe = msg.senderType === 'agent'
                const isAI = msg.senderType === 'ai'

                return (
                  <div key={msg.id} className={cn(
                    "flex flex-col gap-1 w-full",
                    isMe ? "items-end" : "items-start"
                  )}>
                    {/* Timestamp & Sender (Hidden for 'me' unless requested, shown for Customer/AI) */}
                    {!isMe && (
                      <div className="flex items-center gap-2 px-1 mb-1">
                        <span className="text-[11px] font-medium text-[#86868b] pl-1">
                          {msg.senderName}
                          {isAI && <span className="ml-1 inline-flex items-center gap-0.5 text-[#bf5af2]"><Bot className="h-3 w-3" /> IA</span>}
                        </span>
                        <span className="text-[10px] text-[#555]">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    {isMe && (
                      <div className="flex items-center gap-2 px-1 mb-1">
                        <span className="text-[10px] text-[#555]">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* iOS Style Bubble */}
                    <div className={cn(
                      "px-4 py-2.5 text-[14px] leading-relaxed max-w-[85%] shadow-sm",
                      isMe
                        ? "rounded-2xl rounded-tr-sm bg-[#0a84ff] text-white"
                        : isAI
                          ? "rounded-2xl rounded-tl-sm bg-[#bf5af2]/20 border border-[#bf5af2]/30 text-white backdrop-blur-md"
                          : "rounded-2xl rounded-tl-sm bg-black/40 border border-white/5 text-white backdrop-blur-md"
                    )}>
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Refunds sidebar */}
          {refundsPreview ? (
            <aside className="hidden w-[300px] shrink-0 xl:block">
              <div className="space-y-3">
                <section className="rounded-2xl bg-black/20 border border-white/5 shadow-inner p-4 backdrop-blur-xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] shadow-sm">
                      Retours & Remboursements
                    </h3>
                    <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-[#ff9f0a]/20 border border-[#ff9f0a]/30 text-[10px] font-bold text-[#ff9f0a] shadow-[0_0_8px_rgba(255,159,10,0.3)]">
                      {refundsPreview.count}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {refundsPreview.refunds.map((refund) => (
                      <div
                        key={refund.id}
                        className="rounded-xl bg-white/5 border border-white/5 p-3 shadow-sm hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-white shadow-sm">
                            {refund.orderName}
                          </p>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider',
                              refund.status === 'total'
                                ? 'bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/30 shadow-[0_0_8px_rgba(48,209,88,0.3)]'
                                : 'bg-[#ff9f0a]/20 text-[#ff9f0a] border border-[#ff9f0a]/30 shadow-[0_0_8px_rgba(255,159,10,0.3)]'
                            )}
                          >
                            {refund.status === 'total' ? 'TOTAL' : 'PARTIEL'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] font-medium text-white shadow-sm">
                          {formatCurrencyAmount(refund.refundedAmount)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#86868b]">
                          {formatRefundDate(refund.refundedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </aside>
          ) : null}
        </div>
      </div>

      {/* Feedback Widget */}
      {showFeedback && (
        <div className="shrink-0 px-6 pb-2 z-20">
          <div className="max-w-3xl mx-auto rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-[#ff9f0a] fill-[#ff9f0a]" />
              <h4 className="text-[14px] font-semibold text-white shadow-sm">Comment évaluez-vous cette résolution ?</h4>
            </div>

            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      'h-7 w-7 transition-colors drop-shadow-md',
                      star <= (hoveredStar || selectedRating)
                        ? 'text-[#ff9f0a] fill-[#ff9f0a]'
                        : 'text-white/20'
                    )}
                  />
                </button>
              ))}
              {selectedRating > 0 && (
                <span className="ml-3 text-[12px] font-bold text-white shadow-sm">
                  {selectedRating}/5
                </span>
              )}
            </div>

            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Commentaire optionnel..."
              rows={2}
              className="w-full resize-none rounded-2xl bg-white/5 border border-white/5 px-4 py-3 text-[14px] text-white placeholder:text-[#86868b] outline-none focus:ring-1 focus:ring-[#0a84ff]/50 mb-4 transition-all duration-300"
            />

            <button
              onClick={handleFeedbackSubmit}
              disabled={selectedRating < 1 || feedbackSubmitting}
              className={cn(
                'flex items-center justify-center gap-2 rounded-full w-full py-3 text-[14px] font-semibold transition-all active:scale-95 shadow-sm',
                selectedRating >= 1 && !feedbackSubmitting
                  ? 'bg-[#0a84ff] text-white hover:bg-[#409cff] shadow-[0_0_15px_rgba(10,132,255,0.4)]'
                  : 'bg-white/10 text-[#86868b] cursor-not-allowed'
              )}
            >
              {feedbackSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <span>Envoyer le feedback</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Submitted confirmation */}
      {feedbackSubmitted && (
        <div className="shrink-0 px-6 pb-2 z-20">
          <div className="max-w-3xl mx-auto rounded-3xl bg-[#30d158]/10 border border-[#30d158]/30 backdrop-blur-xl p-4 text-center shadow-[0_0_15px_rgba(48,209,88,0.2)]">
            <CheckCircle2 className="h-6 w-6 text-[#30d158] mx-auto mb-2 drop-shadow-md" />
            <p className="text-[14px] font-semibold text-[#30d158] shadow-sm">Merci pour votre feedback !</p>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="shrink-0 p-5 z-30 bg-transparent mb-2">
        <div className="max-w-3xl mx-auto rounded-[32px] bg-black/40 backdrop-blur-3xl border border-white/15 shadow-2xl transition-all duration-300 focus-within:border-white/30 focus-within:bg-black/60 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez une réponse..."
            rows={1}
            className="w-full resize-none bg-transparent px-6 pt-5 pb-2 text-[15px] text-white outline-none placeholder:text-[#86868b] min-h-[72px]"
          />

          <div className="flex items-center justify-between px-5 py-3 mt-1">
            <div className="flex items-center gap-2">
              <button aria-label="Joindre un fichier" className="p-2.5 rounded-full text-[#86868b] hover:text-white hover:bg-white/10 transition-colors duration-300">
                <Paperclip className="h-5 w-5" />
              </button>
              <button aria-label="Emoji" className="p-2.5 rounded-full text-[#86868b] hover:text-white hover:bg-white/10 transition-colors duration-300">
                <Smile className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[12px] font-medium tracking-wide text-[#555] hidden sm:block">
                ⌘ + Entrée
              </span>
              <button
                onClick={handleSend}
                disabled={!reply.trim()}
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-full transition-all duration-300 active:scale-90",
                  reply.trim()
                    ? "bg-[#0a84ff] text-white hover:bg-[#409cff] shadow-[0_0_15px_rgba(10,132,255,0.5)]"
                    : "bg-white/10 text-[#555] cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4 relative right-[1px] top-[1px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
