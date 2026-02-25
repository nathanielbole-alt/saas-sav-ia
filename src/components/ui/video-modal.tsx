'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
}

export function VideoModal({
  isOpen,
  onClose,
  videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0',
}: VideoModalProps) {
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = 'unset'
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              role="dialog"
              aria-modal="true"
              aria-label="Vidéo de démonstration Savly"
              className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-white/[0.06] bg-[#0B0B0F]"
            >
              <button
                onClick={onClose}
                aria-label="Fermer la vidéo"
                className="absolute right-3 top-3 z-10 rounded-md border border-white/[0.06] bg-black/40 p-1.5 text-[#EDEDED]/80 transition-colors hover:text-[#EDEDED]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="aspect-video w-full">
                <iframe
                  src={videoUrl}
                  title="Démonstration Savly"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
