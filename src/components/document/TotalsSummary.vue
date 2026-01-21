<script setup lang="ts">
/**
 * TotalsSummary Component
 *
 * Displays document totals in a consistent format.
 * Works with the calculation service output.
 *
 * @example
 * ```vue
 * <TotalsSummary
 *   :totals="totals"
 *   :show-tax-rate="true"
 *   :tax-rate="11"
 * />
 * ```
 */

import { formatCurrency } from '@/utils/format'
import type { DocumentTotals } from '@/services/calculation'

interface Props {
  totals: DocumentTotals
  showDiscount?: boolean
  showTax?: boolean
  showTaxRate?: boolean
  taxRate?: number
  taxLabel?: string
}

withDefaults(defineProps<Props>(), {
  showDiscount: true,
  showTax: true,
  showTaxRate: true,
  taxRate: 11,
  taxLabel: 'Tax',
})
</script>

<template>
  <div class="space-y-2 text-sm">
    <!-- Subtotal -->
    <div class="flex justify-between">
      <span class="text-muted-foreground">Subtotal</span>
      <span>{{ formatCurrency(totals.subtotal) }}</span>
    </div>

    <!-- Discount (if applicable) -->
    <div
      v-if="showDiscount && totals.totalDiscount > 0"
      class="flex justify-between text-destructive"
    >
      <span>Discount</span>
      <span>-{{ formatCurrency(totals.totalDiscount) }}</span>
    </div>

    <!-- Tax -->
    <div v-if="showTax" class="flex justify-between">
      <span class="text-muted-foreground">
        {{ taxLabel }}
        <span v-if="showTaxRate">({{ taxRate }}%)</span>
      </span>
      <span>{{ formatCurrency(totals.tax) }}</span>
    </div>

    <!-- Grand Total -->
    <div class="flex justify-between pt-2 border-t font-semibold text-base">
      <span>Grand Total</span>
      <span class="text-primary">{{ formatCurrency(totals.grandTotal) }}</span>
    </div>

    <!-- Additional totals slot -->
    <slot />
  </div>
</template>
