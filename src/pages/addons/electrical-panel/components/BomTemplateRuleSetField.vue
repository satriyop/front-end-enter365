<script setup lang="ts">
/**
 * Electrical-panel-only rule set select on BOM template create/edit form.
 * Core BomTemplateFormPage gates with electrical_panel and owns data fetching.
 */
import { Card, FormField, Select } from '@/components/ui'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

defineProps<{
  modelValue: string | number | null
  options: Option[]
}>()

defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()
</script>

<template>
  <Card>
    <template #header>
      <h2 class="font-medium text-foreground">Defaults</h2>
    </template>

    <div class="space-y-4">
      <FormField label="Validation Rule Set" hint="Applied when creating BOMs from this template (panel add-on)">
        <Select
          :model-value="modelValue"
          :options="options"
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </FormField>
    </div>
  </Card>
</template>
