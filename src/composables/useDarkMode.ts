import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'enter365:theme'

type Theme = 'light' | 'dark' | 'system'

// Singleton state - shared across all components
const theme = ref<Theme>('system')
let initialized = false

/**
 * Get system preference for dark mode
 */
function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Compute if dark mode should be active based on theme setting
 */
function shouldBeDark(themeValue: Theme): boolean {
  if (themeValue === 'dark') return true
  if (themeValue === 'light') return false
  return getSystemPreference()
}

/**
 * Apply dark class to document
 */
function updateDOM(dark: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', dark)
}

/**
 * Initialize from localStorage
 */
function init() {
  if (initialized) return
  initialized = true

  // Read stored preference
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      theme.value = stored
    }
  } catch {
    // localStorage not available
  }

  // Apply initial theme
  updateDOM(shouldBeDark(theme.value))

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        updateDOM(getSystemPreference())
      }
    })
  }
}

// Computed dark state - reactive based on theme and system preference
const isDark = computed(() => shouldBeDark(theme.value))

// Watch theme changes and update DOM + storage
watch(theme, (newTheme) => {
  updateDOM(shouldBeDark(newTheme))
  try {
    localStorage.setItem(STORAGE_KEY, newTheme)
  } catch {
    // localStorage not available
  }
})

/**
 * Composable for managing dark mode
 *
 * @example
 * const { isDark, theme, setTheme, toggle } = useDarkMode()
 */
export function useDarkMode() {
  // Ensure initialized (idempotent)
  init()

  /**
   * Set theme mode
   */
  function setTheme(newTheme: Theme) {
    theme.value = newTheme
  }

  /**
   * Toggle between light and dark (skips system)
   */
  function toggle() {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  /**
   * Cycle through: light -> dark -> system -> light
   */
  function cycle() {
    const order: Theme[] = ['light', 'dark', 'system']
    const currentIndex = order.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % order.length
    theme.value = order[nextIndex] as Theme
  }

  return {
    /** Current theme setting ('light' | 'dark' | 'system') */
    theme,
    /** Whether dark mode is currently active (computed) */
    isDark,
    /** Set theme mode */
    setTheme,
    /** Toggle between light and dark */
    toggle,
    /** Cycle through all themes */
    cycle,
  }
}

// Initialize immediately in browser
if (typeof window !== 'undefined') {
  init()
}
