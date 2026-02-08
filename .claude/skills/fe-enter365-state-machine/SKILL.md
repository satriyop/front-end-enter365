# Enter365 State Machine

## Overview

State machines manage document workflows with formal state transitions, guards, and actions.

Location: `src/services/state-machine/` (core engine) + `src/composables/useDocumentWorkflow/workflows/` (workflow definitions)

## Core Concepts

### State Machine Definition
```typescript
interface StateMachineDefinition<TState, TEvent, TContext> {
  id: string
  initial: TState
  context: TContext
  states: Record<TState, StateNode<TState, TEvent, TContext>>
}

interface StateNode<TState, TEvent, TContext> {
  on?: Record<TEvent, Transition<TState, TContext>>
  entry?: Action<TContext>[]
  exit?: Action<TContext>[]
}

interface Transition<TState, TContext> {
  target: TState
  guard?: (context: TContext) => boolean
  actions?: Action<TContext>[]
}
```

## Available Workflows (6)

### State Machine Definitions (3 - in `src/services/state-machine/workflows/`)

| Machine | Exports |
|---------|---------|
| `quotationMachineConfig` | `createQuotationMachine`, `QuotationContext`, `QuotationEvent` |
| `invoiceMachineConfig` | `createInvoiceMachine`, `getPaymentTargetState`, `InvoiceContext`, `InvoiceEvent` |
| `purchaseOrderMachineConfig` | `createPurchaseOrderMachine`, `PurchaseOrderContext`, `PurchaseOrderEvent` |

### Workflow Composables (6 - in `src/composables/useDocumentWorkflow/workflows/`)

| Workflow | File |
|----------|------|
| `quotationWorkflow` | `quotationWorkflow.ts` |
| `invoiceWorkflow` | `invoiceWorkflow.ts` |
| `billWorkflow` | `billWorkflow.ts` |
| `purchaseOrderWorkflow` | `purchaseOrderWorkflow.ts` |
| `workOrderWorkflow` | `workOrderWorkflow.ts` |
| `solarProposalWorkflow` | `solarProposalWorkflow.ts` |

## Workflow Diagrams

### Quotation Workflow
```
         ┌──────────────────────────────────────┐
         │                                      │
         ▼                                      │
      ┌──────┐  SUBMIT   ┌─────────┐  APPROVE  ┌──────────┐
      │ draft │─────────▶│ pending │──────────▶│ approved │
      └──────┘           └─────────┘           └──────────┘
                              │                     │
                              │ REJECT              │ CONVERT
                              ▼                     ▼
                         ┌──────────┐         ┌───────────┐
                         │ rejected │         │ converted │
                         └──────────┘         └───────────┘
```

### Invoice Workflow
```
      ┌──────┐  SEND   ┌──────┐  RECORD_PAYMENT  ┌──────┐
      │ draft │───────▶│ sent │─────────────────▶│ paid │
      └──────┘         └──────┘                  └──────┘
                          │
                          │ MARK_OVERDUE
                          ▼
                      ┌─────────┐
                      │ overdue │──────────▶ paid
                      └─────────┘
```

### Bill Workflow
```
      ┌──────┐  SUBMIT   ┌─────────┐  APPROVE  ┌──────────┐  PAY  ┌──────┐
      │ draft │─────────▶│ pending │──────────▶│ approved │──────▶│ paid │
      └──────┘           └─────────┘           └──────────┘       └──────┘
```

### Purchase Order Workflow
```
      ┌──────┐  SEND   ┌──────┐  RECEIVE_PARTIAL  ┌─────────┐
      │ draft │───────▶│ sent │──────────────────▶│ partial │
      └──────┘         └──────┘                   └─────────┘
                          │                            │
                          │ RECEIVE_ALL                │ RECEIVE_REST
                          ▼                            ▼
                      ┌──────────┐               ┌──────────┐
                      │ received │◀──────────────│ received │
                      └──────────┘               └──────────┘
```

### Work Order Workflow
```
      ┌──────┐  START   ┌─────────────┐  COMPLETE  ┌───────────┐
      │ draft │────────▶│ in_progress │───────────▶│ completed │
      └──────┘          └─────────────┘            └───────────┘
           │                   │
           │ CANCEL            │ CANCEL
           ▼                   ▼
      ┌───────────┐      ┌───────────┐
      │ cancelled │      │ cancelled │
      └───────────┘      └───────────┘
```

### Solar Proposal Workflow
```
      ┌──────┐  SUBMIT  ┌───────────┐  REVIEW  ┌────────┐
      │ draft │─────────▶│ submitted │─────────▶│ review │
      └──────┘           └───────────┘          └────────┘
                                                     │
                                          ┌──────────┼──────────┐
                                          │ APPROVE  │          │ REJECT
                                          ▼          │          ▼
                                     ┌──────────┐   │     ┌──────────┐
                                     │ approved │   │     │ rejected │
                                     └──────────┘   │     └──────────┘
```

## Usage

### Basic Usage
```typescript
import { StateMachine } from '@/services/state-machine'
import { quotationMachineConfig } from '@/services/state-machine/workflows'

const machine = new StateMachine(quotationMachineConfig)

console.log(machine.currentState) // 'draft'

if (machine.can('SUBMIT')) {
  machine.send('SUBMIT')
}

const available = machine.getAvailableTransitions()
// ['SUBMIT']
```

### With Context
```typescript
import { createQuotationMachine } from '@/services/state-machine/workflows'

const machine = createQuotationMachine({
  documentId: 123,
  userId: 456,
  totalAmount: 1000000,
})

// Guards can access context
// e.g., auto-approve under 10M
```

### With Actions
```typescript
const machineWithActions = {
  states: {
    draft: {
      on: {
        SUBMIT: {
          target: 'pending',
          actions: [
            (ctx) => eventBus.emit('document:status-changed', {
              documentType: 'quotation',
              id: ctx.documentId,
              from: 'draft',
              to: 'pending',
            }),
          ],
        },
      },
    },
    pending: {
      entry: [(ctx) => console.log('Entered pending state')],
      exit: [(ctx) => console.log('Exiting pending state')],
    },
  },
}
```

### Vue Composable (Low-level)
```typescript
import { useStateMachine } from '@/services/state-machine'

const {
  currentState,
  context,
  can,
  send,
  availableTransitions,
  history,
} = useStateMachine(quotationMachineConfig, {
  documentId: props.id,
})

watch(currentState, (newState) => {
  console.log('State changed to:', newState)
})
```

### Document Workflow Composable (High-level)
```typescript
import { useDocumentWorkflow } from '@/composables'

const {
  currentState,
  canTransition,
  availableTransitions,
  transition,
  isTransitioning,
} = useDocumentWorkflow({
  workflow: 'quotation',  // or 'invoice', 'bill', 'purchaseOrder', 'workOrder', 'solarProposal'
  initialState: quotation.value?.status ?? 'draft',
  context: { documentId: id },
  onTransition: async (from, to, context) => {
    await updateStatus.mutateAsync({
      id: context.documentId,
      status: to,
    })
  },
})
```

### Invoice Special: Payment Target State
```typescript
import { getPaymentTargetState } from '@/services/state-machine/workflows'

// Determines whether payment makes invoice 'paid' or stays 'sent'
const targetState = getPaymentTargetState(invoiceContext)
```

## Creating a New Workflow

### 1. Define States and Events
```typescript
// src/services/state-machine/workflows/myWorkflow.ts
export type MyState = 'draft' | 'active' | 'completed' | 'cancelled'
export type MyEvent = 'ACTIVATE' | 'COMPLETE' | 'CANCEL'

export interface MyContext {
  documentId: number
  userId: number
}
```

### 2. Define the Machine
```typescript
export const myWorkflowMachineConfig: StateMachineDefinition<MyState, MyEvent, MyContext> = {
  id: 'my-workflow',
  initial: 'draft',
  context: { documentId: 0, userId: 0 },
  states: {
    draft: {
      on: {
        ACTIVATE: { target: 'active' },
        CANCEL: { target: 'cancelled' },
      },
    },
    active: {
      on: {
        COMPLETE: { target: 'completed' },
        CANCEL: { target: 'cancelled' },
      },
      entry: [(ctx) => console.log('Workflow activated')],
    },
    completed: {},
    cancelled: {},
  },
}
```

### 3. Export from Index
```typescript
// src/services/state-machine/workflows/index.ts
export { myWorkflowMachineConfig } from './myWorkflow'
```

### 4. Create Workflow Composable (optional)
```typescript
// src/composables/useDocumentWorkflow/workflows/myWorkflow.ts
import { myWorkflowMachineConfig } from '@/services/state-machine/workflows'

export const myWorkflow = {
  machine: myWorkflowMachineConfig,
  // ... workflow-specific config
}
```

### 5. Register in Workflow Index
```typescript
// src/composables/useDocumentWorkflow/workflows/index.ts
export { myWorkflow } from './myWorkflow'
```

## State Visualization

```typescript
import { visualizeStateMachine } from '@/services/state-machine'

const mermaid = visualizeStateMachine(quotationMachineConfig)
// Returns Mermaid diagram syntax
```

## Best Practices

1. **Explicit States**: Define all possible states upfront
2. **Guard Conditions**: Use guards for conditional transitions
3. **Entry/Exit Actions**: Use for side effects on state changes
4. **Event Bus Integration**: Emit events on significant transitions
5. **Backend Sync**: Always persist state changes to backend
6. **Error Handling**: Handle transition failures gracefully
