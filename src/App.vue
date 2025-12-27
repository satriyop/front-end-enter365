<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ToastProvider } from '@/components/ui'
</script>

<template>
  <ToastProvider>
    <RouterView />
  </ToastProvider>
</template>
