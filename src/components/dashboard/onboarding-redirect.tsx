'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function OnboardingRedirect() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname.startsWith('/dashboard/onboarding')) {
      router.replace('/dashboard/onboarding')
    }
  }, [pathname, router])

  return null
}
