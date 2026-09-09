export type VendorPricelistLine = {
  contact_id: number
  min_qty: number
  price: number
}

export type VendorPriceSource = 'pricelist' | 'purchase_price' | 'selling_price' | 'none'

function matchedVendorLine(
  product: {
    vendor_pricelists?: VendorPricelistLine[] | null
  },
  vendorId: number | null | undefined,
  qty: number,
): VendorPricelistLine | undefined {
  if (!vendorId) {
    return undefined
  }

  return (product.vendor_pricelists ?? [])
    .filter((line) => Number(line.contact_id) === Number(vendorId) && Number(line.min_qty) <= qty)
    .sort((a, b) => Number(b.min_qty) - Number(a.min_qty))[0]
}

export function vendorPriceSource(
  product: {
    purchase_price?: number | null
    selling_price?: number | null
    vendor_pricelists?: VendorPricelistLine[] | null
  },
  vendorId: number | null | undefined,
  qty: number,
): VendorPriceSource {
  if (matchedVendorLine(product, vendorId, qty)) {
    return 'pricelist'
  }
  if (Number(product.purchase_price)) {
    return 'purchase_price'
  }
  if (Number(product.selling_price)) {
    return 'selling_price'
  }
  return 'none'
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
  const match = matchedVendorLine(product, vendorId, qty)
  if (match) {
    return Number(match.price)
  }

  return Number(product.purchase_price) || Number(product.selling_price) || 0
}
