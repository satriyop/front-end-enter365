<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  for?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
})

const hasError = computed(() => !!props.error)
</script>

<template>
  <div class="space-y-1.5">
    <!-- Label -->
    <label
      v-if="label"
      :for="props.for"
      class="block text-sm font-medium text-slate-700 dark:text-slate-200"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input slot -->
    <slot :error="hasError" />

    <!-- Error message -->
    <p
      v-if="error"
      class="text-xs text-red-600 dark:text-red-400"
      role="alert"
    >
      {{ error }}
    </p>

    <!-- Hint text -->
    <p
      v-else-if="hint"
      class="text-xs text-slate-500 dark:text-slate-400"
    >
      {{ hint }}
    </p>
  </div>
</template>
