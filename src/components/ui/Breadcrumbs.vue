<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationMatched } from 'vue-router'

interface BreadcrumbItem {
  label: string
  path?: string
  isLast: boolean
}

const route = useRoute()
const router = useRouter()

/**
 * Build breadcrumb trail from matched routes
 */
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = []

  // Always start with Home
  items.push({
    label: 'Home',
    path: '/',
    isLast: false,
  })

  // Process matched routes
  const matched = route.matched.filter(r => r.meta?.breadcrumb)

  matched.forEach((match: RouteLocationMatched, index: number) => {
    const isLast = index === matched.length - 1
    const breadcrumbMeta = match.meta?.breadcrumb

    let label: string

    if (typeof breadcrumbMeta === 'function') {
      // Dynamic breadcrumb based on route params
      label = breadcrumbMeta(route)
    } else {
      label = breadcrumbMeta as string
    }

    // Build path from route
    let path: string | undefined

    if (!isLast) {
      // For parent routes, resolve the path
      const resolved = router.resolve({
        name: match.name,
        params: route.params,
      })
      path = resolved.href
    }

    items.push({
      label,
      path,
      isLast,
    })
  })

  // Mark the last item
  const lastItem = items[items.length - 1]
  if (lastItem) {
    lastItem.isLast = true
  }

  return items
})

const showBreadcrumbs = computed(() => breadcrumbs.value.length > 1)
</script>

<template>
  <nav v-if="showBreadcrumbs" aria-label="Breadcrumb" class="mb-4">
    <ol class="flex items-center text-sm">
      <li
        v-for="(item, index) in breadcrumbs"
        :key="index"
        class="flex items-center"
      >
        <!-- Separator -->
        <svg
          v-if="index > 0"
          class="w-4 h-4 text-slate-400 mx-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>

        <!-- Link or Text -->
        <RouterLink
          v-if="item.path && !item.isLast"
          :to="item.path"
          class="text-slate-500 hover:text-primary-600 transition-colors"
        >
          {{ item.label }}
        </RouterLink>
        <span
          v-else
          class="text-slate-900 font-medium"
          :class="{ 'truncate max-w-[200px]': item.isLast }"
          :title="item.label"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
