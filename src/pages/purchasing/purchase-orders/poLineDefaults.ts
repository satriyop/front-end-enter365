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

export type VendorPriceQuote = {
  price: number
  source: 'pricelist' | 'purchase_price' | 'selling_price' | 'none'
}

export function purchaseOrderPriceHintFromQuote(quote: VendorPriceQuote): string {
  if (quote.source === 'pricelist') {
    return `Vendor pricelist · ${quote.price}`
  }
  if (quote.source === 'purchase_price') {
    return `Product purchase price · ${quote.price}`
  }
  if (quote.source === 'selling_price') {
    return `Product selling price · ${quote.price}`
  }
  return ''
}

export function purchaseOrderPriceHint(
  product: PurchaseProductLike,
  vendorId: number | null,
  qty: number,
): string {
  return purchaseOrderPriceHintFromQuote({
    source: vendorPriceSource(product, vendorId, qty),
    price: priceForVendor(product, vendorId, qty),
  })
}

export function applyQuotedUnitPrice(item: PurchaseLineDraft, quote?: VendorPriceQuote | null): void {
  if (quote) {
    item.unit_price = quote.price
  }
}

export function isCurrentVendorQuoteRequest(
  item: { product_id: number | null; quantity?: number },
  vendorId: number | null,
  requested: { productId: number; qty: number; vendorId: number | null },
): boolean {
  return Number(item.product_id) === requested.productId
    && (Number(item.quantity) || 1) === requested.qty
    && vendorId === requested.vendorId
}
