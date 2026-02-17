import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from '../trpc'
import type { Ticket, Message, Customer } from '@/types/database.types'
import { triggerAutoReply } from '@/lib/ai/auto-reply'
import { enforceFeatureAccess } from '@/lib/feature-gate'

const ticketStatusEnum = z.enum(['open', 'pending', 'resolved', 'closed'])
const ticketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])
const ticketChannelEnum = z.enum(['email', 'form', 'google_review', 'manual'])

export const ticketsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          status: ticketStatusEnum.optional(),
          priority: ticketPriorityEnum.optional(),
          assignedToMe: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input: rawInput }) => {
      const input = rawInput ?? { limit: 20, offset: 0 }
      let query = ctx.supabase
        .from('tickets')
        .select('*, customer:customers(*)', { count: 'exact' })
        .eq('organization_id', ctx.organizationId)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (input.status) {
        query = query.eq('status', input.status)
      }
      if (input.priority) {
        query = query.eq('priority', input.priority)
      }
      if (input.assignedToMe) {
        query = query.eq('assigned_to', ctx.user.id)
      }

      const { data, error, count } = await query

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }

      return {
        tickets: data as (Ticket & { customer: Customer })[],
        total: count ?? 0,
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: ticket, error } = await ctx.supabase
        .from('tickets')
        .select('*, customer:customers(*)')
        .eq('id', input.id)
        .eq('organization_id', ctx.organizationId)
        .single()

      if (error || !ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' })
      }

      const typedTicket = ticket as Ticket & { customer: Customer }

      const [messagesResult, tagsResult] = await Promise.all([
        ctx.supabase
          .from('messages')
          .select('*')
          .eq('ticket_id', input.id)
          .order('created_at', { ascending: true }),
        ctx.supabase
          .from('ticket_tags')
          .select('*, tags(*)')
          .eq('ticket_id', input.id),
      ])

      return {
        ...typedTicket,
        messages: (messagesResult.data ?? []) as Message[],
        tags: (tagsResult.data ?? []).map((row) => (row as { tags: unknown }).tags),
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
        subject: z.string().min(1).max(500),
        channel: ticketChannelEnum.default('email'),
        priority: ticketPriorityEnum.default('medium'),
        body: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check ticket quota for the organization's plan
      try {
        await enforceFeatureAccess(ctx.organizationId, 'tickets')
      } catch (err) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: err instanceof Error ? err.message : 'Limite tickets atteinte',
        })
      }

      // Verify customer belongs to the organization
      const { error: customerError, count } = await ctx.supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('id', input.customerId)
        .eq('organization_id', ctx.organizationId)

      if (customerError || !count) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Customer not found in your organization' })
      }

      // Create ticket
      const { data: ticketData, error: ticketError } = await ctx.supabase
        .from('tickets')
        .insert({
          organization_id: ctx.organizationId,
          customer_id: input.customerId,
          subject: input.subject,
          channel: input.channel,
          priority: input.priority,
        })
        .select('*')
        .single()

      const ticket = ticketData as Ticket | null

      if (ticketError || !ticket) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: ticketError?.message ?? 'Failed to create ticket' })
      }

      // Create first message
      const { error: messageError } = await ctx.supabase.from('messages').insert({
        ticket_id: ticket.id,
        sender_type: 'customer' as const,
        sender_id: input.customerId,
        body: input.body,
      })

      if (messageError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: messageError.message })
      }

      triggerAutoReply(ticket.id)

      return ticket
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: ticketStatusEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('tickets')
        .update({ status: input.status })
        .eq('id', input.id)
        .eq('organization_id', ctx.organizationId)
        .select('*')
        .single()

      if (error || !data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' })
      }

      return data as Ticket
    }),

  assign: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        assignedTo: z.string().uuid().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If assigning to someone, verify they belong to the org
      if (input.assignedTo) {
        const { error: profileError, count } = await ctx.supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('id', input.assignedTo)
          .eq('organization_id', ctx.organizationId)

        if (profileError || !count) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Agent not found in your organization' })
        }
      }

      const { data, error } = await ctx.supabase
        .from('tickets')
        .update({ assigned_to: input.assignedTo })
        .eq('id', input.id)
        .eq('organization_id', ctx.organizationId)
        .select('*')
        .single()

      if (error || !data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' })
      }

      return data as Ticket
    }),
})
