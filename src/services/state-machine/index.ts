/**
 * State Machine Service
 *
 * Lightweight state machine implementation for document workflows.
 * Provides typed states, guarded transitions, and Vue integration.
 */

// Types
export * from './types'

// Core
export { StateMachine } from './StateMachine'

// Vue Composable
export { useStateMachine, type UseStateMachineReturn } from './useStateMachine'

// Visualization
export {
  generateMermaidDiagram,
  machineToMermaid,
  generateAsciiDiagram,
  toGraph,
} from './visualization'

// Workflow Machines
export * from './workflows'
