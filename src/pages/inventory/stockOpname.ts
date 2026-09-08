export function opnameLineDifference(
  bookQty: number,
  countedQty: number | null | undefined,
): number | null {
  if (countedQty === null || countedQty === undefined || Number.isNaN(Number(countedQty))) {
    return null
  }

  return Number(countedQty) - bookQty
}

export function opnameListStatusLabel(value: string, fallback?: string): string {
  if (value === 'draft') {
    return 'Draft'
  }
  if (value === 'counting') {
    return 'In Progress'
  }
  if (value === 'completed') {
    return 'Done'
  }

  return fallback ?? value
}
