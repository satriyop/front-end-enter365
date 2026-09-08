import { describe, expect, it } from 'vitest'
import { freeToUse } from '../stockPipeline'

describe('stock list pipeline qty', () => {
  it('free to use is on hand minus reserved', () => {
    expect(freeToUse(10, 3)).toBe(7)
    expect(freeToUse(2, 5)).toBe(0)
  })
})
