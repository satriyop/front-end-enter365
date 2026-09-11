import { api, type PaginatedResponse } from './client'

export type PaymentMasterKind = 'payment-terms' | 'payment-methods' | 'payment-providers' | 'checks'
export interface PaymentTermLine {
  type: 'percent' | 'fixed' | 'balance'
  value: number
  days: number
  due_type: 'days_after' | 'end_of_month' | 'end_of_next_month'
}
export interface PaymentConfiguration {
  id?: number
  code: string
  name: string
  is_active: boolean
  note?: string | null
  lines?: PaymentTermLine[]
  direction?: 'inbound' | 'outbound'
  payment_type?: string
  journal_id?: number | null
  state?: 'disabled' | 'test' | 'enabled'
  website?: string | null
  payment_method_ids?: number[]
  next_number?: number
  layout?: 'top' | 'middle' | 'bottom'
  manual_numbering?: boolean
}
export const paymentMasterTitles: Record<PaymentMasterKind, string> = {
  'payment-terms': 'Payment Terms',
  'payment-methods': 'Payment Methods',
  'payment-providers': 'Payment Providers',
  checks: 'Checks',
}
export function newPaymentConfiguration(kind: PaymentMasterKind): PaymentConfiguration {
  const base = { code: '', name: '', is_active: true }
  switch (kind) {
    case 'payment-terms': return { ...base, note: '', lines: [{ type: 'balance', value: 0, days: 30, due_type: 'days_after' }] }
    case 'payment-methods': return { ...base, direction: 'inbound', payment_type: 'bank_transfer', journal_id: null }
    case 'payment-providers': return { ...base, state: 'disabled', journal_id: null, website: '', payment_method_ids: [] }
    case 'checks': return { ...base, journal_id: null, next_number: 1, layout: 'top', manual_numbering: false }
  }
}
export async function listPaymentConfiguration(kind: PaymentMasterKind, params: { page: number; search: string; is_active?: boolean; per_page?: number }) {
  return (await api.get<PaginatedResponse<PaymentConfiguration>>(`/${kind}`, { params })).data
}
export async function savePaymentConfiguration(kind: PaymentMasterKind, record: PaymentConfiguration) {
  const { id, ...data } = record
  const response = id
    ? await api.patch<{ data: PaymentConfiguration }>(`/${kind}/${id}`, data)
    : await api.post<{ data: PaymentConfiguration }>(`/${kind}`, data)
  return response.data.data
}
export async function previewPaymentTerm(id: number, amount: number, date: string) {
  return (await api.post<{ data: { due_date: string; amount: number }[] }>(`/payment-terms/${id}/preview`, { amount, date })).data.data
}
