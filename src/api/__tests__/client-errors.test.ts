import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getErrorMessage, isNetworkError } from '../client'

describe('isNetworkError', () => {
  it('is true for Axios ERR_NETWORK with no response', () => {
    expect(isNetworkError(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true)
  })

  it('is false for 422/409/500 responses', () => {
    for (const status of [422, 409, 500]) {
      const error = new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST')
      error.response = {
        status,
        statusText: 'Error',
        headers: {},
        config: {} as never,
        data: { message: 'Pesan dari server' },
      }
      expect(isNetworkError(error)).toBe(false)
    }
  })

  it('is false for non-axios errors', () => {
    expect(isNetworkError(new Error('boom'))).toBe(false)
    expect(isNetworkError('Network Error')).toBe(false)
  })
})

describe('getErrorMessage', () => {
  it('uses the Indonesian 409 business-rule message', () => {
    const error = new AxiosError('Request failed with status code 409', 'ERR_BAD_REQUEST')
    error.response = {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { message: 'Operasi checkout tidak diizinkan. Uang tunai kurang.' },
    }
    expect(getErrorMessage(error, 'fallback')).toBe('Operasi checkout tidak diizinkan. Uang tunai kurang.')
  })

  it('does not surface the generic Axios Network Error string when there is a 500 body', () => {
    const error = new AxiosError('Network Error', 'ERR_BAD_RESPONSE')
    error.response = {
      status: 500,
      statusText: 'Error',
      headers: {},
      config: {} as never,
      data: { message: 'Terjadi kesalahan di server. Coba lagi.' },
    }
    expect(getErrorMessage(error, 'fallback')).toBe('Terjadi kesalahan di server. Coba lagi.')
  })
})
