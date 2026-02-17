import { router, publicProcedure } from '../trpc'
import { z } from 'zod'

export const healthRouter = router({
  check: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }),

  echo: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(({ input }) => {
      return { echo: input.message }
    }),
})
