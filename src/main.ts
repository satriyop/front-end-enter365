import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import { queryClient } from '@/api/queryClient'
import { bootstrapInfrastructure, eventBus, logger } from '@/infrastructure'
import { installClickRescue } from '@/utils/clickRescue'
import './style.css'
import './styles/print.css'

// Capture-phase rescue MUST register before Vue/Radix so a DismissableLayer
// stopImmediatePropagation cannot swallow Kasir/sidebar/avatar clicks.
installClickRescue()
bootstrapInfrastructure()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin, { queryClient })

// Global error handler - emit to event bus for observability
app.config.errorHandler = (err, instance, info) => {
  const componentName = instance?.$options?.name || instance?.$.type?.name || 'Unknown'

  logger.error(`Vue error in ${componentName}`, err as Error, { info })

  eventBus.emit('error:unhandled', {
    error: err as Error,
    context: `Component: ${componentName}, Info: ${info}`,
  })
}

app.mount('#app')
