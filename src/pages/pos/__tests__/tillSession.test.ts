import { describe, expect, it } from 'vitest'
import { bindOutletId, formatHoldClock, resolveStartWarehouse, tillStartBlocked } from '../tillSession'

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
