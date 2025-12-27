<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface NavItem {
  name: string
  path: string
  icon: string
  permission?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

defineProps<{
  open: boolean
}>()

defineEmits<{
  toggle: []
}>()

const route = useRoute()
const auth = useAuthStore()

const navigation: NavGroup[] = [
  {
    label: 'Menu',
    items: [
      { name: 'Dashboard', path: '/', icon: '🏠' },
    ]
  },
  {
    label: 'Sales',
    items: [
      { name: 'Quotations', path: '/quotations', icon: '📋', permission: 'quotations.view' },
      { name: 'Invoices', path: '/invoices', icon: '📄', permission: 'invoices.view' },
      { name: 'Customers', path: '/customers', icon: '👥', permission: 'contacts.view' },
    ]
  },
  {
    label: 'Projects',
    items: [
      { name: 'Projects', path: '/projects', icon: '🏗️', permission: 'projects.view' },
      { name: 'Work Orders', path: '/work-orders', icon: '🔧', permission: 'work_orders.view' },
    ]
  },
  {
    label: 'Inventory',
    items: [
      { name: 'Stock', path: '/inventory', icon: '📦', permission: 'inventory.view' },
      { name: 'Products', path: '/products', icon: '🏷️', permission: 'products.view' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { name: 'Payments', path: '/payments', icon: '💳', permission: 'payments.view' },
      { name: 'Bills', path: '/bills', icon: '📑', permission: 'bills.view' },
      { name: 'Reports', path: '/reports', icon: '📊', permission: 'reports.view' },
    ]
  },
]

// Filter navigation based on permissions
const filteredNavigation = computed(() => {
  return navigation.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.permission) return true
      return auth.hasPermission(item.permission)
    })
  })).filter(group => group.items.length > 0)
})

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-20 flex flex-col bg-white border-r border-slate-200 transition-all duration-300"
    :class="open ? 'w-60' : 'w-16'"
  >
    <!-- Logo -->
    <div class="flex items-center h-16 px-4 border-b border-slate-200">
      <span v-if="open" class="text-xl font-bold text-primary-600">☀️ Solar ERP</span>
      <span v-else class="text-xl">☀️</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <div v-for="group in filteredNavigation" :key="group.label" class="mb-6">
        <!-- Group Label -->
        <div
          v-if="open"
          class="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider"
        >
          {{ group.label }}
        </div>

        <!-- Items -->
        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors"
          :class="[
            isActive(item.path)
              ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-500'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          ]"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span v-if="open">{{ item.name }}</span>
        </RouterLink>
      </div>
    </nav>

    <!-- User -->
    <div class="border-t border-slate-200 p-4">
      <div v-if="open" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
          {{ auth.user?.name?.charAt(0) ?? 'U' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-900 truncate">
            {{ auth.user?.name ?? 'User' }}
          </div>
          <div class="text-xs text-slate-500 truncate">
            {{ auth.user?.roles?.[0] ?? 'User' }}
          </div>
        </div>
      </div>
      <div v-else class="flex justify-center">
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
          {{ auth.user?.name?.charAt(0) ?? 'U' }}
        </div>
      </div>
    </div>
  </aside>
</template>
