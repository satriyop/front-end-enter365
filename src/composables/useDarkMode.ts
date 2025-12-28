import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'enter365:theme'

type Theme = 'light' | 'dark' | 'system'

// Singleton state
const currentTheme = ref<Theme>('system')
const isDark = ref(false)
let initialized = false

/**
 * Get system preference for dark mode
 */
function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Apply theme to document
 */
function applyTheme(dark: boolean) {
  if (typeof document === 'undefined') return

  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  isDark.value = dark
}

/**
 * Initialize theme from storage or system
 */
function initTheme() {
  if (initialized) return

  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      currentTheme.value = stored
    }
  } catch {
    // localStorage not available
  }

  // Calculate actual dark mode based on theme
  const shouldBeDark = currentTheme.value === 'dark' ||
    (currentTheme.value === 'system' && getSystemPreference())

  applyTheme(shouldBeDark)
  initialized = true
}

/**
 * Listen for system preference changes
 */
function setupSystemListener() {
  if (typeof window === 'undefined') return

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handler = (e: MediaQueryListEvent) => {
    if (currentTheme.value === 'system') {
      applyTheme(e.matches)
    }
  }

  mediaQuery.addEventListener('change', handler)

  return () => mediaQuery.removeEventListener('change', handler)
}

/**
 * Composable for managing dark mode
 *
 * @example
 * const { isDark, theme, setTheme, toggle } = useDarkMode()
 */
export function useDarkMode() {
  onMounted(() => {
    initTheme()
    setupSystemListener()
  })

  /**
   * Set theme mode
   */
  function setTheme(theme: Theme) {
    currentTheme.value = theme

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage not available
    }

    const shouldBeDark = theme === 'dark' ||
      (theme === 'system' && getSystemPreference())

    applyTheme(shouldBeDark)
  }

  /**
   * Toggle between light and dark
   */
  function toggle() {
    const newTheme = isDark.value ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Watch for theme changes
  watch(currentTheme, (theme) => {
    const shouldBeDark = theme === 'dark' ||
      (theme === 'system' && getSystemPreference())
    applyTheme(shouldBeDark)
  })

  return {
    /** Current theme setting */
    theme: currentTheme,
    /** Whether dark mode is currently active */
    isDark,
    /** Set theme mode */
    setTheme,
    /** Toggle between light and dark */
    toggle,
  }
}

// Initialize immediately if in browser
if (typeof window !== 'undefined') {
  initTheme()
}
