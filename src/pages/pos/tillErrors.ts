import { isNetworkError } from '@/api/client'

/**
 * Only a true transport failure (no HTTP response) may show
 * "Jaringan putus / Belum terkirim". A completed checkout must never
 * surface that dialog, even if a later catalog/session refresh fails.
 */
export function shouldShowTillOfflineDialog(
  error: unknown,
  saleAlreadyRecorded: boolean,
): boolean {
  if (saleAlreadyRecorded) {
    return false
  }

  return isNetworkError(error)
}
