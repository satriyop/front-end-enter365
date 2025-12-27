import { ref } from 'vue'

export interface PrintOptions {
  /** Document title shown in print dialog */
  title?: string
  /** Delay before opening print dialog (ms) - allows content to render */
  delay?: number
  /** Callback after print dialog closes */
  onAfterPrint?: () => void
}

export function usePrint() {
  const isPrinting = ref(false)

  /**
   * Trigger the browser's print dialog
   */
  function print(options: PrintOptions = {}) {
    const { title, delay = 100, onAfterPrint } = options

    isPrinting.value = true

    // Set document title temporarily for the print dialog
    const originalTitle = document.title
    if (title) {
      document.title = title
    }

    // Add print mode class for any JS-based styling adjustments
    document.body.classList.add('printing')

    // Small delay to ensure DOM updates are complete
    setTimeout(() => {
      window.print()

      // Restore original state after print dialog closes
      window.addEventListener(
        'afterprint',
        () => {
          document.title = originalTitle
          document.body.classList.remove('printing')
          isPrinting.value = false
          onAfterPrint?.()
        },
        { once: true }
      )

      // Fallback for browsers that don't support afterprint well
      setTimeout(() => {
        if (isPrinting.value) {
          document.title = originalTitle
          document.body.classList.remove('printing')
          isPrinting.value = false
        }
      }, 1000)
    }, delay)
  }

  return {
    isPrinting,
    print,
  }
}
