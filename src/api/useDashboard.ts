/**
 * Dashboard API hooks
 * Level 2 Pattern: Types + Queries in one file
 */

import { useQuery } from '@tanstack/vue-query'
import { api } from './client'

// Types
export interface DashboardSummary {
  period: {
    start_date: string
    end_date: string
  }
  receivables: {
    outstanding: string | number
    outstanding_count: string | number
    overdue: string | number
    overdue_count: string | number
  }
  payables: {
    outstanding: string | number
    outstanding_count: string | number
    overdue: string | number
    overdue_count: string | number
  }
  cash_position: {
    total: number
    accounts: Array<{
      account_id: string
      code: string
      name: string
      balance: string
    }>
  }
  recent_activity: Array<{
    type: string
    description: string
    amount?: string
    date: string
  }>
  monthly_comparison: Record<string, unknown>
}

export interface DashboardReceivables {
  total_outstanding: string
  total_overdue: string
  aging: {
    current: string
    '1_30_days': string
    '31_60_days': string
    '61_90_days': string
    over_90_days: string
  }
  top_customers: Array<{
    contact_id: string
    name: string
    outstanding: string
  }>
}

export interface DashboardPayables {
  total_outstanding: string
  total_overdue: string
  aging: {
    current: string
    '1_30_days': string
    '31_60_days': string
    '61_90_days': string
    over_90_days: string
  }
  top_vendors: Array<{
    contact_id: string
    name: string
    outstanding: string
  }>
}

export interface DashboardCashFlow {
  period_days: number
  total_inflow: string
  total_outflow: string
  net_cash_flow: string
  inflow_breakdown: Array<{
    source: string
    amount: string
  }>
  outflow_breakdown: Array<{
    source: string
    amount: string
  }>
}

export interface DashboardKPIs {
  revenue: {
    mtd: string
    ytd: string
    growth_rate: number
  }
  gross_margin: {
    current: number
    previous: number
    change: number
  }
  dso: number
  dpo: number
  project_metrics: {
    active_count: number
    completion_rate: number
    avg_margin: number
  }
}

// Queries
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await api.get<DashboardSummary>('/dashboard/summary')
      return response.data
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useDashboardReceivables() {
  return useQuery({
    queryKey: ['dashboard', 'receivables'],
    queryFn: async () => {
      const response = await api.get<DashboardReceivables>('/dashboard/receivables')
      return response.data
    },
    staleTime: 60 * 1000,
  })
}

export function useDashboardPayables() {
  return useQuery({
    queryKey: ['dashboard', 'payables'],
    queryFn: async () => {
      const response = await api.get<DashboardPayables>('/dashboard/payables')
      return response.data
    },
    staleTime: 60 * 1000,
  })
}

export function useDashboardCashFlow() {
  return useQuery({
    queryKey: ['dashboard', 'cash-flow'],
    queryFn: async () => {
      const response = await api.get<DashboardCashFlow>('/dashboard/cash-flow')
      return response.data
    },
    staleTime: 60 * 1000,
  })
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const response = await api.get<DashboardKPIs>('/dashboard/kpis')
      return response.data
    },
    staleTime: 60 * 1000,
  })
}
