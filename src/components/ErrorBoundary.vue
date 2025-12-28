<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { Button, Card } from '@/components/ui'

const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')

/**
 * Capture errors from child components
 */
onErrorCaptured((err: Error, _instance, info: string) => {
  hasError.value = true
  errorMessage.value = err.message || 'An unexpected error occurred'
  errorStack.value = err.stack || ''

  // Log error for debugging
  console.error('Error captured by ErrorBoundary:', {
    error: err,
    info,
    stack: err.stack,
  })

  // Prevent error from propagating
  return false
})

function handleRetry() {
  hasError.value = false
  errorMessage.value = ''
  errorStack.value = ''
  // Force re-render by key change handled in parent
  window.location.reload()
}

function handleGoHome() {
  window.location.href = '/'
}
</script>

<template>
  <div v-if="hasError" class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <Card class="max-w-lg w-full text-center">
      <!-- Error Icon -->
      <div class="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <!-- Error Message -->
      <h1 class="text-xl font-semibold text-slate-900 mb-2">
        Something went wrong
      </h1>
      <p class="text-slate-500 mb-6">
        We encountered an unexpected error. Please try again or return to the homepage.
      </p>

      <!-- Error Details (collapsible in dev) -->
      <details v-if="errorMessage" class="text-left mb-6 bg-slate-100 rounded-lg p-4">
        <summary class="cursor-pointer text-sm text-slate-600 font-medium">
          Error details
        </summary>
        <div class="mt-2 space-y-2">
          <p class="text-sm text-red-600 font-mono break-all">
            {{ errorMessage }}
          </p>
          <pre v-if="errorStack" class="text-xs text-slate-500 overflow-auto max-h-32 font-mono">{{ errorStack }}</pre>
        </div>
      </details>

      <!-- Actions -->
      <div class="flex justify-center gap-3">
        <Button variant="ghost" @click="handleGoHome">
          Go to Homepage
        </Button>
        <Button @click="handleRetry">
          Try Again
        </Button>
      </div>
    </Card>
  </div>

  <!-- Normal content -->
  <slot v-else />
</template>
