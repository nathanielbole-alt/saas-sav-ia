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
  open: { bg: 'bg-[#30d158]/10', text: 'text-[#30d158]', icon: AlertCircle, label: 'Ouvert' },
  pending: { bg: 'bg-[#ffd60a]/10', text: 'text-[#ffd60a]', icon: Clock, label: 'En attente' },
  resolved: { bg: 'bg-[#E8856C]/10', text: 'text-[#E8856C]', icon: CheckCircle2, label: 'Résolu' },
  closed: { bg: 'bg-[white/[0.02]]', text: 'text-[#888]', icon: CheckCircle2, label: 'Fermé' },
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
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#131316] mb-5">
        <Inbox className="h-7 w-7 text-[#555]" />
      </div>
      <h3 className="text-[17px] font-semibold text-[#EDEDED] tracking-tight">Aucun ticket sélectionné</h3>
      <p className="mt-2 text-[13px] text-[#888] max-w-xs leading-relaxed">
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
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#0B0B0F]">
      {/* Header */}
      <div className="shrink-0 border-b border-[white/[0.06]] px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-[17px] font-semibold text-[#EDEDED] tracking-tight leading-none">
                {ticket.subject}
              </h2>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
                status.bg,
                status.text
              )}>
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-[#1A1A1F] flex items-center justify-center">
                  <User className="h-3 w-3 text-[#888]" />
                </div>
                <span className="text-[13px] font-medium text-[#EDEDED]">{ticket.customer.name}</span>
                <span className="text-[12px] text-[#555]">{ticket.customer.email}</span>
              </div>
              <div className="w-px h-3 bg-[white/[0.06]]" />
              <div className="flex items-center gap-1.5 text-[12px] text-[#555]">
                <ChannelIcon className="h-3 w-3" />
                <span>via {channel.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button aria-label="Appeler" className="p-2 rounded-lg bg-[#131316] text-[#888] hover:text-[#EDEDED] transition-colors duration-150">
              <Phone className="h-4 w-4" />
            </button>
            <button aria-label="Options" className="p-2 rounded-lg bg-[#131316] text-[#888] hover:text-[#EDEDED] transition-colors duration-150">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {ticket.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {ticket.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[white/[0.02]] px-2 py-0.5 text-[11px] text-[#888]"
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
                  <div key={msg.id} className="group">
                    {/* Sender info */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                        isMe
                          ? "bg-[#E8856C] text-white"
                          : isAI
                            ? "bg-[#E8856C]/15 text-[#E8856C]"
                            : "bg-[#1A1A1F] text-[#888]"
                      )}>
                        {isAI ? <Sparkles className="h-3.5 w-3.5" /> : getInitials(msg.senderName)}
                      </div>
                      <span className="text-[13px] font-medium text-[#EDEDED]">
                        {msg.senderName}
                      </span>
                      {isAI && (
                        <span className="flex items-center gap-1 rounded-md bg-[#E8856C]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#E8856C]">
                          <Bot className="h-2.5 w-2.5" />
                          IA
                        </span>
                      )}
                      <span className="text-[11px] text-[#555]">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>

                    {/* Message body — linear layout, not bubbles */}
                    <div className={cn(
                      "ml-[36px] rounded-xl p-4 text-[14px] leading-relaxed",
                      isMe
                        ? "bg-[#131316] text-[#EDEDED]"
                        : isAI
                          ? "bg-[#E8856C]/[0.06] border border-[#E8856C]/10 text-[#EDEDED]"
                          : "bg-[#131316] text-[#EDEDED]"
                    )}>
                      <p className="whitespace-pre-line">{msg.body}</p>
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
                <section className="rounded-xl bg-[#131316] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#888]">
                      Retours & Remboursements
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-[#ffd60a]/10 px-2 py-0.5 text-[11px] font-medium text-[#ffd60a]">
                      {refundsPreview.count}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {refundsPreview.refunds.map((refund) => (
                      <div
                        key={refund.id}
                        className="rounded-lg bg-[#1A1A1F] p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium text-[#EDEDED]">
                            {refund.orderName}
                          </p>
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                              refund.status === 'total'
                                ? 'bg-[#30d158]/10 text-[#30d158]'
                                : 'bg-[#ffd60a]/10 text-[#ffd60a]'
                            )}
                          >
                            {refund.status === 'total' ? 'TOTAL' : 'PARTIEL'}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] font-medium text-[#888]">
                          {formatCurrencyAmount(refund.refundedAmount)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#555]">
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
          <div className="max-w-3xl mx-auto rounded-xl bg-[#131316] p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-[#ffd60a]" />
              <h4 className="text-[13px] font-medium text-[#EDEDED]">Comment évaluez-vous cette résolution ?</h4>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedRating(star)}
                  className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      'h-6 w-6 transition-colors',
                      star <= (hoveredStar || selectedRating)
                        ? 'text-[#ffd60a] fill-[#ffd60a]'
                        : 'text-[#555]'
                    )}
                  />
                </button>
              ))}
              {selectedRating > 0 && (
                <span className="ml-2 text-[11px] text-[#888]">
                  {selectedRating}/5
                </span>
              )}
            </div>

            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Commentaire optionnel..."
              rows={2}
              className="w-full resize-none rounded-lg bg-[#1A1A1F] px-3 py-2 text-[13px] text-[#EDEDED] placeholder:text-[#555] outline-none focus:ring-1 focus:ring-[#E8856C]/50 mb-3 transition-all duration-150"
            />

            <button
              onClick={handleFeedbackSubmit}
              disabled={selectedRating < 1 || feedbackSubmitting}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all active:scale-95',
                selectedRating >= 1 && !feedbackSubmitting
                  ? 'bg-[#E8856C] text-white hover:bg-[#E8856C]'
                  : 'bg-[#1A1A1F] text-[#555] cursor-not-allowed'
              )}
            >
              {feedbackSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
          <div className="max-w-3xl mx-auto rounded-xl bg-[#30d158]/[0.06] border border-[#30d158]/10 p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-[#30d158] mx-auto mb-1.5" />
            <p className="text-[13px] text-[#30d158]">Merci pour votre feedback !</p>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="shrink-0 p-5 z-30">
        <div className="max-w-3xl mx-auto rounded-xl bg-[#131316] transition-all duration-150 focus-within:ring-1 focus-within:ring-[#E8856C]/30">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez une réponse..."
            rows={1}
            className="w-full resize-none bg-transparent px-5 py-4 text-[14px] text-[#EDEDED] outline-none placeholder:text-[#555] min-h-[72px]"
          />

          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[white/[0.04]]">
            <div className="flex items-center gap-1">
              <button aria-label="Joindre un fichier" className="p-2 rounded-lg text-[#555] hover:text-[#888] hover:bg-[white/[0.04]] transition-colors duration-150">
                <Paperclip className="h-4 w-4" />
              </button>
              <button aria-label="Emoji" className="p-2 rounded-lg text-[#555] hover:text-[#888] hover:bg-[white/[0.04]] transition-colors duration-150">
                <Smile className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#555] hidden sm:block">
                ⌘ + Enter
              </span>
              <button
                onClick={handleSend}
                disabled={!reply.trim()}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-1.5 text-[13px] font-medium transition-all duration-150 active:scale-95",
                  reply.trim()
                    ? "bg-[#E8856C] text-white hover:bg-[#E8856C]"
                    : "bg-[#1A1A1F] text-[#555] cursor-not-allowed"
                )}
              >
                <span>Envoyer</span>
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
