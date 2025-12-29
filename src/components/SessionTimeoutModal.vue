<script setup lang="ts">
import { Modal, Button } from '@/components/ui'

interface Props {
  open: boolean
  remainingTime: string
  isRefreshing: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  extend: []
  logout: []
}>()
</script>

<template>
  <Modal
    :open="open"
    title="Session Expiring"
    size="sm"
    :close-on-backdrop="false"
    :close-on-escape="false"
    :show-close="false"
  >
    <div class="text-center">
      <div class="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <p class="text-slate-600 dark:text-slate-400 mb-2">
        Your session will expire in
      </p>

      <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
        {{ remainingTime }}
      </p>

      <p class="text-sm text-slate-500 dark:text-slate-400">
        Would you like to stay logged in?
      </p>
    </div>

    <template #footer>
      <Button
        variant="ghost"
        @click="emit('logout')"
        :disabled="isRefreshing"
      >
        Logout
      </Button>
      <Button
       
        @click="emit('extend')"
        :loading="isRefreshing"
      >
        Stay Logged In
      </Button>
    </template>
  </Modal>
</template>
