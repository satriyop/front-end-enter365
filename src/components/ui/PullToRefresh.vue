<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePullToRefresh } from '@/composables/usePullToRefresh'

interface Props {
  /** Callback when refresh is triggered */
  onRefresh?: () => Promise<void>
  /** Minimum pull distance to trigger refresh (px) */
  threshold?: number
  /** Maximum pull distance (px) */
  maxPull?: number
  /** Disable pull to refresh */
  disabled?: boolean
  /** Custom loading text */
  loadingText?: string
  /** Custom pull text */
  pullText?: string
  /** Custom release text */
  releaseText?: string
}

const props = withDefaults(defineProps<Props>(), {
  threshold: 80,
  maxPull: 120,
  disabled: false,
  loadingText: 'Refreshing...',
  pullText: 'Pull to refresh',
  releaseText: 'Release to refresh',
})

const emit = defineEmits<{
  refresh: []
}>()

const containerRef = ref<HTMLElement | null>(null)

const { state } = usePullToRefresh({
  containerRef,
  onRefresh: async () => {
    if (props.onRefresh) {
      await props.onRefresh()
    }
    emit('refresh')
  },
  threshold: props.threshold,
  maxPull: props.maxPull,
  disabled: props.disabled,
})

// Status message
const statusText = computed(() => {
  if (state.value.isRefreshing) return props.loadingText
  if (state.value.canRelease) return props.releaseText
  return props.pullText
})

// Icon rotation based on progress
const iconRotation = computed(() => {
  if (state.value.isRefreshing) return 0
  return state.value.progress * 180
})
</script>

<template>
  <div
    ref="containerRef"
    class="pull-to-refresh-container relative overflow-auto"
  >
    <!-- Pull indicator -->
    <div
      class="pull-indicator absolute top-0 left-0 right-0 flex flex-col items-center justify-end pb-2 pointer-events-none z-10"
      :style="{
        height: `${threshold}px`,
        transform: `translateY(${state.pullDistance - threshold}px)`,
        opacity: state.pullDistance > 0 ? 1 : 0,
        transition: state.isPulling ? 'none' : 'all 0.2s ease-out',
      }"
    >
      <!-- Spinner or arrow icon -->
      <div
        class="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-md mb-2"
      >
        <!-- Spinning loader when refreshing -->
        <svg
          v-if="state.isRefreshing"
          class="w-5 h-5 text-primary-600 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>

        <!-- Arrow that rotates -->
        <svg
          v-else
          class="w-5 h-5 text-slate-600 dark:text-slate-300 transition-transform duration-200"
          :style="{ transform: `rotate(${iconRotation}deg)` }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>

      <!-- Status text -->
      <span class="text-xs text-slate-500 dark:text-slate-400">
        {{ statusText }}
      </span>
    </div>

    <!-- Content with transform -->
    <div
      class="pull-content"
      :style="{
        transform: `translateY(${state.pullDistance}px)`,
        transition: state.isPulling ? 'none' : 'transform 0.2s ease-out',
      }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.pull-to-refresh-container {
  /* Prevent rubber-banding on iOS when not at scroll boundaries */
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

.pull-indicator {
  background: linear-gradient(
    to bottom,
    theme('colors.slate.100') 0%,
    transparent 100%
  );
}

:root.dark .pull-indicator {
  background: linear-gradient(
    to bottom,
    theme('colors.slate.800') 0%,
    transparent 100%
  );
}
</style>
