'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/rate-limit'
import {
  getIntegrationStatus,
  disconnectIntegration,
} from '@/lib/actions/integrations'
import { decrypt } from '@/lib/encryption'
import type { Integration } from '@/types/database.types'
import {
  SHOPIFY_API_VERSION,
  getShopFromMetadata,
  upsertShopifyCustomerContext,
  syncShopifyOrderContext,
  type ShopifyOrderRefund,
  type ShopifyOrderRefundLineItem,
} from '@/lib/shopify-context'

type ShopifyOrderRefundApiLineItem = {
  quantity: number | null
  restock_type?: string | null
  line_item?: {
    name?: string | null
    price?: string | null
  } | null
}

type ShopifyOrderRefundResponse = {
  id: number
  created_at: string
  note: string | null
  refund_line_items?: ShopifyOrderRefundApiLineItem[] | null
}

type ShopifyOrderRefundsResponse = {
  refunds?: ShopifyOrderRefundResponse[]
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
): Promise<ShopifyOrderRefund[]> {
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
      .filter(
        (lineItem): lineItem is ShopifyOrderRefundLineItem => lineItem !== null
      )

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
    let importedCount = 0
    let url: string | null = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/customers.json?limit=250`
    let pageCount = 0
    const MAX_PAGES = 20 // safeguard: max 5000 records

    while (url && pageCount < MAX_PAGES) {
      pageCount++
      const res: Response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          await supabase
            .from('integrations')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', integration.id)
        }
        return { success: false, count: importedCount, error: 'Shopify API error' }
      }

      const data = (await res.json()) as {
        customers: Array<{
          id: number
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
        }>
      }

      for (const shopifyCustomer of data.customers) {
        if (!shopifyCustomer.email) continue

        const result = await upsertShopifyCustomerContext(orgId, {
          id: shopifyCustomer.id,
          email: shopifyCustomer.email,
          first_name: shopifyCustomer.first_name,
          last_name: shopifyCustomer.last_name,
          phone: shopifyCustomer.phone,
        })

        if (result.customerId) importedCount++
      }

      // Cursor-based pagination via Link header
      const lh: string | null = res.headers.get('Link')
      const nm: RegExpMatchArray | null | undefined = lh?.match(/<([^>]+)>;\s*rel="next"/)
      url = nm?.[1] ?? null
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

  try {
    let importedCount = 0
    let url: string | null = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/orders.json?limit=250&status=any`
    let pageCount = 0
    const MAX_PAGES = 20 // safeguard: max 5000 records

    while (url && pageCount < MAX_PAGES) {
      pageCount++
      const res: Response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          await supabase
            .from('integrations')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', integration.id)
        }
        return { success: false, count: importedCount, error: 'Shopify API error' }
      }

      const data = (await res.json()) as {
        orders: Array<{
          id: number
          name: string
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

      for (const order of data.orders) {
        const customerEmail = order.email ?? order.customer?.email
        if (!customerEmail) continue
        let refunds: ShopifyOrderRefund[] = []

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
            return { success: false, count: importedCount, error: 'Shopify API error' }
          }

          console.error(
            `Shopify refunds fetch failed for order ${order.id}:`,
            message
          )
        }
        const synced = await syncShopifyOrderContext(
          orgId,
          {
            id: order.id,
            name: order.name,
            email: customerEmail,
            created_at: order.created_at,
            total_price: order.total_price,
            financial_status: order.financial_status,
            fulfillment_status: order.fulfillment_status,
            customer: order.customer
              ? {
                  id: order.customer.id,
                  email: order.customer.email,
                  first_name: order.customer.first_name,
                  last_name: order.customer.last_name,
                }
              : null,
          },
          refunds
        )

        if (synced) {
          importedCount++
        }
      }

      // Cursor-based pagination via Link header
      const lh: string | null = res.headers.get('Link')
      const nm: RegExpMatchArray | null | undefined = lh?.match(/<([^>]+)>;\s*rel="next"/)
      url = nm?.[1] ?? null
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/inbox')
    revalidatePath('/dashboard/customers')
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
