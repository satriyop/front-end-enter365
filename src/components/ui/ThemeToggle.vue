<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'

interface Props {
  /** Show dropdown for system option */
  showSystemOption?: boolean
  /** Size of the toggle */
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  showSystemOption: false,
  size: 'md',
})

const { isDark, theme, toggle } = useDarkMode()

const sizeClasses = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
}

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
}
</script>

<template>
  <!-- Simple Toggle (no system option) -->
  <button
    v-if="!showSystemOption"
    type="button"
    class="inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
    :class="sizeClasses[size]"
    title="Toggle dark mode"
    @click="toggle"
  >
    <!-- Sun icon (shown in dark mode) -->
    <svg
      v-if="isDark"
      :class="iconSizeClasses[size]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>

    <!-- Moon icon (shown in light mode) -->
    <svg
      v-else
      :class="iconSizeClasses[size]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  </button>

  <!-- Dropdown with System Option -->
  <div v-else class="relative">
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
      :class="sizeClasses[size]"
      @click="toggle"
    >
      <svg
        v-if="isDark"
        :class="iconSizeClasses[size]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg
        v-else
        :class="iconSizeClasses[size]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>

    <!-- Theme indicator for current setting -->
    <span
      v-if="theme === 'system'"
      class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-primary-500 rounded-full"
      title="Using system preference"
    />
  </div>
</template>
