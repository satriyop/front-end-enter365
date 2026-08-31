import { describe, expect, it } from 'vitest'
import { tillTileMarks } from '../tillMarks'

describe('tillTileMarks', () => {
  it('does not collide Bubur / Bukajo two-letter blocks', () => {
    const marks = tillTileMarks([
      { id: 1, name: 'Bubur Ayam', sku: 'KT57-BUBUR-AY' },
      { id: 2, name: 'Bubur Seafood', sku: 'KT57-BUBUR-SF' },
      { id: 3, name: 'Bukajo 57', sku: 'KT57-BUKAJO' },
      { id: 4, name: 'Bakpao', sku: 'KT57-BAKPAO' },
      { id: 5, name: 'Hakau', sku: 'KT57-HAKAU' },
    ])
    const values = Object.values(marks)
    expect(new Set(values).size).toBe(values.length)
    expect(values.every((mark) => mark.length >= 2)).toBe(true)
  })
})
