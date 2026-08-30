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

/**
 * Disable only while a start request is in flight or the period is locked.
 * An unbound outlet must not swallow the click — bind or toast instead.
 */
export function tillStartBlocked(
  periodLocked: boolean,
  loading: boolean,
): boolean {
  return periodLocked || loading
}

export function resolveStartWarehouse(
  warehouses: Array<{ id: number; name: string }>,
  current: number | null,
): { warehouseId: number | null; error: string | null } {
  const warehouseId = bindOutletId(warehouses, current)
  if (warehouseId == null) {
    return {
      warehouseId: null,
      error: warehouses.length === 0
        ? 'Outlet masih dimuat, coba lagi.'
        : 'Gudang wajib dipilih.',
    }
  }

  return { warehouseId, error: null }
}

export function formatHoldClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: SHOP_TIME_ZONE,
  })
}
