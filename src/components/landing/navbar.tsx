'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled
        ? 'bg-[#09090b]/90 backdrop-blur-md border-b border-white/[0.06]'
        : 'bg-transparent'
        }`}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-[#8b5cf6]">
            <span className="text-xs font-black text-[#09090b]">S</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            SAV IA
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3.5 py-2 font-mono text-[13px] text-zinc-500 transition-colors hover:text-zinc-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="font-mono text-[13px] text-zinc-500 transition-colors hover:text-white"
          >
            Connexion
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-[#8b5cf6] px-4 py-1.5 font-mono text-[13px] font-medium text-[#09090b] transition-all hover:bg-[#a78bfa] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          >
            Essai gratuit
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-zinc-400 md:hidden"
          aria-label="Ouvrir le menu"
        >{mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/[0.06] bg-[#09090b] md:hidden"
          >
            <div className="space-y-1 px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md py-2.5 font-mono text-[13px] text-zinc-400 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                <Link
                  href="/login"
                  className="py-2.5 font-mono text-[13px] text-zinc-400"
                >
                  Connexion
                </Link>
                <Link
                  href="/login"
                  className="rounded-md bg-[#8b5cf6] px-4 py-2.5 text-center font-mono text-[13px] font-medium text-[#09090b]"
                >
                  Essai gratuit
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
