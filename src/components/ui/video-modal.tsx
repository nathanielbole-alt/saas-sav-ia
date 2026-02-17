'use client'

import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface VideoModalProps {
    isOpen: boolean
    onClose: () => void
    videoId?: string // YouTube video ID
}

export function VideoModal({ isOpen, onClose, videoId = 'dQw4w9WgXcQ' }: VideoModalProps) {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-[#0c0c10] shadow-2xl ring-1 ring-white/10"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                                <span className="font-mono text-xs font-medium text-zinc-400">
                                    Démonstration SAV IA
                                </span>
                                <button
                                    onClick={onClose}
                                    className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Video Player */}
                            <div className="aspect-video w-full bg-black">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                    title="YouTube video player"
                                    frameBorder="0"
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
