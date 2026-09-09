export type InvoiceSalesTax = {
  id: number
  rate: number
}

export type InvoiceProductLike = {
  id: number
  name: string
  unit?: string | null
  selling_price?: number | string | null
  tax_rate?: number | string | null
  sales_account_id?: number | null
  sales_taxes?: InvoiceSalesTax[] | null
}

export type InvoiceLineDraft = {
  product_id: number | null
  description: string
  unit: string
  unit_price: number
  tax_rate: number
  tax_record_ids: number[]
  taxes_manual: boolean
  revenue_account_id?: number | null
}

export function rateForTaxIds(taxes: InvoiceSalesTax[] | null | undefined, ids: number[]): number {
  return (taxes ?? [])
    .filter((tax) => ids.includes(tax.id))
    .reduce((sum, tax) => sum + Number(tax.rate), 0)
}

export function applyInvoiceProductDefaults(item: InvoiceLineDraft, product: InvoiceProductLike): void {
  item.product_id = Number(product.id)
  item.description = product.name
  item.unit = product.unit || 'pcs'
  item.unit_price = Number(product.selling_price) || 0
  const inherited = (product.sales_taxes ?? []).map((tax) => tax.id)
  item.tax_record_ids = inherited
  item.taxes_manual = false
  item.tax_rate = inherited.length
    ? (product.sales_taxes ?? []).reduce((sum, tax) => sum + Number(tax.rate), 0)
    : Number(product.tax_rate) || 0
  if (product.sales_account_id) {
    item.revenue_account_id = Number(product.sales_account_id)
  }
}

export function toggleInvoiceLineTax(
  item: InvoiceLineDraft,
  taxId: number,
  taxes: InvoiceSalesTax[] | null | undefined,
): void {
  const current = item.tax_record_ids ?? []
  const next = current.includes(taxId)
    ? current.filter((id) => id !== taxId)
    : [...current, taxId]
  item.tax_record_ids = next
  item.taxes_manual = true
  item.tax_rate = next.length ? rateForTaxIds(taxes, next) : 0
}
