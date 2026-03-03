import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  claimIntegrationEventReceipt,
  completeIntegrationEventReceipt,
  releaseIntegrationEventReceipt,
} from '@/lib/integration-event-receipts'
import {
  SHOPIFY_DOMAIN_REGEX,
  syncShopifyOrderContext,
  upsertShopifyCustomerContext,
} from '@/lib/shopify-context'
import type { Integration } from '@/types/database.types'

export const runtime = 'nodejs'
export const maxDuration = 30

type ShopifyWebhookCustomerPayload = {
  id?: number | string | null
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  total_spent?: string | number | null
  created_at?: string | null
  tags?: string | string[] | null
}

type ShopifyWebhookOrderPayload = {
  id?: number | string | null
  name?: string | null
  email?: string | null
  created_at?: string | null
  total_price?: string | number | null
  financial_status?: string | null
  fulfillment_status?: string | null
  customer?: ShopifyWebhookCustomerPayload | null
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function verifyShopifyWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  const secret = process.env.SHOPIFY_CLIENT_SECRET
  if (!secret || !signature) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expected, 'utf8')
    )
  } catch {
    return false
  }
}

function buildExternalId(
  topic: string,
  shop: string,
  webhookId: string | null,
  payload: unknown
): string {
  if (webhookId) {
    return `${shop}:${webhookId}`
  }

  const record = toRecord(payload)
  const entityId =
    record?.id !== undefined && record?.id !== null
      ? String(record.id)
      : 'unknown'
  const version =
    typeof record?.updated_at === 'string'
      ? record.updated_at
      : typeof record?.created_at === 'string'
        ? record.created_at
        : 'na'

  return `${shop}:${topic}:${entityId}:${version}`
}

async function findShopifyIntegration(shop: string): Promise<Integration | null> {
  const { data } = await supabaseAdmin
    .from('integrations')
    .select('*')
    .eq('provider', 'shopify')

  const match = (data as Integration[] | null)?.find((integration) => {
    const metadata = toRecord(integration.metadata)
    return metadata?.shop === shop
  })

  return match ?? null
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-shopify-hmac-sha256')

  if (!verifyShopifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const topic = request.headers.get('x-shopify-topic')?.trim().toLowerCase() ?? ''
  const shop = request.headers.get('x-shopify-shop-domain')?.trim().toLowerCase() ?? ''
  const webhookId = request.headers.get('x-shopify-webhook-id')

  if (!topic || !SHOPIFY_DOMAIN_REGEX.test(shop)) {
    return NextResponse.json({ error: 'Invalid webhook headers' }, { status: 400 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const integration = await findShopifyIntegration(shop)
  if (!integration) {
    return NextResponse.json({ success: true, skipped: true, reason: 'integration_not_found' })
  }

  if (integration.status !== 'active' && topic !== 'app/uninstalled') {
    return NextResponse.json({ success: true, skipped: true, reason: 'integration_inactive' })
  }

  const externalId = buildExternalId(topic, shop, webhookId, payload)
  const receipt = await claimIntegrationEventReceipt({
    provider: 'shopify',
    externalId,
    organizationId: integration.organization_id,
    source: 'webhook',
  })

  if (!receipt.acquired) {
    return NextResponse.json({ success: true, duplicate: true })
  }

  try {
    if (topic === 'app/uninstalled') {
      await supabaseAdmin
        .from('integrations')
        .update({
          status: 'inactive',
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)
    } else if (topic === 'customers/create' || topic === 'customers/update') {
      const customer = payload as ShopifyWebhookCustomerPayload
      await upsertShopifyCustomerContext(integration.organization_id, customer)
    } else if (topic === 'orders/create' || topic === 'orders/updated') {
      const order = payload as ShopifyWebhookOrderPayload
      if (order.id !== undefined && order.id !== null) {
        await syncShopifyOrderContext(integration.organization_id, {
          id: order.id,
          name: order.name,
          email: order.email,
          created_at: order.created_at,
          total_price: order.total_price,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          customer: order.customer ?? null,
        })
      }
    }

    await completeIntegrationEventReceipt(receipt.receiptId)

    return NextResponse.json({ success: true })
  } catch (error) {
    await releaseIntegrationEventReceipt(receipt.receiptId)
    console.error(
      'Shopify webhook processing failed:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
