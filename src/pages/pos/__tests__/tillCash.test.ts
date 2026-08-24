import { describe, expect, it } from 'vitest'
import { typeCashReceived } from '../tillCash'

describe('typeCashReceived', () => {
  it('types 50000 as 5 then four zeros', () => {
    let received = 0
    for (const key of ['5', '0', '0', '0', '0']) {
      received = typeCashReceived(received, key)
    }
    expect(received).toBe(50_000)
  })

  it('treats a first tap of 5 as Rp5, not Rp5.000', () => {
    expect(typeCashReceived(0, '5')).toBe(5)
  })

  it('appends 000 as three zeros', () => {
    expect(typeCashReceived(5, '000')).toBe(5_000)
    expect(typeCashReceived(50_000, '000')).toBe(50_000_000)
  })

  it('deletes the last digit', () => {
    expect(typeCashReceived(50_000, 'del')).toBe(5_000)
    expect(typeCashReceived(5, 'del')).toBe(0)
  })

  it('ignores taps that would exceed eight digits', () => {
    expect(typeCashReceived(50_000_000, '000')).toBe(50_000_000)
    expect(typeCashReceived(12_345_678, '9')).toBe(12_345_678)
  })
})
