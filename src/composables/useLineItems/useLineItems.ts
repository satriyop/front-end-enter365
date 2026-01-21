/**
 * useLineItems Composable
 *
 * Combines line items management with calculation service.
 * Provides a unified API for form pages with line items.
 *
 * @example
 * ```typescript
 * const {
 *   items,
 *   totals,
 *   lineCalculations,
 *   addItem,
 *   removeItem,
 *   updateItem,
 * } = useLineItems({
 *   initialItems: form.items,
 *   lineItemsConfig: { minItems: 1 },
 *   onItemsChange: (items) => setFieldValue('items', items),
 * })
 * ```
 */

import { watch, type Ref, type ComputedRef } from 'vue'
import {
  createLineItemsService,
  type BaseLineItem,
  type LineItemsConfig,
  type LineItemsService,
} from '@/services/line-items'
import {
  useCalculation,
  type CalculationServiceOptions,
  type DocumentTotals,
  type LineItemCalculation,
} from '@/services/calculation'

export interface UseLineItemsOptions<T extends BaseLineItem> {
  /** Initial line items */
  initialItems?: T[]
  /** Line items service configuration */
  lineItemsConfig?: LineItemsConfig
  /** Calculation service configuration */
  calculationConfig?: CalculationServiceOptions
  /** Callback when items change */
  onItemsChange?: (items: T[]) => void
}

export interface UseLineItemsReturn<T extends BaseLineItem> {
  // Line items state
  /** Reactive line items array */
  items: Ref<T[]>
  /** Number of items */
  count: ComputedRef<number>
  /** Whether can add more items */
  canAdd: ComputedRef<boolean>
  /** Whether can remove items */
  canRemove: ComputedRef<boolean>
  /** Whether has any items */
  hasItems: ComputedRef<boolean>

  // Line items actions
  /** Add a new line item */
  addItem: (item?: Partial<T>) => void
  /** Remove item at index */
  removeItem: (index: number) => void
  /** Update item at index */
  updateItem: (index: number, updates: Partial<T>) => void
  /** Move item from one position to another */
  moveItem: (fromIndex: number, toIndex: number) => void
  /** Duplicate item at index */
  duplicateItem: (index: number) => void
  /** Clear all items */
  clearItems: () => void
  /** Replace all items */
  setItems: (newItems: T[]) => void

  // Line items queries
  /** Get item at index */
  getItem: (index: number) => T | undefined
  /** Find item by product ID */
  findByProductId: (productId: number) => { item: T; index: number } | null
  /** Validate all items */
  validateItems: () => { valid: boolean; errors: Map<number, string[]> }

  // Calculations
  /** Document totals (subtotal, tax, grand total) */
  totals: ComputedRef<DocumentTotals>
  /** Individual line calculations */
  lineCalculations: ComputedRef<LineItemCalculation[]>
  /** Get calculation for specific line */
  getLineCalculation: (index: number) => LineItemCalculation | null
  /** Tax strategy info */
  taxInfo: ComputedRef<{ name: string; rate: number; isInclusive: boolean }>

  // Raw service access
  /** Underlying line items service */
  lineItemsService: LineItemsService<T>
}

/**
 * Use line items with integrated calculations
 */
export function useLineItems<T extends BaseLineItem>(
  options: UseLineItemsOptions<T> = {}
): UseLineItemsReturn<T> {
  const {
    initialItems = [],
    lineItemsConfig = {},
    calculationConfig = {},
    onItemsChange,
  } = options

  // Create line items service
  const lineItemsService = createLineItemsService<T>(initialItems, lineItemsConfig)

  // Setup calculations
  const calculations = useCalculation(lineItemsService.items as Ref<T[]>, calculationConfig)

  // Watch for changes and call callback
  if (onItemsChange) {
    watch(
      lineItemsService.items,
      (newItems) => {
        onItemsChange([...newItems])
      },
      { deep: true }
    )
  }

  return {
    // Line items state
    items: lineItemsService.items,
    count: lineItemsService.count,
    canAdd: lineItemsService.canAdd,
    canRemove: lineItemsService.canRemove,
    hasItems: lineItemsService.hasItems,

    // Line items actions
    addItem: lineItemsService.addItem,
    removeItem: lineItemsService.removeItem,
    updateItem: lineItemsService.updateItem,
    moveItem: lineItemsService.moveItem,
    duplicateItem: lineItemsService.duplicateItem,
    clearItems: lineItemsService.clearItems,
    setItems: lineItemsService.setItems,

    // Line items queries
    getItem: lineItemsService.getItem,
    findByProductId: lineItemsService.findByProductId,
    validateItems: lineItemsService.validate,

    // Calculations
    totals: calculations.totals,
    lineCalculations: calculations.lineCalculations,
    getLineCalculation: calculations.getLineCalculation,
    taxInfo: calculations.taxInfo,

    // Raw service
    lineItemsService,
  }
}
