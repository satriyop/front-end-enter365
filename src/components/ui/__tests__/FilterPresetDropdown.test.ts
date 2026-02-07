/**
 * FilterPresetDropdown Component Tests
 *
 * Tests the preset management dropdown with Radix components stubbed
 * to render inline (avoiding portal/teleport issues in JSDOM).
 *
 * Key gotchas:
 * - Lucide icons have internal names like "Bookmark" but the stub key
 *   must match. We mock the module to guarantee the match.
 * - The component uses @select.prevent on DropdownMenuItem, so the stub
 *   must emit select with an object that has preventDefault().
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import FilterPresetDropdown from '../FilterPresetDropdown.vue'
import type { FilterPreset } from '@/composables/useFilterPresets'

// Mock lucide-vue-next icons so stubs always resolve
vi.mock('lucide-vue-next', () => ({
  Bookmark: defineComponent({ name: 'Bookmark', template: '<svg data-testid="bookmark-icon" />' }),
  ChevronDown: defineComponent({ name: 'ChevronDown', template: '<svg data-testid="chevron-icon" />' }),
  Plus: defineComponent({ name: 'Plus', template: '<svg data-testid="plus-icon" />' }),
  Star: defineComponent({ name: 'Star', template: '<svg data-testid="star-icon" />' }),
  Trash2: defineComponent({ name: 'Trash2', template: '<svg data-testid="trash-icon" />' }),
  X: defineComponent({ name: 'X', template: '<svg data-testid="x-icon" />' }),
}))

function createPreset(overrides: Partial<FilterPreset> = {}): FilterPreset {
  return {
    id: 'preset-1',
    name: 'Active Invoices',
    filters: { status: 'active' },
    createdAt: Date.now(),
    isDefault: false,
    ...overrides,
  }
}

function mountDropdown(props: Record<string, unknown> = {}) {
  return mount(FilterPresetDropdown, {
    props: {
      presets: [],
      ...props,
    },
    global: {
      stubs: {
        // Stub Radix components to render inline
        DropdownMenuRoot: {
          template: '<div><slot /></div>',
          props: ['open'],
          emits: ['update:open'],
        },
        DropdownMenuTrigger: { template: '<div data-testid="trigger"><slot /></div>' },
        DropdownMenuPortal: { template: '<div><slot /></div>' },
        DropdownMenuContent: { template: '<div data-testid="content"><slot /></div>' },
        DropdownMenuItem: {
          // Emit select with a mock event containing preventDefault to satisfy @select.prevent
          template: '<div data-testid="preset-item" @click="$emit(\'select\', { preventDefault: () => {} })"><slot /></div>',
          emits: ['select'],
        },
        // Stub UI components
        Button: {
          template: '<button @click="$emit(\'click\', $event)"><slot /></button>',
          props: ['variant', 'size'],
          emits: ['click'],
        },
        Input: {
          template: '<input :value="modelValue" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" @keyup="$emit(\'keyup\', $event)" />',
          props: ['modelValue', 'size', 'placeholder'],
          emits: ['update:modelValue', 'keyup'],
        },
      },
    },
  })
}

describe('FilterPresetDropdown', () => {
  describe('trigger', () => {
    it('renders trigger button with Presets label', () => {
      const wrapper = mountDropdown()

      expect(wrapper.text()).toContain('Presets')
    })

    it('shows bookmark icon', () => {
      const wrapper = mountDropdown()

      expect(wrapper.find('[data-testid="bookmark-icon"]').exists()).toBe(true)
    })
  })

  describe('empty state', () => {
    it('shows empty message when no presets', () => {
      const wrapper = mountDropdown({ presets: [] })

      expect(wrapper.text()).toContain('No saved presets')
    })

    it('shows help text in empty state', () => {
      const wrapper = mountDropdown({ presets: [] })

      expect(wrapper.text()).toContain('Save your current filters for quick access')
    })
  })

  describe('presets list', () => {
    it('renders presets when provided', () => {
      const presets = [
        createPreset({ id: '1', name: 'Active' }),
        createPreset({ id: '2', name: 'Overdue' }),
      ]
      const wrapper = mountDropdown({ presets })

      expect(wrapper.text()).toContain('Active')
      expect(wrapper.text()).toContain('Overdue')
    })

    it('shows star icon for default preset', () => {
      const presets = [
        createPreset({ id: '1', name: 'My Default', isDefault: true }),
      ]
      const wrapper = mountDropdown({ presets })

      expect(wrapper.find('[data-testid="star-icon"]').exists()).toBe(true)
    })

    it('emits apply when preset is selected', async () => {
      const preset = createPreset({ id: '1', name: 'Active' })
      const wrapper = mountDropdown({ presets: [preset] })

      const presetItem = wrapper.find('[data-testid="preset-item"]')
      await presetItem.trigger('click')

      expect(wrapper.emitted('apply')?.[0]).toEqual([preset])
    })
  })

  describe('delete action', () => {
    it('shows delete button for presets', () => {
      const wrapper = mountDropdown({
        presets: [createPreset()],
      })

      expect(wrapper.find('[title="Delete"]').exists()).toBe(true)
    })

    it('emits delete with preset id', async () => {
      const wrapper = mountDropdown({
        presets: [createPreset({ id: 'abc-123' })],
      })

      const deleteButton = wrapper.find('[title="Delete"]')
      await deleteButton.trigger('click')

      expect(wrapper.emitted('delete')?.[0]).toEqual(['abc-123'])
    })
  })

  describe('set default action', () => {
    it('emits setDefault with preset id', async () => {
      const wrapper = mountDropdown({
        presets: [createPreset({ id: 'preset-1', isDefault: false })],
      })

      const starButton = wrapper.find('[title="Set as default"]')
      await starButton.trigger('click')

      expect(wrapper.emitted('setDefault')?.[0]).toEqual(['preset-1'])
    })

    it('emits setDefault with null to unset default', async () => {
      const wrapper = mountDropdown({
        presets: [createPreset({ id: 'preset-1', isDefault: true })],
      })

      const starButton = wrapper.find('[title="Set as default"]')
      await starButton.trigger('click')

      expect(wrapper.emitted('setDefault')?.[0]).toEqual([null])
    })
  })

  describe('save dialog', () => {
    it('shows save button initially', () => {
      const wrapper = mountDropdown()

      expect(wrapper.text()).toContain('Save current filters as preset')
    })

    it('shows input when save button clicked', async () => {
      const wrapper = mountDropdown()

      const saveBtn = wrapper.findAll('button').find((b) =>
        b.text().includes('Save current filters'),
      )
      await saveBtn!.trigger('click')

      expect(wrapper.find('input[placeholder="Preset name..."]').exists()).toBe(true)
    })

    it('emits save with preset name', async () => {
      const wrapper = mountDropdown()

      // Open save dialog
      const saveBtn = wrapper.findAll('button').find((b) =>
        b.text().includes('Save current filters'),
      )
      await saveBtn!.trigger('click')

      // Type name and click Save
      const input = wrapper.find('input')
      await input.setValue('My Filter')

      const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')
      await confirmBtn!.trigger('click')

      expect(wrapper.emitted('save')?.[0]).toEqual(['My Filter'])
    })

    it('does not emit save with empty name', async () => {
      const wrapper = mountDropdown()

      // Open save dialog
      const saveBtn = wrapper.findAll('button').find((b) =>
        b.text().includes('Save current filters'),
      )
      await saveBtn!.trigger('click')

      // Click Save without typing
      const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')
      await confirmBtn!.trigger('click')

      expect(wrapper.emitted('save')).toBeUndefined()
    })

    it('hides save dialog on cancel', async () => {
      const wrapper = mountDropdown()

      // Open save dialog
      const saveBtn = wrapper.findAll('button').find((b) =>
        b.text().includes('Save current filters'),
      )
      await saveBtn!.trigger('click')
      expect(wrapper.find('input').exists()).toBe(true)

      // Click the X/cancel button (third button in the save dialog row)
      // After opening save dialog, buttons are: [Save] [X close]
      const buttons = wrapper.findAll('button')
      const cancelBtn = buttons.find((b) => b.find('[data-testid="x-icon"]').exists())
      await cancelBtn!.trigger('click')

      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Save current filters as preset')
    })

    it('clears input after successful save', async () => {
      const wrapper = mountDropdown()

      // Open save dialog
      const saveBtn = wrapper.findAll('button').find((b) =>
        b.text().includes('Save current filters'),
      )
      await saveBtn!.trigger('click')

      // Type name and save
      await wrapper.find('input').setValue('Test Preset')
      const confirmBtn = wrapper.findAll('button').find((b) => b.text() === 'Save')
      await confirmBtn!.trigger('click')

      // Dialog should be hidden
      expect(wrapper.text()).toContain('Save current filters as preset')
    })
  })

  describe('active preset highlighting', () => {
    it('highlights active preset', () => {
      const wrapper = mountDropdown({
        presets: [createPreset({ id: 'active-one' })],
        activePresetId: 'active-one',
      })

      const presetItem = wrapper.find('[data-testid="preset-item"]')
      expect(presetItem.classes()).toContain('bg-primary/10')
    })

    it('does not highlight non-active preset', () => {
      const wrapper = mountDropdown({
        presets: [createPreset({ id: 'preset-1' })],
        activePresetId: 'other-preset',
      })

      const presetItem = wrapper.find('[data-testid="preset-item"]')
      expect(presetItem.classes()).not.toContain('bg-primary/10')
    })
  })
})
