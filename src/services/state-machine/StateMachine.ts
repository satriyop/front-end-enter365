/**
 * StateMachine
 *
 * Lightweight state machine implementation for document workflows.
 * Provides typed states, guarded transitions, and action hooks.
 */

import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import type {
  MachineConfig,
  MachineState,
  MachineVisualization,
  StateValue,
  TransitionResult,
} from './types'

export class StateMachine<
  TContext extends Record<string, unknown> = Record<string, unknown>,
  TEvent extends { type: string } = { type: string },
> {
  private _state: MachineState<TContext>
  private _isTransitioning = false
  private config: MachineConfig<TContext, TEvent>

  constructor(config: MachineConfig<TContext, TEvent>) {
    this.config = config

    const initialStateConfig = config.states[config.initial]
    if (!initialStateConfig) {
      throw new Error(`Invalid initial state: ${config.initial}`)
    }

    this._state = {
      value: config.initial,
      context: { ...config.context },
      config: initialStateConfig,
      done: initialStateConfig.final ?? false,
    }

    logger.debug('State machine initialized', {
      id: config.id,
      initial: config.initial,
    })
  }

  /** Current state (readonly) */
  get state(): MachineState<TContext> {
    return this._state
  }

  /** Current state value */
  get value(): StateValue {
    return this._state.value
  }

  /** Current context */
  get context(): TContext {
    return this._state.context
  }

  /** Whether in a final state */
  get done(): boolean {
    return this._state.done
  }

  /** Whether a transition is in progress */
  get isTransitioning(): boolean {
    return this._isTransitioning
  }

  /** Machine ID */
  get id(): string {
    return this.config.id
  }

  /**
   * Get available transitions from current state
   */
  getAvailableTransitions(): string[] {
    const stateConfig = this.config.states[this.value]
    if (!stateConfig?.on) return []
    return Object.keys(stateConfig.on)
  }

  /**
   * Check if a transition is possible (exists and guard passes)
   */
  canTransition(eventType: string): boolean {
    const stateConfig = this.config.states[this.value]
    if (!stateConfig?.on) return false

    const transition = stateConfig.on[eventType]
    if (!transition) return false

    // Check guard if exists
    if (typeof transition === 'object' && transition.guard) {
      return transition.guard(this.context, { type: eventType } as TEvent)
    }

    return true
  }

  /**
   * Attempt to transition to a new state
   */
  async transition(event: TEvent | string): Promise<TransitionResult<TContext>> {
    const eventObj: TEvent =
      typeof event === 'string' ? ({ type: event } as TEvent) : event

    const eventType = eventObj.type

    logger.debug('Transition requested', {
      machine: this.config.id,
      from: this.value,
      event: eventType,
    })

    // Check if transition exists
    const stateConfig = this.config.states[this.value]
    if (!stateConfig?.on || !stateConfig.on[eventType]) {
      const error = `No transition '${eventType}' from state '${this.value}'`
      logger.warn(error, { machine: this.config.id })
      return { success: false, state: this.state, error }
    }

    const transitionConfig = stateConfig.on[eventType]
    const target =
      typeof transitionConfig === 'string'
        ? transitionConfig
        : transitionConfig.target

    // Check guard
    if (typeof transitionConfig === 'object' && transitionConfig.guard) {
      if (!transitionConfig.guard(this.context, eventObj)) {
        const error =
          transitionConfig.guardMessage ??
          `Guard blocked transition '${eventType}'`
        logger.warn(error, { machine: this.config.id })
        return { success: false, state: this.state, error }
      }
    }

    // Check target state exists
    const targetStateConfig = this.config.states[target]
    if (!targetStateConfig) {
      const error = `Invalid target state: ${target}`
      logger.error(error, new Error(error), { machine: this.config.id })
      return { success: false, state: this.state, error }
    }

    // Begin transition
    this._isTransitioning = true
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
      this._state = {
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
      const contextId = (this.context as Record<string, unknown>).id
      eventBus.emit('document:status-changed', {
        documentType: this.config.id,
        id: typeof contextId === 'number' ? contextId : 0,
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
      this._isTransitioning = false
    }
  }

  /**
   * Update context without transitioning
   */
  updateContext(updates: Partial<TContext>): void {
    this._state = {
      ...this._state,
      context: { ...this.context, ...updates },
    }
  }

  /**
   * Reset machine to initial state
   */
  reset(newContext?: Partial<TContext>): void {
    const initialStateConfig = this.config.states[this.config.initial]
    this._state = {
      value: this.config.initial,
      context: { ...this.config.context, ...newContext },
      config: initialStateConfig!,
      done: initialStateConfig?.final ?? false,
    }
  }

  /**
   * Get visualization data for diagram generation
   */
  toVisualization(): MachineVisualization {
    const states = Object.entries(this.config.states).map(([name, config]) => ({
      name,
      label: config.label,
      final: config.final ?? false,
    }))

    const transitions: Array<{ from: string; to: string; event: string }> = []
    Object.entries(this.config.states).forEach(([stateName, stateConfig]) => {
      if (stateConfig.on) {
        Object.entries(stateConfig.on).forEach(([event, transition]) => {
          const target =
            typeof transition === 'string' ? transition : transition.target
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
