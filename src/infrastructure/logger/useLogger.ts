/**
 * Vue Composable for Logger
 *
 * Creates a child logger with component context automatically added.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useLogger } from '@/infrastructure/logger'
 *
 * const log = useLogger()
 * // or with custom name
 * const log = useLogger('QuotationForm')
 *
 * log.info('Form loaded')
 * log.error('Save failed', error, { formData })
 * </script>
 * ```
 */

import { getCurrentInstance } from 'vue'
import { logger } from './Logger'

/**
 * Get a logger with component context
 *
 * @param componentName - Optional custom component name
 * @returns Logger instance with component context
 */
export function useLogger(componentName?: string) {
  const instance = getCurrentInstance()

  // Try to get component name from instance
  const name =
    componentName ||
    instance?.type?.__name ||
    instance?.type?.name ||
    'Anonymous'

  // Create child logger with component context
  return logger.child({ component: name })
}
