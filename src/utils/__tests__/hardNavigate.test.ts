import { afterEach, describe, expect, it, vi } from 'vitest'
import { hardNavigate, inNavigationQuietPeriod, restoreDocumentPointerEvents, shouldHoldDocumentUnlocked, withBootQuery } from '../hardNavigate'

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
  afterEach(() => {
    sessionStorage.removeItem('e365-quiet')
    sessionStorage.removeItem('e365-unlock')
    vi.unstubAllGlobals()
  })

  it('replaces location with a unique boot query so the document actually reloads', () => {
    const replace = vi.fn()
    vi.stubGlobal('location', { replace })
    document.body.style.pointerEvents = 'none'

    hardNavigate('/login')

    expect(document.body.style.pointerEvents).toBe('')
    expect(replace).toHaveBeenCalledWith(expect.stringMatching(/^\/login\?boot=\d+$/))
    expect(inNavigationQuietPeriod()).toBe(true)
    expect(shouldHoldDocumentUnlocked()).toBe(true)
  })
})

describe('withBootQuery', () => {
  it('forces a new URL even when the path is already /', () => {
    expect(withBootQuery('/', 123)).toBe('/?boot=123')
    expect(withBootQuery('/kasir?x=1', 123)).toBe('/kasir?x=1&boot=123')
  })
})
