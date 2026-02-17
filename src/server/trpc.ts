import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { createClient } from '@/lib/supabase/server'

export type Context = {
  supabase: SupabaseClient<Database>
  user: { id: string; email: string } | null
  organizationId: string | null
}

export async function createTRPCContext(): Promise<Context> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let organizationId: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    organizationId = profile?.organization_id ?? null
  }

  return {
    supabase,
    user: user ? { id: user.id, email: user.email ?? '' } : null,
    organizationId,
  }
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.user || !ctx.organizationId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      organizationId: ctx.organizationId,
    },
  })
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(enforceAuth)
