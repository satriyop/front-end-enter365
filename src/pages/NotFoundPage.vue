<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
    <div class="text-center">
      <div class="text-6xl font-bold text-slate-300 dark:text-slate-600 mb-4">404</div>
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Page Not Found</h1>
      <p class="text-slate-500 dark:text-slate-400 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <RouterLink
        to="/"
        class="inline-flex px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 font-medium"
      >
        ← Back to Dashboard
      </RouterLink>
    </div>
  </div>
</template>
