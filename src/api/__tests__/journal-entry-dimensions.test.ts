import { describe, expect, it } from 'vitest'
import {
  formatAnalyticDistribution,
  parseAnalyticDistribution,
  formatTaxTagIds,
  parseTaxTagIds,
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

  it('parses and formats tax_tag_ids', () => {
    expect(parseTaxTagIds('101, 202')).toEqual([101, 202])
    expect(parseTaxTagIds('')).toBeNull()
    expect(parseTaxTagIds('abc')).toBeNull()
    expect(parseTaxTagIds('0')).toBeNull()
    expect(formatTaxTagIds([101, 202])).toBe('101, 202')
    expect(formatTaxTagIds(null)).toBe('')
  })
})
