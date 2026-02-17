'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    question: "Est-ce que l'IA répond vraiment bien ?",
    answer:
      "L'IA analyse le contexte complet : historique de conversation, profil client, commandes Shopify, ancienneté. Chaque réponse peut être relue et modifiée avant envoi. Vous gardez le contrôle total.",
  },
  {
    question: 'Quels canaux sont supportés ?',
    answer:
      'Gmail, Instagram DMs, Facebook Messenger, Shopify (commandes + clients), et Google Reviews. De nouveaux canaux sont ajoutés régulièrement.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      "Vos données sont hébergées en Europe (infrastructure Supabase sur AWS Frankfurt), chiffrées au repos et en transit. Nous sommes conformes RGPD et ne partageons jamais vos données.",
  },
  {
    question: 'Puis-je tester avant de payer ?',
    answer:
      "Le plan Pro inclut un essai gratuit de 7 jours, sans engagement et sans carte bancaire. Vous pouvez explorer toutes les fonctionnalités avant de décider.",
  },
  {
    question: 'Combien de temps pour mettre en place ?',
    answer:
      "Moins de 5 minutes. Créez votre compte, connectez votre boîte mail ou votre boutique Shopify, et l'IA commence immédiatement à analyser vos messages.",
  },
  {
    question: "Que se passe-t-il si l'IA ne sait pas répondre ?",
    answer:
      "L'IA détecte automatiquement les cas complexes (remboursement, client mécontent, question financière) et escalade vers un humain avec une notification. Rien n'est envoyé sans votre accord.",
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="faq"
      className="border-t border-white/[0.06] py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-3xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-600">
            FAQ
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Questions fréquentes
          </h2>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i

            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`overflow-hidden rounded-xl border transition-colors ${isOpen
                    ? 'border-white/[0.1] bg-[#0c0c10]'
                    : 'border-white/[0.06] bg-transparent hover:border-white/[0.1]'
                  }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <div className="flex items-center gap-4 pr-4">
                    <span className="shrink-0 font-mono text-xs text-zinc-600">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[15px] font-medium text-white">
                      {faq.question}
                    </span>
                  </div>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]">
                    {isOpen ? (
                      <Minus className="h-3 w-3 text-zinc-400" />
                    ) : (
                      <Plus className="h-3 w-3 text-zinc-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pl-[calc(1.5rem+2rem+1rem)]">
                        <p className="text-sm leading-relaxed text-zinc-400">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
