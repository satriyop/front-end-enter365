import { describe, expect, it } from 'vitest'
import { opnameLineDifference, opnameListStatusLabel } from '../stockOpname'

describe('stock opname count lines', () => {
  it('computes counted minus book qty', () => {
    expect(opnameLineDifference(100, 95)).toBe(-5)
    expect(opnameLineDifference(40, 40)).toBe(0)
    expect(opnameLineDifference(0, 3)).toBe(3)
    expect(opnameLineDifference(10, null)).toBeNull()
  })

  it('maps list statuses to Draft / In Progress / Done', () => {
    expect(opnameListStatusLabel('draft')).toBe('Draft')
    expect(opnameListStatusLabel('counting')).toBe('In Progress')
    expect(opnameListStatusLabel('completed')).toBe('Done')
    expect(opnameListStatusLabel('reviewed', 'Reviewed')).toBe('Reviewed')
  })
})
