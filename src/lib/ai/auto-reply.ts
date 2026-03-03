import { z } from 'zod'

const ticketIdSchema = z.string().uuid()

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT || '3000'}`
}

export function triggerAutoReply(ticketId: string): void {
  const parsed = ticketIdSchema.safeParse(ticketId)
  if (!parsed.success) return

  const url = `${getBaseUrl()}/api/ai/auto-reply`
  const internalToken = process.env.INTERNAL_AUTOREPLY_TOKEN

  if (!internalToken) {
    console.error('Failed to trigger auto-reply: INTERNAL_AUTOREPLY_TOKEN is missing')
    return
  }

  void fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-token': internalToken,
    },
    body: JSON.stringify({ ticketId: parsed.data }),
    cache: 'no-store',
  }).catch((error) => {
    console.error('Failed to trigger auto-reply:', error)
  })
}
