export type VendorPricelistLine = {
  contact_id: number
  min_qty: number
  price: number
}

export function priceForVendor(
  product: {
    purchase_price?: number | null
    selling_price?: number | null
    vendor_pricelists?: VendorPricelistLine[] | null
  },
  vendorId: number | null | undefined,
  qty: number,
): number {
  const fallback = Number(product.purchase_price) || Number(product.selling_price) || 0
  if (!vendorId) {
    return fallback
  }

  const match = (product.vendor_pricelists ?? [])
    .filter((line) => Number(line.contact_id) === Number(vendorId) && Number(line.min_qty) <= qty)
    .sort((a, b) => Number(b.min_qty) - Number(a.min_qty))[0]

  return match ? Number(match.price) : fallback
}
