export function productTypeLabel(
  product: { type_label: string; track_inventory: boolean },
  posPack: boolean,
): string {
  if (posPack && !product.track_inventory) {
    return 'Tidak distok'
  }
  return product.type_label
}
