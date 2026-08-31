<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { navigation, navItemVisible, POS_GROUP_ID, POS_NAV_ID, posChrome } from '@/config/nav'
import { useAuthStore } from '@/stores/auth'
import { useFeaturesStore } from '@/stores/features'
import { onRescue } from '@/utils/clickRescue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  toggle: []
  close: []
}>()

const router = useRouter()

// Close sidebar on mobile after navigation
router.afterEach(() => {
  // Only close on mobile (check window width)
  if (window.innerWidth < 1024) {
    emit('close')
  }
})

const route = useRoute()
const auth = useAuthStore()
const features = useFeaturesStore()

const filteredNavigation = computed(() => {
  if (auth.isCashierOnly) {
    return [{
      label: 'Menu',
      items: navigation[0]!.items.filter(item => item.path === '/kasir'),
    }]
  }

  return navigation.map(group => ({
    ...group,
    items: group.items.filter(item => navItemVisible(item, {
      featureEnabled: (name) => features.enabled(name),
      hasPermission: (name) => auth.hasPermission(name),
    })),
  })).filter(group => group.items.length > 0)
})

const posPack = computed(() => features.preset === 'pos')

function groupLabel(label: string): string {
  return posChrome(label, posPack.value, POS_GROUP_ID)
}

function itemName(name: string): string {
  return posChrome(name, posPack.value, POS_NAV_ID)
}

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const stopNavRescue = onRescue('nav', (el) => {
  const href = el.closest('a')?.getAttribute('href')
  if (!href) {
    return
  }
  const path = href.startsWith('http') ? new URL(href).pathname : href
  if (path !== route.path) {
    void router.push(path)
  }
})
onBeforeUnmount(stopNavRescue)
</script>

<template>
  <!-- Mobile Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="$emit('close')"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    class="fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300"
    :class="[
      open ? 'w-60' : 'w-16',
      // Mobile: slide in/out
      open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]"
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
          {{ groupLabel(group.label) }}
        </div>

        <!-- Items -->
        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          data-rescue="nav"
          class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors"
          :class="[
            isActive(item.path)
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-l-2 border-primary-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          ]"
        >
          <span class="text-lg">{{ item.icon }}</span>
          <span v-if="open">{{ itemName(item.name) }}</span>
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
