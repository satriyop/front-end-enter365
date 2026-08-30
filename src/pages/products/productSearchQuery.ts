export function searchFromRouteQuery(search: unknown): string {
  return typeof search === 'string' ? search : ''
}

export function routeQueryAfterSearch(
  current: Record<string, unknown>,
  search: string,
): Record<string, unknown> {
  const next = { ...current }
  if (search !== '') {
    next.search = search
  } else {
    delete next.search
  }
  return next
}
