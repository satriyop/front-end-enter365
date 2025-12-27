<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuotation } from '@/api/useQuotations'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const quotationId = computed(() => Number(route.params.id))

const { data: quotation, isLoading, error } = useQuotation(quotationId)

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return classes[status] ?? 'bg-slate-100 text-slate-700'
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      Failed to load quotation
    </div>

    <!-- Content -->
    <template v-else-if="quotation">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 mb-4">
        <RouterLink to="/quotations" class="hover:text-slate-700">Quotations</RouterLink>
        <span class="mx-2">›</span>
        <span class="text-slate-900">{{ quotation.quotation_number }}</span>
      </div>

      <!-- Header -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900">
                {{ quotation.quotation_number }}
              </h1>
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(quotation.status)"
              >
                {{ quotation.status }}
              </span>
            </div>
            <p class="text-slate-500">{{ quotation.contact?.company_name }}</p>
          </div>
          <div class="flex gap-2">
            <button class="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              Edit
            </button>
            <button class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
              Submit
            </button>
          </div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Details Card -->
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="font-semibold text-slate-900 mb-4">Details</h2>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Subject</dt>
                <dd class="font-medium text-slate-900">{{ quotation.subject }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Valid Until</dt>
                <dd class="font-medium text-slate-900">{{ formatDate(quotation.valid_until) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Customer</dt>
                <dd class="font-medium text-slate-900">{{ quotation.contact?.company_name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Email</dt>
                <dd class="font-medium text-slate-900">{{ quotation.contact?.email }}</dd>
              </div>
            </dl>
          </div>

          <!-- Items Card -->
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200">
              <h2 class="font-semibold text-slate-900">Line Items</h2>
            </div>
            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="item in quotation.items" :key="item.id">
                  <td class="px-6 py-4">
                    <div class="font-medium text-slate-900">{{ item.product?.name }}</div>
                    <div class="text-sm text-slate-500">{{ item.description }}</div>
                  </td>
                  <td class="px-6 py-4 text-right text-slate-900">
                    {{ item.quantity }} {{ item.unit }}
                  </td>
                  <td class="px-6 py-4 text-right text-slate-900">
                    {{ formatCurrency(item.unit_price) }}
                  </td>
                  <td class="px-6 py-4 text-right font-medium text-slate-900">
                    {{ formatCurrency(item.amount) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Card -->
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="font-semibold text-slate-900 mb-4">Summary</h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Subtotal</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(quotation.subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Discount ({{ quotation.discount_percent }}%)</dt>
                <dd class="font-medium text-slate-900">-{{ formatCurrency(quotation.discount_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">PPN 11%</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(quotation.tax_amount) }}</dd>
              </div>
              <hr class="border-slate-200" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900">Grand Total</dt>
                <dd class="font-bold text-lg text-slate-900">{{ formatCurrency(quotation.grand_total) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
