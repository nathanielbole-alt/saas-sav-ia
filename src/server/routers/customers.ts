import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import type { Customer, Ticket } from '@/types/database.types'

export const customersRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input: rawInput }) => {
      const input = rawInput ?? { limit: 20, offset: 0 }
      let query = ctx.supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('organization_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (input.search) {
        const term = input.search.replace(/[^\p{L}\p{N}@._\- ]/gu, '').trim()
        if (term) {
          query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        }
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }

      return { customers: (data ?? []) as Customer[], total: count ?? 0 }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: customer, error } = await ctx.supabase
        .from('customers')
        .select('*')
        .eq('id', input.id)
        .eq('organization_id', ctx.organizationId)
        .single()

      if (error || !customer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' })
      }

      const { data: tickets } = await ctx.supabase
        .from('tickets')
        .select('*')
        .eq('customer_id', input.id)
        .eq('organization_id', ctx.organizationId)
        .order('created_at', { ascending: false })

      return {
        ...(customer as Customer),
        tickets: (tickets ?? []) as Ticket[],
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        fullName: z.string().min(1).optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('customers')
        .insert({
          organization_id: ctx.organizationId,
          email: input.email,
          full_name: input.fullName ?? null,
          phone: input.phone ?? null,
        })
        .select('*')
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A customer with this email already exists' })
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }

      return data as Customer
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        email: z.string().email().optional(),
        fullName: z.string().min(1).optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, string | null | undefined> = {}
      if (input.email !== undefined) updateData.email = input.email
      if (input.fullName !== undefined) updateData.full_name = input.fullName
      if (input.phone !== undefined) updateData.phone = input.phone

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No fields to update' })
      }

      const { data, error } = await ctx.supabase
        .from('customers')
        .update(updateData)
        .eq('id', input.id)
        .eq('organization_id', ctx.organizationId)
        .select('*')
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A customer with this email already exists' })
        }
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' })
      }

      return data as Customer
    }),
})
