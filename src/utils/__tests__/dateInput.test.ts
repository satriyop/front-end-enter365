import { describe, expect, it } from 'vitest'
import { dayFirstToIso, isoToDayFirst } from '../dateInput'

describe('isoToDayFirst', () => {
  it('formats ISO as dd/mm/yyyy', () => {
    expect(isoToDayFirst('2026-08-31')).toBe('31/08/2026')
  })

  it('is empty for blank input', () => {
    expect(isoToDayFirst('')).toBe('')
    expect(isoToDayFirst(undefined)).toBe('')
  })
})

describe('dayFirstToIso', () => {
  it('parses 31/08 as August, not 8 January', () => {
    expect(dayFirstToIso('31/08/2026')).toBe('2026-08-31')
  })

  it('rejects an American 08/31 reading as invalid day-first', () => {
    expect(dayFirstToIso('08/31/2026')).toBeNull()
  })
})
