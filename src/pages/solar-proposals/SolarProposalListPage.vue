<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSolarProposals, useSolarProposalStatistics, type SolarProposalFilters } from '@/api/useSolarProposals'
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/utils/format'
import { Button, Input, Select } from '@/components/ui'
import { Plus, Eye, Pencil } from 'lucide-vue-next'

// Filters state
const filters = ref<SolarProposalFilters>({
  page: 1,
  per_page: 10,
  status: '',
  search: '',
})

// Fetch proposals
const { data, isLoading, error } = useSolarProposals(filters)
const { data: statistics } = useSolarProposalStatistics()

const proposals = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

// Status badge styles
function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
    converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return classes[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    converted: 'Converted',
  }
  return labels[status] ?? status
}

// Status options for Select component
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'converted', label: 'Converted' },
]
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Solar Proposals</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage solar energy proposals and projections</p>
      </div>

      <Button as="router-link" to="/solar-proposals/new">
        <Plus class="w-4 h-4" />
        New Proposal
      </Button>
    </div>

    <!-- Statistics Cards -->
    <div v-if="statistics" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ statistics.total }}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Total</div>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ statistics.draft }}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Draft</div>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ statistics.sent }}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Sent</div>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ statistics.accepted }}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Accepted</div>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ formatPercent(statistics.conversion_rate) }}</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Conversion Rate</div>
      </div>
      <div class="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ formatNumber(statistics.total_capacity_kwp) }} kWp</div>
        <div class="text-sm text-slate-500 dark:text-slate-400">Total Capacity</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <Input
            v-model="filters.search"
            type="text"
            placeholder="Search proposals..."
          />
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <Select
            v-model="filters.status"
            :options="statusOptions"
            placeholder="All Status"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="p-8 text-center text-slate-500 dark:text-slate-400">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2" />
        Loading proposals...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-8 text-center text-red-500 dark:text-red-400">
        Failed to load proposals
      </div>

      <!-- Empty State -->
      <div v-else-if="proposals.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-2">☀️</div>
        <div class="text-slate-900 dark:text-slate-100 font-medium">No solar proposals found</div>
        <div class="text-slate-500 dark:text-slate-400 text-sm mb-4">Create your first solar proposal to get started</div>
        <Button as="router-link" to="/solar-proposals/new">
          <Plus class="w-4 h-4" />
          Create Proposal
        </Button>
      </div>

      <!-- Data Table -->
      <table v-else class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Proposal #
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Customer / Site
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              System
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Returns
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valid Until
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr
            v-for="proposal in proposals"
            :key="proposal.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <td class="px-6 py-4">
              <RouterLink
                :to="`/solar-proposals/${proposal.id}`"
                class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
              >
                {{ proposal.proposal_number }}
              </RouterLink>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.contact?.name }}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ proposal.site_name }} - {{ proposal.city }}</div>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.system_capacity_kwp || '-' }} kWp</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ formatCurrency(proposal.system_cost) }}</div>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="font-medium text-green-600 dark:text-green-400">{{ proposal.payback_years?.toFixed(1) || '-' }} yrs</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ formatPercent(proposal.roi_percent) }} ROI</div>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(proposal.status)"
              >
                {{ getStatusLabel(proposal.status) }}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-500 dark:text-slate-400">
              {{ formatDate(proposal.valid_until) }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <Button
                  as="router-link"
                  :to="`/solar-proposals/${proposal.id}`"
                  variant="ghost"
                  size="icon"
                  title="View"
                >
                  <Eye class="w-4 h-4" />
                </Button>
                <Button
                  v-if="proposal.status === 'draft'"
                  as="router-link"
                  :to="`/solar-proposals/${proposal.id}/edit`"
                  variant="ghost"
                  size="icon"
                  title="Edit"
                >
                  <Pencil class="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination && pagination.total > 0" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div class="text-sm text-slate-500 dark:text-slate-400">
          Showing {{ (pagination.current_page - 1) * pagination.per_page + 1 }}
          to {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}
          of {{ pagination.total }}
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.current_page === 1"
            @click="filters.page = pagination.current_page - 1"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.current_page === pagination.last_page"
            @click="filters.page = pagination.current_page + 1"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
