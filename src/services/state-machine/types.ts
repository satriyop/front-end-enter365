/**
 * State Machine Types
 *
 * Core types for the lightweight state machine implementation.
 * Provides typed workflow states, transitions, guards, and actions.
 */

export type StateValue = string

/**
 * Configuration for a single state
 */
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

/**
 * Configuration for a state transition
 */
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

/**
 * State definition with transitions
 */
export interface StateDefinition<TContext = unknown, TEvent = unknown>
  extends StateConfig<TContext> {
  on?: Record<string, TransitionConfig<TContext, TEvent> | StateValue>
}

/**
 * Complete state machine configuration
 */
export interface MachineConfig<
  TContext = unknown,
  TEvent extends { type: string } = { type: string },
> {
  /** Machine identifier */
  id: string
  /** Initial state */
  initial: StateValue
  /** Initial context (extended state) */
  context: TContext
  /** State definitions */
  states: Record<StateValue, StateDefinition<TContext, TEvent>>
}

/**
 * Current state of a machine
 */
export interface MachineState<TContext = unknown> {
  /** Current state value */
  value: StateValue
  /** Current context */
  context: TContext
  /** Current state configuration */
  config: StateConfig<TContext>
  /** Whether in a final state */
  done: boolean
}

/**
 * Result of a transition attempt
 */
export interface TransitionResult<TContext = unknown> {
  /** Whether transition succeeded */
  success: boolean
  /** New state after transition */
  state: MachineState<TContext>
  /** Error message if transition failed */
  error?: string
}

/**
 * Visualization data for state machine
 */
export interface MachineVisualization {
  id: string
  states: Array<{ name: string; label: string; final: boolean }>
  transitions: Array<{ from: string; to: string; event: string }>
  currentState: string
}
