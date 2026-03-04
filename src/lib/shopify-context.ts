import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Json } from '@/types/database.types'
import { toRecord } from '@/lib/utils'

export const SHOPIFY_API_VERSION = '2024-01'
export const SHOPIFY_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i
export const SHOPIFY_WEBHOOK_TOPICS = [
  'customers/create',
  'customers/update',
  'orders/create',
  'orders/updated',
  'app/uninstalled',
] as const

export type ShopifyOrderRefundLineItem = {
  quantity: number
  line_item: {
    name: string
    price: string
  }
}

export type ShopifyOrderRefund = {
  id: number
  created_at: string
  note: string | null
  restock: boolean
  refund_line_items: ShopifyOrderRefundLineItem[]
}

export type ShopifyStoredOrder = {
  id: string
  name: string
  total_price: string
  fulfillment_status: string | null
  financial_status: string
  created_at: string
  refunds: ShopifyOrderRefund[]
}

export type ShopifyCustomerPayload = {
  id?: number | string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  total_spent?: string | number | null
  created_at?: string | null
  tags?: string | string[] | null
}

export type ShopifyOrderPayload = {
  id: number | string
  name?: string | null
  email?: string | null
  created_at?: string | null
  total_price?: string | number | null
  financial_status?: string | null
  fulfillment_status?: string | null
  customer?: ShopifyCustomerPayload | null
}

type CustomerContextRow = {
  id: string
  full_name: string | null
  phone: string | null
  metadata: unknown
  total_spent: number | null
  tags: string[] | null
  first_contact_at: string | null
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

function formatMoney(value: number): string {
  return value.toFixed(2)
}

function parseInteger(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value))
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return Math.max(0, parsed)
  }

  return 0
}

function normalizeTags(tags: string | string[] | null | undefined): string[] {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  }

  return []
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function normalizeFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | null {
  const value = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')

  return value || null
}

function normalizeStoredOrder(
  order: ShopifyOrderPayload,
  refunds: ShopifyOrderRefund[] | undefined,
  fallbackRefunds: ShopifyOrderRefund[]
): ShopifyStoredOrder {
  return {
    id: String(order.id),
    name: order.name?.trim() || `#${String(order.id)}`,
    total_price: formatMoney(parseMoney(order.total_price)),
    fulfillment_status: order.fulfillment_status ?? null,
    financial_status: order.financial_status?.trim() || 'unknown',
    created_at: order.created_at ?? new Date().toISOString(),
    refunds: refunds ?? fallbackRefunds,
  }
}

function normalizeExistingOrder(value: unknown): ShopifyStoredOrder | null {
  const record = toRecord(value)
  if (!record) return null

  const refundsRaw = Array.isArray(record.refunds) ? record.refunds : []
  const refunds = refundsRaw
    .map((refundValue) => {
      const refund = toRecord(refundValue)
      if (!refund) return null

      const lineItemsRaw = Array.isArray(refund.refund_line_items)
        ? refund.refund_line_items
        : []

      const lineItems = lineItemsRaw
        .map((lineValue) => {
          const line = toRecord(lineValue)
          const lineItem = toRecord(line?.line_item)
          if (!line || !lineItem) return null

          const quantity = parseInteger(line.quantity)
          if (quantity <= 0) return null

          return {
            quantity,
            line_item: {
              name:
                typeof lineItem.name === 'string' && lineItem.name.trim()
                  ? lineItem.name.trim()
                  : 'Article Shopify',
              price: formatMoney(
                parseMoney(
                  typeof lineItem.price === 'string' ||
                    typeof lineItem.price === 'number'
                    ? lineItem.price
                    : null
                )
              ),
            },
          }
        })
        .filter(
          (line): line is ShopifyOrderRefundLineItem => line !== null
        )

      return {
        id: parseInteger(refund.id),
        created_at:
          typeof refund.created_at === 'string'
            ? refund.created_at
            : new Date().toISOString(),
        note: typeof refund.note === 'string' ? refund.note : null,
        restock: Boolean(refund.restock),
        refund_line_items: lineItems,
      }
    })
    .filter((refund): refund is ShopifyOrderRefund => refund !== null)

  const idCandidate =
    typeof record.id === 'string' || typeof record.id === 'number'
      ? String(record.id)
      : typeof record.name === 'string'
        ? record.name
        : null

  if (!idCandidate) return null

  return {
    id: idCandidate,
    name: typeof record.name === 'string' ? record.name : `#${idCandidate}`,
    total_price: formatMoney(
      parseMoney(
        typeof record.total_price === 'string' ||
          typeof record.total_price === 'number'
          ? record.total_price
          : null
      )
    ),
    fulfillment_status:
      typeof record.fulfillment_status === 'string'
        ? record.fulfillment_status
        : null,
    financial_status:
      typeof record.financial_status === 'string'
        ? record.financial_status
        : 'unknown',
    created_at:
      typeof record.created_at === 'string'
        ? record.created_at
        : new Date().toISOString(),
    refunds,
  }
}

function mergeOrders(
  baseMetadata: Record<string, unknown>,
  nextOrder: ShopifyStoredOrder
): ShopifyStoredOrder[] {
  const existingOrdersRaw = Array.isArray(baseMetadata.orders)
    ? baseMetadata.orders
    : []
  const existingOrders = existingOrdersRaw
    .map(normalizeExistingOrder)
    .filter((order): order is ShopifyStoredOrder => order !== null)

  const matchIndex = existingOrders.findIndex(
    (order) => order.id === nextOrder.id || order.name === nextOrder.name
  )

  if (matchIndex >= 0) {
    const previous = existingOrders[matchIndex]!
    existingOrders[matchIndex] = {
      ...previous,
      ...nextOrder,
      refunds: nextOrder.refunds.length > 0 ? nextOrder.refunds : previous.refunds,
    }
  } else {
    existingOrders.push(nextOrder)
  }

  return existingOrders
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    )
    .slice(0, 20)
}

function computeAggregates(orders: ShopifyStoredOrder[]) {
  const totalSpent = orders.reduce(
    (sum, order) => sum + parseMoney(order.total_price),
    0
  )
  const totalRefundsCount = orders.reduce(
    (sum, order) => sum + order.refunds.length,
    0
  )
  const totalRefundedAmount = orders.reduce((sum, order) => {
    return (
      sum +
      order.refunds.reduce((refundsSum, refund) => {
        return (
          refundsSum +
          refund.refund_line_items.reduce((itemsSum, lineItem) => {
            return (
              itemsSum +
              parseMoney(lineItem.line_item.price) * lineItem.quantity
            )
          }, 0)
        )
      }, 0)
    )
  }, 0)

  return {
    totalSpent,
    totalRefundsCount,
    totalRefundedAmount,
  }
}

export function getShopFromMetadata(metadata: unknown): string | null {
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

export async function upsertShopifyCustomerContext(
  organizationId: string,
  customer: ShopifyCustomerPayload
): Promise<{
  customerId: string | null
  metadata: Record<string, unknown>
}> {
  const email = customer.email?.trim().toLowerCase() ?? ''
  if (!email) {
    return { customerId: null, metadata: {} }
  }

  const fullName = normalizeFullName(customer.first_name, customer.last_name)
  const phone = customer.phone?.trim() || null
  const shopifyId =
    customer.id !== null && customer.id !== undefined ? String(customer.id) : null
  const incomingTotalSpent = parseMoney(customer.total_spent)
  const incomingTags = normalizeTags(customer.tags)

  const { data: existing } = await supabaseAdmin
    .from('customers')
    .select('id, full_name, phone, metadata, total_spent, tags, first_contact_at')
    .eq('organization_id', organizationId)
    .eq('email', email)
    .maybeSingle()

  const current = (existing as CustomerContextRow | null) ?? null
  const baseMetadata = toRecord(current?.metadata) ?? {}
  const mergedMetadata: Record<string, unknown> = {
    ...baseMetadata,
    ...(shopifyId ? { shopify_id: shopifyId } : {}),
  }

  const updatePayload = {
    full_name: fullName ?? current?.full_name ?? null,
    phone: phone ?? current?.phone ?? null,
    metadata: mergedMetadata as Json,
    total_spent: Math.max(Number(current?.total_spent ?? 0), incomingTotalSpent),
    tags: uniqueStrings([...(current?.tags ?? []), ...incomingTags]),
    first_contact_at:
      current?.first_contact_at ?? customer.created_at ?? null,
  }

  if (current) {
    await supabaseAdmin
      .from('customers')
      .update(updatePayload)
      .eq('id', current.id)
      .eq('organization_id', organizationId)

    return { customerId: current.id, metadata: mergedMetadata }
  }

  const { data: inserted } = await supabaseAdmin
    .from('customers')
    .insert({
      organization_id: organizationId,
      email,
      ...updatePayload,
    })
    .select('id')
    .single()

  return {
    customerId: (inserted as { id: string } | null)?.id ?? null,
    metadata: mergedMetadata,
  }
}

export async function syncShopifyOrderContext(
  organizationId: string,
  order: ShopifyOrderPayload,
  refunds?: ShopifyOrderRefund[]
): Promise<boolean> {
  const email = order.email?.trim().toLowerCase() ?? order.customer?.email?.trim().toLowerCase() ?? ''
  if (!email) return false

  const customerResult = await upsertShopifyCustomerContext(organizationId, {
    ...order.customer,
    email,
  })

  if (!customerResult.customerId) return false

  const { data: existing } = await supabaseAdmin
    .from('customers')
    .select('metadata, total_spent, first_contact_at')
    .eq('id', customerResult.customerId)
    .eq('organization_id', organizationId)
    .maybeSingle()

  const existingRow = (existing as {
    metadata: unknown
    total_spent: number | null
    first_contact_at: string | null
  } | null) ?? null
  const baseMetadata = toRecord(existingRow?.metadata) ?? customerResult.metadata
  const existingOrders = Array.isArray(baseMetadata.orders) ? baseMetadata.orders : []
  const previousOrder = existingOrders
    .map(normalizeExistingOrder)
    .find(
      (storedOrder) =>
        storedOrder !== null &&
        (storedOrder.id === String(order.id) || storedOrder.name === order.name)
    )

  const normalizedOrder = normalizeStoredOrder(
    order,
    refunds,
    previousOrder?.refunds ?? []
  )
  const orders = mergeOrders(baseMetadata, normalizedOrder)
  const aggregates = computeAggregates(orders)
  const existingTotalSpent = parseMoney(
    typeof baseMetadata.total_spent === 'string' ||
      typeof baseMetadata.total_spent === 'number'
      ? baseMetadata.total_spent
      : null
  )
  const existingOrdersCount = parseInteger(baseMetadata.orders_count)
  const existingRefundsCount = parseInteger(baseMetadata.total_refunds_count)
  const existingRefundedAmount = parseMoney(
    typeof baseMetadata.total_refunded_amount === 'string' ||
      typeof baseMetadata.total_refunded_amount === 'number'
      ? baseMetadata.total_refunded_amount
      : null
  )

  const nextMetadata: Record<string, unknown> = {
    ...baseMetadata,
    ...(customerResult.metadata.shopify_id
      ? { shopify_id: customerResult.metadata.shopify_id }
      : {}),
    orders_count: Math.max(existingOrdersCount, orders.length),
    total_spent: formatMoney(
      Math.max(
        aggregates.totalSpent,
        existingTotalSpent,
        Number(existingRow?.total_spent ?? 0)
      )
    ),
    total_refunds_count: Math.max(
      existingRefundsCount,
      aggregates.totalRefundsCount
    ),
    total_refunded_amount: formatMoney(
      Math.max(existingRefundedAmount, aggregates.totalRefundedAmount)
    ),
    orders,
  }

  await supabaseAdmin
    .from('customers')
    .update({
      metadata: nextMetadata as Json,
      total_spent: Math.max(
        aggregates.totalSpent,
        existingTotalSpent,
        Number(existingRow?.total_spent ?? 0)
      ),
      first_contact_at:
        existingRow?.first_contact_at ?? order.created_at ?? null,
    })
    .eq('id', customerResult.customerId)
    .eq('organization_id', organizationId)

  return true
}
