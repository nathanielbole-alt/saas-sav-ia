import { router } from '../trpc'
import { healthRouter } from './health'
import { ticketsRouter } from './tickets'
import { customersRouter } from './customers'

export const appRouter = router({
  health: healthRouter,
  tickets: ticketsRouter,
  customers: customersRouter,
})

export type AppRouter = typeof appRouter
