import { describe, expect, it } from 'vitest'
import {
  formatAnalyticDistribution,
  parseAnalyticDistribution,
  formatTaxTagIds,
  parseTaxTagIds,
  validateJournalLines,
  type CreateJournalEntryLineData,
} from '../useJournalEntries'

describe('JE line analytic / tax grid helpers', () => {
  it('parses and formats analytic_distribution id:pct pairs', () => {
    expect(parseAnalyticDistribution('1:100')).toEqual({ '1': 100 })
    expect(parseAnalyticDistribution('1:50, 2:50')).toEqual({ '1': 50, '2': 50 })
    expect(parseAnalyticDistribution('{"10":60,"20":40}')).toEqual({ '10': 60, '20': 40 })
    expect(parseAnalyticDistribution('')).toBeNull()
    expect(parseAnalyticDistribution('1:150')).toBeNull()
    expect(parseAnalyticDistribution('bad')).toBeNull()
    expect(formatAnalyticDistribution({ '1': 100 })).toBe('1:100')
    expect(formatAnalyticDistribution(null)).toBe('')
  })

  it('rejects analytic splits that do not sum to 100 percent', () => {
    const balanced: CreateJournalEntryLineData[] = [
      { account_id: 1, debit: 100, credit: 0, analytic_distribution: { '3': 60, '4': 40 } },
      { account_id: 2, debit: 0, credit: 100, analytic_distribution: null },
    ]
    expect(validateJournalLines(balanced)).toEqual([])

    const unbalanced: CreateJournalEntryLineData[] = [
      { account_id: 1, debit: 100, credit: 0, analytic_distribution: { '3': 60, '4': 30 } },
      { account_id: 2, debit: 0, credit: 100, analytic_distribution: null },
    ]
    expect(validateJournalLines(unbalanced).some((error) => error.includes('sum to 100%'))).toBe(true)
  })

  it('parses and formats tax_tag_ids', () => {
    expect(parseTaxTagIds('101, 202')).toEqual([101, 202])
    expect(parseTaxTagIds('')).toBeNull()
    expect(parseTaxTagIds('abc')).toBeNull()
    expect(parseTaxTagIds('0')).toBeNull()
    expect(formatTaxTagIds([101, 202])).toBe('101, 202')
    expect(formatTaxTagIds(null)).toBe('')
  })
})
