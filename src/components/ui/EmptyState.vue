<script setup lang="ts">
import { type Component } from 'vue'

interface Props {
  icon?: Component
  title: string
  description?: string
  actionLabel?: string
}

defineProps<Props>()

const emit = defineEmits<{
  action: []
}>()

// Default icon (document with plus)
const defaultIconPath = 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <!-- Icon -->
    <div class="mb-4">
      <component
        v-if="icon"
        :is="icon"
        class="w-12 h-12 text-slate-400 dark:text-slate-500"
      />
      <svg
        v-else
        class="w-12 h-12 text-slate-400 dark:text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          :d="defaultIconPath"
        />
      </svg>
    </div>

    <!-- Title -->
    <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
      {{ title }}
    </h3>

    <!-- Description -->
    <p
      v-if="description"
      class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6"
    >
      {{ description }}
    </p>

    <!-- Action button -->
    <button
      v-if="actionLabel"
      type="button"
      class="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-sm hover:bg-orange-600 transition-colors"
      @click="emit('action')"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {{ actionLabel }}
    </button>

    <!-- Custom slot for additional content -->
    <slot />
  </div>
</template>
