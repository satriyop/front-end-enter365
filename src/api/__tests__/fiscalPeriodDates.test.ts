import { describe, expect, it } from 'vitest'
import { formatPeriodRange, isDateInPeriod } from '../useFiscalPeriods'
import type { FiscalPeriod } from '../useFiscalPeriods'

function period(start_date: string, end_date: string): FiscalPeriod {
  return {
    start_date,
    end_date,
  } as FiscalPeriod
}

describe('fiscal period calendar dates (#123)', () => {
  it('formats 1 Jan–31 Dec without shifting to the previous day', () => {
    const range = formatPeriodRange(period('2026-01-01', '2026-12-31'))
    expect(range).toContain('2026')
    expect(range.toLowerCase()).toContain('jan')
    expect(range.toLowerCase()).toContain('des')
    expect(range).not.toMatch(/2025/)
  })

  it('includes the stored start and end days in the period', () => {
    const fy = period('2026-01-01', '2026-12-31')
    expect(isDateInPeriod('2026-01-01', fy)).toBe(true)
    expect(isDateInPeriod('2026-12-31', fy)).toBe(true)
    expect(isDateInPeriod('2025-12-31', fy)).toBe(false)
  })
})
