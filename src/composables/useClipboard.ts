import { ref } from 'vue'
import { useToast } from '@/components/ui'

/**
 * Composable for clipboard operations
 *
 * @example
 * const { copy, copied, isSupported } = useClipboard()
 * await copy('Hello World')
 */
export function useClipboard() {
  const toast = useToast()
  const copied = ref(false)
  const isSupported = ref(!!navigator.clipboard)

  let timeout: ReturnType<typeof setTimeout> | null = null

  /**
   * Copy text to clipboard
   * @param text - Text to copy
   * @param showToast - Whether to show success toast (default: true)
   */
  async function copy(text: string, showToast = true): Promise<boolean> {
    if (!text) {
      return false
    }

    try {
      if (navigator.clipboard) {
        // Modern API
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.top = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      copied.value = true

      if (showToast) {
        toast.success('Copied to clipboard')
      }

      // Reset copied state after 2 seconds
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(() => {
        copied.value = false
      }, 2000)

      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
      return false
    }
  }

  return {
    copy,
    copied,
    isSupported,
  }
}
