import { describe, expect, it } from 'vitest'
import {
  analyticDistributionFromAccountId,
  analyticDistributionPrimaryId,
  formatAnalyticDistributionLabel,
} from '../useAnalyticAccounts'

describe('analytic account picker helpers', () => {
  it('maps a selected analytic account to a 100% distribution', () => {
    expect(analyticDistributionFromAccountId('7')).toEqual({ '7': 100 })
    expect(analyticDistributionFromAccountId(12)).toEqual({ '12': 100 })
    expect(analyticDistributionFromAccountId('')).toBeNull()
    expect(analyticDistributionFromAccountId(null)).toBeNull()
  })

  it('reads the primary analytic account id from a distribution map', () => {
    expect(analyticDistributionPrimaryId({ '7': 100 })).toBe('7')
    expect(analyticDistributionPrimaryId({ '3': 60, '4': 40 })).toBe('3')
    expect(analyticDistributionPrimaryId(null)).toBe('')
  })

  it('labels distribution using analytic account master rows', () => {
    const accounts = [
      { id: 7, code: 'MKT', name: 'Marketing', is_active: true },
      { id: 8, code: 'OPS', name: 'Operations', is_active: true },
    ]
    expect(formatAnalyticDistributionLabel({ '7': 100 }, accounts)).toBe('MKT Marketing 100%')
    expect(formatAnalyticDistributionLabel({ '7': 60, '8': 40 }, accounts)).toBe(
      'MKT Marketing 60%, OPS Operations 40%',
    )
    expect(formatAnalyticDistributionLabel({ '99': 100 }, accounts)).toBe('99 100%')
    expect(formatAnalyticDistributionLabel(null, accounts)).toBe('')
  })
})
