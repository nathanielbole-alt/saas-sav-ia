import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateAIResponseAdmin } from '@/lib/actions/ai'

export const runtime = 'nodejs'
export const maxDuration = 60

const bodySchema = z.object({
  ticketId: z.string().uuid(),
})

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: Request) {
  const internalToken = process.env.INTERNAL_AUTOREPLY_TOKEN
  if (!internalToken || request.headers.get('x-internal-token') !== internalToken) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { ticketId } = parsed.data

  await sleep(15_000)

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('tickets')
    .select('status')
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'ticket_not_found',
    })
  }

  const status = (ticket as { status: string }).status
  if (status !== 'open' && status !== 'pending') {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'ticket_not_active',
    })
  }

  const { data: lastMessage, error: messageError } = await supabaseAdmin
    .from('messages')
    .select('sender_type')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (messageError) {
    return NextResponse.json(
      { error: 'Failed to check message state' },
      { status: 500 }
    )
  }

  if (!lastMessage || lastMessage.sender_type !== 'customer') {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'already_handled_by_human_or_ai',
    })
  }

  try {
    await generateAIResponseAdmin(ticketId)
    return NextResponse.json({ success: true, generated: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Auto reply failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
