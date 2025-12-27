<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  class?: string
}

interface Props {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  rowKey?: keyof T
  selectable?: boolean
  selectedRows?: T[]
  hoverable?: boolean
  striped?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortDirection: 'asc',
  selectable: false,
  selectedRows: () => [],
  hoverable: true,
  striped: false,
})

const emit = defineEmits<{
  sort: [key: string, direction: 'asc' | 'desc']
  'row-click': [row: T, index: number]
  'selection-change': [rows: T[]]
}>()

const alignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function handleSort(column: Column<T>) {
  if (!column.sortable) return

  const key = String(column.key)
  const newDirection = props.sortKey === key && props.sortDirection === 'asc' ? 'desc' : 'asc'
  emit('sort', key, newDirection)
}

function handleRowClick(row: T, index: number) {
  emit('row-click', row, index)
}

function isSelected(row: T): boolean {
  if (!props.rowKey) return false
  return props.selectedRows.some((r) => r[props.rowKey!] === row[props.rowKey!])
}

function toggleRow(row: T) {
  if (!props.rowKey) return

  const isCurrentlySelected = isSelected(row)
  let newSelection: T[]

  if (isCurrentlySelected) {
    newSelection = props.selectedRows.filter((r) => r[props.rowKey!] !== row[props.rowKey!])
  } else {
    newSelection = [...props.selectedRows, row]
  }

  emit('selection-change', newSelection)
}

function toggleAll() {
  if (props.selectedRows.length === props.data.length) {
    emit('selection-change', [])
  } else {
    emit('selection-change', [...props.data])
  }
}

const allSelected = computed(() =>
  props.data.length > 0 && props.selectedRows.length === props.data.length
)

const someSelected = computed(() =>
  props.selectedRows.length > 0 && props.selectedRows.length < props.data.length
)
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full text-sm">
      <!-- Header -->
      <thead class="bg-slate-50 border-b border-slate-200">
        <tr>
          <!-- Checkbox column -->
          <th
            v-if="selectable"
            class="w-12 px-4 py-3"
          >
            <input
              type="checkbox"
              :checked="allSelected"
              :indeterminate="someSelected"
              class="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              @change="toggleAll"
            />
          </th>

          <!-- Data columns -->
          <th
            v-for="column in columns"
            :key="String(column.key)"
            :class="[
              'px-4 py-3 font-medium text-slate-600',
              alignClasses[column.align ?? 'left'],
              column.sortable && 'cursor-pointer select-none hover:bg-slate-100',
              column.class,
            ]"
            :style="column.width ? { width: column.width } : undefined"
            @click="handleSort(column)"
          >
            <div class="flex items-center gap-1">
              <span>{{ column.label }}</span>
              <span v-if="column.sortable" class="text-slate-400">
                <svg
                  v-if="sortKey === column.key && sortDirection === 'asc'"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
                <svg
                  v-else-if="sortKey === column.key && sortDirection === 'desc'"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
                <svg
                  v-else
                  class="w-4 h-4 opacity-0 group-hover:opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </span>
            </div>
          </th>

          <!-- Actions column slot -->
          <th v-if="$slots.actions" class="w-20 px-4 py-3">
            <span class="sr-only">Actions</span>
          </th>
        </tr>
      </thead>

      <!-- Body -->
      <tbody class="divide-y divide-slate-200">
        <!-- Loading state -->
        <tr v-if="loading">
          <td
            :colspan="columns.length + (selectable ? 1 : 0) + ($slots.actions ? 1 : 0)"
            class="px-4 py-8 text-center text-slate-500"
          >
            <div class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading...</span>
            </div>
          </td>
        </tr>

        <!-- Empty state -->
        <tr v-else-if="data.length === 0">
          <td
            :colspan="columns.length + (selectable ? 1 : 0) + ($slots.actions ? 1 : 0)"
            class="px-4 py-8"
          >
            <slot name="empty">
              <div class="text-center text-slate-500">
                No data available
              </div>
            </slot>
          </td>
        </tr>

        <!-- Data rows -->
        <tr
          v-else
          v-for="(row, index) in data"
          :key="rowKey ? String(row[rowKey]) : index"
          :class="[
            'bg-white',
            hoverable && 'hover:bg-slate-50',
            striped && index % 2 === 1 && 'bg-slate-50',
            isSelected(row) && 'bg-orange-50',
          ]"
          @click="handleRowClick(row, index)"
        >
          <!-- Checkbox -->
          <td
            v-if="selectable"
            class="w-12 px-4 py-3"
            @click.stop
          >
            <input
              type="checkbox"
              :checked="isSelected(row)"
              class="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              @change="toggleRow(row)"
            />
          </td>

          <!-- Data cells -->
          <td
            v-for="column in columns"
            :key="String(column.key)"
            :class="[
              'px-4 py-3 text-slate-900',
              alignClasses[column.align ?? 'left'],
              column.class,
            ]"
          >
            <slot
              :name="`cell-${String(column.key)}`"
              :row="row"
              :value="row[column.key as keyof T]"
              :index="index"
            >
              {{ row[column.key as keyof T] }}
            </slot>
          </td>

          <!-- Actions -->
          <td
            v-if="$slots.actions"
            class="w-20 px-4 py-3 text-right"
            @click.stop
          >
            <slot name="actions" :row="row" :index="index" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
