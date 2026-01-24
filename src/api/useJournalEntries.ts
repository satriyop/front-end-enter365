import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type JournalEntry = components['schemas']['JournalEntryResource']
export type JournalEntryLine = components['schemas']['JournalEntryLineResource']

export interface JournalEntryFilters {
  page?: number
  per_page?: number
  search?: string
  start_date?: string
  end_date?: string
  is_posted?: boolean
  fiscal_period_id?: number
}

export type CreateJournalEntryData = paths['/journal-entries']['post']['requestBody']['content']['application/json']
export type CreateJournalEntryLineData = CreateJournalEntryData['lines'][number]

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<JournalEntry, JournalEntryFilters, CreateJournalEntryData>({
  resourceName: 'journal-entries',
  singularName: 'journal-entry',
})

export const useJournalEntries = hooks.useList
export const useJournalEntry = hooks.useSingle
export const useCreateJournalEntry = hooks.useCreate
export const useDeleteJournalEntry = hooks.useDelete

// Note: Journal entries typically cannot be updated once created
// They should be reversed and re-created instead

// ============================================
// Action Hooks
// ============================================

/**
 * Post a journal entry (makes it permanent)
 */
export function usePostJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: JournalEntry }>(
        `/journal-entries/${id}/post`
      )
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.setQueryData(['journal-entry', data.id], data)
      // Also invalidate affected accounts
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account'] })
    },
  })
}

/**
 * Reverse a journal entry (creates a new reversing entry)
 */
export function useReverseJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: number | string; description?: string }) => {
      const { id, ...data } = params
      const response = await api.post<{ data: JournalEntry }>(
        `/journal-entries/${id}/reverse`,
        data
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['journal-entry', variables.id] })
      // Also invalidate affected accounts
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account'] })
    },
  })
}

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate totals for journal entry lines
 */
export function calculateLineTotals(lines: CreateJournalEntryLineData[]): {
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  difference: number
} {
  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
  const difference = Math.abs(totalDebit - totalCredit)
  const isBalanced = difference < 0.01 // Allow for floating point precision

  return {
    totalDebit,
    totalCredit,
    isBalanced,
    difference,
  }
}

/**
 * Validate journal entry lines
 */
export function validateJournalLines(lines: CreateJournalEntryLineData[]): string[] {
  const errors: string[] = []

  if (lines.length < 2) {
    errors.push('Journal entry must have at least 2 lines')
  }

  lines.forEach((line, index) => {
    if (!line.account_id) {
      errors.push(`Line ${index + 1}: Account is required`)
    }

    const debit = Number(line.debit) || 0
    const credit = Number(line.credit) || 0

    if (debit === 0 && credit === 0) {
      errors.push(`Line ${index + 1}: Either debit or credit must be greater than 0`)
    }

    if (debit > 0 && credit > 0) {
      errors.push(`Line ${index + 1}: Cannot have both debit and credit on the same line`)
    }

    if (debit < 0 || credit < 0) {
      errors.push(`Line ${index + 1}: Amounts cannot be negative`)
    }
  })

  const { isBalanced, difference } = calculateLineTotals(lines)
  if (!isBalanced) {
    errors.push(`Entry is not balanced. Difference: ${difference.toFixed(2)}`)
  }

  return errors
}

/**
 * Create an empty journal line
 */
export function createEmptyLine(): CreateJournalEntryLineData {
  return {
    account_id: 0,
    description: '',
    debit: 0,
    credit: 0,
  }
}

/**
 * Get status badge info for journal entry
 */
export function getJournalEntryStatus(entry: JournalEntry): {
  label: string
  color: string
} {
  if (entry.is_reversed) {
    return {
      label: 'Reversed',
      color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    }
  }

  if (entry.is_posted) {
    return {
      label: 'Posted',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    }
  }

  return {
    label: 'Draft',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  }
}