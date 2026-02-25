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
    { label: 'CGU', href: '/cgu' },
    { label: 'Confidentialité', href: '/confidentialite' },
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'Cookies', href: '/cookies' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0B0B0F]">
      {/* CTA band */}
      <div className="mx-auto max-w-[1400px] px-6 py-20">
        <div
          className="relative overflow-hidden rounded-xl border border-[#E8856C]/15 bg-[#E8856C]/[0.02] p-10 sm:p-14"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(232,133,108,0.06)',
          }}
        >
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#EDEDED] sm:text-3xl">
                Prêt à automatiser votre SAV ?
              </h2>
              <p className="mt-2 max-w-md text-sm text-[#777]">
                Créez votre compte en 30 secondes. Essai gratuit 7 jours, sans
                carte bancaire.
              </p>
            </div>
            <Link
              href="/signup"
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#E8856C] px-6 py-3 text-sm font-semibold text-[#0B0B0F] transition-all hover:bg-[#F09E8A] active:scale-[0.97]"
            >
              Commencer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Security badges */}
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex flex-wrap items-center justify-center gap-8 border-t border-white/[0.06] py-8">
          {security.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm text-[#777]"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Links grid */}
      <div className="mx-auto max-w-[1400px] px-6 pb-12">
        <div className="grid gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8856C]">
                <span className="text-xs font-black text-[#0B0B0F]">S</span>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-[#EDEDED]">
                Savly
              </span>
            </Link>
            <p className="mt-3 text-sm text-[#777]">
              Votre SAV, en pilote automatique.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-medium uppercase tracking-widest text-[#888]">
                {title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[#777] transition-colors hover:text-[#EDEDED]"
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
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6">
          <p className="text-xs text-[#777]">
            &copy; {new Date().getFullYear()} Savly
          </p>
          <p className="text-xs text-[#777]">Made in France</p>
        </div>
      </div>
    </footer>
  )
}
