import { describe, expect, it } from 'vitest'
import { bindOutletId, formatHoldClock, tillStartBlocked } from '../tillSession'

const outlets = [
  { id: 3, name: 'Gudang Belakang' },
  { id: 7, name: 'Kopitiam 57 — Toko Depan' },
]

describe('bindOutletId', () => {
  it('selects the Kopitiam outlet when none is bound yet', () => {
    expect(bindOutletId(outlets, null)).toBe(7)
  })

  it('keeps a still-valid current outlet', () => {
    expect(bindOutletId(outlets, 3)).toBe(3)
  })
})

describe('tillStartBlocked', () => {
  it('blocks a silent click while the outlet is unbound', () => {
    expect(tillStartBlocked(null, false, false)).toBe(true)
    expect(tillStartBlocked(7, false, false)).toBe(false)
  })
})

describe('formatHoldClock', () => {
  it('shows Asia/Jakarta wall time for a UTC hold', () => {
    expect(formatHoldClock('2026-08-29T10:20:00.000Z')).toMatch(/17[:.]20/)
  })
})
