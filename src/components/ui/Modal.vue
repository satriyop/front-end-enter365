<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { cn } from '@/utils/cn'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'

interface Props {
  open: boolean
  size?: ModalSize
  title?: string
  description?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  showClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  closeOnBackdrop: true,
  closeOnEscape: true,
  showClose: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',      // 384px
  md: 'max-w-md',      // 448px
  lg: 'max-w-lg',      // 512px
  xl: 'max-w-xl',      // 576px
  '2xl': 'max-w-2xl',  // 672px
  '3xl': 'max-w-3xl',  // 768px
  '4xl': 'max-w-4xl',  // 896px
  full: 'max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]',
}

const panelClasses = computed(() =>
  cn(
    'relative w-full bg-white rounded-lg shadow-xl',
    'transform transition-all duration-200',
    sizeClasses[props.size]
  )
)

function close() {
  emit('update:open', false)
  emit('close')
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.closeOnEscape && props.open) {
    close()
  }
}

// Lock body scroll when modal is open
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-modal="true"
        role="dialog"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-slate-900/50 transition-opacity"
          @click="handleBackdropClick"
        />

        <!-- Modal container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="open"
              :class="panelClasses"
              @click.stop
            >
              <!-- Header -->
              <div
                v-if="title || showClose"
                class="flex items-start justify-between p-6 border-b border-slate-200"
              >
                <div>
                  <h3
                    v-if="title"
                    class="text-lg font-semibold text-slate-900"
                  >
                    {{ title }}
                  </h3>
                  <p
                    v-if="description"
                    class="mt-1 text-sm text-slate-500"
                  >
                    {{ description }}
                  </p>
                </div>

                <!-- Close button -->
                <button
                  v-if="showClose"
                  type="button"
                  class="ml-4 p-1 text-slate-400 hover:text-slate-500 transition-colors rounded-sm hover:bg-slate-100"
                  @click="close"
                >
                  <span class="sr-only">Close</span>
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Body -->
              <div class="p-6">
                <slot />
              </div>

              <!-- Footer -->
              <div
                v-if="$slots.footer"
                class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-lg"
              >
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
