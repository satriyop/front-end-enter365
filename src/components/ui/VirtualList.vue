<!--
  VirtualList Component

  Renders large lists efficiently by only rendering visible items.
  Uses windowing technique to minimize DOM nodes.

  @example
  ```vue
  <VirtualList :items="products" :item-height="48" :container-height="400">
    <template #default="{ item, index }">
      <div class="flex items-center px-4 border-b">
        {{ index + 1 }}. {{ item.name }}
      </div>
    </template>
  </VirtualList>
  ```
-->
<script setup lang="ts" generic="T">
import { ref, computed, watch } from 'vue'

interface Props {
  /** Array of items to render */
  items: T[]
  /** Fixed height of each item in pixels */
  itemHeight: number
  /** Height of the scrollable container in pixels */
  containerHeight?: number
  /** Number of items to render outside visible area (improves scroll smoothness) */
  overscan?: number
  /** Unique key property on items (defaults to index if not provided) */
  keyField?: keyof T
  /** CSS class for the container */
  containerClass?: string
  /** Show loading state */
  loading?: boolean
  /** Custom empty state text */
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 400,
  overscan: 5,
  containerClass: '',
  loading: false,
  emptyText: 'No items to display',
})

const emit = defineEmits<{
  /** Emitted when user scrolls near the bottom (for infinite loading) */
  loadMore: []
  /** Emitted on scroll with current scroll position */
  scroll: [scrollTop: number]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const scrollTop = ref(0)

// Calculate which items should be visible
const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight)
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)

  return {
    start: Math.max(0, start - props.overscan),
    end: Math.min(props.items.length, start + visibleCount + props.overscan),
  }
})

// Get only the items that need to be rendered
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value
  return props.items.slice(start, end).map((item, idx) => {
    const absoluteIndex = start + idx
    return {
      item,
      index: absoluteIndex,
      key: props.keyField ? String(item[props.keyField]) : absoluteIndex,
      style: {
        position: 'absolute' as const,
        top: `${absoluteIndex * props.itemHeight}px`,
        height: `${props.itemHeight}px`,
        width: '100%',
      },
    }
  })
})

// Total scrollable height
const totalHeight = computed(() => props.items.length * props.itemHeight)

// Handle scroll events
function handleScroll(event: Event) {
  const target = event.target as HTMLDivElement
  scrollTop.value = target.scrollTop
  emit('scroll', target.scrollTop)

  // Check if near bottom for infinite loading
  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  if (scrollBottom < props.itemHeight * 3) {
    emit('loadMore')
  }
}

// Reset scroll position when items change significantly
watch(
  () => props.items.length,
  (newLength, oldLength) => {
    // If list was cleared, reset scroll
    if (newLength === 0 || (oldLength > 0 && newLength < oldLength / 2)) {
      scrollTop.value = 0
      if (containerRef.value) {
        containerRef.value.scrollTop = 0
      }
    }
  }
)

// Expose scroll control methods
function scrollToIndex(index: number) {
  if (containerRef.value) {
    const top = index * props.itemHeight
    containerRef.value.scrollTop = top
    scrollTop.value = top
  }
}

function scrollToTop() {
  scrollToIndex(0)
}

function scrollToBottom() {
  scrollToIndex(props.items.length - 1)
}

defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
})
</script>

<template>
  <div
    v-if="loading"
    :style="{ height: `${containerHeight}px` }"
    class="flex items-center justify-center"
    :class="containerClass"
  >
    <slot name="loading">
      <div class="text-muted-foreground">Loading...</div>
    </slot>
  </div>

  <div
    v-else-if="items.length === 0"
    :style="{ height: `${containerHeight}px` }"
    class="flex items-center justify-center"
    :class="containerClass"
  >
    <slot name="empty">
      <div class="text-muted-foreground">{{ emptyText }}</div>
    </slot>
  </div>

  <div
    v-else
    ref="containerRef"
    :style="{ height: `${containerHeight}px` }"
    class="overflow-auto"
    :class="containerClass"
    @scroll="handleScroll"
  >
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <div
        v-for="{ item, index, key, style } in visibleItems"
        :key="key"
        :style="style"
      >
        <slot :item="item" :index="index" />
      </div>
    </div>
  </div>
</template>
