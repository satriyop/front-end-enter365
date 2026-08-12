<script setup lang="ts">
/**
 * Electrical-panel-only Component Standard field in BOM template item modal.
 * Core BomTemplateDetailPage gates with electrical_panel and owns standards data.
 */
import { FormField, Select } from '@/components/ui'

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
  <FormField
    label="Component Standard"
    hint="Link to IEC standard for brand swapping"
  >
    <Select
      :model-value="modelValue"
      :options="options"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </FormField>
</template>
