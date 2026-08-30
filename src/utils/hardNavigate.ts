/**
 * Radix dialogs set pointer-events on body/html and can leave it stuck
 * after a close or a role switch in the same SPA tab.
 */
export function restoreDocumentPointerEvents(): void {
  document.body.style.removeProperty('pointer-events')
  document.documentElement.style.removeProperty('pointer-events')
}

/** Full load so leftover dialog locks, Pinia, and a waiting SW cannot survive. */
export function hardNavigate(path: string): void {
  restoreDocumentPointerEvents()
  window.location.assign(path)
}
