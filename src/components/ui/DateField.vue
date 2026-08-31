<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Input from './Input.vue'
import { dayFirstToIso, isoToDayFirst } from '@/utils/dateInput'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
  class?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const typed = ref(isoToDayFirst(props.modelValue))

watch(() => props.modelValue, (iso) => {
  typed.value = isoToDayFirst(iso)
})

const displayPlaceholder = computed(() => props.placeholder || 'dd/mm/yyyy')

function commit(): void {
  const raw = typed.value.trim()
  if (!raw) {
    emit('update:modelValue', '')
    return
  }
  const iso = dayFirstToIso(raw)
  if (!iso) {
    typed.value = isoToDayFirst(props.modelValue)
    return
  }
  typed.value = isoToDayFirst(iso)
  emit('update:modelValue', iso)
}
</script>

<template>
  <Input
    v-model="typed"
    type="text"
    inputmode="numeric"
    :placeholder="displayPlaceholder"
    :class="props.class"
    data-date-field="dmy"
    @blur="commit"
    @keydown.enter.prevent="commit"
  />
</template>
