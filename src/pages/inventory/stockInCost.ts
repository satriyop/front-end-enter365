export function resolveStockInUnitCost(
  entered: number,
  fallbacks: { averageCost?: number | null; purchasePrice?: number | null },
): { unitCost: number } | { error: string } {
  if (entered > 0) {
    return { unitCost: entered }
  }

  const average = fallbacks.averageCost ?? 0
  if (average > 0) {
    return { unitCost: average }
  }

  const purchase = fallbacks.purchasePrice ?? 0
  if (purchase > 0) {
    return { unitCost: purchase }
  }

  return { error: 'Unit cost is required for stock in' }
}
