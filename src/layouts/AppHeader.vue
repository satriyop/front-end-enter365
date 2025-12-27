<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

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

    <!-- Search (optional) -->
    <div class="hidden md:flex items-center mr-4">
      <div class="relative">
        <input
          type="text"
          placeholder="Search... (Ctrl+K)"
          class="w-64 pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      </div>
    </div>

    <!-- Notifications -->
    <button class="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700">
      <span class="text-xl">🔔</span>
      <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
    </button>

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
        <a href="#" class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          ⚙️ Settings
        </a>
        <button
          class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          @click="handleLogout"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  </header>
</template>
