'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/rate-limit'
import {
  getIntegrationStatus,
  disconnectIntegration,
} from '@/lib/actions/integrations'
import { decrypt } from '@/lib/encryption'
import type { Integration, Json } from '@/types/database.types'
import { triggerAutoReply } from '@/lib/ai/auto-reply'
import { checkFeatureAccess } from '@/lib/feature-gate'

const SHOPIFY_API_VERSION = '2024-01'

type ShopifyOrderRefundLineItem = {
  quantity: number | null
  restock_type?: string | null
  line_item?: {
    name?: string | null
    price?: string | null
  } | null
}

type ShopifyOrderRefund = {
  id: number
  created_at: string
  note: string | null
  refund_line_items?: ShopifyOrderRefundLineItem[] | null
}

type ShopifyOrderRefundsResponse = {
  refunds?: ShopifyOrderRefund[]
}

type StoredRefundLineItem = {
  quantity: number
  line_item: {
    name: string
    price: string
  }
}

type StoredRefund = {
  id: number
  created_at: string
  note: string | null
  restock: boolean
  refund_line_items: StoredRefundLineItem[]
}

type StoredOrder = {
  name: string
  total_price: string
  fulfillment_status: string | null
  financial_status: string
  created_at: string
  refunds: StoredRefund[]
}

type CustomerOrdersAggregation = {
  customerId: string
  baseMetadata: Record<string, unknown>
  orders: StoredOrder[]
  totalSpent: number
  totalRefundsCount: number
  totalRefundedAmount: number
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/[^0-9.-]/g, '')
    const parsed = Number.parseFloat(normalized)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function parseQuantity(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

async function fetchOrderRefunds(
  shop: string,
  accessToken: string,
  orderId: number
): Promise<StoredRefund[]> {
  const response = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders/${orderId}/refunds.json`,
    {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`refunds_http_${response.status}`)
  }

  const payload = (await response.json()) as ShopifyOrderRefundsResponse
  const refunds = payload.refunds ?? []

  return refunds.map((refund) => {
    const rawLineItems = refund.refund_line_items ?? []

    const refundLineItems = rawLineItems
      .map((lineItem) => {
        const quantity = parseQuantity(lineItem.quantity)
        if (quantity <= 0) return null

        const unitPrice = formatMoney(parseMoney(lineItem.line_item?.price))
        return {
          quantity,
          line_item: {
            name: lineItem.line_item?.name?.trim() || 'Article Shopify',
            price: unitPrice,
          },
        }
      })
      .filter((lineItem): lineItem is StoredRefundLineItem => lineItem !== null)

    const restock = rawLineItems.some(
      (lineItem) => lineItem.restock_type !== 'no_restock'
    )

    return {
      id: refund.id,
      created_at: refund.created_at,
      note: refund.note ?? null,
      restock,
      refund_line_items: refundLineItems,
    }
  })
}

function getShopFromMetadata(metadata: unknown): string | null {
  if (
    typeof metadata === 'object' &&
    metadata !== null &&
    'shop' in metadata &&
    typeof (metadata as Record<string, unknown>).shop === 'string'
  ) {
    return (metadata as Record<string, unknown>).shop as string
  }
  return null
}

/** Shared helper: auth + org + rate limit + integration */
async function getShopifyContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'No profile' as const }

  const role = (profile as { role?: string })?.role
  if (role !== 'owner' && role !== 'admin') {
    return {
      error: 'Seuls les propriétaires et administrateurs peuvent synchroniser' as const,
    }
  }

  const orgId = (profile as unknown as { organization_id: string })
    .organization_id

  // Rate limit: max 1 sync per 5 minutes per org
  const { success: withinLimit } = await rateLimit(
    `shopify-sync:${orgId}`,
    1,
    5 * 60 * 1000
  )
  if (!withinLimit)
    return { error: 'Rate limit — wait 5 minutes' as const }

  // Get Shopify integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('provider', 'shopify')
    .eq('status', 'active')
    .single()

  if (!integration)
    return { error: 'Shopify not connected' as const }

  const int = integration as Integration
  const shop = getShopFromMetadata(int.metadata)
  if (!shop) return { error: 'Invalid Shopify metadata' as const }
  const accessToken = int.access_token ? decrypt(int.access_token) : null
  if (!accessToken) return { error: 'Shopify token missing' as const }

  return { supabase, orgId, integration: int, shop, accessToken }
}

export async function syncShopifyCustomers(): Promise<{
  success: boolean
  count: number
  error?: string
}> {
  const ctx = await getShopifyContext()
  if ('error' in ctx) {
    return { success: false, count: 0, error: ctx.error }
  }

  const { supabase, orgId, integration, shop, accessToken } = ctx

  try {
    const response = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/customers.json?limit=50`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await supabase
          .from('integrations')
          .update({ status: 'error', updated_at: new Date().toISOString() })
          .eq('id', integration.id)
      }
      return { success: false, count: 0, error: 'Shopify API error' }
    }

    const data = (await response.json()) as {
      customers: Array<{
        id: number
        email: string | null
        first_name: string | null
        last_name: string | null
        phone: string | null
      }>
    }

    let importedCount = 0

    for (const shopifyCustomer of data.customers) {
      if (!shopifyCustomer.email) continue

      // Find or create customer (same pattern as Gmail)
      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', shopifyCustomer.email)
        .limit(1)

      if (existingCustomers && existingCustomers.length > 0) continue

      const fullName =
        [shopifyCustomer.first_name, shopifyCustomer.last_name]
          .filter(Boolean)
          .join(' ') || null

      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          organization_id: orgId,
          email: shopifyCustomer.email,
          full_name: fullName,
          phone: shopifyCustomer.phone,
          metadata: { shopify_id: shopifyCustomer.id },
        })

      if (!insertError) importedCount++
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/customers')
    revalidatePath('/dashboard/settings')

    return { success: true, count: importedCount }
  } catch (err) {
    console.error(
      'Shopify customers sync error:',
      err instanceof Error ? err.message : 'Unknown'
    )
    return { success: false, count: 0, error: 'Sync failed' }
  }
}

export async function syncShopifyOrders(): Promise<{
  success: boolean
  count: number
  error?: string
}> {
  const ctx = await getShopifyContext()
  if ('error' in ctx) {
    return { success: false, count: 0, error: ctx.error }
  }

  const { supabase, orgId, integration, shop, accessToken } = ctx

  // Check ticket quota before syncing orders (each order creates a ticket)
  const ticketCheck = await checkFeatureAccess(orgId, 'tickets')
  if (!ticketCheck.allowed) {
    return { success: false, count: 0, error: `Limite tickets atteinte (${ticketCheck.current}/${ticketCheck.limit}). Passez à un plan supérieur.` }
  }

  try {
    const response = await fetch(
      `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json?limit=50&status=any`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await supabase
          .from('integrations')
          .update({ status: 'error', updated_at: new Date().toISOString() })
          .eq('id', integration.id)
      }
      return { success: false, count: 0, error: 'Shopify API error' }
    }

    const data = (await response.json()) as {
      orders: Array<{
        id: number
        name: string // e.g. "#1001"
        email: string | null
        created_at: string
        total_price: string
        financial_status: string
        fulfillment_status: string | null
        customer: {
          id: number
          email: string | null
          first_name: string | null
          last_name: string | null
        } | null
      }>
    }

    let importedCount = 0
    const customerOrdersMap = new Map<string, CustomerOrdersAggregation>()

    for (const order of data.orders) {
      const customerEmail = order.email ?? order.customer?.email
      if (!customerEmail) continue

      const shopifyOrderId = String(order.id)
      let refunds: StoredRefund[] = []

      try {
        refunds = await fetchOrderRefunds(shop, accessToken, order.id)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'refunds_failed'
        if (
          message.includes('refunds_http_401') ||
          message.includes('refunds_http_403')
        ) {
          await supabase
            .from('integrations')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', integration.id)
          return { success: false, count: 0, error: 'Shopify API error' }
        }

        console.error(
          `Shopify refunds fetch failed for order ${order.id}:`,
          message
        )
      }

      // Find or create customer
      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('id, metadata')
        .eq('organization_id', orgId)
        .eq('email', customerEmail)
        .limit(1)

      let customerId: string
      let customerMetadata: Record<string, unknown> = {}

      if (existingCustomers && existingCustomers.length > 0) {
        const existingCustomer = existingCustomers[0] as {
          id: string
          metadata: unknown
        }
        customerId = existingCustomer.id
        customerMetadata = toRecord(existingCustomer.metadata) ?? {}
      } else {
        const fullName = order.customer
          ? [order.customer.first_name, order.customer.last_name]
              .filter(Boolean)
              .join(' ') || null
          : null

        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            organization_id: orgId,
            email: customerEmail,
            full_name: fullName,
            metadata: order.customer?.id
              ? { shopify_id: order.customer.id }
              : null,
          })
          .select('id, metadata')
          .single()

        if (!newCustomer) continue
        const createdCustomer = newCustomer as { id: string; metadata: unknown }
        customerId = createdCustomer.id
        customerMetadata = toRecord(createdCustomer.metadata) ?? {}
      }

      const normalizedOrder: StoredOrder = {
        name: order.name,
        total_price: formatMoney(parseMoney(order.total_price)),
        fulfillment_status: order.fulfillment_status,
        financial_status: order.financial_status,
        created_at: order.created_at,
        refunds,
      }

      const refundAmountForOrder = normalizedOrder.refunds.reduce(
        (sum, refund) =>
          sum +
          refund.refund_line_items.reduce(
            (lineItemsSum, lineItem) =>
              lineItemsSum +
              parseMoney(lineItem.line_item.price) * lineItem.quantity,
            0
          ),
        0
      )

      const existingAggregation = customerOrdersMap.get(customerId)
      if (existingAggregation) {
        existingAggregation.orders.push(normalizedOrder)
        existingAggregation.totalSpent += parseMoney(normalizedOrder.total_price)
        existingAggregation.totalRefundsCount += normalizedOrder.refunds.length
        existingAggregation.totalRefundedAmount += refundAmountForOrder
      } else {
        customerOrdersMap.set(customerId, {
          customerId,
          baseMetadata: customerMetadata,
          orders: [normalizedOrder],
          totalSpent: parseMoney(normalizedOrder.total_price),
          totalRefundsCount: normalizedOrder.refunds.length,
          totalRefundedAmount: refundAmountForOrder,
        })
      }

      // Dedup: check if order already imported (same pattern as Gmail gmail_id)
      const { data: existingMsg } = await supabase
        .from('messages')
        .select('id')
        .eq('metadata->>shopify_order_id', shopifyOrderId)
        .limit(1)

      if (existingMsg && existingMsg.length > 0) continue

      // Create ticket for the order
      const subject = `Commande Shopify ${order.name}`
      const { data: ticket } = await supabase
        .from('tickets')
        .insert({
          organization_id: orgId,
          customer_id: customerId,
          subject,
          status: 'open',
          priority: 'medium',
          channel: 'manual',
        })
        .select('id')
        .single()

      if (!ticket) continue

      // Create message with order details
      const body = [
        `Commande: ${order.name}`,
        `Statut paiement: ${order.financial_status}`,
        `Statut livraison: ${order.fulfillment_status ?? 'Non expedie'}`,
        `Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}`,
      ].join('\n')

      await supabase.from('messages').insert({
        ticket_id: (ticket as { id: string }).id,
        sender_type: 'customer',
        sender_id: customerId,
        body,
        metadata: {
          shopify_order_id: shopifyOrderId,
          shopify_order_name: order.name,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
        },
      })

      triggerAutoReply((ticket as { id: string }).id)

      importedCount++
    }

    for (const aggregation of customerOrdersMap.values()) {
      const sortedOrders = [...aggregation.orders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      const mergedMetadata: Record<string, unknown> = {
        ...aggregation.baseMetadata,
        orders_count: sortedOrders.length,
        total_spent: formatMoney(aggregation.totalSpent),
        total_refunds_count: aggregation.totalRefundsCount,
        total_refunded_amount: formatMoney(aggregation.totalRefundedAmount),
        orders: sortedOrders,
      }

      await supabase
        .from('customers')
        .update({ metadata: mergedMetadata as Json })
        .eq('id', aggregation.customerId)
        .eq('organization_id', orgId)
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/tickets')
    revalidatePath('/dashboard/settings')

    return { success: true, count: importedCount }
  } catch (err) {
    console.error(
      'Shopify orders sync error:',
      err instanceof Error ? err.message : 'Unknown'
    )
    return { success: false, count: 0, error: 'Sync failed' }
  }
}

/** Check if Shopify is connected for the current user's org */
export async function getShopifyStatus(): Promise<{
  connected: boolean
  shop?: string
}> {
  const integration = await getIntegrationStatus('shopify')
  if (!integration || integration.status !== 'active') {
    return { connected: false }
  }
  const shop = getShopFromMetadata(integration.metadata)
  return { connected: true, shop: shop ?? undefined }
}

/** Disconnect Shopify integration */
export async function disconnectShopify(): Promise<{ success: boolean }> {
  return disconnectIntegration('shopify')
}
