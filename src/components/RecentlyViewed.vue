<script setup lang="ts">
import { computed } from 'vue'
import { useRecentlyViewed } from '@/composables/useRecentlyViewed'

interface Props {
  /** Display mode */
  variant?: 'dropdown' | 'sidebar'
  /** Maximum items to show */
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'dropdown',
  limit: 5,
})

const { items, getTypeIcon, clear } = useRecentlyViewed()

const displayItems = computed(() => items.value.slice(0, props.limit))
const hasMore = computed(() => items.value.length > props.limit)

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
</script>

<template>
  <!-- Dropdown Variant -->
  <div v-if="variant === 'dropdown'" class="w-80">
    <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center justify-between">
        <h3 class="font-medium text-slate-900 dark:text-slate-100">Recently Viewed</h3>
        <button
          v-if="items.length > 0"
          type="button"
          class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          @click="clear"
        >
          Clear all
        </button>
      </div>
    </div>

    <div v-if="displayItems.length === 0" class="px-4 py-8 text-center">
      <p class="text-sm text-slate-400">No recently viewed items</p>
    </div>

    <div v-else class="max-h-80 overflow-y-auto">
      <RouterLink
        v-for="item in displayItems"
        :key="`${item.type}-${item.id}`"
        :to="item.path"
        class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
      >
        <span class="text-lg flex-shrink-0">{{ getTypeIcon(item.type) }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ item.title }}</p>
          <p v-if="item.subtitle" class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ item.subtitle }}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{{ formatTime(item.viewedAt) }}</p>
        </div>
      </RouterLink>

      <div v-if="hasMore" class="px-4 py-2 text-center border-t border-slate-100 dark:border-slate-700">
        <span class="text-xs text-slate-400">
          {{ items.length - limit }} more items
        </span>
      </div>
    </div>
  </div>

  <!-- Sidebar Variant -->
  <div v-else class="space-y-1">
    <div class="flex items-center justify-between px-3 py-2">
      <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Recent
      </h4>
      <button
        v-if="items.length > 0"
        type="button"
        class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        @click="clear"
      >
        Clear
      </button>
    </div>

    <div v-if="displayItems.length === 0" class="px-3 py-2">
      <p class="text-xs text-slate-400">No recent items</p>
    </div>

    <RouterLink
      v-for="item in displayItems"
      :key="`${item.type}-${item.id}`"
      :to="item.path"
      class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
    >
      <span class="text-sm">{{ getTypeIcon(item.type) }}</span>
      <span class="truncate flex-1">{{ item.title }}</span>
    </RouterLink>
  </div>
</template>
