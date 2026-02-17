'use client'

import { Marquee } from '@/components/landing/marquee'
import { WordRotate } from '@/components/landing/word-rotate'
import {
  MessageSquare,
  Truck,
  Star,
  Zap,
  RefreshCcw,
  Calendar,
  Mail,
  Smartphone,
  Shield,
  Clock,
} from 'lucide-react'

const useCasesTop = [
  { icon: MessageSquare, label: 'Répondre aux questions fréquentes' },
  { icon: Truck, label: 'Suivre les livraisons' },
  { icon: Star, label: 'Gérer les avis Google' },
  { icon: RefreshCcw, label: 'Traiter les retours' },
  { icon: Calendar, label: 'Planifier des RDV' },
]

const useCasesBottom = [
  { icon: Zap, label: 'Prioriser les urgences' },
  { icon: Mail, label: 'Trier les emails' },
  { icon: Smartphone, label: 'Support multicanal' },
  { icon: Shield, label: 'Détecter les fraudes' },
  { icon: Clock, label: 'Relancer les paniers' },
]

export function UseCases() {
  return (
    <section className="overflow-hidden border-t border-white/[0.06] py-28">
      <div className="mx-auto mb-14 max-w-7xl px-6 text-center">
        <h2 className="flex flex-col items-center justify-center gap-2 text-3xl font-bold tracking-tight text-white sm:flex-row sm:text-4xl">
          Tout ce que{' '}
          <span className="font-mono text-[#8b5cf6]">SAV IA</span> fait pour
          <WordRotate
            className="text-white underline decoration-[#8b5cf6]/40 decoration-2 underline-offset-4"
            words={[
              'vos clients',
              'vos équipes',
              'votre croissance',
              'votre tranquillité',
            ]}
          />
        </h2>
        <p className="mt-4 text-base text-zinc-500">
          Une infinité de cas d&apos;usage pour automatiser votre relation
          client.
        </p>
      </div>

      <div className="relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-24 bg-gradient-to-r from-[#09090b] to-transparent" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-24 bg-gradient-to-l from-[#09090b] to-transparent" />

        <Marquee pauseOnHover className="[--duration:35s]">
          {useCasesTop.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <item.icon className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-300">{item.label}</span>
            </div>
          ))}
        </Marquee>

        <Marquee reverse pauseOnHover className="mt-3 [--duration:35s]">
          {useCasesBottom.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
            >
              <item.icon className="h-4 w-4 text-zinc-500" />
              <span className="text-sm text-zinc-300">{item.label}</span>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  )
}
