/**
 * UI Component Library
 * Built following design_system/ specifications
 */

// Core Components
export { default as Button } from './Button.vue'
export { default as Input } from './Input.vue'
export { default as Badge } from './Badge.vue'
export { default as Card } from './Card.vue'
export { default as StatCard } from './StatCard.vue'
export { default as Modal } from './Modal.vue'
export { default as Alert } from './Alert.vue'

// Form Components
export { default as FormField } from './FormField.vue'
export { default as Textarea } from './Textarea.vue'
export { default as Select } from './Select.vue'
export { default as CurrencyInput } from './CurrencyInput.vue'

// Data Components
export { default as DataTable } from './DataTable.vue'
export { default as Pagination } from './Pagination.vue'
export { default as EmptyState } from './EmptyState.vue'
export { default as LoadingSkeleton } from './LoadingSkeleton.vue'
export { default as PageSkeleton } from './PageSkeleton.vue'

// Dialogs
export { default as ConfirmDialog } from './ConfirmDialog.vue'
export { default as ConfirmationModal } from './ConfirmationModal.vue'

// Status
export { default as StatusBadge } from './StatusBadge.vue'

// Navigation
export { default as Breadcrumbs } from './Breadcrumbs.vue'

// Utilities
export { default as CopyButton } from './CopyButton.vue'
export { default as ExportButton } from './ExportButton.vue'
export { default as FilterPresetDropdown } from './FilterPresetDropdown.vue'
export { default as ThemeToggle } from './ThemeToggle.vue'

// Performance & Mobile
export { default as VirtualTable } from './VirtualTable.vue'
export { default as ResponsiveTable } from './ResponsiveTable.vue'
export { default as PullToRefresh } from './PullToRefresh.vue'

// ResponsiveTable types
export interface ResponsiveColumn<T = object> {
  key: keyof T | (string & {})
  label: string
  /** Show in mobile card view */
  showInMobile?: boolean
  /** Priority for mobile (lower = more important) */
  mobilePriority?: number
  /** Width for desktop table */
  width?: string
  align?: 'left' | 'center' | 'right'
  /** Format function for display */
  format?: (value: unknown, item: T) => string
}

// Toast System
export { Toast, ToastProvider, useToast } from './Toast'
export type { ToastType, ToastVariant, ToastOptions } from './Toast'

// Type definitions for component props
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type InputSize = 'sm' | 'md' | 'lg'

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
export type StatusType = 'draft' | 'pending' | 'in_progress' | 'submitted' | 'approved' | 'completed' | 'on_hold' | 'cancelled' | 'rejected' | 'overdue' | 'sent' | 'partial' | 'paid' | 'expired' | 'converted'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'
