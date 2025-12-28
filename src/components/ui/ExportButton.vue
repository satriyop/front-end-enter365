<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'

interface Props {
  /** Button label */
  label?: string
  /** Show format dropdown */
  showFormatOptions?: boolean
  /** Loading state */
  loading?: boolean
  /** Disabled state */
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  label: 'Export',
  showFormatOptions: true,
  loading: false,
  disabled: false,
})

const emit = defineEmits<{
  export: [format: 'excel' | 'csv']
}>()

const isOpen = ref(false)

function handleExport(format: 'excel' | 'csv') {
  emit('export', format)
  isOpen.value = false
}

function handleSingleExport() {
  emit('export', 'excel')
}

// Close dropdown when clicking outside
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.export-dropdown')) {
    isOpen.value = false
  }
}

import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <!-- Simple button (no format options) -->
  <Button
    v-if="!showFormatOptions"
    type="button"
    variant="ghost"
    size="sm"
    :loading="loading"
    :disabled="disabled"
    @click="handleSingleExport"
  >
    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    {{ label }}
  </Button>

  <!-- Dropdown button (with format options) -->
  <div v-else class="relative export-dropdown">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      :loading="loading"
      :disabled="disabled"
      @click.stop="isOpen = !isOpen"
    >
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {{ label }}
      <svg
        class="w-4 h-4 ml-1 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </Button>

    <Transition name="scale-fade">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1"
      >
        <button
          type="button"
          class="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          @click="handleExport('excel')"
        >
          <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 12h2v6H8v-6zm4 0h2v6h-2v-6z"/>
          </svg>
          Excel (.xlsx)
        </button>
        <button
          type="button"
          class="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          @click="handleExport('csv')"
        >
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV (.csv)
        </button>
      </div>
    </Transition>
  </div>
</template>
