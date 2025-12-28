<script setup lang="ts">
import { ref, computed, watch, type Component } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'

type TableItem = Record<string, unknown>

export interface VirtualColumn {
  key: string
  label: string
  width?: string
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  /** Custom render component or function */
  render?: Component | ((item: TableItem, index: number) => string)
}

interface Props {
  /** Data items to display */
  items: TableItem[]
  /** Column definitions */
  columns: VirtualColumn[]
  /** Unique key field for each item */
  keyField?: string
  /** Estimated row height for virtual calculation */
  estimatedRowHeight?: number
  /** Container height */
  height?: string
  /** Enable row selection */
  selectable?: boolean
  /** Currently selected keys */
  selectedKeys?: Set<string | number>
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Overscan count (buffer rows) */
  overscan?: number
  /** Current sort field */
  sortField?: string
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  keyField: 'id',
  estimatedRowHeight: 48,
  height: '400px',
  selectable: false,
  selectedKeys: () => new Set(),
  loading: false,
  emptyMessage: 'No data available',
  overscan: 5,
  sortField: '',
  sortDirection: 'asc',
})

const emit = defineEmits<{
  'row-click': [item: TableItem, index: number]
  'select': [keys: Set<string | number>]
  'select-all': [selected: boolean]
  'sort': [field: string, direction: 'asc' | 'desc']
}>()

// Container ref for virtualizer
const parentRef = ref<HTMLDivElement | null>(null)

// Virtualizer instance
const virtualizer = useVirtualizer({
  get count() {
    return props.items.length
  },
  getScrollElement: () => parentRef.value,
  estimateSize: () => props.estimatedRowHeight,
  overscan: props.overscan,
})

// Virtual items
const virtualItems = computed(() => virtualizer.value.getVirtualItems())

// Total size for spacer
const totalSize = computed(() => virtualizer.value.getTotalSize())

// Get item key
function getItemKey(item: TableItem): string | number {
  return item[props.keyField] as string | number
}

// Check if all visible items are selected
const allSelected = computed(() => {
  if (props.items.length === 0) return false
  return props.items.every((item) => props.selectedKeys.has(getItemKey(item)))
})

// Some items are selected (for indeterminate state)
const someSelected = computed(() => {
  if (props.items.length === 0) return false
  const selectedCount = props.items.filter((item) =>
    props.selectedKeys.has(getItemKey(item))
  ).length
  return selectedCount > 0 && selectedCount < props.items.length
})

// Handle row click
function handleRowClick(item: TableItem, index: number) {
  emit('row-click', item, index)
}

// Handle row selection
function handleSelect(item: TableItem) {
  const key = getItemKey(item)
  const newSelected = new Set(props.selectedKeys)

  if (newSelected.has(key)) {
    newSelected.delete(key)
  } else {
    newSelected.add(key)
  }

  emit('select', newSelected)
}

// Handle select all
function handleSelectAll() {
  if (allSelected.value) {
    emit('select-all', false)
    emit('select', new Set())
  } else {
    const allKeys = new Set(props.items.map((item) => getItemKey(item)))
    emit('select-all', true)
    emit('select', allKeys)
  }
}

// Handle sort
function handleSort(column: VirtualColumn) {
  if (!column.sortable) return

  const field = column.key
  const newDirection =
    props.sortField === field && props.sortDirection === 'asc' ? 'desc' : 'asc'

  emit('sort', field, newDirection)
}

// Get cell value
function getCellValue(item: TableItem, column: VirtualColumn): unknown {
  const keys = column.key.split('.')
  let value: unknown = item

  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }

  return value
}

// Get alignment class
function getAlignClass(align?: 'left' | 'center' | 'right'): string {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    default:
      return 'text-left'
  }
}

// Check if row is selected
function isRowSelected(index: number): boolean {
  const item = props.items[index]
  return item ? props.selectedKeys.has(getItemKey(item)) : false
}

// Re-measure when items change
watch(
  () => props.items.length,
  () => {
    virtualizer.value.measure()
  }
)
</script>

<template>
  <div class="virtual-table-wrapper">
    <!-- Header (fixed) -->
    <div
      class="virtual-table-header bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
    >
      <table class="w-full table-fixed">
        <thead>
          <tr>
            <!-- Selection checkbox -->
            <th
              v-if="selectable"
              class="w-10 px-3 py-3"
            >
              <input
                type="checkbox"
                class="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="handleSelectAll"
              />
            </th>

            <!-- Column headers -->
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-3 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
              :class="[
                getAlignClass(column.align),
                column.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none' : '',
              ]"
              :style="{
                width: column.width,
                minWidth: column.minWidth,
              }"
              @click="handleSort(column)"
            >
              <div class="flex items-center gap-1" :class="{ 'justify-center': column.align === 'center', 'justify-end': column.align === 'right' }">
                <span>{{ column.label }}</span>
                <template v-if="column.sortable">
                  <svg
                    v-if="sortField === column.key"
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      v-if="sortDirection === 'asc'"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 15l7-7 7 7"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4 opacity-30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </template>
              </div>
            </th>
          </tr>
        </thead>
      </table>
    </div>

    <!-- Scrollable body -->
    <div
      ref="parentRef"
      class="virtual-table-body overflow-auto"
      :style="{ height }"
    >
      <!-- Loading overlay -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10"
      >
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>

      <!-- Empty state -->
      <div
        v-if="!loading && items.length === 0"
        class="flex items-center justify-center h-full text-slate-500 dark:text-slate-400"
      >
        {{ emptyMessage }}
      </div>

      <!-- Virtual rows container -->
      <div
        v-else
        class="relative w-full"
        :style="{ height: `${totalSize}px` }"
      >
        <table class="w-full table-fixed">
          <tbody>
            <tr
              v-for="virtualRow in virtualItems"
              :key="virtualRow.index"
              class="absolute top-0 left-0 w-full border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              :class="{
                'bg-primary-50 dark:bg-primary-900/20': isRowSelected(virtualRow.index),
              }"
              :style="{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }"
              @click="items[virtualRow.index] && handleRowClick(items[virtualRow.index]!, virtualRow.index)"
            >
              <!-- Selection checkbox -->
              <td
                v-if="selectable"
                class="w-10 px-3"
                @click.stop
              >
                <input
                  type="checkbox"
                  class="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                  :checked="isRowSelected(virtualRow.index)"
                  @change="items[virtualRow.index] && handleSelect(items[virtualRow.index]!)"
                />
              </td>

              <!-- Data cells -->
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 truncate"
                :class="getAlignClass(column.align)"
                :style="{
                  width: column.width,
                  minWidth: column.minWidth,
                }"
              >
                <!-- Custom render -->
                <template v-if="column.render && items[virtualRow.index]">
                  <component
                    :is="column.render"
                    v-if="typeof column.render !== 'function'"
                    :item="items[virtualRow.index]"
                    :index="virtualRow.index"
                  />
                  <span v-else>
                    {{ (column.render as Function)(items[virtualRow.index], virtualRow.index) }}
                  </span>
                </template>

                <!-- Default value -->
                <template v-else-if="items[virtualRow.index]">
                  {{ getCellValue(items[virtualRow.index]!, column) }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer with row count -->
    <div
      class="virtual-table-footer px-3 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400"
    >
      <span>{{ items.length.toLocaleString() }} rows</span>
      <span v-if="selectable && selectedKeys.size > 0" class="ml-2">
        ({{ selectedKeys.size }} selected)
      </span>
    </div>
  </div>
</template>

<style scoped>
.virtual-table-wrapper {
  @apply relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900;
}

.virtual-table-header {
  @apply sticky top-0 z-10;
}

.virtual-table-body {
  @apply relative;
}

/* Hide scrollbar but keep functionality */
.virtual-table-body::-webkit-scrollbar {
  width: 8px;
}

.virtual-table-body::-webkit-scrollbar-track {
  @apply bg-slate-100 dark:bg-slate-800;
}

.virtual-table-body::-webkit-scrollbar-thumb {
  @apply bg-slate-300 dark:bg-slate-600 rounded-full;
}

.virtual-table-body::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-400 dark:bg-slate-500;
}
</style>
