'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Mail,
  MessageSquare,
  Instagram,
  ShoppingBag,
  Star,
  Play,
} from 'lucide-react'
import { VideoModal } from '@/components/ui/video-modal'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const channels = [
  { icon: Mail, label: 'Gmail' },
  { icon: ShoppingBag, label: 'Shopify' },
  { icon: Instagram, label: 'Instagram' },
  { icon: MessageSquare, label: 'Messenger' },
  { icon: Star, label: 'Google Reviews' },
]

const sidebarItems = ['Inbox', 'Tickets', 'Clients', 'Analytics']

const tickets = [
  {
    name: 'Marie D.',
    msg: 'Commande #4829 — retard livraison',
    time: '2m',
    unread: true,
    tag: 'urgent',
    selected: true,
  },
  {
    name: 'Pierre L.',
    msg: 'Demande remboursement produit',
    time: '15m',
    unread: true,
    tag: 'ia',
    selected: false,
  },
  {
    name: 'Sophie R.',
    msg: 'Question sur la garantie',
    time: '1h',
    unread: false,
    tag: '',
    selected: false,
  },
]

export function Hero() {
  const [isDemoOpen, setIsDemoOpen] = useState(false)

  return (
    <section className="relative overflow-hidden pt-32 pb-24 sm:pt-44 sm:pb-32">
      <VideoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />

      {/* Dot grid background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Subtle glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#8b5cf6]/[0.03] blur-[150px]" />

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mx-auto max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {/* Tag */}
          <motion.div variants={fadeUp} className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#8b5cf6]/20 bg-[#8b5cf6]/[0.05] px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8b5cf6]" />
              <span className="font-mono text-xs text-[#8b5cf6]/80">
                v2.0 — Auto-réponse IA en 30 secondes
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-center text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white"
          >
            Votre SAV, en pilote
            <br />
            <span className="relative inline-block">
              automatique
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <motion.path
                  d="M2 8 C 75 2, 225 2, 298 8"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-8 max-w-xl text-center text-lg leading-relaxed text-zinc-400"
          >
            Centralisez emails, avis Google, Instagram et Shopify.
            L&apos;IA répond à vos clients en 2 minutes. Vous gardez le
            contrôle.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-lg bg-[#8b5cf6] px-6 py-3 text-sm font-semibold text-[#09090b] transition-all hover:bg-[#a78bfa] hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]"
            >
              Démarrer l&apos;essai gratuit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              onClick={() => setIsDemoOpen(true)}
              className="group inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-zinc-400 transition-colors hover:text-white hover:bg-white/[0.05]"
            >
              <Play className="h-4 w-4 fill-current opacity-60 transition-transform group-hover:scale-110" />
              Voir la démo
            </button>
          </motion.div>

          {/* Channel badges */}
          <motion.div
            variants={fadeUp}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            {channels.map((ch) => (
              <div
                key={ch.label}
                className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5"
              >
                <ch.icon className="h-3.5 w-3.5 text-zinc-500" />
                <span className="font-mono text-xs text-zinc-500">
                  {ch.label}
                </span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ======== APP PREVIEW ======== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9, ease: [0.25, 0.1, 0, 1] }}
          className="mx-auto mt-20 max-w-5xl [perspective:2400px]"
        >
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0f] p-1 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] [transform:rotateX(2deg)]">
            <div className="overflow-hidden rounded-lg">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#111115] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white/[0.04] px-3 py-1">
                  <span className="font-mono text-[11px] text-zinc-600">
                    app.sav-ia.fr/inbox
                  </span>
                </div>
              </div>

              {/* App content */}
              <div className="flex bg-[#0c0c0f]">
                {/* Sidebar */}
                <div className="hidden w-44 border-r border-white/[0.06] p-3 sm:block">
                  <div className="mb-5 flex items-center gap-2 px-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-[#8b5cf6]/20">
                      <span className="text-[8px] font-bold text-[#8b5cf6]">
                        S
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300">
                      Mon Entreprise
                    </span>
                  </div>
                  {sidebarItems.map((item, i) => (
                    <div
                      key={item}
                      className={`mb-0.5 rounded-md px-2 py-1.5 text-[11px] ${i === 0
                        ? 'bg-white/[0.06] font-medium text-white'
                        : 'text-zinc-500'
                        }`}
                    >
                      {item}
                      {i === 0 && (
                        <span className="ml-2 rounded bg-[#8b5cf6]/20 px-1 py-0.5 font-mono text-[8px] text-[#8b5cf6]">
                          3
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ticket list */}
                <div className="hidden w-64 border-r border-white/[0.06] p-3 md:block">
                  <div className="mb-3 px-1">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                      3 non lus
                    </span>
                  </div>
                  {tickets.map((t) => (
                    <div
                      key={t.name}
                      className={`mb-1 rounded-md p-2.5 ${t.selected ? 'bg-white/[0.04]' : ''
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] ${t.unread
                            ? 'font-semibold text-white'
                            : 'text-zinc-400'
                            }`}
                        >
                          {t.name}
                        </span>
                        <span className="font-mono text-[9px] text-zinc-600">
                          {t.time}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                        {t.msg}
                      </p>
                      {t.tag && (
                        <span
                          className={`mt-1.5 inline-block rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${t.tag === 'urgent'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                            }`}
                        >
                          {t.tag === 'ia' ? '✦ IA prête' : t.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Conversation */}
                <div className="min-h-[300px] flex-1 p-5">
                  <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div>
                      <span className="text-[12px] font-medium text-white">
                        Marie Dupont
                      </span>
                      <span className="ml-2 rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[8px] uppercase text-red-400">
                        urgent
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-600">
                      via Gmail
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Customer message */}
                    <div className="max-w-[80%]">
                      <div className="rounded-lg bg-white/[0.04] p-3.5">
                        <p className="text-[11px] leading-relaxed text-zinc-300">
                          Bonjour, ma commande #4829 devait arriver hier mais
                          je n&apos;ai toujours rien reçu. Pouvez-vous
                          vérifier le statut de la livraison ?
                        </p>
                      </div>
                      <span className="mt-1 block font-mono text-[9px] text-zinc-600">
                        Marie — il y a 2 min
                      </span>
                    </div>

                    {/* AI suggestion */}
                    <div className="ml-auto max-w-[80%]">
                      <div className="rounded-lg border border-[#8b5cf6]/15 bg-[#8b5cf6]/[0.03] p-3.5">
                        <div className="mb-2 flex items-center gap-1.5">
                          <span className="font-mono text-[8px] uppercase tracking-wider text-[#8b5cf6]">
                            ✦ Suggestion IA — confiance 96%
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-300">
                          Bonjour Marie, je viens de vérifier votre commande
                          #4829. Le colis est actuellement en transit via
                          Colissimo et devrait arriver demain avant 18h. Voici
                          votre lien de suivi : [lien]. N&apos;hésitez pas si
                          vous avez d&apos;autres questions.
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <span className="cursor-default rounded bg-white/[0.06] px-2.5 py-1 font-mono text-[9px] text-zinc-400">
                          Modifier
                        </span>
                        <span className="cursor-default rounded bg-[#8b5cf6] px-2.5 py-1 font-mono text-[9px] font-medium text-[#09090b]">
                          Envoyer
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
