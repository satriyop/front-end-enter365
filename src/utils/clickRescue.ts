import { restoreDocumentPointerEvents } from '@/utils/hardNavigate'

type RescueHandler = (el: HTMLElement) => void

const handlers = new Map<string, RescueHandler>()
const recent = new Map<string, number>()
const DEBOUNCE_MS = 400

export function onRescue(id: string, handler: RescueHandler): () => void {
  handlers.set(id, handler)
  return () => {
    if (handlers.get(id) === handler) {
      handlers.delete(id)
    }
  }
}

export function unlockInteractiveDocument(): void {
  restoreDocumentPointerEvents()
  document.body.removeAttribute('inert')
  document.body.removeAttribute('aria-hidden')
  document.body.removeAttribute('data-scroll-locked')
  document.documentElement.removeAttribute('inert')
  document.documentElement.removeAttribute('aria-hidden')
  const app = document.getElementById('app')
  app?.removeAttribute('inert')
  app?.removeAttribute('aria-hidden')
}

export function rescueIdFrom(target: EventTarget | null): { id: string; el: HTMLElement } | null {
  if (!(target instanceof Element)) {
    return null
  }
  const el = target.closest<HTMLElement>('[data-rescue], [data-testid]')
  if (!el) {
    return null
  }
  const id = el.getAttribute('data-rescue') || el.getAttribute('data-testid')
  if (!id) {
    return null
  }
  return { id, el }
}

export function dispatchRescue(id: string, el: HTMLElement, now = Date.now()): boolean {
  const last = recent.get(id) ?? 0
  if (now - last < DEBOUNCE_MS) {
    return false
  }
  const handler = handlers.get(id)
  if (!handler) {
    return false
  }
  recent.set(id, now)
  handler(el)
  return true
}

let navRescueSeq = 0

function scheduleInAppLinkFallback(anchor: HTMLAnchorElement): void {
  const href = anchor.getAttribute('href')
  if (!href || !href.startsWith('/') || href.startsWith('//')) {
    return
  }
  const destPath = href.split('?')[0] ?? href
  const seq = ++navRescueSeq
  window.setTimeout(() => {
    if (seq !== navRescueSeq) {
      return
    }
    if (window.location.pathname !== destPath) {
      window.location.assign(href)
    }
  }, 300)
}

function onPointerOrClick(event: Event): void {
  unlockInteractiveDocument()
  const found = rescueIdFrom(event.target)
  if (found) {
    dispatchRescue(found.id, found.el)
  }
  if (event.type !== 'click' || !(event.target instanceof Element)) {
    return
  }
  const anchor = event.target.closest('a[href]')
  if (anchor instanceof HTMLAnchorElement) {
    scheduleInAppLinkFallback(anchor)
  }
}

export function installClickRescue(root: Window = window): () => void {
  root.addEventListener('pointerdown', onPointerOrClick, true)
  root.addEventListener('click', onPointerOrClick, true)
  return () => {
    root.removeEventListener('pointerdown', onPointerOrClick, true)
    root.removeEventListener('click', onPointerOrClick, true)
  }
}
