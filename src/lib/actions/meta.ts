'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import type { Integration } from '@/types/database.types'

const GRAPH_API = 'https://graph.facebook.com/v21.0'

function toRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return null
    }
    return value as Record<string, unknown>
}

const sendMetaReplyParamsSchema = z.object({
    organizationId: z.string().uuid(),
    ticketId: z.string().uuid(),
    recipientId: z.string().min(1),
    messageText: z.string().min(1),
})

/**
 * Send a reply via Instagram DM or Facebook Messenger.
 * Works for both platforms — same Graph API endpoint.
 */
export async function sendMetaReply(params: {
    organizationId: string
    ticketId: string
    recipientId: string
    messageText: string
}): Promise<{ success: boolean; error?: string }> {
    const parsed = sendMetaReplyParamsSchema.safeParse(params)
    if (!parsed.success) {
        return { success: false, error: 'Invalid Meta reply payload' }
    }

    const { organizationId, recipientId, messageText } = parsed.data

    // Get Meta integration for this org
    const { data: integration, error: integrationError } = await supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider', 'meta')
        .eq('status', 'active')
        .single()

    if (integrationError || !integration) {
        return { success: false, error: 'Meta integration not connected' }
    }

    const typedIntegration = integration as Integration
    const pageAccessToken = typedIntegration.access_token

    if (!pageAccessToken) {
        return { success: false, error: 'No Meta page access token' }
    }

    try {
        const res = await fetch(`${GRAPH_API}/me/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${pageAccessToken}`,
            },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text: messageText },
            }),
        })

        if (!res.ok) {
            const errorBody = await res.text()
            console.error('Meta send message failed:', errorBody)

            // Check if token expired
            if (res.status === 401 || errorBody.includes('OAuthException')) {
                // Try to refresh token
                const refreshResult = await refreshMetaPageToken(typedIntegration.id)
                if (refreshResult.success && refreshResult.newToken) {
                    // Retry with new token
                    const retryRes = await fetch(`${GRAPH_API}/me/messages`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${refreshResult.newToken}`,
                        },
                        body: JSON.stringify({
                            recipient: { id: recipientId },
                            message: { text: messageText },
                        }),
                    })

                    if (retryRes.ok) return { success: true }
                }

                // Mark integration as error
                await supabaseAdmin
                    .from('integrations')
                    .update({ status: 'error', updated_at: new Date().toISOString() })
                    .eq('id', typedIntegration.id)

                return { success: false, error: 'Meta token expired' }
            }

            return { success: false, error: 'Failed to send Meta message' }
        }

        return { success: true }
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Meta reply send failed'
        console.error('Failed to send Meta reply:', message)
        return { success: false, error: 'Failed to send Meta reply' }
    }
}

/**
 * Refresh the Meta page token using the long-lived user token.
 */
export async function refreshMetaPageToken(
    integrationId: string
): Promise<{ success: boolean; newToken?: string }> {
    const { data: integration } = await supabaseAdmin
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single()

    if (!integration) return { success: false }

    const typedIntegration = integration as Integration
    const userToken = typedIntegration.refresh_token // Long-lived user token

    if (!userToken) return { success: false }

    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) return { success: false }

    try {
        // Refresh long-lived user token
        const refreshUrl = new URL(`${GRAPH_API}/oauth/access_token`)
        refreshUrl.searchParams.set('grant_type', 'fb_exchange_token')
        refreshUrl.searchParams.set('client_id', appId)
        refreshUrl.searchParams.set('client_secret', appSecret)
        refreshUrl.searchParams.set('fb_exchange_token', userToken)

        const refreshRes = await fetch(refreshUrl.toString())
        if (!refreshRes.ok) return { success: false }

        const refreshData = (await refreshRes.json()) as {
            access_token: string
            expires_in?: number
        }

        // Get new page token
        const pagesRes = await fetch(
            `${GRAPH_API}/me/accounts?access_token=${refreshData.access_token}&fields=id,access_token`
        )

        if (!pagesRes.ok) return { success: false }

        const pagesData = (await pagesRes.json()) as {
            data: Array<{ id: string; access_token: string }>
        }

        const meta = toRecord(typedIntegration.metadata)
        const pageId = meta?.page_id as string | undefined
        const page = pagesData.data.find((p) => p.id === pageId) ?? pagesData.data[0]

        if (!page) return { success: false }

        const tokenExpiresAt = refreshData.expires_in
            ? new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
            : null

        // Update integration with new tokens
        await supabaseAdmin
            .from('integrations')
            .update({
                access_token: page.access_token,
                refresh_token: refreshData.access_token,
                token_expires_at: tokenExpiresAt,
                status: 'active',
                updated_at: new Date().toISOString(),
            })
            .eq('id', integrationId)

        return { success: true, newToken: page.access_token }
    } catch (error) {
        console.error('Meta token refresh failed:', error)
        return { success: false }
    }
}

/**
 * Extract Meta reply context from a ticket's metadata.
 */
export async function extractMetaReplyContext(ticketMetadata: unknown): Promise<{
    socialUserId: string | null
    socialPlatform: string | null
}> {
    const meta = toRecord(ticketMetadata)
    if (!meta) return { socialUserId: null, socialPlatform: null }

    return {
        socialUserId:
            typeof meta.social_user_id === 'string' ? meta.social_user_id : null,
        socialPlatform:
            typeof meta.social_platform === 'string' ? meta.social_platform : null,
    }
}
