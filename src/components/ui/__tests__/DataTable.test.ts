/**
 * DataTable Component Tests
 *
 * Tests selection state, sorting, row click, loading/empty states, and column rendering.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../DataTable.vue'

interface TestRow {
  id: number
  name: string
  amount: number
}

const testColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' as const },
]

const testData: TestRow[] = [
  { id: 1, name: 'Alpha', amount: 100 },
  { id: 2, name: 'Beta', amount: 200 },
  { id: 3, name: 'Gamma', amount: 300 },
]

function mountTable(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(DataTable, {
    props: {
      columns: testColumns,
      data: testData,
      ...props,
    },
    slots,
  })
}

describe('DataTable', () => {
  describe('rendering', () => {
    it('renders table with column headers', () => {
      const wrapper = mountTable()

      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.text()).toContain('Name')
      expect(wrapper.text()).toContain('Amount')
    })

    it('renders data rows', () => {
      const wrapper = mountTable()

      const rows = wrapper.findAll('tbody tr')
      expect(rows).toHaveLength(3)
      expect(wrapper.text()).toContain('Alpha')
      expect(wrapper.text()).toContain('Beta')
      expect(wrapper.text()).toContain('Gamma')
    })

    it('renders cell values from row data', () => {
      const wrapper = mountTable()

      expect(wrapper.text()).toContain('100')
      expect(wrapper.text()).toContain('200')
      expect(wrapper.text()).toContain('300')
    })

    it('applies right alignment class', () => {
      const wrapper = mountTable()

      const headers = wrapper.findAll('th')
      const amountHeader = headers.find((h) => h.text().includes('Amount'))
      expect(amountHeader?.html()).toContain('text-right')
    })

    it('applies column width style', () => {
      const columns = [
        { key: 'name', label: 'Name', width: '200px' },
        { key: 'amount', label: 'Amount' },
      ]
      const wrapper = mountTable({ columns })

      const headers = wrapper.findAll('th')
      expect(headers[0].attributes('style')).toContain('width: 200px')
    })
  })

  describe('loading state', () => {
    it('shows loading indicator', () => {
      const wrapper = mountTable({ loading: true })

      expect(wrapper.text()).toContain('Loading...')
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('hides data rows when loading', () => {
      const wrapper = mountTable({ loading: true })

      // Should not show data rows
      expect(wrapper.text()).not.toContain('Alpha')
    })

    it('sets correct colspan on loading cell', () => {
      const wrapper = mountTable({ loading: true })

      const td = wrapper.find('tbody td')
      expect(td.attributes('colspan')).toBe('2') // 2 columns
    })

    it('adjusts colspan for selectable + actions', () => {
      const wrapper = mountTable(
        { loading: true, selectable: true, rowKey: 'id' },
        { actions: '<button>Edit</button>' }
      )

      const td = wrapper.find('tbody td')
      expect(td.attributes('colspan')).toBe('4') // 2 columns + checkbox + actions
    })
  })

  describe('empty state', () => {
    it('shows default empty message', () => {
      const wrapper = mountTable({ data: [] })

      expect(wrapper.text()).toContain('No data available')
    })

    it('renders custom empty slot', () => {
      const wrapper = mountTable(
        { data: [] },
        { empty: '<div>Nothing to show here</div>' }
      )

      expect(wrapper.text()).toContain('Nothing to show here')
    })
  })

  describe('sorting', () => {
    it('emits sort event when clicking sortable column', async () => {
      const wrapper = mountTable()

      const nameHeader = wrapper.findAll('th').find((h) => h.text().includes('Name'))
      await nameHeader!.trigger('click')

      expect(wrapper.emitted('sort')?.[0]).toEqual(['name', 'asc'])
    })

    it('toggles sort direction on repeated click', async () => {
      const wrapper = mountTable({ sortKey: 'name', sortDirection: 'asc' })

      const nameHeader = wrapper.findAll('th').find((h) => h.text().includes('Name'))
      await nameHeader!.trigger('click')

      // Already asc → should toggle to desc
      expect(wrapper.emitted('sort')?.[0]).toEqual(['name', 'desc'])
    })

    it('resets to asc when sorting different column', async () => {
      const wrapper = mountTable({ sortKey: 'name', sortDirection: 'desc' })

      const amountHeader = wrapper.findAll('th').find((h) => h.text().includes('Amount'))
      await amountHeader!.trigger('click')

      expect(wrapper.emitted('sort')?.[0]).toEqual(['amount', 'asc'])
    })

    it('does not emit sort for non-sortable column', async () => {
      const columns = [
        { key: 'name', label: 'Name', sortable: false },
      ]
      const wrapper = mountTable({ columns })

      const nameHeader = wrapper.find('th')
      await nameHeader.trigger('click')

      expect(wrapper.emitted('sort')).toBeUndefined()
    })

    it('shows sort indicator on active sort column', () => {
      const wrapper = mountTable({ sortKey: 'name', sortDirection: 'asc' })

      const nameHeader = wrapper.findAll('th').find((h) => h.text().includes('Name'))
      // Should have an SVG for the asc indicator (arrow up: M5 15l7-7 7 7)
      expect(nameHeader?.find('svg').exists()).toBe(true)
    })
  })

  describe('row click', () => {
    it('emits row-click with row and index', async () => {
      const wrapper = mountTable()

      const rows = wrapper.findAll('tbody tr')
      await rows[1].trigger('click')

      expect(wrapper.emitted('row-click')?.[0]).toEqual([testData[1], 1])
    })
  })

  describe('selection', () => {
    it('shows checkboxes when selectable', () => {
      const wrapper = mountTable({ selectable: true, rowKey: 'id' })

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // 1 header checkbox + 3 row checkboxes
      expect(checkboxes).toHaveLength(4)
    })

    it('does not show checkboxes when not selectable', () => {
      const wrapper = mountTable({ selectable: false })

      expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(0)
    })

    it('checks selected rows', () => {
      const wrapper = mountTable({
        selectable: true,
        rowKey: 'id',
        selectedRows: [testData[0]],
      })

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      // Header checkbox (index 0), then row checkboxes
      expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)
      expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
    })

    it('emits selection-change when toggling a row', async () => {
      const wrapper = mountTable({
        selectable: true,
        rowKey: 'id',
        selectedRows: [],
      })

      // Click first row checkbox (index 1, after header)
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      await checkboxes[1].trigger('change')

      const emitted = wrapper.emitted('selection-change')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual([testData[0]])
    })

    it('deselects row when already selected', async () => {
      const wrapper = mountTable({
        selectable: true,
        rowKey: 'id',
        selectedRows: [testData[0]],
      })

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      await checkboxes[1].trigger('change')

      const emitted = wrapper.emitted('selection-change')
      expect(emitted![0][0]).toEqual([]) // Deselected
    })

    it('selects all when header checkbox clicked and none selected', async () => {
      const wrapper = mountTable({
        selectable: true,
        rowKey: 'id',
        selectedRows: [],
      })

      const headerCheckbox = wrapper.findAll('input[type="checkbox"]')[0]
      await headerCheckbox.trigger('change')

      const emitted = wrapper.emitted('selection-change')
      expect(emitted![0][0]).toEqual([...testData])
    })

    it('deselects all when header checkbox clicked and all selected', async () => {
      const wrapper = mountTable({
        selectable: true,
        rowKey: 'id',
        selectedRows: [...testData],
      })

      const headerCheckbox = wrapper.findAll('input[type="checkbox"]')[0]
      await headerCheckbox.trigger('change')

      const emitted = wrapper.emitted('selection-change')
      expect(emitted![0][0]).toEqual([])
    })

    it('header checkbox is indeterminate when some rows selected', () => {
      const wrapper = mountTable({
        selectable: true,
        rowKey: 'id',
        selectedRows: [testData[0]],
      })

      const headerCheckbox = wrapper.findAll('input[type="checkbox"]')[0]
      expect((headerCheckbox.element as HTMLInputElement).indeterminate).toBe(true)
    })

    it('applies selected row styling', () => {
      const wrapper = mountTable({
        selectable: true,
        rowKey: 'id',
        selectedRows: [testData[0]],
      })

      const firstRow = wrapper.findAll('tbody tr')[0]
      expect(firstRow.html()).toContain('bg-orange-50')
    })

    it('checkbox click does not trigger row-click', async () => {
      const wrapper = mountTable({
        selectable: true,
        rowKey: 'id',
        selectedRows: [],
      })

      // The checkbox td has @click.stop
      const checkboxTds = wrapper.findAll('td')
      await checkboxTds[0].trigger('click')

      expect(wrapper.emitted('row-click')).toBeUndefined()
    })
  })

  describe('hoverable', () => {
    it('applies hover classes by default', () => {
      const wrapper = mountTable()

      const row = wrapper.find('tbody tr')
      expect(row.html()).toContain('hover:bg-slate-50')
    })

    it('does not apply hover classes when hoverable is false', () => {
      const wrapper = mountTable({ hoverable: false })

      const row = wrapper.find('tbody tr')
      expect(row.html()).not.toContain('hover:bg-slate-50')
    })
  })

  describe('striped rows', () => {
    it('applies striped styling to odd rows when enabled', () => {
      const wrapper = mountTable({ striped: true })

      const rows = wrapper.findAll('tbody tr')
      // Index 1 (second row) should have striped bg
      expect(rows[1].html()).toContain('bg-slate-50')
    })
  })

  describe('actions column', () => {
    it('renders actions column when slot provided', () => {
      const wrapper = mountTable(
        {},
        { actions: '<button>Edit</button>' }
      )

      // Should have an extra th for actions
      const headers = wrapper.findAll('th')
      expect(headers[headers.length - 1].text()).toBe('Actions')
    })

    it('does not render actions column when no slot', () => {
      const wrapper = mountTable()

      const headers = wrapper.findAll('th')
      expect(headers.map((h) => h.text())).not.toContain('Actions')
    })
  })

  describe('cell slots', () => {
    it('renders custom cell content via named slot', () => {
      const wrapper = mountTable(
        {},
        { 'cell-name': '<strong>Custom Name</strong>' }
      )

      expect(wrapper.find('strong').exists()).toBe(true)
      expect(wrapper.text()).toContain('Custom Name')
    })
  })
})
