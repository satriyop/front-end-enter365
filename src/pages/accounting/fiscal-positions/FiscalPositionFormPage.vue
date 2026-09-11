<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import {
  useCreateFiscalPosition,
  useFiscalPosition,
  useUpdateFiscalPosition,
  type FiscalPositionAccountMap,
  type FiscalPositionTaxMap,
} from '@/api/useFiscalPositions'
import { useTaxRecords } from '@/api/useTaxRecords'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft, Plus, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const positionId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!positionId.value)
const { data: existing } = useFiscalPosition(positionId)
const { data: taxes } = useTaxRecords()
const { data: accounts } = useAccountsLookup()

const code = ref('')
const name = ref('')
const notes = ref('')
const isActive = ref(true)
const taxMaps = ref<Array<{ source_tax_record_id: string; dest_tax_record_id: string }>>([])
const accountMaps = ref<Array<{ source_account_id: string; dest_account_id: string }>>([])

watch(existing, (position) => {
  if (!position) return
  code.value = position.code
  name.value = position.name
  notes.value = position.notes ?? ''
  isActive.value = position.is_active
  taxMaps.value = (position.tax_maps ?? []).map((map: FiscalPositionTaxMap) => ({
    source_tax_record_id: String(map.source_tax_record_id),
    dest_tax_record_id: map.dest_tax_record_id == null ? '' : String(map.dest_tax_record_id),
  }))
  accountMaps.value = (position.account_maps ?? []).map((map: FiscalPositionAccountMap) => ({
    source_account_id: String(map.source_account_id),
    dest_account_id: String(map.dest_account_id),
  }))
}, { immediate: true })

const taxOptions = computed(() =>
  (taxes.value ?? []).map((tax) => ({
    value: String(tax.id),
    label: `${tax.code} · ${tax.name} (${tax.rate}%)`,
  })),
)
const destTaxOptions = computed(() => [
  { value: '', label: 'Exempt (no tax)' },
  ...taxOptions.value,
])
const accountOptions = computed(() =>
  (accounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: `${account.code} · ${account.name}`,
  })),
)

const createMutation = useCreateFiscalPosition()
const updateMutation = useUpdateFiscalPosition()

function addTaxMap() {
  taxMaps.value = [...taxMaps.value, { source_tax_record_id: '', dest_tax_record_id: '' }]
}

function removeTaxMap(index: number) {
  taxMaps.value = taxMaps.value.filter((_, i) => i !== index)
}

function addAccountMap() {
  accountMaps.value = [...accountMaps.value, { source_account_id: '', dest_account_id: '' }]
}

function removeAccountMap(index: number) {
  accountMaps.value = accountMaps.value.filter((_, i) => i !== index)
}

async function handleSubmit() {
  if (!code.value.trim() || !name.value.trim()) {
    toast.error('Code and name are required')
    return
  }

  const payload = {
    code: code.value.trim(),
    name: name.value.trim(),
    notes: notes.value.trim() || null,
    is_active: isActive.value,
    tax_maps: taxMaps.value
      .filter((map) => map.source_tax_record_id)
      .map((map) => ({
        source_tax_record_id: Number(map.source_tax_record_id),
        dest_tax_record_id: map.dest_tax_record_id ? Number(map.dest_tax_record_id) : null,
      })),
    account_maps: accountMaps.value
      .filter((map) => map.source_account_id && map.dest_account_id)
      .map((map) => ({
        source_account_id: Number(map.source_account_id),
        dest_account_id: Number(map.dest_account_id),
      })),
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: positionId.value, data: payload })
      toast.success('Fiscal position updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Fiscal position created')
    }
    router.push('/accounting/fiscal-positions')
  } catch {
    toast.error('Failed to save fiscal position')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <RouterLink to="/accounting/fiscal-positions" class="hover:text-slate-700 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Fiscal Positions
      </RouterLink>
    </div>
    <h1 class="text-2xl font-semibold mb-2">{{ isEditing ? 'Edit Fiscal Position' : 'New Fiscal Position' }}</h1>
    <p class="text-slate-500 dark:text-slate-400 mb-6">
      Tax and account mapping for a customer or vendor. Distinct from Fiscal Periods.
    </p>
    <form class="max-w-3xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="fiscal-position-code" placeholder="Code" />
        <Input v-model="name" data-testid="fiscal-position-name" placeholder="Name" />
        <Input v-model="notes" data-testid="fiscal-position-notes" placeholder="Notes (optional)" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox" data-testid="fiscal-position-active" />
          Active
        </label>
      </Card>

      <Card class="space-y-3 p-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Tax Mapping</h2>
          <Button type="button" variant="secondary" data-testid="fiscal-position-add-tax-map" @click="addTaxMap">
            <Plus class="w-4 h-4 mr-1" />
            Add tax map
          </Button>
        </div>
        <p class="text-sm text-slate-500">Source tax on the product is replaced by the destination tax. Empty destination means exempt.</p>
        <div
          v-for="(map, index) in taxMaps"
          :key="`tax-${index}`"
          class="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end"
        >
          <Select
            :model-value="map.source_tax_record_id"
            :options="taxOptions"
            placeholder="Source tax"
            :test-id="`fiscal-position-tax-source-${index}`"
            @update:model-value="(v) => { map.source_tax_record_id = v ? String(v) : '' }"
          />
          <Select
            :model-value="map.dest_tax_record_id"
            :options="destTaxOptions"
            placeholder="Destination tax"
            :test-id="`fiscal-position-tax-dest-${index}`"
            @update:model-value="(v) => { map.dest_tax_record_id = v ? String(v) : '' }"
          />
          <Button type="button" variant="ghost" @click="removeTaxMap(index)">
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Card class="space-y-3 p-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Account Mapping</h2>
          <Button type="button" variant="secondary" data-testid="fiscal-position-add-account-map" @click="addAccountMap">
            <Plus class="w-4 h-4 mr-1" />
            Add account map
          </Button>
        </div>
        <div
          v-for="(map, index) in accountMaps"
          :key="`account-${index}`"
          class="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-end"
        >
          <Select
            :model-value="map.source_account_id"
            :options="accountOptions"
            placeholder="Source account"
            @update:model-value="(v) => { map.source_account_id = v ? String(v) : '' }"
          />
          <Select
            :model-value="map.dest_account_id"
            :options="accountOptions"
            placeholder="Destination account"
            @update:model-value="(v) => { map.dest_account_id = v ? String(v) : '' }"
          />
          <Button type="button" variant="ghost" @click="removeAccountMap(index)">
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </Card>

      <Button type="submit" data-testid="fiscal-position-save">Save</Button>
    </form>
  </div>
</template>
