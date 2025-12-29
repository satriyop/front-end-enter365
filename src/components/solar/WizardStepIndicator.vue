<script setup lang="ts">
import { computed } from 'vue'
import { Check, MapPin, Zap, Sun, FileCheck } from 'lucide-vue-next'

interface Step {
  number: number
  title: string
  description: string
}

interface Props {
  steps: Step[]
  currentStep: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'go-to-step': [step: number]
}>()

const stepIcons = [MapPin, Zap, Sun, FileCheck]

const progressPercent = computed(() => {
  return ((props.currentStep - 1) / (props.steps.length - 1)) * 100
})
</script>

<template>
  <div class="relative">
    <!-- Background track -->
    <div class="absolute top-6 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-12" />

    <!-- Progress fill with glow -->
    <div
      class="absolute top-6 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 rounded-full mx-12 transition-all duration-500 ease-out"
      :style="{ width: `calc(${progressPercent}% - 0px)` }"
    >
      <div class="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 rounded-full blur-sm opacity-60" />
    </div>

    <!-- Steps -->
    <nav class="relative flex justify-between">
      <button
        v-for="(step, index) in steps"
        :key="step.number"
        type="button"
        class="group flex flex-col items-center focus:outline-none"
        :class="step.number <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'"
        :disabled="step.number > currentStep"
        @click="step.number <= currentStep && emit('go-to-step', step.number)"
      >
        <!-- Step circle -->
        <div class="relative">
          <!-- Glow effect for current step -->
          <div
            v-if="currentStep === step.number"
            class="absolute -inset-2 bg-orange-500/20 rounded-full blur-md animate-pulse"
          />

          <!-- Circle -->
          <div
            class="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300"
            :class="[
              currentStep > step.number
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-500/30'
                : currentStep === step.number
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500'
            ]"
          >
            <Check v-if="currentStep > step.number" class="w-5 h-5" />
            <component
              v-else
              :is="stepIcons[index] || Sun"
              class="w-5 h-5"
            />
          </div>
        </div>

        <!-- Label -->
        <div class="mt-3 text-center">
          <span
            class="block text-sm font-semibold transition-colors"
            :class="currentStep >= step.number
              ? 'text-slate-900 dark:text-slate-100'
              : 'text-slate-400 dark:text-slate-500'"
          >
            {{ step.title }}
          </span>
          <span
            class="block text-xs mt-0.5 transition-colors max-w-[100px]"
            :class="currentStep >= step.number
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-slate-400 dark:text-slate-600'"
          >
            {{ step.description }}
          </span>
        </div>
      </button>
    </nav>
  </div>
</template>
