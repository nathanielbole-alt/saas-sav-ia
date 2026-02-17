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
      <div className="relative flex h-screen w-full overflow-hidden bg-[#050505] text-zinc-100 selection:bg-violet-500/30">
        {/* Aurora Background */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="animate-aurora-1 absolute -top-[20%] -right-[20%] h-[600px] w-[600px] rounded-full bg-[#8b5cf6]/[0.07] blur-[150px]" />
          <div className="animate-aurora-2 absolute -bottom-[20%] -left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.05] blur-[120px]" />
        </div>

        <OnboardingRedirect />
        <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
          <main className="w-full max-w-3xl overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c10] shadow-2xl shadow-[#8b5cf6]/[0.03]">
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
    <div className="relative flex h-screen w-full overflow-hidden bg-[#050505] text-zinc-100 selection:bg-violet-500/30">
      {/* Aurora Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-aurora-1 absolute -top-[20%] -right-[20%] h-[600px] w-[600px] rounded-full bg-[#8b5cf6]/[0.07] blur-[150px]" />
        <div className="animate-aurora-2 absolute -bottom-[20%] -left-[20%] h-[500px] w-[500px] rounded-full bg-indigo-600/[0.05] blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col md:flex-row gap-3 p-3">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-2 min-h-[40px]">
          <MobileSidebar user={{ email: user.email ?? '' }} unreadCount={unreadCount} />
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#8b5cf6]">
              <span className="text-[8px] font-black text-white">S</span>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">SAV IA</span>
          </div>
          <div className="w-10" />
        </div>

        {/* Floating Sidebar (Desktop) */}
        <div className="hidden md:block shrink-0">
          <Sidebar user={{ email: user.email ?? '' }} unreadCount={unreadCount} />
        </div>

        {/* Main Content Island */}
        <main className="flex-1 overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c10] shadow-xl shadow-[#8b5cf6]/[0.02] transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}
