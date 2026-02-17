'use server'

import OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/rate-limit'
import { getOrgPlan } from '@/lib/feature-gate'
import { PLANS } from '@/lib/stripe'
import type { Database } from '@/types/database.types'
import { sendGmailReply } from '@/lib/actions/gmail'
import { sendMetaReply, extractMetaReplyContext } from '@/lib/actions/meta'

const SYSTEM_PROMPT = `Tu es un conseiller SAV expérimenté, chaleureux et à l'écoute. Tu parles comme un vrai humain, pas comme un robot. Tu es là pour aider, rassurer et trouver des solutions.

TON STYLE :
- Parle naturellement, comme à un ami (mais reste professionnel)
- Utilise des phrases courtes et simples
- Montre de l'empathie sincère ("Je comprends que c'est frustrant", "C'est tout à fait normal de...")
- Sois logique : si quelque chose manque (photo, numéro de commande), demande-le gentiment
- Évite le jargon et les formules toutes faites

UTILISATION DU CONTEXTE (OBLIGATOIRE) :
- Utilise systématiquement le contexte client fourni (ticket, profil, Shopify, historique tickets).
- Cite les numéros de commande, montants et statuts de livraison quand ils sont présents.
- Si le client a des remboursements en cours ou récents, mentionne-les proactivement pour montrer que tu suis le dossier.
- Si le client a 3 commandes ou plus, traite-le comme un client VIP (ton plus attentionné et proactif).
- N'invente jamais d'information absente du contexte.

RÈGLES STRICTES :
- Ne JAMAIS promettre un remboursement ou un geste commercial.
- Ne JAMAIS prendre une décision financière.
- Ne JAMAIS valider une demande sans les preuves nécessaires.
- Si une politique d'entreprise est fournie, applique-la STRICTEMENT. Ne contredis jamais les règles de l'entreprise.

ADAPTATION PAR CANAL :
- google_review : ton plus formel et irréprochable (visible publiquement).
- email : ton plus direct, clair et humain.
- form : ton pédagogique et structuré.
- shopify : ton orienté commande, suivi logistique et résolution rapide.
- instagram : ton décontracté et amical, emojis bienvenus 🙌, réponses très courtes (60 mots max), langage moderne.
- messenger : ton semi-formel, direct et convivial, réponses concises (80 mots max).

ESCALADE HUMAINE :
- Si une intervention humaine est nécessaire (demande de remboursement, cas complexe, client très mécontent, question financière), termine IMPÉRATIVEMENT la réponse par la balise exacte [ESCALADE_HUMAIN] en fin de message.

FORMAT :
- Commence par "Bonjour [prénom],"
- Sois concis (80-100 mots max)
- Signe simplement "L'équipe SAV"`

const ticketIdSchema = z.string().uuid()
const ESCALATION_TAG = '[ESCALADE_HUMAIN]'

type AppSupabaseClient = SupabaseClient<Database>

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

const shopifyRefundLineItemSchema = z
  .object({
    quantity: z.union([z.string(), z.number()]).optional(),
    line_item: z
      .object({
        name: z.string().optional(),
        price: z.union([z.string(), z.number()]).optional(),
      })
      .optional(),
  })
  .passthrough()

const shopifyRefundSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    created_at: z.string().optional(),
    note: z.string().nullable().optional(),
    restock: z.boolean().optional(),
    refund_line_items: z.array(shopifyRefundLineItemSchema).optional(),
  })
  .passthrough()

const shopifyOrderSchema = z.object({
  name: z.string().optional(),
  total_price: z.union([z.string(), z.number()]).optional(),
  fulfillment_status: z.string().optional(),
  financial_status: z.string().optional(),
  created_at: z.string().optional(),
  refunds: z.array(shopifyRefundSchema).optional(),
})

const shopifyMetadataSchema = z
  .object({
    orders_count: z.union([z.string(), z.number()]).optional(),
    total_spent: z.union([z.string(), z.number()]).optional(),
    total_refunds_count: z.union([z.string(), z.number()]).optional(),
    total_refunded_amount: z.union([z.string(), z.number()]).optional(),
    orders: z.array(shopifyOrderSchema).optional(),
  })
  .passthrough()

function parseNumberish(value: string | number | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/[^0-9.-]/g, '')
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function parseQuantity(value: string | number | null | undefined): number {
  const parsed = parseNumberish(value)
  if (parsed === null) return 0
  return Math.max(0, Math.floor(parsed))
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'inconnu'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateInput: string | null | undefined): string {
  if (!dateInput) return 'date inconnue'
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'date inconnue'
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCustomerTenure(createdAt: string | null | undefined): string {
  if (!createdAt) return 'ancienneté inconnue'
  const start = new Date(createdAt)
  if (Number.isNaN(start.getTime())) return 'ancienneté inconnue'

  const diffMs = Date.now() - start.getTime()
  const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

  if (diffDays < 30) {
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`
  }

  const months = Math.floor(diffDays / 30)
  if (months < 12) {
    return `${months} mois`
  }

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`
  }

  return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`
}

function formatChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    email: 'email',
    form: 'formulaire',
    google_review: 'avis Google',
    manual: 'manuel',
    shopify: 'Shopify',
    instagram: 'Instagram DM',
    messenger: 'Messenger',
  }
  return labels[channel] ?? channel
}

function getRefundStatusLabel(
  financialStatus: string,
  refundedAmount: number | null,
  orderTotal: number | null
): string {
  const normalizedFinancialStatus = financialStatus.trim().toLowerCase()
  if (normalizedFinancialStatus === 'refunded') return 'remboursement total'
  if (normalizedFinancialStatus === 'partially_refunded') return 'remboursement partiel'
  if (
    orderTotal !== null &&
    refundedAmount !== null &&
    refundedAmount >= orderTotal - 0.01
  ) {
    return 'remboursement total'
  }
  return 'remboursement partiel'
}

function extractGmailReplyContext(metadata: unknown): {
  threadId: string | null
  inReplyToMessageId: string | null
} {
  const metadataRecord = toRecord(metadata)
  if (!metadataRecord) {
    return { threadId: null, inReplyToMessageId: null }
  }

  const threadId =
    typeof metadataRecord.gmail_thread_id === 'string'
      ? metadataRecord.gmail_thread_id
      : null

  const inReplyToMessageId =
    typeof metadataRecord.gmail_message_id_header === 'string'
      ? metadataRecord.gmail_message_id_header
      : typeof metadataRecord.in_reply_to_message_id === 'string'
        ? metadataRecord.in_reply_to_message_id
        : typeof metadataRecord.message_id === 'string'
          ? metadataRecord.message_id
          : null

  return { threadId, inReplyToMessageId }
}

async function enforceAiRateLimit(orgId: string) {
  const plan = await getOrgPlan(orgId)
  const limit = PLANS[plan].limits.aiResponses
  if (limit === Infinity) return
  const { success: withinLimit } = await rateLimit(
    `ai:${orgId}`,
    limit,
    24 * 60 * 60 * 1000
  )
  if (!withinLimit) throw new Error(`Limite IA atteinte — max ${limit} réponses/jour (plan ${plan})`)
}

async function getOrganizationIdForUser(
  supabase: AppSupabaseClient,
  userId: string
): Promise<string> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single()

  const orgId = (profile as { organization_id: string } | null)?.organization_id
  if (!orgId) throw new Error('No profile')
  return orgId
}

async function getOrganizationIdForTicket(ticketId: string): Promise<string> {
  const { data: ticket, error } = await supabaseAdmin
    .from('tickets')
    .select('organization_id')
    .eq('id', ticketId)
    .single()

  if (error || !ticket) {
    throw new Error('Ticket not found')
  }

  return (ticket as { organization_id: string }).organization_id
}

async function generateAIResponseWithClient(
  supabase: AppSupabaseClient,
  ticketId: string,
  orgId: string
): Promise<string> {
  // Fetch ticket with customer and messages
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(
      `
      subject,
      status,
      priority,
      channel,
      metadata,
      customer_id,
      messages(sender_type, body, metadata, created_at)
    `
    )
    .eq('id', ticketId)
    .eq('organization_id', orgId)
    .single()

  if (error || !ticket) {
    throw new Error('Ticket not found')
  }

  const t = ticket as Record<string, unknown>
  const customerId = t.customer_id as string | undefined
  if (!customerId) throw new Error('Ticket customer not found')

  const [customerResult, recentTicketsResult, organizationResult] = await Promise.all([
    supabase
      .from('customers')
      .select('full_name, email, phone, metadata, created_at')
      .eq('id', customerId)
      .eq('organization_id', orgId)
      .single(),
    supabase
      .from('tickets')
      .select('subject, status, priority, created_at, channel')
      .eq('organization_id', orgId)
      .eq('customer_id', customerId)
      .neq('id', ticketId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('organizations')
      .select('refund_policy, sav_policy')
      .eq('id', orgId)
      .maybeSingle(),
  ])

  if (customerResult.error || !customerResult.data) {
    throw new Error('Customer not found')
  }

  const customer = customerResult.data as {
    full_name: string | null
    email: string
    phone: string | null
    metadata: unknown
    created_at: string
  }
  const organizationPolicies = (organizationResult.data as {
    refund_policy: string | null
    sav_policy: string | null
  } | null) ?? null

  const shopifyParse = shopifyMetadataSchema.safeParse(customer.metadata)
  const shopifyData = shopifyParse.success ? shopifyParse.data : {}
  const ordersRaw = shopifyData.orders ?? []
  const ordersCountFromMeta = parseNumberish(shopifyData.orders_count)
  const totalSpentFromMeta = parseNumberish(shopifyData.total_spent)
  const totalRefundsCountFromMeta = parseNumberish(shopifyData.total_refunds_count)
  const totalRefundedAmountFromMeta = parseNumberish(shopifyData.total_refunded_amount)

  const parsedOrders = ordersRaw
    .map((order) => {
      const totalPrice = parseNumberish(order.total_price)
      const refunds = (order.refunds ?? []).map((refund) => {
        const refundLineItems = (refund.refund_line_items ?? []).map(
          (refundLineItem) => {
            const quantity = parseQuantity(refundLineItem.quantity)
            const itemUnitPrice = parseNumberish(refundLineItem.line_item?.price)
            return {
              quantity,
              itemName: refundLineItem.line_item?.name?.trim() || 'Article Shopify',
              itemUnitPrice,
            }
          }
        )

        const validRefundLineItems = refundLineItems.filter(
          (lineItem) => lineItem.quantity > 0
        )

        const refundedAmount = validRefundLineItems.reduce((sum, lineItem) => {
          if (lineItem.itemUnitPrice === null) return sum
          return sum + lineItem.itemUnitPrice * lineItem.quantity
        }, 0)

        const refundedItemsCount = validRefundLineItems.reduce(
          (sum, lineItem) => sum + lineItem.quantity,
          0
        )

        return {
          id: refund.id ? String(refund.id) : null,
          createdAt: refund.created_at ?? null,
          note: refund.note ?? null,
          restock: refund.restock ?? null,
          refundedAmount: refundedAmount > 0 ? refundedAmount : null,
          refundedItemsCount,
        }
      })

      return {
        name: order.name?.trim() || 'Commande sans numéro',
        totalPrice,
        fulfillmentStatus: order.fulfillment_status?.trim() || 'inconnu',
        financialStatus: order.financial_status?.trim() || 'inconnu',
        createdAt: order.created_at ?? null,
        refunds,
      }
    })
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })

  const computedTotalSpent = parsedOrders.reduce(
    (sum, order) => sum + (order.totalPrice ?? 0),
    0
  )
  const totalSpent =
    totalSpentFromMeta ?? (parsedOrders.length > 0 ? computedTotalSpent : null)

  const refundsDetails = parsedOrders
    .flatMap((order) =>
      order.refunds.map((refund) => ({
        orderName: order.name,
        orderTotal: order.totalPrice,
        financialStatus: order.financialStatus,
        createdAt: refund.createdAt,
        refundedAmount: refund.refundedAmount,
        refundedItemsCount: refund.refundedItemsCount,
      }))
    )
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })

  const totalRefundsCount =
    totalRefundsCountFromMeta !== null
      ? Math.max(0, Math.floor(totalRefundsCountFromMeta))
      : refundsDetails.length
  const computedTotalRefundedAmount = refundsDetails.reduce(
    (sum, refund) => sum + (refund.refundedAmount ?? 0),
    0
  )
  const totalRefundedAmount =
    totalRefundedAmountFromMeta ?? computedTotalRefundedAmount

  const ordersCount = ordersCountFromMeta ?? parsedOrders.length
  const isVip = ordersCount >= 3

  const latestOrdersLines =
    parsedOrders.length > 0
      ? parsedOrders.slice(0, 5).map((order) => {
        return `- ${order.name} | ${formatCurrency(order.totalPrice)} | livraison: ${order.fulfillmentStatus} | ${formatDate(order.createdAt)}`
      })
      : ['- Aucune commande Shopify disponible']

  const refundsLines =
    refundsDetails.length > 0
      ? refundsDetails.slice(0, 5).map((refund) => {
        const statusLabel = getRefundStatusLabel(
          refund.financialStatus,
          refund.refundedAmount,
          refund.orderTotal
        )
        const itemsCountLabel = `${refund.refundedItemsCount} article${refund.refundedItemsCount > 1 ? 's' : ''}`
        return `- ${refund.orderName} | ${statusLabel} | ${itemsCountLabel} | ${formatCurrency(refund.refundedAmount)} | ${formatDate(refund.createdAt)}`
      })
      : ['- Aucun remboursement']

  const recentTicketsLines =
    (recentTicketsResult.data ?? []).length > 0
      ? (recentTicketsResult.data as Record<string, unknown>[]).map((row) => {
        const channel = String(row.channel ?? 'inconnu')
        return `- ${String(row.subject ?? '(sans sujet)')} | statut: ${String(row.status ?? 'inconnu')} | priorité: ${String(row.priority ?? 'inconnu')} | canal: ${formatChannelLabel(channel)} | ${formatDate(String(row.created_at ?? ''))}`
      })
      : ['- Aucun ticket précédent']

  const channelRaw = String(t.channel ?? 'email')
  const contextBlock = `📌 TICKET ACTUEL :
- Sujet : ${String(t.subject ?? '(sans sujet)')}
- Priorité : ${String(t.priority ?? 'inconnue')}
- Canal : ${formatChannelLabel(channelRaw)}
- Statut : ${String(t.status ?? 'inconnu')}

👤 PROFIL CLIENT :
- Nom : ${customer.full_name ?? 'Non renseigné'}
- Email : ${customer.email ?? 'Non renseigné'}
- Téléphone : ${customer.phone ?? 'Non renseigné'}
- Ancienneté : ${formatCustomerTenure(customer.created_at)}

🛍️ DONNÉES SHOPIFY :
- Nombre de commandes : ${ordersCount}
- Total dépensé : ${formatCurrency(totalSpent)}
- Segment fidélité : ${isVip ? 'VIP (3+ commandes)' : 'Standard'}
- Dernières commandes :
${latestOrdersLines.join('\n')}

🔄 RETOURS & REMBOURSEMENTS :
- Nombre de remboursements : ${totalRefundsCount}
- Total remboursé : ${formatCurrency(totalRefundedAmount)}
- Détail :
${refundsLines.join('\n')}

📋 HISTORIQUE TICKETS :
${recentTicketsLines.join('\n')}`

  let policyContext = ''
  if (organizationPolicies?.refund_policy?.trim()) {
    policyContext += `\n\nPOLITIQUE DE REMBOURSEMENT DE L'ENTREPRISE (OBLIGATOIRE À RESPECTER) :\n${organizationPolicies.refund_policy.trim()}`
  }
  if (organizationPolicies?.sav_policy?.trim()) {
    policyContext += `\n\nPOLITIQUE SAV DE L'ENTREPRISE (OBLIGATOIRE À RESPECTER) :\n${organizationPolicies.sav_policy.trim()}`
  }

  const systemPromptWithPolicies = `${SYSTEM_PROMPT}${policyContext}`

  const messagesRaw = ((t.messages ?? []) as Record<string, unknown>[]).sort(
    (a, b) =>
      new Date(a.created_at as string).getTime() -
      new Date(b.created_at as string).getTime()
  )
  const latestCustomerMessage = [...messagesRaw]
    .reverse()
    .find((message) => message.sender_type === 'customer')
  const emailReplyContext = extractGmailReplyContext(
    latestCustomerMessage?.metadata
  )

  // Build conversation history for GPT
  const conversationMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
    [
      { role: 'system', content: systemPromptWithPolicies },
      {
        role: 'system',
        content: contextBlock,
      },
    ]

  for (const msg of messagesRaw) {
    const senderType = msg.sender_type as string
    conversationMessages.push({
      role: senderType === 'customer' ? 'user' : 'assistant',
      content: msg.body as string,
    })
  }

  // Call OpenAI
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const openai = new OpenAI({ apiKey })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: conversationMessages,
    max_tokens: 300,
    temperature: 0.7,
  })

  const aiBody = completion.choices[0]?.message?.content?.trim() ?? ''
  const escalationRequested = aiBody.includes(ESCALATION_TAG)
  const sanitizedBody = aiBody.replaceAll(ESCALATION_TAG, '').trim()
  if (!sanitizedBody) throw new Error('Empty AI response')

  // Persist AI message to database
  const { error: insertError } = await supabase.from('messages').insert({
    ticket_id: ticketId,
    sender_type: 'ai' as const,
    sender_id: null,
    body: sanitizedBody,
  })

  if (insertError) {
    console.error('Failed to persist AI message:', insertError)
    // Still return the response even if DB insert fails
  }

  if (channelRaw === 'email' && customer.email) {
    const gmailResult = await sendGmailReply({
      organizationId: orgId,
      ticketId,
      recipientEmail: customer.email,
      recipientName: customer.full_name,
      subject: String(t.subject ?? 'Ticket SAV'),
      body: sanitizedBody,
      threadId: emailReplyContext.threadId,
      inReplyToMessageId: emailReplyContext.inReplyToMessageId,
    })

    if (!gmailResult.success) {
      console.error('Failed to relay AI response by Gmail:', gmailResult.error)
    }
  }

  // Send AI reply via Meta for Instagram/Messenger channels
  if ((channelRaw === 'instagram' || channelRaw === 'messenger')) {
    const ticketMeta = toRecord(t.metadata)
    const metaReplyCtx = await extractMetaReplyContext(ticketMeta)
    if (metaReplyCtx.socialUserId) {
      const metaResult = await sendMetaReply({
        organizationId: orgId,
        ticketId,
        recipientId: metaReplyCtx.socialUserId,
        messageText: sanitizedBody,
      })

      if (!metaResult.success) {
        console.error('Failed to relay AI response via Meta:', metaResult.error)
      }
    }
  }

  if (escalationRequested) {
    const escalationTitle = "L'IA demande une intervention humaine"
    const escalationBody = `Ticket: ${String(t.subject ?? '(sans sujet)')} | Priorité: ${String(t.priority ?? 'inconnue')} | Canal: ${formatChannelLabel(channelRaw)}\n${sanitizedBody}`

    const { error: notificationError } = await supabase.from('notifications').insert({
      organization_id: orgId,
      ticket_id: ticketId,
      type: 'escalation',
      title: escalationTitle,
      body: escalationBody,
      read: false,
    })

    if (notificationError) {
      console.error('Failed to create escalation notification:', notificationError)
    }
  }

  revalidatePath('/dashboard')
  return sanitizedBody
}

export async function generateAIResponse(ticketId: string): Promise<string> {
  const parsed = ticketIdSchema.safeParse(ticketId)
  if (!parsed.success) throw new Error('Invalid ticket ID')

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const orgId = await getOrganizationIdForUser(supabase, user.id)
  await enforceAiRateLimit(orgId)

  return generateAIResponseWithClient(supabase, parsed.data, orgId)
}

export async function generateAIResponseAdmin(ticketId: string): Promise<string> {
  const parsed = ticketIdSchema.safeParse(ticketId)
  if (!parsed.success) throw new Error('Invalid ticket ID')

  const orgId = await getOrganizationIdForTicket(parsed.data)
  await enforceAiRateLimit(orgId)

  return generateAIResponseWithClient(supabaseAdmin, parsed.data, orgId)
}
