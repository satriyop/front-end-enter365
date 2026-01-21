/**
 * useStateMachine Composable
 *
 * Vue composable for reactive state machine integration.
 * Provides reactive state, computed helpers, and transition methods.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { StateMachine } from './StateMachine'
import type {
  MachineConfig,
  MachineState,
  MachineVisualization,
  TransitionResult,
} from './types'

export interface UseStateMachineReturn<
  TContext extends Record<string, unknown>,
  TEvent extends { type: string },
> {
  // State
  state: Ref<MachineState<TContext>>
  currentState: ComputedRef<string>
  context: ComputedRef<TContext>
  isDone: ComputedRef<boolean>
  stateLabel: ComputedRef<string>
  stateDescription: ComputedRef<string | undefined>

  // Transitions
  send: (event: TEvent | string) => Promise<TransitionResult<TContext>>
  can: (eventType: string) => boolean
  availableTransitions: ComputedRef<string[]>
  isTransitioning: Ref<boolean>
  lastError: Ref<string | null>

  // Context
  setContext: (updates: Partial<TContext>) => void
  reset: (newContext?: Partial<TContext>) => void

  // Debug
  visualization: ComputedRef<MachineVisualization>
  machine: StateMachine<TContext, TEvent>
}

export function useStateMachine<
  TContext extends Record<string, unknown>,
  TEvent extends { type: string } = { type: string },
>(
  config: MachineConfig<TContext, TEvent>,
  initialContext?: Partial<TContext>
): UseStateMachineReturn<TContext, TEvent> {
  // Create machine with optional initial context override
  const machineConfig = initialContext
    ? { ...config, context: { ...config.context, ...initialContext } }
    : config

  const machine = new StateMachine<TContext, TEvent>(machineConfig)

  // Reactive state
  const state = ref<MachineState<TContext>>(machine.state) as Ref<
    MachineState<TContext>
  >
  const isTransitioning = ref(false)
  const lastError = ref<string | null>(null)

  // Computed helpers
  const currentState = computed(() => state.value.value)
  const context = computed(() => state.value.context)
  const isDone = computed(() => state.value.done)
  const stateLabel = computed(() => state.value.config.label)
  const stateDescription = computed(() => state.value.config.description)

  const availableTransitions = computed(() => {
    // Re-check available transitions based on current state
    return machine.getAvailableTransitions()
  })

  /**
   * Send an event to transition the machine
   */
  async function send(
    event: TEvent | string
  ): Promise<TransitionResult<TContext>> {
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

  /**
   * Check if a transition is possible
   */
  function can(eventType: string): boolean {
    return machine.canTransition(eventType)
  }

  /**
   * Update context
   */
  function setContext(updates: Partial<TContext>): void {
    machine.updateContext(updates)
    state.value = machine.state
  }

  /**
   * Reset machine to initial state
   */
  function reset(newContext?: Partial<TContext>): void {
    machine.reset(newContext)
    state.value = machine.state
    lastError.value = null
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
    reset,

    // Debug
    visualization,
    machine,
  }
}
