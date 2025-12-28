<script setup lang="ts">
import { useClipboard } from '@/composables/useClipboard'
import Button from './Button.vue'

interface Props {
  text: string
  showToast?: boolean
  variant?: 'icon' | 'button'
  label?: string
  size?: 'xs' | 'sm' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  showToast: true,
  variant: 'icon',
  label: 'Copy',
  size: 'sm',
})

const { copy, copied } = useClipboard()

async function handleCopy() {
  await copy(props.text, props.showToast)
}
</script>

<template>
  <Button
    v-if="variant === 'button'"
    type="button"
    variant="ghost"
    :size="size"
    @click="handleCopy"
  >
    <svg
      v-if="!copied"
      class="w-4 h-4 mr-1"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <svg
      v-else
      class="w-4 h-4 mr-1 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
    {{ copied ? 'Copied!' : label }}
  </Button>

  <button
    v-else
    type="button"
    class="inline-flex items-center justify-center p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
    :class="{
      'w-6 h-6': size === 'xs',
      'w-7 h-7': size === 'sm',
      'w-8 h-8': size === 'default',
    }"
    title="Copy to clipboard"
    @click="handleCopy"
  >
    <svg
      v-if="!copied"
      :class="{
        'w-3.5 h-3.5': size === 'xs',
        'w-4 h-4': size === 'sm',
        'w-5 h-5': size === 'default',
      }"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <svg
      v-else
      :class="[
        'text-green-500',
        {
          'w-3.5 h-3.5': size === 'xs',
          'w-4 h-4': size === 'sm',
          'w-5 h-5': size === 'default',
        }
      ]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
  </button>
</template>
