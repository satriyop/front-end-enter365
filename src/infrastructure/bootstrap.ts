/**
 * Infrastructure Bootstrap
 *
 * Initializes all infrastructure services at application startup.
 * Should be called once in main.ts before mounting the app.
 *
 * @example
 * ```ts
 * // main.ts
 * import { bootstrapInfrastructure } from '@/infrastructure'
 *
 * bootstrapInfrastructure()
 *
 * const app = createApp(App)
 * // ...
 * app.mount('#app')
 * ```
 */

import { container, ServiceTokens } from './container'
import { eventBus } from './events'
import { logger, ConsoleTransport } from './logger'

/**
 * Bootstrap configuration options
 */
export interface BootstrapOptions {
  /** Enable debug mode (verbose logging) */
  debug?: boolean
  /** Custom log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  /** Enable event history tracking */
  trackEvents?: boolean
}

/**
 * Initialize infrastructure services
 */
export function bootstrapInfrastructure(options: BootstrapOptions = {}): void {
  const isDev = import.meta.env.DEV
  const debug = options.debug ?? isDev

  // ─────────────────────────────────────────────────────────────
  // Configure Logger
  // ─────────────────────────────────────────────────────────────

  // Set log level
  if (options.logLevel) {
    logger.setLevel(options.logLevel)
  } else {
    logger.setLevel(isDev ? 'debug' : 'warn')
  }

  // Add console transport for development
  if (isDev) {
    logger.addTransport(new ConsoleTransport({ collapsed: true }))
  }

  // Add environment info to logger context
  logger.setContext({
    env: import.meta.env.MODE,
    version: import.meta.env.VITE_APP_VERSION ?? 'unknown',
  })

  // ─────────────────────────────────────────────────────────────
  // Register Services in Container
  // ─────────────────────────────────────────────────────────────

  container.register(ServiceTokens.EventBus, () => eventBus, 'singleton')
  container.register(ServiceTokens.Logger, () => logger, 'singleton')

  // ─────────────────────────────────────────────────────────────
  // Wire up Event → Logger Integration
  // ─────────────────────────────────────────────────────────────

  if (debug) {
    // Log all events in debug mode
    eventBus.onAny((event) => {
      logger.debug(`Event: ${event.type}`, {
        payload: event.payload as Record<string, unknown>,
        meta: event.meta,
      })
    })
  } else {
    // In production, only log important events
    eventBus.onMany(
      [
        'document:created',
        'document:deleted',
        'document:status-changed',
        'error:unhandled',
        'error:api',
        'user:logged-in',
        'user:logged-out',
      ],
      (event) => {
        logger.info(`Event: ${event.type}`, {
          payload: event.payload as Record<string, unknown>,
        })
      }
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Log Startup
  // ─────────────────────────────────────────────────────────────

  logger.info('Infrastructure initialized', {
    mode: import.meta.env.MODE,
    debug,
    services: container.getRegisteredTokens(),
  })
}

/**
 * Cleanup infrastructure (useful for testing)
 */
export function cleanupInfrastructure(): void {
  eventBus.clear()
  eventBus.clearHistory()
  container.clear()
}
