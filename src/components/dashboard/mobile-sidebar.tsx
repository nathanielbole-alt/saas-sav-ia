'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { usePathname } from 'next/navigation'

export function MobileSidebar({
    user,
    unreadCount,
}: {
    user: { email: string }
    unreadCount?: number
}) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    // Close sidebar on route change
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Prevent body scroll when open
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
        <>
            {/* Mobile Header Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="md:hidden flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                aria-label="Ouvrir le menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 md:hidden transition-opacity duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#050505] shadow-2xl transition-transform duration-300 ease-out md:hidden ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-full flex-col p-3">
                    <div className="flex items-center justify-end mb-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                            aria-label="Fermer le menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <Sidebar user={user} unreadCount={unreadCount} />
                    </div>
                </div>
            </div>
        </>
    )
}
