import { priceForVendor, vendorPriceSource, type VendorPricelistLine } from '@/utils/vendorPrice'

export type PurchaseProductLike = {
  id: number
  name: string
  unit?: string | null
  tax_rate?: number | string | null
  purchase_price?: number | null
  selling_price?: number | null
  vendor_pricelists?: VendorPricelistLine[] | null
}

export type PurchaseLineDraft = {
  product_id: number | null
  description: string
  unit: string
  tax_rate: number
  unit_price: number
  quantity?: number
}

export function applyPurchaseOrderProductDefaults(
  item: PurchaseLineDraft,
  product: PurchaseProductLike,
  vendorId: number | null,
): void {
  item.product_id = Number(product.id)
  item.description = product.name
  item.unit = product.unit || 'pcs'
  item.tax_rate = Number(product.tax_rate) || 0
  const qty = Number(item.quantity) || 1
  item.unit_price = priceForVendor(product, vendorId, qty)
}

export function purchaseOrderPriceHint(
  product: PurchaseProductLike,
  vendorId: number | null,
  qty: number,
): string {
  const source = vendorPriceSource(product, vendorId, qty)
  const price = priceForVendor(product, vendorId, qty)
  if (source === 'pricelist') {
    return `Vendor pricelist · ${price}`
  }
  if (source === 'purchase_price') {
    return `Product purchase price · ${price}`
  }
  if (source === 'selling_price') {
    return `Product selling price · ${price}`
  }
  return ''
}
