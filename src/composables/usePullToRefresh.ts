import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface PullToRefreshOptions {
  /** Container element ref */
  containerRef: Ref<HTMLElement | null>
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>
  /** Minimum pull distance to trigger refresh (px) */
  threshold?: number
  /** Maximum pull distance (px) */
  maxPull?: number
  /** Only enable on touch devices */
  touchOnly?: boolean
  /** Disable pull to refresh */
  disabled?: boolean
}

export interface PullToRefreshState {
  /** Whether user is currently pulling */
  isPulling: boolean
  /** Current pull distance */
  pullDistance: number
  /** Whether refresh is in progress */
  isRefreshing: boolean
  /** Pull progress (0-1) */
  progress: number
  /** Whether threshold is reached */
  canRelease: boolean
}

/**
 * Composable for pull-to-refresh gesture
 *
 * @example
 * const containerRef = ref<HTMLElement | null>(null)
 * const { state, indicatorStyle } = usePullToRefresh({
 *   containerRef,
 *   onRefresh: async () => {
 *     await refetch()
 *   }
 * })
 *
 * <div ref="containerRef" class="overflow-auto">
 *   <div :style="indicatorStyle" class="pull-indicator">
 *     <Spinner v-if="state.isRefreshing" />
 *     <span v-else>{{ state.canRelease ? 'Release to refresh' : 'Pull to refresh' }}</span>
 *   </div>
 *   <!-- Content -->
 * </div>
 */
export function usePullToRefresh(options: PullToRefreshOptions) {
  const {
    containerRef,
    onRefresh,
    threshold = 80,
    maxPull = 120,
    touchOnly = true,
    disabled = false,
  } = options

  const state = ref<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    progress: 0,
    canRelease: false,
  })

  let startY = 0
  let currentY = 0
  let isTouching = false

  /**
   * Check if device supports touch
   */
  function isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  /**
   * Check if we're at the top of scroll
   */
  function isAtTop(): boolean {
    if (!containerRef.value) return false
    return containerRef.value.scrollTop <= 0
  }

  /**
   * Handle touch/mouse start
   */
  function handleStart(clientY: number) {
    if (disabled || state.value.isRefreshing) return
    if (!isAtTop()) return

    startY = clientY
    isTouching = true
  }

  /**
   * Handle touch/mouse move
   */
  function handleMove(clientY: number) {
    if (!isTouching || disabled || state.value.isRefreshing) return
    if (!isAtTop()) {
      // User scrolled away from top, cancel pull
      reset()
      return
    }

    currentY = clientY
    const deltaY = currentY - startY

    if (deltaY > 0) {
      // Pulling down
      state.value.isPulling = true

      // Apply resistance - gets harder to pull further
      const resistance = 0.5
      const resistedDelta = Math.min(deltaY * resistance, maxPull)

      state.value.pullDistance = resistedDelta
      state.value.progress = Math.min(resistedDelta / threshold, 1)
      state.value.canRelease = resistedDelta >= threshold

      // Prevent default scrolling when pulling
      if (containerRef.value) {
        containerRef.value.style.overflow = 'hidden'
      }
    }
  }

  /**
   * Handle touch/mouse end
   */
  async function handleEnd() {
    if (!isTouching || disabled) return

    isTouching = false

    if (state.value.canRelease && !state.value.isRefreshing) {
      // Trigger refresh
      state.value.isRefreshing = true
      state.value.pullDistance = threshold // Snap to threshold height

      try {
        await onRefresh()
      } finally {
        state.value.isRefreshing = false
        reset()
      }
    } else {
      reset()
    }
  }

  /**
   * Reset state
   */
  function reset() {
    state.value.isPulling = false
    state.value.pullDistance = 0
    state.value.progress = 0
    state.value.canRelease = false

    if (containerRef.value) {
      containerRef.value.style.overflow = ''
    }
  }

  // Touch event handlers
  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    if (touch) {
      handleStart(touch.clientY)
    }
  }

  function onTouchMove(e: TouchEvent) {
    const touch = e.touches[0]
    if (touch) {
      handleMove(touch.clientY)
      // Prevent scroll if pulling
      if (state.value.isPulling) {
        e.preventDefault()
      }
    }
  }

  function onTouchEnd() {
    handleEnd()
  }

  // Mouse event handlers (for testing on desktop)
  function onMouseDown(e: MouseEvent) {
    if (touchOnly && isTouchDevice()) return
    handleStart(e.clientY)
  }

  function onMouseMove(e: MouseEvent) {
    if (touchOnly && isTouchDevice()) return
    handleMove(e.clientY)
  }

  function onMouseUp() {
    if (touchOnly && isTouchDevice()) return
    handleEnd()
  }

  function onMouseLeave() {
    if (touchOnly && isTouchDevice()) return
    if (isTouching) {
      handleEnd()
    }
  }

  // Setup/teardown
  onMounted(() => {
    const container = containerRef.value
    if (!container) return

    // Touch events
    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd, { passive: true })

    // Mouse events (for desktop testing)
    if (!touchOnly) {
      container.addEventListener('mousedown', onMouseDown)
      container.addEventListener('mousemove', onMouseMove)
      container.addEventListener('mouseup', onMouseUp)
      container.addEventListener('mouseleave', onMouseLeave)
    }
  })

  onUnmounted(() => {
    const container = containerRef.value
    if (!container) return

    container.removeEventListener('touchstart', onTouchStart)
    container.removeEventListener('touchmove', onTouchMove)
    container.removeEventListener('touchend', onTouchEnd)

    if (!touchOnly) {
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('mouseleave', onMouseLeave)
    }
  })

  /**
   * CSS style for the pull indicator
   */
  const indicatorStyle = ref({
    transform: `translateY(${state.value.pullDistance}px)`,
    transition: state.value.isPulling ? 'none' : 'transform 0.2s ease-out',
  })

  // Update indicator style when state changes
  const updateIndicatorStyle = () => {
    indicatorStyle.value = {
      transform: `translateY(${state.value.pullDistance}px)`,
      transition: state.value.isPulling ? 'none' : 'transform 0.2s ease-out',
    }
  }

  return {
    /** Current pull-to-refresh state */
    state,
    /** CSS style object for indicator element */
    indicatorStyle,
    /** Manually trigger refresh */
    refresh: async () => {
      if (state.value.isRefreshing) return
      state.value.isRefreshing = true
      try {
        await onRefresh()
      } finally {
        state.value.isRefreshing = false
      }
    },
    /** Update indicator style (call in watch or computed) */
    updateIndicatorStyle,
  }
}
