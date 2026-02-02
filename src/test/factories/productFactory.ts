/**
 * Product Factory
 *
 * Creates test Product data matching the API ProductResource schema.
 */

import type { components } from '@/api/types'

export type Product = components['schemas']['ProductResource']

let productId = 1

/**
 * Create a single product with optional overrides
 */
export function createProduct(overrides: Partial<Product> = {}): Product {
  const id = productId++
  const sellingPrice = 100000 + id * 10000
  const taxAmount = Math.round(sellingPrice * 0.11)

  return {
    id: String(id),
    sku: `SKU-${id.toString().padStart(4, '0')}`,
    name: `Product ${id}`,
    description: `Description for product ${id}`,
    type: 'product',
    type_label: 'Produk',
    category_id: '1',
    unit: 'pcs',
    // Pricing
    purchase_price: String(sellingPrice * 0.7),
    selling_price: String(sellingPrice),
    selling_price_with_tax: String(sellingPrice + taxAmount),
    selling_tax_amount: String(taxAmount),
    tax_rate: 11,
    is_taxable: 'true',
    profit_margin: '30',
    markup: '42.86',
    // Inventory
    track_inventory: 'true',
    min_stock: '10',
    current_stock: '100',
    is_low_stock: 'false',
    is_out_of_stock: 'false',
    // Timestamps
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Product
}

/**
 * Create multiple products
 */
export function createProducts(count: number, overrides: Partial<Product> = {}): Product[] {
  return Array.from({ length: count }, () => createProduct(overrides))
}

/**
 * Create a service product (non-inventory)
 */
export function createService(overrides: Partial<Product> = {}): Product {
  return createProduct({
    type: 'service',
    type_label: 'Jasa',
    track_inventory: false,
    current_stock: 0,
    min_stock: 0,
    purchase_price: 0,
    selling_price: 0,
    ...overrides,
  })
}

/**
 * Create a low stock product
 */
export function createLowStockProduct(overrides: Partial<Product> = {}): Product {
  return createProduct({
    current_stock: 5,
    min_stock: 10,
    is_low_stock: true,
    ...overrides,
  })
}

/**
 * Reset factory to initial state
 */
export function resetProductFactory(): void {
  productId = 1
}
