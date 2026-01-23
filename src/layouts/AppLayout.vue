<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { Breadcrumbs } from '@/components/ui'
import CommandPalette from '@/components/CommandPalette.vue'
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal.vue'

const showShortcuts = ref(false)
const commandPaletteOpen = ref(false)

// Desktop: sidebar starts open. Mobile: starts closed.
const isMobile = ref(false)
const sidebarOpen = ref(true)

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  checkMobile()
  // Start closed on mobile
  if (isMobile.value) {
    sidebarOpen.value = false
  }
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function openCommandPalette() {
  commandPaletteOpen.value = true
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <!-- Sidebar -->
    <AppSidebar :open="sidebarOpen" @toggle="toggleSidebar" @close="closeSidebar" />

    <!-- Main Content -->
    <div
      class="transition-all duration-300"
      :class="sidebarOpen ? 'lg:ml-60' : 'lg:ml-16'"
    >
      <!-- Header -->
      <AppHeader @toggle-sidebar="toggleSidebar" @open-command-palette="openCommandPalette" />

      <!-- Page Content -->
      <main class="p-6 min-h-screen">
        <!-- Breadcrumbs -->
        <Breadcrumbs />

        <!-- Route Transition -->
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <!-- Command Palette (Cmd+K) -->
    <CommandPalette v-model:open="commandPaletteOpen" @show-shortcuts="showShortcuts = true" />

    <!-- Keyboard Shortcuts Modal -->
    <KeyboardShortcutsModal v-model:open="showShortcuts" />
  </div>
</template>
