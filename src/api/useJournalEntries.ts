import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type JournalEntry = components['schemas']['JournalEntryResource'] & {
  journal_id?: number | null
  journal?: { id: number; name: string; type: string; sequence_prefix: string } | null
}
export type JournalEntryLine = components['schemas']['JournalEntryLineResource']

export interface JournalEntryFilters {
  page?: number
  per_page?: number
  search?: string
  start_date?: string
  end_date?: string
  is_posted?: boolean
  fiscal_period_id?: number
  journal_id?: number
  journal_type?: 'sales' | 'purchase' | 'bank' | 'cash' | 'miscellaneous'
  partner_id?: number
}

export type CreateJournalEntryData = paths['/journal-entries']['post']['requestBody']['content']['application/json'] & {
  journal_id: number
}
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
    mutationFn: async (params: { id: number | string; reversal_date?: string; description?: string }) => {
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
    partner_id: null,
    analytic_distribution: null,
    tax_tag_ids: null,
    description: '',
    debit: 0,
    credit: 0,
  }
}

/**
 * Format Odoo analytic_distribution as "id:pct, id:pct" for the line grid.
 */
export function formatAnalyticDistribution(
  value: { [key: string]: number } | null | undefined,
): string {
  if (!value || Object.keys(value).length === 0) return ''
  return Object.entries(value)
    .map(([id, pct]) => `${id}:${pct}`)
    .join(', ')
}

/**
 * Parse "id:pct, id:pct" (or JSON object) into analytic_distribution.
 * Returns null when empty/invalid.
 */
export function parseAnalyticDistribution(
  raw: string,
): { [key: string]: number } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      const out: { [key: string]: number } = {}
      for (const [k, v] of Object.entries(parsed)) {
        const n = Number(v)
        if (!Number.isFinite(n) || n < 0 || n > 100) return null
        out[String(k)] = n
      }
      return Object.keys(out).length ? out : null
    } catch {
      return null
    }
  }

  const out: { [key: string]: number } = {}
  for (const part of trimmed.split(',')) {
    const piece = part.trim()
    if (!piece) continue
    const [idRaw, pctRaw] = piece.split(':').map((s) => s.trim())
    if (!idRaw || pctRaw === undefined) return null
    const pct = Number(pctRaw)
    if (!/^\d+$/.test(idRaw) || !Number.isFinite(pct) || pct < 0 || pct > 100) return null
    out[idRaw] = pct
  }
  return Object.keys(out).length ? out : null
}

/**
 * Format tax_tag_ids as comma-separated ids for the line grid.
 */
export function formatTaxTagIds(value: number[] | null | undefined): string {
  if (!value || value.length === 0) return ''
  return value.join(', ')
}

/**
 * Parse comma-separated tax tag ids. Returns null when empty; null on invalid.
 */
export function parseTaxTagIds(raw: string): number[] | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const ids: number[] = []
  for (const part of trimmed.split(',')) {
    const piece = part.trim()
    if (!piece) continue
    if (!/^\d+$/.test(piece)) return null
    const n = parseInt(piece, 10)
    if (n < 1) return null
    ids.push(n)
  }
  return ids.length ? ids : null
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