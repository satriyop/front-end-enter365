/**
 * State Machine Visualization Utilities
 *
 * Generates diagrams and visual representations of state machines.
 */

import type { MachineVisualization } from './types'
import type { StateMachine } from './StateMachine'

/**
 * Generate a Mermaid state diagram from machine visualization data
 */
export function generateMermaidDiagram(viz: MachineVisualization): string {
  const lines: string[] = ['stateDiagram-v2']

  // Add state descriptions
  viz.states.forEach((state) => {
    lines.push(`    ${state.name} : ${state.label}`)
  })

  // Add initial state marker
  const initialState = viz.states[0]?.name
  if (initialState) {
    lines.push(`    [*] --> ${initialState}`)
  }

  // Add transitions
  viz.transitions.forEach((t) => {
    lines.push(`    ${t.from} --> ${t.to} : ${t.event}`)
  })

  // Mark final states
  viz.states
    .filter((s) => s.final)
    .forEach((state) => {
      lines.push(`    ${state.name} --> [*]`)
    })

  // Highlight current state (note: requires mermaid styling)
  lines.push('')
  lines.push(`    classDef current fill:#f97316,color:#fff`)
  lines.push(`    class ${viz.currentState} current`)

  return lines.join('\n')
}

/**
 * Generate a Mermaid diagram from a StateMachine instance
 */
export function machineToMermaid<TContext extends Record<string, unknown>>(
  machine: StateMachine<TContext>
): string {
  return generateMermaidDiagram(machine.toVisualization())
}

/**
 * Generate ASCII art representation of state machine
 * Useful for debugging and logging
 */
export function generateAsciiDiagram(viz: MachineVisualization): string {
  const lines: string[] = []

  lines.push(`State Machine: ${viz.id}`)
  lines.push('='.repeat(40))
  lines.push('')

  // States
  lines.push('States:')
  viz.states.forEach((state) => {
    const marker =
      state.name === viz.currentState
        ? '→'
        : state.final
          ? '◉'
          : '○'
    lines.push(`  ${marker} ${state.name} (${state.label})`)
  })
  lines.push('')

  // Transitions
  lines.push('Transitions:')
  viz.transitions.forEach((t) => {
    lines.push(`  ${t.from} --[${t.event}]--> ${t.to}`)
  })

  return lines.join('\n')
}

/**
 * Generate a simple graph object for custom visualization
 */
export function toGraph(viz: MachineVisualization): {
  nodes: Array<{
    id: string
    label: string
    final: boolean
    current: boolean
  }>
  edges: Array<{
    from: string
    to: string
    label: string
  }>
} {
  return {
    nodes: viz.states.map((state) => ({
      id: state.name,
      label: state.label,
      final: state.final,
      current: state.name === viz.currentState,
    })),
    edges: viz.transitions.map((t) => ({
      from: t.from,
      to: t.to,
      label: t.event,
    })),
  }
}
