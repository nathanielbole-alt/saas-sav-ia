'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitTicketFeedback(
  ticketId: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  if (!ticketId || typeof ticketId !== 'string') {
    return { success: false, error: 'ID ticket invalide' }
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: 'Note invalide (1-5)' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifie' }

  const { error } = await supabase
    .from('tickets')
    .update({
      csat_rating: rating,
      csat_comment: comment?.trim() || null,
      csat_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  if (error) {
    console.error('Failed to submit feedback:', error.message)
    return { success: false, error: 'Erreur lors de la sauvegarde' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/analytics')
  return { success: true }
}
