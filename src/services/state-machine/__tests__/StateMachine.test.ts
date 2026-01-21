/**
 * StateMachine Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StateMachine } from '../StateMachine'
import type { MachineConfig } from '../types'

interface TestContext extends Record<string, unknown> {
  id: number
  count: number
  message?: string
}

type TestEvent =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_MESSAGE'; message: string }
  | { type: 'COMPLETE' }
  | { type: 'CANCEL' }

const testMachineConfig: MachineConfig<TestContext, TestEvent> = {
  id: 'test',
  initial: 'idle',
  context: {
    id: 1,
    count: 0,
  },
  states: {
    idle: {
      label: 'Idle',
      description: 'Initial state',
      on: {
        INCREMENT: {
          target: 'active',
          actions: [(ctx) => { ctx.count += 1 }],
        },
        COMPLETE: 'done',
        CANCEL: 'cancelled',
      },
    },
    active: {
      label: 'Active',
      description: 'Processing',
      on: {
        INCREMENT: {
          target: 'active',
          actions: [(ctx) => { ctx.count += 1 }],
        },
        DECREMENT: {
          target: 'active',
          guard: (ctx) => ctx.count > 0,
          guardMessage: 'Count cannot go below zero',
          actions: [(ctx) => { ctx.count -= 1 }],
        },
        SET_MESSAGE: {
          target: 'active',
          actions: [(ctx, event) => {
            if (event.type === 'SET_MESSAGE') {
              ctx.message = event.message
            }
          }],
        },
        COMPLETE: {
          target: 'done',
          guard: (ctx) => ctx.count >= 5,
          guardMessage: 'Count must be at least 5 to complete',
        },
        CANCEL: 'cancelled',
      },
    },
    done: {
      label: 'Done',
      description: 'Completed',
      final: true,
    },
    cancelled: {
      label: 'Cancelled',
      description: 'Cancelled by user',
      final: true,
    },
  },
}

describe('StateMachine', () => {
  let machine: StateMachine<TestContext, TestEvent>

  beforeEach(() => {
    machine = new StateMachine<TestContext, TestEvent>(testMachineConfig)
  })

  describe('initialization', () => {
    it('should initialize with initial state', () => {
      expect(machine.value).toBe('idle')
      expect(machine.done).toBe(false)
    })

    it('should initialize with default context', () => {
      expect(machine.context.id).toBe(1)
      expect(machine.context.count).toBe(0)
    })

    it('should throw for invalid initial state', () => {
      const invalidConfig = {
        ...testMachineConfig,
        initial: 'nonexistent',
      }
      expect(() => new StateMachine(invalidConfig)).toThrow('Invalid initial state')
    })
  })

  describe('transitions', () => {
    it('should transition to target state', async () => {
      const result = await machine.transition('INCREMENT')

      expect(result.success).toBe(true)
      expect(machine.value).toBe('active')
    })

    it('should execute actions during transition', async () => {
      await machine.transition('INCREMENT')

      expect(machine.context.count).toBe(1)
    })

    it('should handle event objects', async () => {
      await machine.transition('INCREMENT')
      await machine.transition({ type: 'SET_MESSAGE', message: 'Hello' })

      expect(machine.context.message).toBe('Hello')
    })

    it('should fail for non-existent transition', async () => {
      const result = await machine.transition('DECREMENT')

      expect(result.success).toBe(false)
      expect(result.error).toContain("No transition 'DECREMENT'")
      expect(machine.value).toBe('idle')
    })
  })

  describe('guards', () => {
    it('should allow transition when guard passes', async () => {
      await machine.transition('INCREMENT')
      expect(machine.context.count).toBe(1)

      const result = await machine.transition('DECREMENT')
      expect(result.success).toBe(true)
      expect(machine.context.count).toBe(0)
    })

    it('should block transition when guard fails', async () => {
      await machine.transition('INCREMENT')
      expect(machine.context.count).toBe(1)

      await machine.transition('DECREMENT')
      expect(machine.context.count).toBe(0)

      // Try to decrement below zero
      const result = await machine.transition('DECREMENT')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Count cannot go below zero')
    })

    it('should block COMPLETE when count < 5', async () => {
      await machine.transition('INCREMENT')
      const result = await machine.transition('COMPLETE')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Count must be at least 5 to complete')
    })

    it('should allow COMPLETE when count >= 5', async () => {
      // Increment 5 times
      for (let i = 0; i < 5; i++) {
        await machine.transition('INCREMENT')
      }

      const result = await machine.transition('COMPLETE')

      expect(result.success).toBe(true)
      expect(machine.value).toBe('done')
    })
  })

  describe('final states', () => {
    it('should mark done when in final state', async () => {
      await machine.transition('COMPLETE')

      expect(machine.done).toBe(true)
    })

    it('should have no transitions from final state', async () => {
      await machine.transition('CANCEL')

      expect(machine.done).toBe(true)
      expect(machine.getAvailableTransitions()).toHaveLength(0)
    })
  })

  describe('canTransition', () => {
    it('should return true for available transitions', () => {
      expect(machine.canTransition('INCREMENT')).toBe(true)
      expect(machine.canTransition('COMPLETE')).toBe(true)
    })

    it('should return false for unavailable transitions', () => {
      expect(machine.canTransition('DECREMENT')).toBe(false)
    })

    it('should check guards', async () => {
      await machine.transition('INCREMENT')

      expect(machine.canTransition('COMPLETE')).toBe(false)

      // Add more increments
      for (let i = 0; i < 4; i++) {
        await machine.transition('INCREMENT')
      }

      expect(machine.canTransition('COMPLETE')).toBe(true)
    })
  })

  describe('getAvailableTransitions', () => {
    it('should return available event types', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('INCREMENT')
      expect(transitions).toContain('COMPLETE')
      expect(transitions).toContain('CANCEL')
    })

    it('should reflect current state', async () => {
      await machine.transition('INCREMENT')
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('INCREMENT')
      expect(transitions).toContain('DECREMENT')
      expect(transitions).toContain('SET_MESSAGE')
      expect(transitions).toContain('COMPLETE')
    })
  })

  describe('updateContext', () => {
    it('should update context without transition', () => {
      machine.updateContext({ count: 10 })

      expect(machine.context.count).toBe(10)
      expect(machine.value).toBe('idle')
    })
  })

  describe('reset', () => {
    it('should reset to initial state', async () => {
      await machine.transition('INCREMENT')
      await machine.transition('INCREMENT')

      machine.reset()

      expect(machine.value).toBe('idle')
      expect(machine.context.count).toBe(0)
    })

    it('should accept new context on reset', async () => {
      await machine.transition('INCREMENT')

      machine.reset({ count: 100 })

      expect(machine.value).toBe('idle')
      expect(machine.context.count).toBe(100)
    })
  })

  describe('visualization', () => {
    it('should generate visualization data', () => {
      const viz = machine.toVisualization()

      expect(viz.id).toBe('test')
      expect(viz.currentState).toBe('idle')
      expect(viz.states).toHaveLength(4)
      expect(viz.transitions.length).toBeGreaterThan(0)
    })

    it('should include all states', () => {
      const viz = machine.toVisualization()
      const stateNames = viz.states.map((s) => s.name)

      expect(stateNames).toContain('idle')
      expect(stateNames).toContain('active')
      expect(stateNames).toContain('done')
      expect(stateNames).toContain('cancelled')
    })

    it('should mark final states', () => {
      const viz = machine.toVisualization()
      const doneState = viz.states.find((s) => s.name === 'done')

      expect(doneState?.final).toBe(true)
    })
  })

  describe('lifecycle hooks', () => {
    it('should call onEnter when entering state', async () => {
      const onEnter = vi.fn()
      const activeState = testMachineConfig.states.active!
      const configWithHooks: MachineConfig<TestContext, TestEvent> = {
        ...testMachineConfig,
        states: {
          ...testMachineConfig.states,
          active: {
            label: activeState.label,
            description: activeState.description,
            on: activeState.on,
            onEnter,
          },
        },
      }

      const hookMachine = new StateMachine<TestContext, TestEvent>(configWithHooks)
      await hookMachine.transition('INCREMENT')

      expect(onEnter).toHaveBeenCalledTimes(1)
    })

    it('should call onExit when leaving state', async () => {
      const onExit = vi.fn()
      const idleState = testMachineConfig.states.idle!
      const configWithHooks: MachineConfig<TestContext, TestEvent> = {
        ...testMachineConfig,
        states: {
          ...testMachineConfig.states,
          idle: {
            label: idleState.label,
            description: idleState.description,
            on: idleState.on,
            onExit,
          },
        },
      }

      const hookMachine = new StateMachine<TestContext, TestEvent>(configWithHooks)
      await hookMachine.transition('INCREMENT')

      expect(onExit).toHaveBeenCalledTimes(1)
    })
  })
})
