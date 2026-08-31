import { describe, expect, it } from 'vitest'
import { bindOutletId, formatHoldClock, resolveStartWarehouse, tillExpectedCash, tillStartBlocked } from '../tillSession'

const outlets = [
  { id: 3, name: 'Gudang Belakang' },
  { id: 7, name: 'Kopitiam 57 — Toko Depan' },
]

describe('tillExpectedCash', () => {
  it('adds cash tenders to opening so recap matches booked drawer', () => {
    expect(tillExpectedCash(200_000, [
      {
        status: 'completed',
        payable_amount: 25_410,
        tenders: [{ type: 'cash', amount: 25_410 }],
      },
      {
        status: 'completed',
        payable_amount: 9_240,
        tenders: [{ type: 'cash', amount: 9_240 }],
      },
      {
        status: 'completed',
        payable_amount: 9_240,
        tenders: [{ type: 'cash', amount: 9_240 }],
      },
      {
        status: 'voided',
        payable_amount: 25_410,
        tenders: [{ type: 'cash', amount: 25_410 }],
      },
    ])).toBe(243_890)
  })

  it('does not treat missing tenders as cash (wait for sales refresh)', () => {
    expect(tillExpectedCash(200_000, [
      { status: 'completed', payable_amount: 25_410 },
    ])).toBe(200_000)
  })
})

describe('bindOutletId', () => {
  it('selects the Kopitiam outlet when none is bound yet', () => {
    expect(bindOutletId(outlets, null)).toBe(7)
  })

  it('keeps a still-valid current outlet', () => {
    expect(bindOutletId(outlets, 3)).toBe(3)
  })
})

describe('tillStartBlocked', () => {
  it('does not disable Mulai jualan just because the outlet is still unbound', () => {
    expect(tillStartBlocked(false, false)).toBe(false)
  })

  it('disables only while locked or a start request is in flight', () => {
    expect(tillStartBlocked(true, false)).toBe(true)
    expect(tillStartBlocked(false, true)).toBe(true)
  })
})

describe('resolveStartWarehouse', () => {
  it('binds Kopitiam on the first click before outlets paint into v-model', () => {
    expect(resolveStartWarehouse(outlets, null)).toEqual({ warehouseId: 7, error: null })
  })

  it('asks the kasir to wait when outlets have not loaded', () => {
    expect(resolveStartWarehouse([], null)).toEqual({
      warehouseId: null,
      error: 'Outlet masih dimuat, coba lagi.',
    })
  })
})

describe('formatHoldClock', () => {
  it('shows Asia/Jakarta wall time for a UTC hold', () => {
    expect(formatHoldClock('2026-08-29T10:20:00.000Z')).toMatch(/17[:.]20/)
  })
})
