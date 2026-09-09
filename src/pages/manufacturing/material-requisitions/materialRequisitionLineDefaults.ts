export type MaterialProductLike = {
  id: number
  name: string
  unit?: string | null
}

export type MaterialLineDraft = {
  product_id: number | null | undefined
  description: string
  unit: string
}

export function applyMaterialRequisitionProductDefaults(
  item: MaterialLineDraft,
  product: MaterialProductLike,
): void {
  item.product_id = Number(product.id)
  item.description = product.name
  item.unit = product.unit || 'unit'
}
