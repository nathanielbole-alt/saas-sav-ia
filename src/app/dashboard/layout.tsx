import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/dashboard/topbar'
import { OnboardingRedirect } from '@/components/dashboard/onboarding-redirect'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check onboarding status
  const { data: onboardingCheck } = await supabase
    .from('profiles')
    .select('is_onboarded')
    .eq('id', user.id)
    .single()

  const isOnboarded = (onboardingCheck as { is_onboarded: boolean } | null)?.is_onboarded !== false

  if (!isOnboarded) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#0B0B0F] text-[#EDEDED]">
        <OnboardingRedirect />
        <div className="flex h-full w-full items-center justify-center p-4">
          <main className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/[0.06] bg-[#131316]">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Compute unread count from DB: open tickets where last message is from customer
  const { data: openTickets } = await supabase
    .from('tickets')
    .select('id, status, messages(sender_type, created_at)')
    .eq('status', 'open')

  const unreadCount = (openTickets as unknown[] | null)?.filter((raw) => {
    const t = raw as { messages: { sender_type: string; created_at: string }[] }
    if (!t.messages || t.messages.length === 0) return true
    const sorted = [...t.messages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return sorted[0]?.sender_type === 'customer'
  }).length ?? 0

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black text-[#F5F5F7]">
      {/* Ambient Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-[var(--orb-1)] opacity-[0.15] mix-blend-screen blur-[100px] animate-float-1" />
        <div className="absolute -right-[5%] top-[20%] h-[400px] w-[400px] rounded-full bg-[var(--orb-2)] opacity-[0.12] mix-blend-screen blur-[100px] animate-float-2" />
        <div className="absolute -bottom-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-[var(--orb-3)] opacity-[0.1] mix-blend-screen blur-[120px] animate-float-3" />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col">
        {/* Topbar row — fixed height so children can calculate their own */}
        <div className="flex-none pt-4 pb-3 px-4 md:px-6 flex justify-center w-full z-50">
          <Topbar user={{ email: user.email ?? '' }} unreadCount={unreadCount} />
        </div>

        {/* Main Content — fills remaining height */}
        <main className="flex-1 overflow-hidden">
          <div className="mx-auto h-full max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
