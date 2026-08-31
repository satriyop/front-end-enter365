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
const UNLOCK_KEY = 'e365-unlock'
const UNLOCK_MS = 15_000

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // private mode
  }
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function clearSession(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // private mode
  }
}

/** Next document ignores the leftover Sign-in mouseup/click. */
export function beginNavigationQuietPeriod(): void {
  writeSession(QUIET_KEY, String(Date.now()))
}

export function inNavigationQuietPeriod(now = Date.now()): boolean {
  const raw = readSession(QUIET_KEY)
  if (!raw) {
    return false
  }
  const started = Number(raw)
  if (!Number.isFinite(started) || now - started > QUIET_MS) {
    clearSession(QUIET_KEY)
    return false
  }
  return true
}

/** Next document keeps stripping leftover pointer locks; events never fire while locked. */
export function beginPostNavigationUnlock(): void {
  writeSession(UNLOCK_KEY, String(Date.now()))
}

export function endPostNavigationUnlock(): void {
  clearSession(UNLOCK_KEY)
}

export function shouldHoldDocumentUnlocked(now = Date.now()): boolean {
  const raw = readSession(UNLOCK_KEY)
  if (!raw) {
    return false
  }
  const started = Number(raw)
  if (!Number.isFinite(started) || now - started > UNLOCK_MS) {
    clearSession(UNLOCK_KEY)
    return false
  }
  return true
}

export function withBootQuery(path: string, now = Date.now()): string {
  const hashIndex = path.indexOf('#')
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : ''
  const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path
  const sep = withoutHash.includes('?') ? '&' : '?'
  return `${withoutHash}${sep}boot=${now}${hash}`
}

/**
 * Full document load. `assign('/')` is a no-op when the SPA already sits on `/`
 * (Sign in then client-route to dashboard). A unique `boot` query forces reload.
 */
export function hardNavigate(path: string): void {
  restoreDocumentPointerEvents()
  beginNavigationQuietPeriod()
  beginPostNavigationUnlock()
  window.location.replace(withBootQuery(path))
}
