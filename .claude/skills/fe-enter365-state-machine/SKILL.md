# Enter365 State Machine

## Overview

State machines manage document workflows with formal state transitions, guards, and actions.

Location: `src/services/state-machine/`

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

## Available Workflows

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

States: `draft` → `pending` → `approved` | `rejected` → `converted`

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

States: `draft` → `sent` → `paid` | `overdue` → `paid`

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

States: `draft` → `sent` → `partial` | `received`

## Usage

### Basic Usage
```typescript
import { StateMachine } from '@/services/state-machine'
import { quotationMachine } from '@/services/state-machine/workflows'

// Create instance
const machine = new StateMachine(quotationMachine)

// Check current state
console.log(machine.currentState) // 'draft'

// Check if transition is allowed
if (machine.can('SUBMIT')) {
  machine.send('SUBMIT')
}

// Get available transitions
const available = machine.getAvailableTransitions()
// ['SUBMIT']
```

### With Context
```typescript
const machine = new StateMachine({
  ...quotationMachine,
  context: {
    documentId: 123,
    userId: 456,
    totalAmount: 1000000,
  },
})

// Guards can access context
const machineWithGuard = {
  states: {
    pending: {
      on: {
        APPROVE: {
          target: 'approved',
          guard: (ctx) => ctx.totalAmount < 10000000, // Only auto-approve under 10M
        },
      },
    },
  },
}
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
            (ctx) => console.log('Submitting...'),
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

### Vue Composable
```typescript
import { useStateMachine } from '@/services/state-machine'
import { quotationMachine } from '@/services/state-machine/workflows'

const {
  currentState,
  context,
  can,
  send,
  availableTransitions,
  history,
} = useStateMachine(quotationMachine, {
  documentId: props.id,
})

// Reactive state
watch(currentState, (newState) => {
  console.log('State changed to:', newState)
})

// In template
<Button
  v-for="event in availableTransitions"
  :key="event"
  @click="send(event)"
>
  {{ event }}
</Button>
```

### Document Workflow Composable
```typescript
import { useDocumentWorkflow } from '@/composables'

const {
  currentState,
  canTransition,
  availableTransitions,
  transition,
  isTransitioning,
} = useDocumentWorkflow({
  workflow: 'quotation',
  initialState: quotation.value?.status ?? 'draft',
  context: { documentId: id },
  onTransition: async (from, to, context) => {
    // Persist to backend
    await updateStatus.mutateAsync({
      id: context.documentId,
      status: to,
    })
  },
})
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
import type { StateMachineDefinition } from '../types'

export const myWorkflowMachine: StateMachineDefinition<MyState, MyEvent, MyContext> = {
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
    completed: {
      // Terminal state - no transitions
    },
    cancelled: {
      // Terminal state
    },
  },
}
```

### 3. Export from Index
```typescript
// src/services/state-machine/workflows/index.ts
export { myWorkflowMachine } from './myWorkflow'
export type { MyState, MyEvent, MyContext } from './myWorkflow'
```

### 4. Register in Document Workflow (Optional)
```typescript
// src/composables/useDocumentWorkflow/workflows/index.ts
import { myWorkflowMachine } from '@/services/state-machine/workflows'

export const workflows = {
  quotation: quotationMachine,
  invoice: invoiceMachine,
  myDocument: myWorkflowMachine,  // Add here
}
```

## State Visualization

```typescript
import { visualizeStateMachine } from '@/services/state-machine'

const mermaid = visualizeStateMachine(quotationMachine)
// Returns Mermaid diagram syntax:
// stateDiagram-v2
//   [*] --> draft
//   draft --> pending: SUBMIT
//   pending --> approved: APPROVE
//   pending --> rejected: REJECT
//   approved --> converted: CONVERT
```

## Best Practices

1. **Explicit States**: Define all possible states upfront
2. **Guard Conditions**: Use guards for conditional transitions
3. **Entry/Exit Actions**: Use for side effects on state changes
4. **Event Bus Integration**: Emit events on significant transitions
5. **Backend Sync**: Always persist state changes to backend
6. **Error Handling**: Handle transition failures gracefully
