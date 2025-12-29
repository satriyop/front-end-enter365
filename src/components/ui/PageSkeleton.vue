<script setup lang="ts">
type PageType = 'list' | 'detail' | 'form'

interface Props {
  type?: PageType
}

withDefaults(defineProps<Props>(), {
  type: 'list',
})
</script>

<template>
  <!-- List Page Skeleton -->
  <div v-if="type === 'list'" class="space-y-6 animate-pulse">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>

    <!-- Filters -->
    <div class="flex gap-4">
      <div class="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <!-- Table header -->
      <div class="flex items-center gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div class="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="ml-auto h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>

      <!-- Table rows -->
      <div v-for="i in 8" :key="i" class="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div class="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="ml-auto h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
      <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="flex gap-2">
        <div class="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  </div>

  <!-- Detail Page Skeleton -->
  <div v-else-if="type === 'detail'" class="space-y-6 animate-pulse">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2">
      <div class="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>

    <!-- Header Card -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-start justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <div class="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div class="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div class="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div class="flex gap-2">
          <div class="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div class="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div class="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- Details Card -->
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div class="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div class="grid grid-cols-2 gap-4">
            <div v-for="i in 6" :key="i" class="space-y-1">
              <div class="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              <div class="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>

        <!-- Items Card -->
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div class="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div v-for="i in 4" :key="i" class="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div class="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div class="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
            <div class="ml-auto h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div class="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div v-for="i in 4" :key="i" class="flex justify-between">
            <div class="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div class="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Form Page Skeleton -->
  <div v-else-if="type === 'form'" class="space-y-6 animate-pulse">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
      <div class="flex gap-2">
        <div class="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>

    <!-- Form Card -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 6" :key="i" class="space-y-2">
          <div class="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div class="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>

    <!-- Items Section -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
      <div class="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      <div v-for="i in 3" :key="i" class="flex gap-4">
        <div class="h-10 flex-1 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div class="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  </div>
</template>
