import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import InviteClient from './invite-client'

type InviteData = {
  valid: true
  orgName: string
  role: string
  email: string
  token: string
  isLoggedIn: boolean
  emailMatch: boolean
} | {
  valid: false
  reason: string
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Fetch invitation by token using admin
  const { data: invitation } = await supabaseAdmin
    .from('invitations')
    .select('id, organization_id, email, role, status, expires_at')
    .eq('token', token)
    .single()

  const inv = invitation as {
    id: string
    organization_id: string
    email: string
    role: string
    status: string
    expires_at: string
  } | null

  let inviteData: InviteData

  if (!inv) {
    inviteData = { valid: false, reason: 'Invitation introuvable ou lien invalide.' }
  } else if (inv.status === 'accepted') {
    inviteData = { valid: false, reason: 'Cette invitation a deja ete acceptee.' }
  } else if (inv.status === 'revoked') {
    inviteData = { valid: false, reason: 'Cette invitation a ete revoquee.' }
  } else if (inv.status === 'expired' || new Date(inv.expires_at) < new Date()) {
    inviteData = { valid: false, reason: 'Cette invitation a expire.' }
  } else {
    // Fetch org name
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', inv.organization_id)
      .single()

    const orgName = (org as { name: string } | null)?.name ?? 'Organisation'

    // Check if user is logged in
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    inviteData = {
      valid: true,
      orgName,
      role: inv.role,
      email: inv.email,
      token,
      isLoggedIn: !!user,
      emailMatch: user?.email?.toLowerCase() === inv.email.toLowerCase(),
    }
  }

  return <InviteClient data={inviteData} />
}
