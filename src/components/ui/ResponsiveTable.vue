<script setup lang="ts">
import { computed, useSlots } from 'vue'

type TableItem = Record<string, unknown>

export interface ResponsiveColumn {
  key: string
  label: string
  /** Show in mobile card view */
  showInMobile?: boolean
  /** Priority for mobile (lower = more important) */
  mobilePriority?: number
  /** Width for desktop table */
  width?: string
  align?: 'left' | 'center' | 'right'
  /** Format function for display */
  format?: (value: unknown, item: TableItem) => string
}

interface Props {
  /** Data items to display */
  items: TableItem[]
  /** Column definitions */
  columns: ResponsiveColumn[]
  /** Unique key field for each item */
  keyField?: string
  /** Enable row selection */
  selectable?: boolean
  /** Currently selected keys */
  selectedKeys?: Set<string | number>
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Title field for mobile card header */
  titleField?: string
  /** Subtitle field for mobile card */
  subtitleField?: string
  /** Show status badge (field name) */
  statusField?: string
}

const props = withDefaults(defineProps<Props>(), {
  keyField: 'id',
  selectable: false,
  selectedKeys: () => new Set(),
  loading: false,
  emptyMessage: 'No data available',
})

const emit = defineEmits<{
  'row-click': [item: TableItem, index: number]
  'select': [keys: Set<string | number>]
}>()

const slots = useSlots()

// Get item key
function getItemKey(item: TableItem): string | number {
  return item[props.keyField] as string | number
}

// Get item field value
function getFieldValue(item: TableItem, field: string | undefined): unknown {
  if (!field) return undefined
  return item[field]
}

// Get mobile-visible columns sorted by priority
const mobileColumns = computed(() => {
  return props.columns
    .filter((col) => col.showInMobile !== false)
    .sort((a, b) => (a.mobilePriority || 99) - (b.mobilePriority || 99))
    .slice(0, 4) // Max 4 fields in mobile view
})

// Check if all items are selected
const allSelected = computed(() => {
  if (props.items.length === 0) return false
  return props.items.every((item) => props.selectedKeys.has(getItemKey(item)))
})

// Handle row click
function handleRowClick(item: TableItem, index: number) {
  emit('row-click', item, index)
}

// Handle selection toggle
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
    emit('select', new Set())
  } else {
    const allKeys = new Set(props.items.map((item) => getItemKey(item)))
    emit('select', allKeys)
  }
}

// Get cell value with nested key support
function getCellValue(item: TableItem, column: ResponsiveColumn): string {
  const keys = column.key.split('.')
  let value: unknown = item

  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[key]
    } else {
      return ''
    }
  }

  if (column.format) {
    return column.format(value, item)
  }

  return String(value ?? '')
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

// Check if item is selected
function isSelected(item: TableItem): boolean {
  return props.selectedKeys.has(getItemKey(item))
}

// Check if column should be hidden in mobile (already shown in header)
function isHeaderField(column: ResponsiveColumn): boolean {
  return (
    column.key === props.titleField ||
    column.key === props.subtitleField ||
    column.key === props.statusField
  )
}
</script>

<template>
  <div class="responsive-table">
    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && items.length === 0"
      class="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400"
    >
      <svg class="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p>{{ emptyMessage }}</p>
    </div>

    <!-- Desktop Table View (hidden on mobile) -->
    <div v-else class="hidden md:block overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead class="bg-slate-50 dark:bg-slate-800">
          <tr>
            <!-- Select All -->
            <th v-if="selectable" class="w-10 px-3 py-3">
              <input
                type="checkbox"
                class="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                :checked="allSelected"
                @change="handleSelectAll"
              />
            </th>

            <!-- Column Headers -->
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
              :class="getAlignClass(column.align)"
              :style="{ width: column.width }"
            >
              {{ column.label }}
            </th>

            <!-- Actions slot header -->
            <th v-if="slots.actions" class="px-4 py-3 text-right">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        <tbody class="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
          <tr
            v-for="(item, index) in items"
            :key="String(getItemKey(item))"
            class="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            :class="{ 'bg-primary-50 dark:bg-primary-900/20': isSelected(item) }"
            @click="handleRowClick(item, index)"
          >
            <!-- Selection -->
            <td v-if="selectable" class="w-10 px-3 py-3" @click.stop>
              <input
                type="checkbox"
                class="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                :checked="isSelected(item)"
                @change="handleSelect(item)"
              />
            </td>

            <!-- Data Cells -->
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
              :class="getAlignClass(column.align)"
            >
              <slot :name="`cell-${column.key}`" :item="item" :value="getCellValue(item, column)">
                {{ getCellValue(item, column) }}
              </slot>
            </td>

            <!-- Actions -->
            <td v-if="slots.actions" class="px-4 py-3 text-right" @click.stop>
              <slot name="actions" :item="item" :index="index" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View (hidden on desktop) -->
    <div v-if="items.length > 0" class="md:hidden space-y-3">
      <div
        v-for="(item, index) in items"
        :key="String(getItemKey(item))"
        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm"
        :class="{ 'ring-2 ring-primary-500': isSelected(item) }"
        @click="handleRowClick(item, index)"
      >
        <!-- Card Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <!-- Selection checkbox -->
            <input
              v-if="selectable"
              type="checkbox"
              class="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
              :checked="isSelected(item)"
              @click.stop
              @change="handleSelect(item)"
            />

            <div>
              <!-- Title -->
              <h3
                v-if="titleField"
                class="font-medium text-slate-900 dark:text-slate-100"
              >
                <slot name="mobile-title" :item="item">
                  {{ getFieldValue(item, titleField) }}
                </slot>
              </h3>

              <!-- Subtitle -->
              <p
                v-if="subtitleField"
                class="text-sm text-slate-500 dark:text-slate-400"
              >
                {{ getFieldValue(item, subtitleField) }}
              </p>
            </div>
          </div>

          <!-- Status badge -->
          <div v-if="statusField">
            <slot name="mobile-status" :item="item" :status="getFieldValue(item, statusField)">
              <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {{ getFieldValue(item, statusField) }}
              </span>
            </slot>
          </div>
        </div>

        <!-- Card Body - Key fields -->
        <div class="grid grid-cols-2 gap-2 text-sm">
          <template v-for="column in mobileColumns" :key="column.key">
            <div v-if="!isHeaderField(column)">
              <span class="text-slate-500 dark:text-slate-400">{{ column.label }}:</span>
              <span class="ml-1 text-slate-700 dark:text-slate-300">
                <slot :name="`cell-${column.key}`" :item="item" :value="getCellValue(item, column)">
                  {{ getCellValue(item, column) }}
                </slot>
              </span>
            </div>
          </template>
        </div>

        <!-- Card Actions -->
        <div v-if="slots.actions" class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2" @click.stop>
          <slot name="actions" :item="item" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.responsive-table {
  @apply relative;
}
</style>
