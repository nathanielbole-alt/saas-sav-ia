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
import { Magnetic } from '@/components/landing/magnetic'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
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
    name: 'Camille D.',
    msg: 'Commande #4829 — retard livraison',
    time: '2m',
    unread: true,
    tag: 'urgent',
    selected: true,
  },
  {
    name: 'Alexandre M.',
    msg: 'Demande remboursement produit',
    time: '15m',
    unread: true,
    tag: 'ia',
    selected: false,
  },
  {
    name: 'Nathalie R.',
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
    <section
      role="region"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-32 pb-20 sm:pt-44 sm:pb-28"
    >
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

      {/* Subtle warm glow */}
      <div className="pointer-events-none absolute top-0 left-1/3 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#E8856C]/[0.03] blur-[180px]" />

      <div className="mx-auto max-w-[1400px] px-6">
        {/* SPLIT-SCREEN: Left copy + Right stats — ANTI-CENTER BIAS */}
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          {/* Left column — copy */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={container}
            className="max-w-2xl"
          >
            {/* Tag */}
            <motion.div variants={fadeUp} className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8856C]/20 bg-[#E8856C]/[0.05] px-4 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-[#E8856C]" />
                <span className="text-xs text-[#E8856C]/80">
                  Auto-réponse IA en 28 secondes
                </span>
              </div>
            </motion.div>

            {/* Headline — left-aligned, tracking-tighter */}
            <motion.h1
              id="hero-heading"
              variants={fadeUp}
              className="text-4xl font-semibold leading-[0.95] tracking-tighter text-[#EDEDED] md:text-6xl"
            >
              Votre SAV,
              <br />
              en pilote{' '}
              <span className="relative inline-block text-[#E8856C]">
                automatique
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M2 8 C 75 2, 225 2, 298 8"
                    stroke="#E8856C"
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
              className="mt-8 max-w-[52ch] text-base leading-relaxed text-[#888]"
            >
              Centralisez emails, avis Google, Instagram et Shopify.
              L&apos;IA répond à vos clients en moins de 30 secondes.
              Vous gardez le contrôle.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Magnetic>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 rounded-lg bg-[#E8856C] px-6 py-3 text-sm font-semibold text-[#0B0B0F] transition-all hover:bg-[#F09E8A] active:scale-[0.97]"
                >
                  Démarrer l&apos;essai gratuit
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Magnetic>
              <button
                onClick={() => setIsDemoOpen(true)}
                aria-label="Voir la démonstration vidéo"
                aria-haspopup="dialog"
                className="group inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-[#888] transition-colors hover:text-[#EDEDED] hover:bg-white/[0.04] active:scale-[0.97]"
              >
                <Play className="h-4 w-4 fill-current opacity-60 transition-transform group-hover:scale-110" />
                Voir la démo
              </button>
            </motion.div>

            {/* Channel badges */}
            <motion.div
              variants={fadeUp}
              className="mt-12 flex flex-wrap items-center gap-3"
            >
              {channels.map((ch) => (
                <div
                  key={ch.label}
                  className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-1.5"
                >
                  <ch.icon className="h-3.5 w-3.5 text-[#777]" />
                  <span className="text-xs text-[#777]">{ch.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column — floating stats */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: 'spring',
              stiffness: 80,
              damping: 20,
              delay: 0.4,
            }}
            className="hidden space-y-4 lg:block"
          >
            {[
              {
                value: '24/7',
                label: 'Disponibilité continue',
                color: 'text-[#E8856C]',
              },
              {
                value: '100%',
                label: 'Centralisation',
                color: 'text-emerald-400',
              },
              {
                value: 'IA',
                label: 'Apprentissage continu',
                color: 'text-amber-400',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 20,
                  delay: 0.6 + i * 0.12,
                }}
                className="w-[220px] rounded-xl border border-white/[0.06] bg-[#131316] p-5"
              >
                <span
                  className={`text-2xl font-semibold tracking-tight ${stat.color}`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {stat.value}
                </span>
                <p className="mt-1 text-xs text-[#777]">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ======== APP PREVIEW — 3D perspective tilt ======== */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 60,
            damping: 20,
            delay: 0.7,
          }}
          className="mx-auto mt-20 max-w-5xl [perspective:2400px]"
        >
          <div
            className="rounded-xl border border-white/[0.08] bg-[#131316] p-1 [transform:rotateX(2deg)]"
            style={{
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.06), 0 40px 100px -20px rgba(0,0,0,0.8)',
            }}
          >
            <div className="overflow-hidden rounded-lg">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0F0F13] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white/[0.04] px-3 py-1">
                  <span className="text-[11px] text-[#777]">
                    app.savly.com/inbox
                  </span>
                </div>
              </div>

              {/* App content */}
              <div className="flex bg-[#0B0B0F]">
                {/* Sidebar */}
                <div className="hidden w-44 border-r border-white/[0.06] p-3 sm:block">
                  <div className="mb-5 flex items-center gap-2 px-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-[#E8856C]/20">
                      <span className="text-[8px] font-bold text-[#E8856C]">
                        S
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-[#EDEDED]/80">
                      Mon Entreprise
                    </span>
                  </div>
                  {sidebarItems.map((item, i) => (
                    <div
                      key={item}
                      className={`mb-0.5 rounded-md px-2 py-1.5 text-[11px] ${i === 0
                        ? 'bg-white/[0.06] font-medium text-[#EDEDED]'
                        : 'text-[#777]'
                        }`}
                    >
                      {item}
                      {i === 0 && (
                        <span
                          className="ml-2 rounded bg-[#E8856C]/20 px-1 py-0.5 text-[8px] text-[#E8856C]"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          3
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ticket list */}
                <div className="hidden w-64 border-r border-white/[0.06] p-3 md:block">
                  <div className="mb-3 px-1">
                    <span
                      className="text-[10px] uppercase tracking-wider text-[#777]"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
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
                            ? 'font-semibold text-[#EDEDED]'
                            : 'text-[#888]'
                            }`}
                        >
                          {t.name}
                        </span>
                        <span
                          className="text-[9px] text-[#777]"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {t.time}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-[#777]">
                        {t.msg}
                      </p>
                      {t.tag && (
                        <span
                          className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[8px] uppercase tracking-wider ${t.tag === 'urgent'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-[#E8856C]/10 text-[#E8856C]'
                            }`}
                        >
                          {t.tag === 'ia' ? 'IA prête' : t.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Conversation */}
                <div className="min-h-[300px] flex-1 p-5">
                  <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div>
                      <span className="text-[12px] font-medium text-[#EDEDED]">
                        Camille Dubois
                      </span>
                      <span className="ml-2 rounded bg-red-500/10 px-1.5 py-0.5 text-[8px] uppercase text-red-400">
                        urgent
                      </span>
                    </div>
                    <span className="text-[10px] text-[#777]">via Gmail</span>
                  </div>

                  <div className="space-y-4">
                    {/* Customer message */}
                    <div className="max-w-[80%]">
                      <div className="rounded-lg bg-white/[0.04] p-3.5">
                        <p className="text-[11px] leading-relaxed text-[#EDEDED]/80">
                          Bonjour, ma commande #4829 devait arriver hier mais je
                          n&apos;ai toujours rien reçu. Pouvez-vous vérifier le
                          statut de la livraison ?
                        </p>
                      </div>
                      <span className="mt-1 block text-[9px] text-[#777]">
                        Camille — il y a 2 min
                      </span>
                    </div>

                    {/* AI suggestion */}
                    <div className="ml-auto max-w-[80%]">
                      <div
                        className="rounded-lg border border-[#E8856C]/15 bg-[#E8856C]/[0.03] p-3.5"
                        style={{
                          boxShadow:
                            'inset 0 1px 0 rgba(232,133,108,0.06)',
                        }}
                      >
                        <div className="mb-2 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[8px] uppercase tracking-wider text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Savly IA — Envoyé automatiquement · 28s
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#EDEDED]/80">
                          Bonjour Camille, je viens de vérifier votre commande
                          #4829. Le colis est actuellement en transit via
                          Colissimo et devrait arriver demain avant 18h. Voici
                          votre lien de suivi : [lien]. N&apos;hésitez pas si
                          vous avez d&apos;autres questions.
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-end">
                        <span className="text-[9px] text-[#777]">
                          Le client a reçu une réponse sans intervention
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
