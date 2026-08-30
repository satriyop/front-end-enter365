import { afterEach, describe, expect, it, vi } from 'vitest'
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
  it('fires on capture click even after a later listener stops the event', () => {
    const handler = vi.fn()
    onRescue('kasir-start', handler)
    const stop = installClickRescue(window)
    const button = document.createElement('button')
    button.setAttribute('data-testid', 'kasir-start')
    document.body.appendChild(button)

    window.addEventListener('click', (event) => event.stopImmediatePropagation(), true)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(handler).toHaveBeenCalledTimes(1)
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
})
