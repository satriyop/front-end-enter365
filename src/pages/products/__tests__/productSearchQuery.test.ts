import { describe, expect, it } from 'vitest'
import { routeQueryAfterSearch, searchFromRouteQuery } from '../productSearchQuery'

describe('product list search query', () => {
  it('reads ?search= from the route', () => {
    expect(searchFromRouteQuery('Garlic Cheese')).toBe('Garlic Cheese')
    expect(searchFromRouteQuery(['Garlic'])).toBe('')
  })

  it('writes and clears the search query param', () => {
    expect(routeQueryAfterSearch({ page: '1' }, 'Garlic Cheese')).toEqual({
      page: '1',
      search: 'Garlic Cheese',
    })
    expect(routeQueryAfterSearch({ page: '1', search: 'Garlic Cheese' }, '')).toEqual({
      page: '1',
    })
  })
})
