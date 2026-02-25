import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileSidebar } from '@/components/dashboard/mobile-sidebar'
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
    <div className="flex h-screen w-full overflow-hidden bg-[#0B0B0F] text-[#EDEDED]">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-12 bg-[#0B0B0F]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <MobileSidebar user={{ email: user.email ?? '' }} unreadCount={unreadCount} />
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E8856C]/20">
            <span className="text-[8px] font-black text-[#E8856C]">S</span>
          </div>
          <span className="text-sm font-semibold text-[#EDEDED] tracking-tight">Savly</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar (Desktop) */}
      <div className="hidden md:block shrink-0">
        <Sidebar user={{ email: user.email ?? '' }} unreadCount={unreadCount} />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden md:pt-0 pt-12">
        {children}
      </main>
    </div>
  )
}
