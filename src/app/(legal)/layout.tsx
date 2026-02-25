import type { ReactNode } from 'react'
import { Navbar } from '@/components/landing/navbar'
import { Footer } from '@/components/landing/footer'

type LegalLayoutProps = {
  children: ReactNode
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 selection:bg-emerald-500/30">
      <Navbar />
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  )
}
