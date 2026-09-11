export type FiscalPositionTaxMapLike = {
  source_tax_record_id: number
  dest_tax_record_id: number | null
}

export type FiscalPositionAccountMapLike = {
  source_account_id: number
  dest_account_id: number
}

export type FiscalPositionMapsLike = {
  tax_maps?: FiscalPositionTaxMapLike[] | null
  account_maps?: FiscalPositionAccountMapLike[] | null
} | null | undefined

export function mapTaxIdsThroughFiscalPosition(
  ids: number[],
  position?: FiscalPositionMapsLike,
): number[] {
  if (!position?.tax_maps?.length) {
    return [...ids]
  }

  const maps = new Map(
    position.tax_maps.map((map) => [map.source_tax_record_id, map.dest_tax_record_id]),
  )
  const mapped: number[] = []

  for (const sourceId of ids) {
    if (!maps.has(sourceId)) {
      mapped.push(sourceId)
      continue
    }
    const dest = maps.get(sourceId)
    if (dest != null) {
      mapped.push(dest)
    }
  }

  return [...new Set(mapped)]
}

export function mapAccountThroughFiscalPosition(
  accountId: number | null | undefined,
  position?: FiscalPositionMapsLike,
): number | null {
  if (accountId == null) {
    return null
  }
  const map = position?.account_maps?.find((row) => row.source_account_id === accountId)
  return map ? map.dest_account_id : accountId
}
