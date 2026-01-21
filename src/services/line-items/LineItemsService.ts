/**
 * Line Items Service
 *
 * Manages line items for document forms with add/remove/update/reorder operations.
 * Provides validation and enforces min/max constraints.
 *
 * @example
 * ```typescript
 * const lineItems = createLineItemsService<QuotationItem>([], {
 *   minItems: 1,
 *   maxItems: 50,
 * })
 *
 * lineItems.addItem({ quantity: 5, unit_price: 10000 })
 * lineItems.removeItem(0)
 * ```
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { BaseLineItem, LineItemsConfig, ValidationResult } from './types'

const DEFAULT_LINE_ITEM: BaseLineItem = {
  product_id: null,
  description: '',
  quantity: 1,
  unit_price: 0,
  discount_type: null,
  discount_value: null,
  unit: 'pcs',
  notes: '',
}

export interface LineItemsService<T extends BaseLineItem> {
  // Reactive state
  items: Ref<T[]>
  count: ComputedRef<number>
  canAdd: ComputedRef<boolean>
  canRemove: ComputedRef<boolean>
  hasItems: ComputedRef<boolean>

  // Actions
  addItem: (item?: Partial<T>) => void
  removeItem: (index: number) => void
  updateItem: (index: number, updates: Partial<T>) => void
  moveItem: (fromIndex: number, toIndex: number) => void
  duplicateItem: (index: number) => void
  clearItems: () => void
  setItems: (newItems: T[]) => void

  // Queries
  getItem: (index: number) => T | undefined
  findByProductId: (productId: number) => { item: T; index: number } | null
  validate: () => ValidationResult
}

/**
 * Create a line items service instance
 */
export function createLineItemsService<T extends BaseLineItem>(
  initialItems: T[] = [],
  config: LineItemsConfig = {}
): LineItemsService<T> {
  const { minItems = 0, maxItems = 100, defaultItem = {}, requireProduct = false } = config

  // Initialize items, respecting minItems
  const items: Ref<T[]> = ref(
    initialItems.length > 0
      ? [...initialItems]
      : minItems > 0
        ? [{ ...DEFAULT_LINE_ITEM, ...defaultItem } as T]
        : []
  ) as Ref<T[]>

  /**
   * Can add more items?
   */
  const canAdd = computed(() => items.value.length < maxItems)

  /**
   * Can remove items?
   */
  const canRemove = computed(() => items.value.length > minItems)

  /**
   * Has items?
   */
  const hasItems = computed(() => items.value.length > 0)

  /**
   * Item count
   */
  const count = computed(() => items.value.length)

  /**
   * Add a new line item
   */
  function addItem(item?: Partial<T>): void {
    if (!canAdd.value) return

    const newItem = {
      ...DEFAULT_LINE_ITEM,
      ...defaultItem,
      ...item,
    } as T

    items.value.push(newItem)
  }

  /**
   * Remove a line item by index
   */
  function removeItem(index: number): void {
    if (!canRemove.value) return
    if (index < 0 || index >= items.value.length) return

    items.value.splice(index, 1)
  }

  /**
   * Update a line item at index
   */
  function updateItem(index: number, updates: Partial<T>): void {
    if (index < 0 || index >= items.value.length) return

    const currentItem = items.value[index]
    if (currentItem) {
      items.value[index] = {
        ...currentItem,
        ...updates,
      }
    }
  }

  /**
   * Move item from one position to another
   */
  function moveItem(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= items.value.length) return
    if (toIndex < 0 || toIndex >= items.value.length) return
    if (fromIndex === toIndex) return

    const [item] = items.value.splice(fromIndex, 1)
    if (item) {
      items.value.splice(toIndex, 0, item)
    }
  }

  /**
   * Duplicate an item
   */
  function duplicateItem(index: number): void {
    if (!canAdd.value) return
    if (index < 0 || index >= items.value.length) return

    const original = items.value[index]
    if (original) {
      const duplicate = { ...original, id: undefined } as T
      items.value.splice(index + 1, 0, duplicate)
    }
  }

  /**
   * Clear all items (respects minItems)
   */
  function clearItems(): void {
    items.value =
      minItems > 0
        ? ([{ ...DEFAULT_LINE_ITEM, ...defaultItem }] as T[])
        : ([] as T[])
  }

  /**
   * Set items (replace all)
   */
  function setItems(newItems: T[]): void {
    items.value = [...newItems]
  }

  /**
   * Get item at index
   */
  function getItem(index: number): T | undefined {
    return items.value[index]
  }

  /**
   * Find item by product ID
   */
  function findByProductId(productId: number): { item: T; index: number } | null {
    const index = items.value.findIndex((item) => item.product_id === productId)
    if (index === -1) return null
    const item = items.value[index]
    if (!item) return null
    return { item, index }
  }

  /**
   * Validate all items
   */
  function validate(): ValidationResult {
    const errors = new Map<number, string[]>()

    items.value.forEach((item, index) => {
      const itemErrors: string[] = []

      if (item.quantity <= 0) {
        itemErrors.push('Quantity must be greater than 0')
      }

      if (item.unit_price < 0) {
        itemErrors.push('Unit price cannot be negative')
      }

      if (requireProduct && !item.product_id) {
        itemErrors.push('Product is required')
      }

      if (itemErrors.length > 0) {
        errors.set(index, itemErrors)
      }
    })

    return {
      valid: errors.size === 0,
      errors,
    }
  }

  return {
    // Reactive state
    items,
    count,
    canAdd,
    canRemove,
    hasItems,

    // Actions
    addItem,
    removeItem,
    updateItem,
    moveItem,
    duplicateItem,
    clearItems,
    setItems,

    // Queries
    getItem,
    findByProductId,
    validate,
  }
}
