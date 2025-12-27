<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import GlobalSearch from '@/components/GlobalSearch.vue'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'

defineEmits<{
  toggleSidebar: []
}>()

const auth = useAuthStore()
const showUserMenu = ref(false)

async function handleLogout() {
  await auth.logout()
}
</script>

<template>
  <header class="sticky top-0 z-10 flex items-center h-16 px-6 bg-white border-b border-slate-200">
    <!-- Toggle Sidebar -->
    <button
      class="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
      @click="$emit('toggleSidebar')"
    >
      <span class="text-xl">☰</span>
    </button>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Global Search -->
    <div class="hidden md:block mr-4">
      <GlobalSearch />
    </div>

    <!-- Notifications -->
    <NotificationsDropdown />

    <!-- User Menu -->
    <div class="relative ml-2">
      <button
        class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100"
        @click="showUserMenu = !showUserMenu"
      >
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
          {{ auth.user?.name?.charAt(0) ?? 'U' }}
        </div>
        <span class="hidden md:block text-sm font-medium text-slate-700">
          {{ auth.user?.name ?? 'User' }}
        </span>
        <span class="text-slate-400">▼</span>
      </button>

      <!-- Dropdown -->
      <div
        v-if="showUserMenu"
        class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1"
        @click="showUserMenu = false"
      >
        <div class="px-4 py-2 border-b border-slate-100">
          <div class="text-sm font-medium text-slate-900">{{ auth.user?.name }}</div>
          <div class="text-xs text-slate-500">{{ auth.user?.email }}</div>
        </div>
        <RouterLink to="/settings" class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          Settings
        </RouterLink>
        <button
          class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
