import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/landing/navbar'
import { PricingClient } from './pricing-client'

export const metadata = {
  title: 'Tarifs — Savly',
  description:
    'Découvrez nos plans Pro, Business et Enterprise. Essai gratuit 7 jours, sans carte bancaire.',
}

export default async function PricingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#0B0B0F]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 pb-32 pt-32">
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-[#777]">
            Tarifs
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tighter text-[#EDEDED] md:text-5xl">
            Simple et <span className="text-[#E8856C]">transparent.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[48ch] text-sm leading-relaxed text-[#888]">
            Démarrez avec 7 jours d&apos;essai gratuit sur Pro. Sans carte
            bancaire. Hébergé en Europe.
          </p>

          <PricingClient isLoggedIn={!!user} />
        </div>
      </main>
    </div>
  )
}
