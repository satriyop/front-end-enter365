/**
 * Line Item Factory
 *
 * Creates test line item data for documents (quotations, invoices, etc.).
 */

import type { BaseLineItem } from '@/services/line-items'

let lineItemId = 1

/**
 * Create a single line item with optional overrides
 */
export function createLineItem(overrides: Partial<BaseLineItem> = {}): BaseLineItem {
  const id = lineItemId++
  const quantity = overrides.quantity ?? 1
  const unitPrice = overrides.unit_price ?? 100000

  return {
    id,
    product_id: id,
    description: `Line item ${id}`,
    quantity,
    unit_price: unitPrice,
    discount_type: null,
    discount_value: null,
    unit: 'pcs',
    notes: '',
    ...overrides,
  }
}

/**
 * Create multiple line items
 */
export function createLineItems(count: number, overrides: Partial<BaseLineItem> = {}): BaseLineItem[] {
  return Array.from({ length: count }, () => createLineItem(overrides))
}

/**
 * Create a line item with percent discount
 */
export function createDiscountedLineItem(
  discountPercent: number,
  overrides: Partial<BaseLineItem> = {}
): BaseLineItem {
  return createLineItem({
    discount_type: 'percent',
    discount_value: discountPercent,
    ...overrides,
  })
}

/**
 * Create a line item with amount discount
 */
export function createAmountDiscountLineItem(
  discountAmount: number,
  overrides: Partial<BaseLineItem> = {}
): BaseLineItem {
  return createLineItem({
    discount_type: 'amount',
    discount_value: discountAmount,
    ...overrides,
  })
}

/**
 * Create line items with varying quantities and prices
 */
export function createVariedLineItems(): BaseLineItem[] {
  return [
    createLineItem({ quantity: 2, unit_price: 50000, description: 'Small item' }),
    createLineItem({ quantity: 1, unit_price: 150000, description: 'Medium item' }),
    createLineItem({ quantity: 5, unit_price: 25000, description: 'Bulk item' }),
  ]
}

/**
 * Reset factory to initial state
 */
export function resetLineItemFactory(): void {
  lineItemId = 1
}
