# Phase 6: State Machine Implementation

## Overview

This phase implements formal state machines for document lifecycle management. State machines provide:
- Clear, visualizable workflow states
- Guarded transitions (prevent invalid state changes)
- Side effects on transitions (notifications, logging)
- Consistent behavior across the application

**Prerequisites:** Phase 1, Phase 2, Phase 3

**Deliverables:**
1. State machine core implementation
2. Document workflow machines (quotation, invoice, PO, etc.)
3. Transition guards
4. Side effects and actions
5. Vue integration

---

## 6.1 State Machine Core

### Why Not XState?

While XState is excellent, we'll build a lightweight custom solution because:
1. Smaller bundle size
2. Tailored to our document workflow needs
3. Better TypeScript integration with our types
4. Simpler learning curve for the team

### Core Types

```typescript
// src/services/state-machine/types.ts
export type StateValue = string

export interface StateConfig<TContext = unknown> {
  /** Human-readable label */
  label: string
  /** Description of this state */
  description?: string
  /** Whether this is a final state (no outgoing transitions) */
  final?: boolean
  /** Actions to run when entering this state */
  onEnter?: (context: TContext) => void | Promise<void>
  /** Actions to run when exiting this state */
  onExit?: (context: TContext) => void | Promise<void>
}

export interface TransitionConfig<TContext = unknown, TEvent = unknown> {
  /** Target state */
  target: StateValue
  /** Guard condition - transition only if returns true */
  guard?: (context: TContext, event: TEvent) => boolean
  /** Guard failure message */
  guardMessage?: string
  /** Actions to run during transition */
  actions?: Array<(context: TContext, event: TEvent) => void | Promise<void>>
}

export interface MachineConfig<TContext = unknown, TEvent extends { type: string } = { type: string }> {
  /** Machine identifier */
  id: string
  /** Initial state */
  initial: StateValue
  /** Context (extended state) */
  context: TContext
  /** State definitions */
  states: Record<StateValue, StateConfig<TContext> & {
    on?: Record<string, TransitionConfig<TContext, TEvent> | StateValue>
  }>
}

export interface MachineState<TContext = unknown> {
  value: StateValue
  context: TContext
  config: StateConfig<TContext>
  done: boolean
}

export interface TransitionResult<TContext = unknown> {
  success: boolean
  state: MachineState<TContext>
  error?: string
}
```

### State Machine Class

```typescript
// src/services/state-machine/StateMachine.ts
import { ref, computed, readonly, type Ref } from 'vue'
import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import type {
  MachineConfig,
  MachineState,
  StateValue,
  TransitionConfig,
  TransitionResult,
} from './types'

export class StateMachine<
  TContext extends Record<string, any> = Record<string, any>,
  TEvent extends { type: string } = { type: string }
> {
  private _state: Ref<MachineState<TContext>>
  private config: MachineConfig<TContext, TEvent>
  private isTransitioning = ref(false)

  constructor(config: MachineConfig<TContext, TEvent>) {
    this.config = config

    const initialStateConfig = config.states[config.initial]
    if (!initialStateConfig) {
      throw new Error(`Invalid initial state: ${config.initial}`)
    }

    this._state = ref({
      value: config.initial,
      context: config.context,
      config: initialStateConfig,
      done: initialStateConfig.final ?? false,
    }) as Ref<MachineState<TContext>>

    logger.debug('State machine initialized', {
      id: config.id,
      initial: config.initial,
    })
  }

  /** Current state (readonly) */
  get state(): MachineState<TContext> {
    return this._state.value
  }

  /** Current state value */
  get value(): StateValue {
    return this._state.value.value
  }

  /** Current context */
  get context(): TContext {
    return this._state.value.context
  }

  /** Whether in a final state */
  get done(): boolean {
    return this._state.value.done
  }

  /** Whether a transition is in progress */
  get transitioning(): boolean {
    return this.isTransitioning.value
  }

  /** Get available transitions from current state */
  getAvailableTransitions(): string[] {
    const stateConfig = this.config.states[this.value]
    if (!stateConfig.on) return []
    return Object.keys(stateConfig.on)
  }

  /** Check if a transition is possible */
  canTransition(eventType: string): boolean {
    const stateConfig = this.config.states[this.value]
    if (!stateConfig.on) return false

    const transition = stateConfig.on[eventType]
    if (!transition) return false

    // Check guard if exists
    if (typeof transition === 'object' && transition.guard) {
      return transition.guard(this.context, { type: eventType } as TEvent)
    }

    return true
  }

  /** Attempt to transition */
  async transition(event: TEvent | string): Promise<TransitionResult<TContext>> {
    const eventObj: TEvent = typeof event === 'string'
      ? { type: event } as TEvent
      : event

    const eventType = eventObj.type

    logger.debug('Transition requested', {
      machine: this.config.id,
      from: this.value,
      event: eventType,
    })

    // Check if transition exists
    const stateConfig = this.config.states[this.value]
    if (!stateConfig.on || !stateConfig.on[eventType]) {
      const error = `No transition '${eventType}' from state '${this.value}'`
      logger.warn(error)
      return { success: false, state: this.state, error }
    }

    const transitionConfig = stateConfig.on[eventType]
    const target = typeof transitionConfig === 'string'
      ? transitionConfig
      : transitionConfig.target

    // Check guard
    if (typeof transitionConfig === 'object' && transitionConfig.guard) {
      if (!transitionConfig.guard(this.context, eventObj)) {
        const error = transitionConfig.guardMessage ?? `Guard blocked transition '${eventType}'`
        logger.warn(error)
        return { success: false, state: this.state, error }
      }
    }

    // Check target state exists
    const targetStateConfig = this.config.states[target]
    if (!targetStateConfig) {
      const error = `Invalid target state: ${target}`
      logger.error(error)
      return { success: false, state: this.state, error }
    }

    // Begin transition
    this.isTransitioning.value = true
    const previousState = this.value

    try {
      // Exit actions
      if (stateConfig.onExit) {
        await stateConfig.onExit(this.context)
      }

      // Transition actions
      if (typeof transitionConfig === 'object' && transitionConfig.actions) {
        for (const action of transitionConfig.actions) {
          await action(this.context, eventObj)
        }
      }

      // Update state
      this._state.value = {
        value: target,
        context: this.context,
        config: targetStateConfig,
        done: targetStateConfig.final ?? false,
      }

      // Enter actions
      if (targetStateConfig.onEnter) {
        await targetStateConfig.onEnter(this.context)
      }

      // Emit event
      eventBus.emit('document:status-changed', {
        documentType: this.config.id,
        id: (this.context as any).id ?? 0,
        from: previousState,
        to: target,
      })

      logger.info('Transition completed', {
        machine: this.config.id,
        from: previousState,
        to: target,
        event: eventType,
      })

      return { success: true, state: this.state }
    } catch (error) {
      logger.error('Transition failed', error as Error, {
        machine: this.config.id,
        from: previousState,
        event: eventType,
      })

      return {
        success: false,
        state: this.state,
        error: (error as Error).message,
      }
    } finally {
      this.isTransitioning.value = false
    }
  }

  /** Update context */
  updateContext(updates: Partial<TContext>): void {
    this._state.value = {
      ...this._state.value,
      context: { ...this.context, ...updates },
    }
  }

  /** Get state for visualization */
  toVisualization(): {
    id: string
    states: Array<{ name: string; label: string; final: boolean }>
    transitions: Array<{ from: string; to: string; event: string }>
    currentState: string
  } {
    const states = Object.entries(this.config.states).map(([name, config]) => ({
      name,
      label: config.label,
      final: config.final ?? false,
    }))

    const transitions: Array<{ from: string; to: string; event: string }> = []
    Object.entries(this.config.states).forEach(([stateName, stateConfig]) => {
      if (stateConfig.on) {
        Object.entries(stateConfig.on).forEach(([event, transition]) => {
          const target = typeof transition === 'string' ? transition : transition.target
          transitions.push({ from: stateName, to: target, event })
        })
      }
    })

    return {
      id: this.config.id,
      states,
      transitions,
      currentState: this.value,
    }
  }
}
```

---

## 6.2 Document Workflow Machines

### Quotation Workflow

```typescript
// src/services/state-machine/workflows/quotationMachine.ts
import type { MachineConfig } from '../types'
import { notificationService } from '@/services/notification'
import { logger } from '@/infrastructure/logger'

export interface QuotationContext {
  id: number
  contactId: number
  totalAmount: number
  validUntil: Date | null
  rejectionReason?: string
  convertedInvoiceId?: number
}

export type QuotationEvent =
  | { type: 'SUBMIT' }
  | { type: 'APPROVE' }
  | { type: 'REJECT'; reason: string }
  | { type: 'CONVERT' }
  | { type: 'CANCEL' }
  | { type: 'EXPIRE' }

export const quotationMachineConfig: MachineConfig<QuotationContext, QuotationEvent> = {
  id: 'quotation',
  initial: 'draft',
  context: {
    id: 0,
    contactId: 0,
    totalAmount: 0,
    validUntil: null,
  },

  states: {
    draft: {
      label: 'Draft',
      description: 'Quotation is being prepared',
      on: {
        SUBMIT: {
          target: 'submitted',
          guard: (ctx) => ctx.totalAmount > 0,
          guardMessage: 'Cannot submit quotation with zero amount',
          actions: [
            async (ctx) => {
              logger.info('Quotation submitted', { id: ctx.id })
              await notificationService.success(
                'Quotation Submitted',
                `Quotation #${ctx.id} has been submitted for approval`
              )
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    submitted: {
      label: 'Submitted',
      description: 'Awaiting approval',
      onEnter: async (ctx) => {
        // Could trigger email notification to approver
        logger.debug('Entered submitted state', { id: ctx.id })
      },
      on: {
        APPROVE: {
          target: 'approved',
          actions: [
            async (ctx) => {
              await notificationService.success(
                'Quotation Approved',
                `Quotation #${ctx.id} has been approved`
              )
            },
          ],
        },
        REJECT: {
          target: 'rejected',
          actions: [
            (ctx, event) => {
              if (event.type === 'REJECT') {
                ctx.rejectionReason = event.reason
              }
            },
            async (ctx) => {
              await notificationService.warning(
                'Quotation Rejected',
                `Quotation #${ctx.id} has been rejected`
              )
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    approved: {
      label: 'Approved',
      description: 'Ready for conversion to invoice',
      on: {
        CONVERT: {
          target: 'converted',
          guard: (ctx) => !ctx.validUntil || new Date() <= ctx.validUntil,
          guardMessage: 'Cannot convert expired quotation',
        },
        EXPIRE: {
          target: 'expired',
          guard: (ctx) => ctx.validUntil !== null && new Date() > ctx.validUntil,
        },
        CANCEL: 'cancelled',
      },
    },

    rejected: {
      label: 'Rejected',
      description: 'Quotation was rejected',
      on: {
        // Can be revised (back to draft)
        SUBMIT: {
          target: 'submitted',
          actions: [
            (ctx) => {
              ctx.rejectionReason = undefined
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    converted: {
      label: 'Converted',
      description: 'Converted to invoice',
      final: true,
      onEnter: async (ctx) => {
        await notificationService.success(
          'Quotation Converted',
          `Quotation #${ctx.id} has been converted to invoice`
        )
      },
    },

    expired: {
      label: 'Expired',
      description: 'Past validity date',
      final: true,
    },

    cancelled: {
      label: 'Cancelled',
      description: 'Quotation was cancelled',
      final: true,
    },
  },
}
```

### Invoice Workflow

```typescript
// src/services/state-machine/workflows/invoiceMachine.ts
import type { MachineConfig } from '../types'

export interface InvoiceContext {
  id: number
  contactId: number
  totalAmount: number
  paidAmount: number
  dueDate: Date
}

export type InvoiceEvent =
  | { type: 'SEND' }
  | { type: 'RECORD_PAYMENT'; amount: number }
  | { type: 'MARK_OVERDUE' }
  | { type: 'VOID' }
  | { type: 'CANCEL' }

export const invoiceMachineConfig: MachineConfig<InvoiceContext, InvoiceEvent> = {
  id: 'invoice',
  initial: 'draft',
  context: {
    id: 0,
    contactId: 0,
    totalAmount: 0,
    paidAmount: 0,
    dueDate: new Date(),
  },

  states: {
    draft: {
      label: 'Draft',
      description: 'Invoice is being prepared',
      on: {
        SEND: {
          target: 'sent',
          guard: (ctx) => ctx.totalAmount > 0,
          guardMessage: 'Cannot send invoice with zero amount',
        },
        CANCEL: 'cancelled',
      },
    },

    sent: {
      label: 'Sent',
      description: 'Invoice sent to customer',
      on: {
        RECORD_PAYMENT: [
          {
            target: 'paid',
            guard: (ctx, event) =>
              event.type === 'RECORD_PAYMENT' &&
              ctx.paidAmount + event.amount >= ctx.totalAmount,
            actions: [
              (ctx, event) => {
                if (event.type === 'RECORD_PAYMENT') {
                  ctx.paidAmount += event.amount
                }
              },
            ],
          },
          {
            target: 'partial',
            guard: (ctx, event) =>
              event.type === 'RECORD_PAYMENT' &&
              ctx.paidAmount + event.amount < ctx.totalAmount,
            actions: [
              (ctx, event) => {
                if (event.type === 'RECORD_PAYMENT') {
                  ctx.paidAmount += event.amount
                }
              },
            ],
          },
        ],
        MARK_OVERDUE: {
          target: 'overdue',
          guard: (ctx) => new Date() > ctx.dueDate,
        },
        VOID: 'void',
      },
    },

    partial: {
      label: 'Partial',
      description: 'Partially paid',
      on: {
        RECORD_PAYMENT: [
          {
            target: 'paid',
            guard: (ctx, event) =>
              event.type === 'RECORD_PAYMENT' &&
              ctx.paidAmount + event.amount >= ctx.totalAmount,
            actions: [
              (ctx, event) => {
                if (event.type === 'RECORD_PAYMENT') {
                  ctx.paidAmount += event.amount
                }
              },
            ],
          },
          {
            target: 'partial',
            guard: (ctx, event) =>
              event.type === 'RECORD_PAYMENT' &&
              ctx.paidAmount + event.amount < ctx.totalAmount,
            actions: [
              (ctx, event) => {
                if (event.type === 'RECORD_PAYMENT') {
                  ctx.paidAmount += event.amount
                }
              },
            ],
          },
        ],
        MARK_OVERDUE: {
          target: 'overdue',
          guard: (ctx) => new Date() > ctx.dueDate,
        },
        VOID: 'void',
      },
    },

    overdue: {
      label: 'Overdue',
      description: 'Payment is past due',
      on: {
        RECORD_PAYMENT: [
          {
            target: 'paid',
            guard: (ctx, event) =>
              event.type === 'RECORD_PAYMENT' &&
              ctx.paidAmount + event.amount >= ctx.totalAmount,
          },
          {
            target: 'partial',
            guard: (ctx, event) =>
              event.type === 'RECORD_PAYMENT' &&
              ctx.paidAmount + event.amount < ctx.totalAmount,
          },
        ],
        VOID: 'void',
      },
    },

    paid: {
      label: 'Paid',
      description: 'Fully paid',
      final: true,
    },

    void: {
      label: 'Void',
      description: 'Invoice voided',
      final: true,
    },

    cancelled: {
      label: 'Cancelled',
      description: 'Invoice cancelled',
      final: true,
    },
  },
}
```

---

## 6.3 Vue Integration

### useStateMachine Composable

```typescript
// src/services/state-machine/useStateMachine.ts
import { ref, computed, onUnmounted } from 'vue'
import { StateMachine } from './StateMachine'
import type { MachineConfig, MachineState, TransitionResult } from './types'

export function useStateMachine<
  TContext extends Record<string, any>,
  TEvent extends { type: string }
>(
  config: MachineConfig<TContext, TEvent>,
  initialContext?: Partial<TContext>
) {
  // Create machine with optional initial context
  const machineConfig = initialContext
    ? { ...config, context: { ...config.context, ...initialContext } }
    : config

  const machine = new StateMachine<TContext, TEvent>(machineConfig)

  // Reactive state
  const state = ref<MachineState<TContext>>(machine.state)
  const isTransitioning = ref(false)
  const lastError = ref<string | null>(null)

  // Computed helpers
  const currentState = computed(() => state.value.value)
  const context = computed(() => state.value.context)
  const isDone = computed(() => state.value.done)
  const stateLabel = computed(() => state.value.config.label)
  const stateDescription = computed(() => state.value.config.description)

  const availableTransitions = computed(() => machine.getAvailableTransitions())

  // Transition helper
  async function send(event: TEvent | string): Promise<TransitionResult<TContext>> {
    isTransitioning.value = true
    lastError.value = null

    try {
      const result = await machine.transition(event)
      state.value = result.state

      if (!result.success && result.error) {
        lastError.value = result.error
      }

      return result
    } finally {
      isTransitioning.value = false
    }
  }

  // Check if can transition
  function can(eventType: string): boolean {
    return machine.canTransition(eventType)
  }

  // Update context
  function setContext(updates: Partial<TContext>): void {
    machine.updateContext(updates)
    state.value = machine.state
  }

  // Visualization data
  const visualization = computed(() => machine.toVisualization())

  return {
    // State
    state,
    currentState,
    context,
    isDone,
    stateLabel,
    stateDescription,

    // Transitions
    send,
    can,
    availableTransitions,
    isTransitioning,
    lastError,

    // Context
    setContext,

    // Debug
    visualization,
    machine,
  }
}
```

### WorkflowActions Component

```vue
<!-- src/components/document/WorkflowActions.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui'
import { ConfirmationModal } from '@/components/ui'
import { Loader2 } from 'lucide-vue-next'

interface WorkflowAction {
  event: string
  label: string
  icon?: any
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'outline'
  requiresConfirmation?: boolean
  confirmationTitle?: string
  confirmationMessage?: string
}

interface Props {
  actions: WorkflowAction[]
  canExecute: (event: string) => boolean
  isTransitioning?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isTransitioning: false,
})

const emit = defineEmits<{
  action: [event: string]
}>()

// Filter to only available actions
const availableActions = computed(() =>
  props.actions.filter((action) => props.canExecute(action.event))
)

// Confirmation modal state
const confirmingAction = ref<WorkflowAction | null>(null)

function handleActionClick(action: WorkflowAction) {
  if (action.requiresConfirmation) {
    confirmingAction.value = action
  } else {
    emit('action', action.event)
  }
}

function confirmAction() {
  if (confirmingAction.value) {
    emit('action', confirmingAction.value.event)
    confirmingAction.value = null
  }
}
</script>

<template>
  <div class="flex gap-2">
    <Button
      v-for="action in availableActions"
      :key="action.event"
      :variant="action.variant ?? 'outline'"
      :disabled="isTransitioning"
      @click="handleActionClick(action)"
    >
      <Loader2
        v-if="isTransitioning"
        class="h-4 w-4 mr-2 animate-spin"
      />
      <component
        v-else-if="action.icon"
        :is="action.icon"
        class="h-4 w-4 mr-2"
      />
      {{ action.label }}
    </Button>
  </div>

  <!-- Confirmation Modal -->
  <ConfirmationModal
    :open="!!confirmingAction"
    :title="confirmingAction?.confirmationTitle ?? 'Confirm Action'"
    :message="confirmingAction?.confirmationMessage ?? 'Are you sure?'"
    :variant="confirmingAction?.variant === 'destructive' ? 'destructive' : 'default'"
    :is-loading="isTransitioning"
    @update:open="confirmingAction = null"
    @confirm="confirmAction"
    @cancel="confirmingAction = null"
  />
</template>
```

### Usage Example

```vue
<!-- QuotationDetailPage.vue -->
<script setup lang="ts">
import { useStateMachine } from '@/services/state-machine'
import { quotationMachineConfig } from '@/services/state-machine/workflows/quotationMachine'
import { WorkflowActions } from '@/components/document'
import { Send, Check, X, FileText, Trash2 } from 'lucide-vue-next'

// Initialize state machine with document data
const {
  currentState,
  stateLabel,
  send,
  can,
  isTransitioning,
  lastError,
} = useStateMachine(quotationMachineConfig, {
  id: quotation.value.id,
  contactId: quotation.value.contact_id,
  totalAmount: quotation.value.total,
  validUntil: quotation.value.valid_until,
})

// Define workflow actions
const workflowActions = [
  {
    event: 'SUBMIT',
    label: 'Submit',
    icon: Send,
    variant: 'default',
  },
  {
    event: 'APPROVE',
    label: 'Approve',
    icon: Check,
    variant: 'success',
  },
  {
    event: 'REJECT',
    label: 'Reject',
    icon: X,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationTitle: 'Reject Quotation',
    confirmationMessage: 'Are you sure you want to reject this quotation?',
  },
  {
    event: 'CONVERT',
    label: 'Convert to Invoice',
    icon: FileText,
    variant: 'success',
  },
  {
    event: 'CANCEL',
    label: 'Cancel',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationTitle: 'Cancel Quotation',
    confirmationMessage: 'This action cannot be undone.',
  },
]

async function handleAction(event: string) {
  const result = await send(event)
  if (result.success) {
    // Sync with backend
    await updateQuotationStatus.mutateAsync({
      id: quotation.value.id,
      status: result.state.value,
    })
  }
}
</script>

<template>
  <DocumentDetailLayout>
    <template #actions>
      <WorkflowActions
        :actions="workflowActions"
        :can-execute="can"
        :is-transitioning="isTransitioning"
        @action="handleAction"
      />
    </template>

    <!-- Show error if transition failed -->
    <div v-if="lastError" class="text-destructive text-sm">
      {{ lastError }}
    </div>
  </DocumentDetailLayout>
</template>
```

---

## 6.4 State Visualization

### Mermaid Diagram Generation

```typescript
// src/services/state-machine/visualization.ts
import type { StateMachine } from './StateMachine'

export function generateMermaidDiagram<TContext, TEvent extends { type: string }>(
  machine: StateMachine<TContext, TEvent>
): string {
  const viz = machine.toVisualization()

  const lines: string[] = ['stateDiagram-v2']

  // Add states
  viz.states.forEach((state) => {
    if (state.final) {
      lines.push(`  [*] --> ${state.name} : (final)`)
    }
    lines.push(`  ${state.name} : ${state.label}`)
  })

  // Add transitions
  viz.transitions.forEach((t) => {
    lines.push(`  ${t.from} --> ${t.to} : ${t.event}`)
  })

  // Highlight current state
  lines.push(`  state ${viz.currentState} #highlight`)

  return lines.join('\n')
}
```

---

## 6.5 File Structure

```
src/services/state-machine/
├── index.ts
├── types.ts
├── StateMachine.ts
├── useStateMachine.ts
├── visualization.ts
├── workflows/
│   ├── quotationMachine.ts
│   ├── invoiceMachine.ts
│   ├── purchaseOrderMachine.ts
│   ├── billMachine.ts
│   └── workOrderMachine.ts
└── __tests__/
    ├── StateMachine.test.ts
    └── workflows.test.ts
```

---

## 6.6 Benefits

| Benefit | Description |
|---------|-------------|
| **Clarity** | States and transitions are explicitly defined |
| **Safety** | Guards prevent invalid transitions |
| **Traceability** | All transitions are logged |
| **Testability** | State machines are pure functions |
| **Visualization** | Can generate diagrams from code |
| **Consistency** | Same workflow logic across frontend and backend |

---

## Checklist

- [ ] StateMachine core class
- [ ] useStateMachine composable
- [ ] Quotation workflow machine
- [ ] Invoice workflow machine
- [ ] Purchase order workflow machine
- [ ] WorkflowActions component
- [ ] Mermaid diagram generation
- [ ] Unit tests for state machines
- [ ] Integration with API mutations

---

## Next Phase

Once Phase 6 is complete, proceed to [Phase 7: Testing Infrastructure](./07-PHASE-TESTING.md) for comprehensive test coverage.
