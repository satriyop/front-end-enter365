<script setup lang="ts">
/**
 * Electrical-panel-only meta cards on BOM template detail:
 * rule set summary + available brand coverage.
 * Multi-root so they participate in the parent info-card grid.
 */
import { Card } from '@/components/ui'
import { Settings } from 'lucide-vue-next'

interface AvailableBrand {
  code: string
  name: string
  coverage_percent: number
}

withDefaults(
  defineProps<{
    ruleSetCode?: string | null
    availableBrands?: AvailableBrand[] | null
  }>(),
  {
    ruleSetCode: null,
    availableBrands: null,
  },
)
</script>

<template>
  <Card>
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
        <Settings class="w-5 h-5 text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Rule Set</div>
        <div class="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {{ ruleSetCode ?? 'Default' }}
        </div>
      </div>
    </div>
  </Card>

  <Card
    v-if="availableBrands && availableBrands.length > 0"
    class="col-span-3"
  >
    <template #header>
      <h2 class="font-medium text-slate-900 dark:text-slate-100">Available Brands for This Template</h2>
    </template>
    <div class="flex flex-wrap gap-3">
      <div
        v-for="brand in availableBrands"
        :key="brand.code"
        class="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
      >
        <span class="font-medium text-slate-900 dark:text-slate-100">{{ brand.name }}</span>
        <span class="text-sm text-slate-500 dark:text-slate-400">
          {{ brand.coverage_percent }}% coverage
        </span>
      </div>
    </div>
  </Card>
</template>
