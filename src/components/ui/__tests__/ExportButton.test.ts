/**
 * ExportButton Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ExportButton from '../ExportButton.vue'

function mountExportButton(props: Record<string, unknown> = {}) {
  return mount(ExportButton, {
    props,
    global: {
      stubs: {
        Button: {
          template: '<button :disabled="disabled" :class="{ loading }" @click="$emit(\'click\', $event)"><slot /></button>',
          props: ['variant', 'size', 'loading', 'disabled', 'type'],
          emits: ['click'],
        },
        // Stub Transition so leave animations complete instantly in JSDOM
        Transition: { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('ExportButton', () => {
  describe('simple mode (no format options)', () => {
    it('renders a single button when showFormatOptions is false', () => {
      const wrapper = mountExportButton({ showFormatOptions: false })

      expect(wrapper.text()).toContain('Export')
    })

    it('renders custom label', () => {
      const wrapper = mountExportButton({ showFormatOptions: false, label: 'Download' })

      expect(wrapper.text()).toContain('Download')
    })

    it('emits export with excel format on click', async () => {
      const wrapper = mountExportButton({ showFormatOptions: false })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('export')?.[0]).toEqual(['excel'])
    })
  })

  describe('dropdown mode (with format options)', () => {
    it('renders dropdown button by default', () => {
      const wrapper = mountExportButton()

      expect(wrapper.text()).toContain('Export')
      expect(wrapper.find('.export-dropdown').exists()).toBe(true)
    })

    it('shows format menu when clicked', async () => {
      const wrapper = mountExportButton()

      await wrapper.find('.export-dropdown button').trigger('click')

      expect(wrapper.text()).toContain('Excel (.xlsx)')
      expect(wrapper.text()).toContain('CSV (.csv)')
    })

    it('hides format menu initially', () => {
      const wrapper = mountExportButton()

      expect(wrapper.text()).not.toContain('Excel (.xlsx)')
    })

    it('toggles dropdown open/closed', async () => {
      const wrapper = mountExportButton()
      const trigger = wrapper.find('.export-dropdown button')

      await trigger.trigger('click')
      expect(wrapper.text()).toContain('Excel (.xlsx)')

      await trigger.trigger('click')
      expect(wrapper.text()).not.toContain('Excel (.xlsx)')
    })

    it('emits export with excel format', async () => {
      const wrapper = mountExportButton()

      // Open dropdown
      await wrapper.find('.export-dropdown button').trigger('click')

      // Click Excel option
      const buttons = wrapper.findAll('button')
      const excelButton = buttons.find((b) => b.text().includes('Excel'))
      await excelButton!.trigger('click')

      expect(wrapper.emitted('export')?.[0]).toEqual(['excel'])
    })

    it('emits export with csv format', async () => {
      const wrapper = mountExportButton()

      // Open dropdown
      await wrapper.find('.export-dropdown button').trigger('click')

      // Click CSV option
      const buttons = wrapper.findAll('button')
      const csvButton = buttons.find((b) => b.text().includes('CSV'))
      await csvButton!.trigger('click')

      expect(wrapper.emitted('export')?.[0]).toEqual(['csv'])
    })

    it('closes dropdown after selecting format', async () => {
      const wrapper = mountExportButton()

      await wrapper.find('.export-dropdown button').trigger('click')
      expect(wrapper.text()).toContain('Excel (.xlsx)')

      const buttons = wrapper.findAll('button')
      const excelButton = buttons.find((b) => b.text().includes('Excel'))
      await excelButton!.trigger('click')

      expect(wrapper.text()).not.toContain('Excel (.xlsx)')
    })
  })

  describe('states', () => {
    it('passes loading to button', () => {
      const wrapper = mountExportButton({ loading: true })

      expect(wrapper.find('button').classes()).toContain('loading')
    })

    it('passes disabled to button', () => {
      const wrapper = mountExportButton({ disabled: true })

      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })
  })

  describe('chevron icon', () => {
    it('shows chevron in dropdown mode', () => {
      const wrapper = mountExportButton()

      // Dropdown mode has a chevron SVG with ml-1 class
      const svgs = wrapper.findAll('svg')
      expect(svgs.length).toBeGreaterThanOrEqual(2) // download icon + chevron
    })

    it('rotates chevron when open', async () => {
      const wrapper = mountExportButton()

      await wrapper.find('.export-dropdown button').trigger('click')

      const rotatedSvg = wrapper.findAll('svg').find((s) => s.classes().includes('rotate-180'))
      expect(rotatedSvg).toBeTruthy()
    })
  })
})
