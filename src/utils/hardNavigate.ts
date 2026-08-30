/**
 * Radix dialogs set pointer-events on body/html and can leave it stuck
 * after a close or a role switch in the same SPA tab.
 */
export function restoreDocumentPointerEvents(): void {
  document.body.style.removeProperty('pointer-events')
  document.documentElement.style.removeProperty('pointer-events')
}

const QUIET_KEY = 'e365-quiet'
const QUIET_MS = 800

/** Next document ignores the leftover Sign-in mouseup/click. */
export function beginNavigationQuietPeriod(): void {
  try {
    sessionStorage.setItem(QUIET_KEY, String(Date.now()))
  } catch {
    // private mode
  }
}

export function inNavigationQuietPeriod(now = Date.now()): boolean {
  try {
    const raw = sessionStorage.getItem(QUIET_KEY)
    if (!raw) {
      return false
    }
    const started = Number(raw)
    if (!Number.isFinite(started) || now - started > QUIET_MS) {
      sessionStorage.removeItem(QUIET_KEY)
      return false
    }
    return true
  } catch {
    return false
  }
}

/** Full load so leftover dialog locks, Pinia, and a waiting SW cannot survive. */
export function hardNavigate(path: string): void {
  restoreDocumentPointerEvents()
  beginNavigationQuietPeriod()
  window.location.assign(path)
}
