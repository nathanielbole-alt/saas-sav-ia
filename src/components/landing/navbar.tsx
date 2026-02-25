'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Magnetic } from '@/components/landing/magnetic'

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
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed top-0 z-40 w-full transition-all duration-500 ${
        scrolled
          ? 'bg-[#0B0B0F]/90 backdrop-blur-md border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="relative mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-[#E8856C]">
            <span className="text-xs font-black text-[#0B0B0F]">S</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[#EDEDED]">
            Savly
          </span>
        </Link>

        {/* Desktop nav — Dynamic Island pill */}
        <div
          className={`absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full transition-all duration-500 md:flex ${
            scrolled
              ? 'bg-[#131316] px-1.5 py-1 border border-white/[0.06]'
              : 'bg-transparent px-0 py-0'
          }`}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[13px] text-[#888] transition-colors hover:text-[#EDEDED] hover:bg-white/[0.04] active:scale-[0.97]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-[13px] text-[#888] transition-colors hover:text-[#EDEDED]"
          >
            Connexion
          </Link>
          <Magnetic>
            <Link
              href="/signup"
              className="rounded-lg bg-[#E8856C] px-4 py-1.5 text-[13px] font-medium text-[#0B0B0F] transition-all hover:bg-[#F09E8A] active:scale-[0.97]"
            >
              Essai gratuit
            </Link>
          </Magnetic>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-[#888] md:hidden active:scale-[0.97]"
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="overflow-hidden border-t border-white/[0.06] bg-[#0B0B0F] md:hidden"
          >
            <div className="space-y-1 px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md py-2.5 text-[13px] text-[#888] transition-colors hover:text-[#EDEDED]"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                <Link href="/login" className="py-2.5 text-[13px] text-[#888]">
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-[#E8856C] px-4 py-2.5 text-center text-[13px] font-medium text-[#0B0B0F]"
                >
                  Essai gratuit
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
