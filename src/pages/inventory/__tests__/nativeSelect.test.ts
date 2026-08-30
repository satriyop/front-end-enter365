import { describe, expect, it } from 'vitest'
import { pickedOptionValue } from '../nativeSelect'

const products = [
  { value: 11, label: 'KT57-SMEER' },
  { value: 22, label: 'KT57-SB-GARLIC' },
  { value: 33, label: 'KT57-CROISS-BT' },
]

describe('pickedOptionValue', () => {
  it('selects the option whose value was clicked, not a neighbor', () => {
    expect(pickedOptionValue(products, '22')).toBe(22)
    expect(pickedOptionValue(products, '11')).toBe(11)
    expect(pickedOptionValue(products, '')).toBeNull()
  })
})
