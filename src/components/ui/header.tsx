'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Header({ user }: { user: { email: string } }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-foreground/10 bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <span className="text-lg font-bold text-foreground">Savly</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground/60">{user.email}</span>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}
