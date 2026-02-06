/**
 * Payment Reminder API hooks
 * Covers: reminder list, summary, invoice reminders, send, cancel, schedule
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'

// ============================================
// Types (hand-written until types.ts is regenerated)
// ============================================

export interface PaymentReminder {
  id: number
  remindable_type: string // 'Invoice' | 'Bill'
  remindable_id: number
  remindable?: {
    id: number
    invoice_number?: string
    bill_number?: string
    contact?: { id: number; name: string }
    total_amount?: number
    outstanding_amount?: number
    due_date?: string
    status?: { value: string; label: string }
  }
  contact_id: number
  contact?: { id: number; name: string; email?: string | null }
  type: 'upcoming' | 'overdue' | 'final_notice'
  days_offset: number
  scheduled_date: string
  sent_date: string | null
  status: 'pending' | 'sent' | 'cancelled' | 'failed'
  channel: 'email' | 'sms' | 'whatsapp' | 'database'
  message: string | null
  metadata: Record<string, unknown> | null
  creator?: { id: number; name: string }
  created_by: number | null
  created_at: string | null
  updated_at: string | null
}

export interface ReminderFilters {
  page?: number
  per_page?: number
  status?: string
  type?: string
  remindable_type?: string
  contact_id?: number
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_dir?: string
}

export interface ReminderSummary {
  pending: number
  due_today: number
  sent_this_week: number
  failed: number
  total_overdue_invoices: number
}

export interface ScheduleReminderData {
  scheduled_date: string
  type: 'upcoming' | 'overdue' | 'final_notice'
  channel: 'email' | 'whatsapp'
  message?: string | null
}

// ============================================
// Query Hooks
// ============================================

/**
 * List payment reminders (paginated, filterable)
 */
export function usePaymentReminderList(filters: Ref<ReminderFilters>) {
  return useQuery({
    queryKey: computed(() => ['payment-reminders', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<PaymentReminder>>('/payment-reminders', {
        params: cleanParams,
      })
      return response.data
    },
  })
}

/**
 * Dashboard summary counts
 */
export function usePaymentReminderSummary() {
  return useQuery({
    queryKey: ['payment-reminder-summary'],
    queryFn: async () => {
      const response = await api.get<ReminderSummary>('/payment-reminders/summary')
      return response.data
    },
    staleTime: 60_000,
  })
}

/**
 * Reminders for a specific invoice
 */
export function useInvoiceReminders(invoiceId: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['invoice-reminders', invoiceId.value]),
    queryFn: async () => {
      const response = await api.get<{ data: PaymentReminder[] }>(
        `/invoices/${invoiceId.value}/reminders`
      )
      return response.data.data
    },
    enabled: computed(() => !!invoiceId.value && invoiceId.value > 0),
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Send a pending reminder immediately
 */
export function useSendReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await api.post<{ data: PaymentReminder }>(
        `/payment-reminders/${id}/send`
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-summary'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
    },
  })
}

/**
 * Cancel a pending reminder
 */
export function useCancelReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await api.post<{ data: PaymentReminder }>(
        `/payment-reminders/${id}/cancel`
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-summary'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
    },
  })
}

/**
 * Schedule a custom reminder for an invoice
 */
export function useScheduleReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId, data }: { invoiceId: number; data: ScheduleReminderData }) => {
      const response = await api.post<{ data: PaymentReminder }>(
        `/invoices/${invoiceId}/reminders`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-summary'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
    },
  })
}

/**
 * Quick action: create and send an immediate reminder
 */
export function useSendImmediateReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      invoiceId,
      message,
      channel,
    }: {
      invoiceId: number
      message?: string | null
      channel?: 'email' | 'whatsapp'
    }) => {
      const response = await api.post<{ data: PaymentReminder }>(
        `/invoices/${invoiceId}/send-reminder`,
        { message, channel }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['payment-reminder-summary'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-reminders'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
    },
  })
}
