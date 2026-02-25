'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
}

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
      'Vos données sont hébergées en Europe (infrastructure Supabase sur AWS Frankfurt), chiffrées au repos et en transit. Nous sommes conformes RGPD et ne partageons jamais vos données.',
  },
  {
    question: 'Puis-je tester avant de payer ?',
    answer:
      'Le plan Pro inclut un essai gratuit de 7 jours, sans engagement et sans carte bancaire. Vous pouvez explorer toutes les fonctionnalités avant de décider.',
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
      role="region"
      aria-labelledby="faq-heading"
      className="border-t border-white/[0.06] py-32"
      ref={ref}
    >
      <div className="mx-auto max-w-3xl px-6">
        {/* Centered header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="mb-16 text-center"
        >
          <span className="text-xs uppercase tracking-widest text-[#777]">
            FAQ
          </span>
          <h2
            id="faq-heading"
            className="mt-4 text-4xl font-semibold tracking-tighter text-[#EDEDED] md:text-5xl"
          >
            Questions{' '}
            <span className="text-[#777]">fréquentes</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[42ch] text-sm leading-relaxed text-[#888]">
            Tout ce que vous devez savoir avant de démarrer avec Savly.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={container}
          className="space-y-2"
        >
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            const buttonId = `faq-question-${i}`
            const panelId = `faq-answer-${i}`

            return (
              <motion.div
                key={faq.question}
                variants={fadeUp}
                className={`overflow-hidden rounded-xl border transition-colors ${isOpen
                    ? 'border-white/[0.1] bg-[#131316]'
                    : 'border-white/[0.06] bg-transparent hover:border-white/[0.1]'
                  }`}
              >
                <button
                  id={buttonId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between px-6 py-5 text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4 pr-4">
                    <span
                      className="shrink-0 text-xs text-[#777]"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[15px] font-medium text-[#EDEDED]">
                      {faq.question}
                    </span>
                  </div>
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.03]">
                    {isOpen ? (
                      <Minus className="h-3 w-3 text-[#888]" />
                    ) : (
                      <Plus className="h-3 w-3 text-[#888]" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 20,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pl-[calc(1.5rem+2rem+1rem)]">
                        <p className="text-sm leading-relaxed text-[#888]">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
