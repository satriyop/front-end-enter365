<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const sidebarOpen = ref(true)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Sidebar -->
    <AppSidebar :open="sidebarOpen" @toggle="toggleSidebar" />

    <!-- Main Content -->
    <div
      class="transition-all duration-300"
      :class="sidebarOpen ? 'lg:ml-60' : 'lg:ml-16'"
    >
      <!-- Header -->
      <AppHeader @toggle-sidebar="toggleSidebar" />

      <!-- Page Content -->
      <main class="p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
