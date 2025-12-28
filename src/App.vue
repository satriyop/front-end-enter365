<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ToastProvider } from '@/components/ui'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import SessionTimeoutModal from '@/components/SessionTimeoutModal.vue'
import OfflineBanner from '@/components/OfflineBanner.vue'
import PwaUpdatePrompt from '@/components/PwaUpdatePrompt.vue'
import { useSessionTimeout } from '@/composables/useSessionTimeout'

const {
  showWarning,
  remainingTime,
  isRefreshing,
  handleExtendSession,
  handleLogout,
} = useSessionTimeout()
</script>

<template>
  <ErrorBoundary>
    <ToastProvider>
      <!-- Offline Status Banner -->
      <OfflineBanner />

      <RouterView />

      <!-- Session Timeout Warning -->
      <SessionTimeoutModal
        :open="showWarning"
        :remaining-time="remainingTime"
        :is-refreshing="isRefreshing"
        @extend="handleExtendSession"
        @logout="handleLogout"
      />

      <!-- PWA Update Prompt -->
      <PwaUpdatePrompt />
    </ToastProvider>
  </ErrorBoundary>
</template>
