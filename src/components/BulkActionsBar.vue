<script setup lang="ts">
import { Button } from '@/components/ui'

defineProps<{
  selectedCount: number
  actions: Array<{
    label: string
    icon?: string
    variant?: 'default' | 'secondary' | 'destructive' | 'ghost'
    action: () => void | Promise<void>
    loading?: boolean
  }>
}>()

defineEmits<{
  clear: []
}>()
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="selectedCount > 0"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-4"
    >
      <div class="text-sm font-medium">
        {{ selectedCount }} selected
      </div>

      <div class="w-px h-6 bg-slate-700" />

      <div class="flex items-center gap-2">
        <Button
          v-for="action in actions"
          :key="action.label"
          :variant="action.variant || 'secondary'"
          size="sm"
          :loading="action.loading"
          @click="action.action"
        >
          <span v-if="action.icon" class="mr-1">{{ action.icon }}</span>
          {{ action.label }}
        </Button>
      </div>

      <button
        type="button"
        class="ml-2 p-1 rounded hover:bg-slate-700 transition-colors"
        @click="$emit('clear')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
