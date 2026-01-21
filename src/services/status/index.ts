/**
 * Status Service Module
 */

export { StatusService, statusService } from './StatusService'
export { useStatus, type UseStatusReturn } from './useStatus'
export { STATUS_REGISTRY, DEFAULT_STATUS_CONFIG } from './statusRegistry'
export type {
  StatusVariant,
  StatusConfig,
  StatusRegistry,
  DocumentStatusRegistry,
  DocumentType,
} from './types'
