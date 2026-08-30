import { afterEach, describe, expect, it, vi } from 'vitest'
import { hardNavigate, restoreDocumentPointerEvents } from '../hardNavigate'

describe('restoreDocumentPointerEvents', () => {
  afterEach(() => {
    document.body.style.removeProperty('pointer-events')
    document.documentElement.style.removeProperty('pointer-events')
  })

  it('clears a leftover Radix body lock', () => {
    document.body.style.pointerEvents = 'none'
    document.documentElement.style.pointerEvents = 'none'

    restoreDocumentPointerEvents()

    expect(document.body.style.pointerEvents).toBe('')
    expect(document.documentElement.style.pointerEvents).toBe('')
  })
})

describe('hardNavigate', () => {
  it('restores pointer events then assigns location', () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { assign })
    document.body.style.pointerEvents = 'none'

    hardNavigate('/login')

    expect(document.body.style.pointerEvents).toBe('')
    expect(assign).toHaveBeenCalledWith('/login')
    vi.unstubAllGlobals()
  })
})
