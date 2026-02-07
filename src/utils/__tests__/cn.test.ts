/**
 * cn.ts Tests
 *
 * Tests the Tailwind class merging utility (clsx + tailwind-merge).
 */

import { describe, it, expect } from 'vitest'
import cn from '../cn'

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('handles conditional classes (clsx)', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra')
  })

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'extra')).toBe('base extra')
  })

  it('handles object syntax', () => {
    expect(cn('base', { hidden: true, flex: false })).toBe('base hidden')
  })

  it('handles array syntax', () => {
    expect(cn(['px-4', 'py-2'])).toBe('px-4 py-2')
  })

  it('resolves color conflicts', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('preserves non-conflicting classes', () => {
    expect(cn('bg-card', 'text-foreground', 'p-4')).toBe('bg-card text-foreground p-4')
  })
})
