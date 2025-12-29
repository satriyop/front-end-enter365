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
      { name: 'Solar Proposals', path: '/solar-proposals', icon: '☀️', permission: 'solar_proposals.view' },
      { name: 'Invoices', path: '/invoices', icon: '📄', permission: 'invoices.view' },
      { name: 'Contacts', path: '/contacts', icon: '👥', permission: 'contacts.view' },
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
      { name: 'BOMs', path: '/boms', icon: '📐', permission: 'boms.view' },
      { name: 'Variant Groups', path: '/boms/variant-groups', icon: '🔄', permission: 'boms.view' },
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
  {
    label: 'Settings',
    items: [
      { name: 'Company Profiles', path: '/company-profiles', icon: '🏢', permission: 'company_profiles.view' },
      { name: 'Component Library', path: '/settings/component-library', icon: '🔌', permission: 'products.view' },
    ]
  },
  {
    label: 'Admin',
    items: [
      { name: 'Users', path: '/users', icon: '👤', permission: 'users.view' },
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
    class="fixed inset-y-0 left-0 z-20 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300"
    :class="open ? 'w-60' : 'w-16'"
  >
    <!-- Logo -->
    <div class="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-700">
      <span v-if="open" class="text-xl font-bold text-primary-600">Enter365</span>
      <span v-else class="text-xl font-bold text-primary-600">E</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <div v-for="group in filteredNavigation" :key="group.label" class="mb-6">
        <!-- Group Label -->
        <div
          v-if="open"
          class="px-4 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
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
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-l-2 border-primary-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          ]"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span v-if="open">{{ item.name }}</span>
        </RouterLink>
      </div>
    </nav>

    <!-- User -->
    <div class="border-t border-slate-200 dark:border-slate-700 p-4">
      <div v-if="open" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-700 dark:text-primary-400">
          {{ auth.user?.name?.charAt(0) ?? 'U' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
            {{ auth.user?.name ?? 'User' }}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
            {{ auth.user?.roles?.[0]?.display_name ?? 'User' }}
          </div>
        </div>
      </div>
      <div v-else class="flex justify-center">
        <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-700 dark:text-primary-400">
          {{ auth.user?.name?.charAt(0) ?? 'U' }}
        </div>
      </div>
    </div>
  </aside>
</template>
