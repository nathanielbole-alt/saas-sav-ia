import Link from 'next/link'
import { ArrowRight, Server, Lock, Shield } from 'lucide-react'

const security = [
  { icon: Server, label: 'Hébergé en Europe' },
  { icon: Lock, label: 'Données chiffrées' },
  { icon: Shield, label: 'RGPD compliant' },
]

const footerLinks = {
  Produit: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  Entreprise: [
    { label: 'À propos', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'CGU', href: '#' },
    { label: 'Confidentialité', href: '#' },
    { label: 'Mentions légales', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#09090b]">
      {/* CTA band */}
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-xl border border-[#8b5cf6]/15 bg-[#8b5cf6]/[0.02] p-10 sm:p-14">
          {/* Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#8b5cf6]/[0.06] blur-[80px]" />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Prêt à automatiser votre SAV ?
              </h2>
              <p className="mt-2 max-w-md text-sm text-zinc-500">
                Créez votre compte en 30 secondes. Essai gratuit 7 jours, sans
                carte bancaire.
              </p>
            </div>
            <Link
              href="/login"
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#8b5cf6] px-6 py-3 font-mono text-sm font-semibold text-[#09090b] transition-all hover:bg-[#a78bfa] hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]"
            >
              Commencer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 border-t border-white/[0.06] py-8">
          {security.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm text-zinc-600"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Links grid */}
      <div className="mx-auto max-w-7xl px-6 pb-12">
        <div className="grid gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#8b5cf6]">
                <span className="text-xs font-black text-[#09090b]">S</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">
                SAV IA
              </span>
            </Link>
            <p className="mt-3 text-sm text-zinc-600">
              Votre SAV, en pilote automatique.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-mono text-xs font-medium uppercase tracking-widest text-zinc-500">
                {title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-600 transition-colors hover:text-zinc-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <p className="font-mono text-xs text-zinc-700">
            &copy; {new Date().getFullYear()} SAV IA
          </p>
          <p className="font-mono text-xs text-zinc-700">Made in France</p>
        </div>
      </div>
    </footer>
  )
}
