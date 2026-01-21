/**
 * useCalculation Composable
 *
 * Reactive wrapper around CalculationService for Vue components.
 * Automatically recalculates when items change.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const items = ref<CalculableLineItem[]>([
 *   { quantity: 2, unit_price: 100000 },
 * ])
 *
 * const { totals, lineCalculations, taxInfo } = useCalculation(items)
 *
 * // totals.value.grandTotal is reactive
 * </script>
 * ```
 */

import { computed, type Ref, type ComputedRef } from 'vue'
import {
  CalculationService,
  type CalculationServiceOptions,
} from './CalculationService'
import type {
  CalculableLineItem,
  DocumentTotals,
  LineItemCalculation,
} from './strategies/types'

export interface UseCalculationReturn {
  /** Reactive document totals */
  totals: ComputedRef<DocumentTotals>
  /** Reactive line item calculations */
  lineCalculations: ComputedRef<LineItemCalculation[]>
  /** Get calculation for a specific line */
  getLineCalculation: (index: number) => LineItemCalculation | null
  /** Tax strategy info */
  taxInfo: ComputedRef<{ name: string; rate: number; isInclusive: boolean }>
  /** Underlying service instance */
  service: CalculationService
}

/**
 * Use calculation service with reactive items
 */
export function useCalculation(
  items: Ref<CalculableLineItem[]>,
  options?: CalculationServiceOptions
): UseCalculationReturn {
  const service = new CalculationService(options)

  /**
   * Calculated totals (reactive)
   */
  const totals = computed<DocumentTotals>(() => {
    return service.calculateTotals(items.value)
  })

  /**
   * Individual line calculations (reactive)
   */
  const lineCalculations = computed<LineItemCalculation[]>(() => {
    return service.calculateLineItems(items.value)
  })

  /**
   * Get calculation for specific line index
   */
  function getLineCalculation(index: number): LineItemCalculation | null {
    return lineCalculations.value[index] ?? null
  }

  /**
   * Tax info (reactive, though unlikely to change)
   */
  const taxInfo = computed(() => service.getTaxInfo())

  return {
    totals,
    lineCalculations,
    getLineCalculation,
    taxInfo,
    service,
  }
}
