import { afterEach, describe, expect, it, vi } from 'vitest'
import { beginNavigationQuietPeriod, beginPostNavigationUnlock } from '../hardNavigate'
import {
  dispatchRescue,
  installClickRescue,
  onRescue,
  rescueIdFrom,
  unlockInteractiveDocument,
} from '../clickRescue'

describe('unlockInteractiveDocument', () => {
  afterEach(() => {
    document.body.removeAttribute('inert')
    document.body.style.removeProperty('pointer-events')
  })

  it('clears leftover inert and pointer-events locks', () => {
    document.body.setAttribute('inert', '')
    document.body.style.pointerEvents = 'none'

    unlockInteractiveDocument()

    expect(document.body.hasAttribute('inert')).toBe(false)
    expect(document.body.style.pointerEvents).toBe('')
  })
})

describe('rescueIdFrom', () => {
  it('prefers data-rescue then data-testid', () => {
    const el = document.createElement('button')
    el.setAttribute('data-testid', 'kasir-start')
    expect(rescueIdFrom(el)?.id).toBe('kasir-start')
    el.setAttribute('data-rescue', 'start')
    expect(rescueIdFrom(el)?.id).toBe('start')
  })
})

describe('dispatchRescue', () => {
  it('runs the handler once per debounce window', () => {
    const handler = vi.fn()
    const stop = onRescue('kasir-start', handler)
    const el = document.createElement('button')

    expect(dispatchRescue('kasir-start', el, 1000)).toBe(true)
    expect(dispatchRescue('kasir-start', el, 1100)).toBe(false)
    expect(dispatchRescue('kasir-start', el, 1500)).toBe(true)
    expect(handler).toHaveBeenCalledTimes(2)
    stop()
  })
})

describe('installClickRescue', () => {
  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.removeItem('e365-quiet')
    sessionStorage.removeItem('e365-unlock')
    document.documentElement.removeAttribute('data-e365-unlock')
    delete (window as Window & { __e365Rescue?: unknown }).__e365Rescue
  })

  it('fires on capture click even after a later listener stops the event', () => {
    const handler = vi.fn()
    onRescue('kasir-start', handler)
    const stop = installClickRescue(window)
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'kasir-start')
    document.body.appendChild(button)

    const swallow = (event: Event): void => event.stopImmediatePropagation()
    window.addEventListener('click', swallow, true)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(handler).toHaveBeenCalledTimes(1)
    window.removeEventListener('click', swallow, true)
    button.remove()
    stop()
  })

  it('rescues the control under a covering overlay via elementsFromPoint', () => {
    const handler = vi.fn()
    onRescue('kasir-start-under', handler)
    const stop = installClickRescue(window)
    const overlay = document.createElement('div')
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'kasir-start-under')
    document.body.append(overlay, button)
    Object.defineProperty(document, 'elementsFromPoint', {
      configurable: true,
      value: () => [overlay, button],
    })

    const event = new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
    Object.defineProperties(event, {
      clientX: { value: 40 },
      clientY: { value: 40 },
    })
    overlay.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
    overlay.remove()
    button.remove()
    stop()
  })

  it('does not dispatch an orphan click during the post-login quiet period', () => {
    const handler = vi.fn()
    onRescue('kasir-start-quiet', handler)
    const stop = installClickRescue(window)
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'kasir-start-quiet')
    document.body.appendChild(button)
    beginNavigationQuietPeriod()

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(handler).not.toHaveBeenCalled()
    sessionStorage.removeItem('e365-quiet')
    button.remove()
    stop()
  })

  it('still rescues the first pointerdown during the post-login quiet period', () => {
    const handler = vi.fn()
    onRescue('nav-first-after-login', handler)
    const stop = installClickRescue(window)
    const button = document.createElement('button')
    button.setAttribute('data-rescue', 'nav-first-after-login')
    document.body.appendChild(button)
    beginNavigationQuietPeriod()

    button.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }))

    expect(handler).toHaveBeenCalledTimes(1)
    button.remove()
    stop()
  })

  it('strips a post-login body lock without waiting for a pointer event', () => {
    vi.useFakeTimers()
    beginPostNavigationUnlock()
    const stop = installClickRescue(window)
    document.body.style.pointerEvents = 'none'

    vi.advanceTimersByTime(50)

    expect(document.body.style.pointerEvents).toBe('auto')
    expect(document.documentElement.getAttribute('data-e365-unlock')).toBe('')
    stop()
    vi.useRealTimers()
  })

  it('rescues a click with no prior pointerdown once the quiet period ends', () => {
    const handler = vi.fn()
    onRescue('nav-keyboard', handler)
    const stop = installClickRescue(window)
    const button = document.createElement('button')
    button.setAttribute('data-rescue', 'nav-keyboard')
    document.body.appendChild(button)

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(handler).toHaveBeenCalledTimes(1)
    button.remove()
    stop()
  })
})
