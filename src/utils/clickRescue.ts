import {
  endPostNavigationUnlock,
  inNavigationQuietPeriod,
  restoreDocumentPointerEvents,
  shouldHoldDocumentUnlocked,
} from '@/utils/hardNavigate'

type RescueHandler = (el: HTMLElement) => void

type RescueBag = {
  handlers: Map<string, RescueHandler>
  recent: Map<string, number>
  gestureFromThisDocument: boolean
}

function bag(): RescueBag {
  const w = window as Window & { __e365Rescue?: RescueBag }
  w.__e365Rescue ??= { handlers: new Map(), recent: new Map(), gestureFromThisDocument: false }
  return w.__e365Rescue
}

const DEBOUNCE_MS = 400

export function onRescue(id: string, handler: RescueHandler): () => void {
  bag().handlers.set(id, handler)
  return () => {
    if (bag().handlers.get(id) === handler) {
      bag().handlers.delete(id)
    }
  }
}

export function isIntentionalDialogLock(): boolean {
  return Boolean(document.querySelector(
    '[data-radix-dialog-content][data-state="open"], [role="dialog"][data-state="open"]',
  ))
}

function neutralizeStaleOverlays(): void {
  document.querySelectorAll('[data-radix-dialog-overlay]').forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }
    node.style.pointerEvents = 'none'
    node.style.display = 'none'
  })
}

export function unlockInteractiveDocument(): void {
  if (isIntentionalDialogLock()) {
    document.documentElement.removeAttribute('data-e365-unlock')
    return
  }
  restoreDocumentPointerEvents()
  if (shouldHoldDocumentUnlocked()) {
    document.body.style.pointerEvents = 'auto'
    document.documentElement.style.pointerEvents = 'auto'
    document.documentElement.setAttribute('data-e365-unlock', '')
  } else {
    document.documentElement.removeAttribute('data-e365-unlock')
  }
  document.body.removeAttribute('inert')
  document.body.removeAttribute('aria-hidden')
  document.body.removeAttribute('data-scroll-locked')
  document.documentElement.removeAttribute('inert')
  document.documentElement.removeAttribute('aria-hidden')
  const app = document.getElementById('app')
  app?.removeAttribute('inert')
  app?.removeAttribute('aria-hidden')
  if (app) {
    app.style.pointerEvents = 'auto'
  }
  neutralizeStaleOverlays()
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
  const store = bag()
  const last = store.recent.get(id) ?? 0
  if (now - last < DEBOUNCE_MS) {
    return false
  }
  const handler = store.handlers.get(id)
  if (!handler) {
    return false
  }
  store.recent.set(id, now)
  handler(el)
  return true
}

export function hitStack(x: number, y: number): Element[] {
  if (typeof document.elementsFromPoint === 'function') {
    return document.elementsFromPoint(x, y)
  }
  const top = document.elementFromPoint(x, y)
  return top ? [top] : []
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

function eventPoint(event: Event): { x: number; y: number } | null {
  if (event instanceof MouseEvent) {
    return { x: event.clientX, y: event.clientY }
  }
  if ('changedTouches' in event) {
    const touch = (event as TouchEvent).changedTouches.item(0)
    if (touch) {
      return { x: touch.clientX, y: touch.clientY }
    }
  }
  return null
}

function candidatesFrom(event: Event): Element[] {
  const nodes: Element[] = []
  const point = eventPoint(event)
  if (point && (point.x !== 0 || point.y !== 0)) {
    nodes.push(...hitStack(point.x, point.y))
  }
  if (event.target instanceof Element) {
    nodes.push(event.target)
  }
  return nodes
}

function isPointerStart(event: Event): boolean {
  return event.type === 'pointerdown' || event.type === 'mousedown' || event.type === 'touchstart'
}

function onPointerOrClick(event: Event): void {
  unlockInteractiveDocument()
  if (isPointerStart(event)) {
    bag().gestureFromThisDocument = true
  } else if (!bag().gestureFromThisDocument && inNavigationQuietPeriod()) {
    // Leftover Sign-in click after location.assign — not a real in-app gesture.
    event.preventDefault()
    event.stopPropagation()
    return
  }
  const seen = new Set<string>()
  for (const node of candidatesFrom(event)) {
    const found = rescueIdFrom(node)
    if (found && !seen.has(found.id)) {
      seen.add(found.id)
      dispatchRescue(found.id, found.el)
    }
    if (event.type === 'click' && node instanceof Element) {
      const anchor = node.closest('a[href]')
      if (anchor instanceof HTMLAnchorElement) {
        scheduleInAppLinkFallback(anchor)
      }
    }
  }
}

const LISTEN = ['pointerdown', 'mousedown', 'touchstart', 'click'] as const

export function armLoadUnlock(root: Window = window): () => void {
  unlockInteractiveDocument()
  const until = Date.now() + (shouldHoldDocumentUnlocked() ? 15_000 : 1500)
  const tick = (): void => {
    unlockInteractiveDocument()
    if (Date.now() >= until) {
      endPostNavigationUnlock()
      document.documentElement.removeAttribute('data-e365-unlock')
    }
  }
  const interval = root.setInterval(() => {
    tick()
    if (Date.now() >= until) {
      root.clearInterval(interval)
    }
  }, 50)
  const observer = new MutationObserver(() => {
    if (document.body.style.pointerEvents === 'none' || document.body.hasAttribute('inert')) {
      unlockInteractiveDocument()
    }
  })
  observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'inert', 'aria-hidden', 'data-scroll-locked'] })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'inert', 'aria-hidden'] })
  const stopRafUntil = Date.now() + 1500
  const rafTick = (): void => {
    unlockInteractiveDocument()
    if (Date.now() < stopRafUntil) {
      root.requestAnimationFrame(rafTick)
    }
  }
  root.requestAnimationFrame(rafTick)
  return () => {
    root.clearInterval(interval)
    observer.disconnect()
  }
}

export function installClickRescue(root: Window = window): () => void {
  for (const type of LISTEN) {
    root.addEventListener(type, onPointerOrClick, true)
  }
  let stopUnlock = armLoadUnlock(root)
  const onPageShow = (): void => {
    stopUnlock()
    stopUnlock = armLoadUnlock(root)
  }
  root.addEventListener('pageshow', onPageShow)
  return () => {
    for (const type of LISTEN) {
      root.removeEventListener(type, onPointerOrClick, true)
    }
    root.removeEventListener('pageshow', onPageShow)
    stopUnlock()
  }
}
