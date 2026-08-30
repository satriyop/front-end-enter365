export const SHOP_TIME_ZONE = 'Asia/Jakarta'

export function bindOutletId(
  warehouses: Array<{ id: number; name: string }>,
  current: number | null,
): number | null {
  if (current != null && warehouses.some((row) => row.id === current)) {
    return current
  }
  const preferred = warehouses.find((row) => row.name.includes('Kopitiam 57')) ?? warehouses[0]
  return preferred?.id ?? null
}

export function tillStartBlocked(
  warehouseId: number | null,
  periodLocked: boolean,
  loading: boolean,
): boolean {
  return periodLocked || loading || warehouseId == null
}

export function formatHoldClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SHOP_TIME_ZONE,
  })
}
