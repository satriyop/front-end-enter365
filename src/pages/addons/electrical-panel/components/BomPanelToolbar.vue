<script setup lang="ts">
/**
 * Electrical-panel-only BOM detail toolbar actions.
 * Kept under addons so core BomDetailPage does not own industry CTAs.
 */
import { TrendingDown } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'

defineEmits<{
  optimize: []
  compare: []
  swapBrand: []
  generateVariants: []
}>()
</script>

<template>
  <div class="contents">
    <Button variant="success" size="sm" @click="$emit('optimize')">
      <TrendingDown class="w-4 h-4 mr-1" />
      Optimize Cost
    </Button>
    <Button size="sm" @click="$emit('compare')">
      <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      Compare Brands
    </Button>
    <Button variant="secondary" size="sm" @click="$emit('swapBrand')">
      <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      Swap Brand
    </Button>
    <Button variant="secondary" size="sm" @click="$emit('generateVariants')">
      <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      Generate Variants
    </Button>
    <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
  </div>
</template>
