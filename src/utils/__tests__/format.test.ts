/**
 * format.ts Tests
 *
 * Tests all pure formatting utility functions.
 * Focus areas: Indonesian locale, PHP serialization edge cases,
 * null/undefined handling, compact currency thresholds.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  toNumber,
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  daysRemaining,
  truncate,
  getInitials,
  formatSolarOffset,
  CURRENCY_OPTIONS,
} from '../format'

describe('toNumber', () => {
  it('returns 0 for null', () => {
    expect(toNumber(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(toNumber(undefined)).toBe(0)
  })

  it('passes through a number', () => {
    expect(toNumber(42)).toBe(42)
  })

  it('passes through zero', () => {
    expect(toNumber(0)).toBe(0)
  })

  it('passes through negative number', () => {
    expect(toNumber(-100)).toBe(-100)
  })

  it('parses string number (PHP serialization)', () => {
    expect(toNumber('1500.50')).toBe(1500.5)
  })

  it('parses integer string', () => {
    expect(toNumber('42')).toBe(42)
  })

  it('returns 0 for empty string', () => {
    expect(toNumber('')).toBe(0)
  })

  it('returns 0 for non-numeric string', () => {
    expect(toNumber('abc')).toBe(0)
  })

  it('returns 0 for NaN', () => {
    expect(toNumber(NaN)).toBe(0)
  })

  it('handles float precision', () => {
    expect(toNumber('99.99')).toBe(99.99)
  })
})

describe('formatCurrency', () => {
  it('formats IDR with no decimals', () => {
    const result = formatCurrency(1500000)
    expect(result).toContain('Rp')
    expect(result).toContain('1.500.000')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('Rp')
    expect(formatCurrency(0)).toContain('0')
  })

  it('formats null as Rp 0', () => {
    expect(formatCurrency(null)).toBe('Rp 0')
  })

  it('formats undefined as Rp 0', () => {
    expect(formatCurrency(undefined)).toBe('Rp 0')
  })

  it('formats string value (PHP serialization)', () => {
    const result = formatCurrency('250000')
    expect(result).toContain('250.000')
  })

  it('formats negative values', () => {
    const result = formatCurrency(-50000)
    expect(result).toContain('50.000')
  })

  it('formats USD with 2 decimals', () => {
    const result = formatCurrency(1500.5, 'USD')
    expect(result).toContain('1.500,50')
  })

  it('formats EUR with 2 decimals', () => {
    const result = formatCurrency(99.9, 'EUR')
    expect(result).toContain('99,90')
  })
})

describe('formatCurrencyCompact', () => {
  it('returns Rp 0 for zero', () => {
    expect(formatCurrencyCompact(0)).toBe('Rp 0')
  })

  it('returns Rp 0 for null', () => {
    expect(formatCurrencyCompact(null)).toBe('Rp 0')
  })

  it('shows full format under 1 million', () => {
    const result = formatCurrencyCompact(500000)
    expect(result).toContain('500.000')
  })

  it('shows jt for millions', () => {
    expect(formatCurrencyCompact(5000000)).toContain('jt')
  })

  it('shows millions with decimal for < 100 jt', () => {
    const result = formatCurrencyCompact(5500000)
    expect(result).toBe('Rp 5,5 jt')
  })

  it('shows millions without decimal for >= 100 jt', () => {
    const result = formatCurrencyCompact(326000000)
    expect(result).toBe('Rp 326 jt')
  })

  it('shows M for billions (Miliar)', () => {
    const result = formatCurrencyCompact(1500000000)
    expect(result).toBe('Rp 1,5 M')
  })

  it('handles negative millions', () => {
    const result = formatCurrencyCompact(-5000000)
    expect(result).toBe('-Rp 5,0 jt')
  })

  it('handles negative billions', () => {
    const result = formatCurrencyCompact(-2000000000)
    expect(result).toBe('-Rp 2,0 M')
  })

  it('handles string input', () => {
    const result = formatCurrencyCompact('10000000')
    expect(result).toBe('Rp 10,0 jt')
  })
})

describe('formatNumber', () => {
  it('formats with Indonesian thousand separators', () => {
    expect(formatNumber(1500000)).toBe('1.500.000')
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats string input', () => {
    expect(formatNumber('42000')).toBe('42.000')
  })

  it('formats null as 0', () => {
    expect(formatNumber(null)).toBe('0')
  })
})

describe('formatPercent', () => {
  it('formats with comma decimal separator', () => {
    expect(formatPercent(85.5)).toBe('85,5%')
  })

  it('defaults to 1 decimal place', () => {
    expect(formatPercent(50)).toBe('50,0%')
  })

  it('respects custom decimal places', () => {
    expect(formatPercent(33.333, 2)).toBe('33,33%')
  })

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0,0%')
  })

  it('formats null as 0', () => {
    expect(formatPercent(null)).toBe('0,0%')
  })
})

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('-')
  })

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('-')
  })

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('-')
  })

  it('formats string date in Indonesian format', () => {
    const result = formatDate('2024-12-27')
    expect(result).toContain('27')
    expect(result).toContain('2024')
  })

  it('formats Date object', () => {
    const result = formatDate(new Date(2024, 0, 15))
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })
})

describe('formatDateTime', () => {
  it('returns dash for null', () => {
    expect(formatDateTime(null)).toBe('-')
  })

  it('returns dash for undefined', () => {
    expect(formatDateTime(undefined)).toBe('-')
  })

  it('includes time in output', () => {
    const result = formatDateTime('2024-12-27T14:30:00')
    expect(result).toContain('27')
    expect(result).toContain('2024')
    // Should contain time portion
    expect(result).toMatch(/\d{2}\.\d{2}/)
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows "Baru saja" for < 1 minute', () => {
    const justNow = new Date('2024-06-15T11:59:30')
    expect(formatRelativeTime(justNow)).toBe('Baru saja')
  })

  it('shows minutes for < 60 minutes', () => {
    const fiveMinAgo = new Date('2024-06-15T11:55:00')
    expect(formatRelativeTime(fiveMinAgo)).toBe('5 menit lalu')
  })

  it('shows hours for < 24 hours', () => {
    const twoHoursAgo = new Date('2024-06-15T10:00:00')
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 jam lalu')
  })

  it('shows days for < 7 days', () => {
    const threeDaysAgo = new Date('2024-06-12T12:00:00')
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 hari lalu')
  })

  it('falls back to formatted date for >= 7 days', () => {
    const twoWeeksAgo = new Date('2024-06-01T12:00:00')
    const result = formatRelativeTime(twoWeeksAgo)
    // Should be a formatted date, not a relative string
    expect(result).not.toContain('lalu')
    expect(result).toContain('2024')
  })

  it('accepts string date', () => {
    expect(formatRelativeTime('2024-06-15T11:50:00')).toBe('10 menit lalu')
  })
})

describe('daysRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns positive days for future date', () => {
    const result = daysRemaining('2024-06-20')
    expect(result.days).toBeGreaterThan(0)
    expect(result.isOverdue).toBe(false)
  })

  it('returns overdue for past date', () => {
    const result = daysRemaining('2024-06-10')
    expect(result.days).toBeGreaterThan(0)
    expect(result.isOverdue).toBe(true)
  })

  it('accepts Date object', () => {
    const result = daysRemaining(new Date('2024-06-20'))
    expect(result.isOverdue).toBe(false)
  })
})

describe('truncate', () => {
  it('returns text unchanged if under maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns text unchanged if equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates with ellipsis when over maxLength', () => {
    expect(truncate('hello world', 8)).toBe('hello...')
  })

  it('handles very short maxLength', () => {
    expect(truncate('hello', 4)).toBe('h...')
  })
})

describe('getInitials', () => {
  it('returns initials from two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns single initial for single name', () => {
    expect(getInitials('Satriyo')).toBe('S')
  })

  it('returns max 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('uppercases initials', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('formatSolarOffset', () => {
  it('returns 0% for null', () => {
    const result = formatSolarOffset(null)
    expect(result.value).toBe('0%')
    expect(result.label).toBe('Kebutuhan Tercukupi')
    expect(result.isSurplus).toBe(false)
  })

  it('returns 0% for undefined', () => {
    const result = formatSolarOffset(undefined)
    expect(result.value).toBe('0%')
    expect(result.isSurplus).toBe(false)
  })

  it('returns 0% for zero', () => {
    const result = formatSolarOffset(0)
    expect(result.value).toBe('0%')
    expect(result.isSurplus).toBe(false)
  })

  it('shows percentage for < 100%', () => {
    const result = formatSolarOffset(85)
    expect(result.value).toBe('85,0%')
    expect(result.label).toBe('Kebutuhan Tercukupi')
    expect(result.isSurplus).toBe(false)
  })

  it('shows multiplier for >= 100%', () => {
    const result = formatSolarOffset(250)
    expect(result.value).toBe('2,5x')
    expect(result.label).toBe('Surplus Energi')
    expect(result.isSurplus).toBe(true)
  })

  it('shows 1.0x for exactly 100%', () => {
    const result = formatSolarOffset(100)
    expect(result.value).toBe('1,0x')
    expect(result.isSurplus).toBe(true)
  })
})

describe('CURRENCY_OPTIONS', () => {
  it('contains IDR as first option', () => {
    expect(CURRENCY_OPTIONS[0]).toEqual({ value: 'IDR', label: 'IDR - Rupiah' })
  })

  it('contains 8 currency options', () => {
    expect(CURRENCY_OPTIONS).toHaveLength(8)
  })
})
