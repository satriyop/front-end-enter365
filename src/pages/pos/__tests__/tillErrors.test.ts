import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { isNetworkError } from '@/api/client'
import { shouldShowTillOfflineDialog } from '../tillErrors'

function axiosWithResponse(status: number, data: Record<string, unknown> = {}): AxiosError {
  return new AxiosError(
    `Request failed with status code ${status}`,
    status === 422 ? 'ERR_BAD_REQUEST' : 'ERR_BAD_RESPONSE',
    undefined,
    { path: '/pos/sessions/1/checkout' },
    {
      status,
      statusText: 'Error',
      headers: {},
      config: {} as never,
      data,
    },
  )
}

describe('shouldShowTillOfflineDialog', () => {
  it('is false after checkout already recorded, even on a network error', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(shouldShowTillOfflineDialog(error, true)).toBe(false)
  })

  it('is true only for a real transport failure before the sale exists', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK')
    expect(isNetworkError(error)).toBe(true)
    expect(shouldShowTillOfflineDialog(error, false)).toBe(true)
  })

  it.each([422, 409, 403, 500])('is false for HTTP %s (sale may or may not exist — show the real error)', (status) => {
    const error = axiosWithResponse(status, { message: 'Operasi checkout tidak diizinkan.' })
    expect(isNetworkError(error)).toBe(false)
    expect(shouldShowTillOfflineDialog(error, false)).toBe(false)
  })

  it('does not treat a stripped 422 (no response) as offline unless Axios marks it as network', () => {
    const error = new AxiosError('Request failed with status code 422', 'ERR_BAD_REQUEST')
    expect(isNetworkError(error)).toBe(false)
    expect(shouldShowTillOfflineDialog(error, false)).toBe(false)
  })
})
