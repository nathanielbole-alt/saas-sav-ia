import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getSafeNextPath(next: string | null): string {
  if (!next) return '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard'
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedNext = searchParams.get('next')
  const safeNext = getSafeNextPath(requestedNext)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_onboarded')
          .eq('id', user.id)
          .maybeSingle()

        const isDefaultRedirect = !requestedNext || safeNext === '/dashboard'
        if (isDefaultRedirect) {
          const shouldGoToOnboarding = !profile || profile.is_onboarded === false
          const target = shouldGoToOnboarding ? '/dashboard/onboarding' : '/dashboard'
          return NextResponse.redirect(`${origin}${target}`)
        }
      }

      return NextResponse.redirect(`${origin}${safeNext}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
